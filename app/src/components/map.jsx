/* eslint react/sort-comp:0 */
import React, { Component } from 'react';
import { GoogleMapLoader, GoogleMap } from 'react-google-maps';
import { MIN_ZOOM_LEVEL, MAX_ZOOM_LEVEL } from '../constants';
import CanvasLayer from './layers/canvas_layer';
import createTrackLayer from './layers/track_layer';
import ControlPanel from '../containers/map/ControlPanel';
import VesselPanel from './map/vessel_panel';
import Header from '../containers/header';
import map from '../../styles/index.scss';
import Timebar from '../containers/map/timebar';
import Modal from './shared/Modal';
import Share from '../containers/map/Share';
import NoLogin from '../containers/map/NoLogin';
import extentChanged from '../util/extentChanged';

const strictBounds = new google.maps.LatLngBounds(new google.maps.LatLng(-85, -180), new google.maps.LatLng(85, 180));

class Map extends Component {

  constructor(props) {
    super(props);
    this.state = {
      overlay: null,
      addedLayers: [],
      vesselLayerTransparency: 1,
      currentVesselInfo: {},
      shareModalOpened: false,
      running: 'stop'
    };

    this.updateFilters = this.updateFilters.bind(this);
    this.onClickMap = this.onClickMap.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onZoomChanged = this.onZoomChanged.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.onMapIdle = this.onMapIdle.bind(this);
    this.changeZoomLevel = this.changeZoomLevel.bind(this);
  }

  /**
   * Zoom change handler
   * Enforces min and max zoom levels
   * Resets vessel layer data on change
   */
  onZoomChanged() {
    if (!this.map) {
      return;
    }
    let zoom = this.map.getZoom();
    if (zoom < MIN_ZOOM_LEVEL) {
      zoom = MIN_ZOOM_LEVEL;
      this.map.setZoom(MIN_ZOOM_LEVEL);
    }
    if (zoom > MAX_ZOOM_LEVEL) {
      zoom = MAX_ZOOM_LEVEL;
      this.map.setZoom(MAX_ZOOM_LEVEL);
    }
    this.setState({ zoom });
    this.props.setZoom(zoom);
    if (this.state.overlay) {
      this.state.overlay.resetPlaybackData();
    }
  }

  /**
   * Called once additional vessel details are loaded
   * TODO: should probably be moved elsewhere
   *
   * @param incomingData Data returned by the API
   */
  handleAdditionalVesselDetails(incomingData) {
    const currentVesselInfo = this.state.currentVesselInfo;

    const data = JSON.parse(incomingData.target.response);
    currentVesselInfo.callsign = data.callsign;
    currentVesselInfo.flag = data.flag;
    currentVesselInfo.imo = data.imo;
    currentVesselInfo.mmsi = data.mmsi;
    currentVesselInfo.name = data.vesselname;

    this.setState({ currentVesselInfo });
  }

  /**
   * Given a series group ID, loads additional info for that vessel
   * Used to display additional data on the vessel details panel
   * TODO: should probably be moved elsewhere
   *
   * @param seriesGroup
   */
  loadAdditionalVesselDetails(seriesGroup) {
    if (typeof XMLHttpRequest !== 'undefined') {
      this.request = new XMLHttpRequest();
    } else {
      throw new Error('XMLHttpRequest is disabled');
    }
    this.request.open(
      'GET',
      `https://skytruth-pleuston.appspot.com/v1/tilesets/tms-format-2015-2016-v1/sub/seriesgroup=${seriesGroup}/info`,
      true
    );
    this.request.setRequestHeader('Authorization', `Bearer ${this.props.token}`);
    this.request.responseType = 'application/json';
    this.request.onload = this.handleAdditionalVesselDetails.bind(this);
    this.request.send(null);
  }

  /**
   * Displays the currently selected vessel details on the corresponding panel
   * Triggers additional vessel details loading.
   *
   * @param vesselInfo
   */
  showVesselDetails(vesselInfo) {
    const currentVesselInfo = {
      series: vesselInfo.series,
      seriesGroup: vesselInfo.seriesgroup,
      latitude: vesselInfo.latitude,
      longitude: vesselInfo.longitude,
      weight: vesselInfo.weight,
      timestamp: vesselInfo.timestamp
    };

    this.setState({ currentVesselInfo });
    this.loadAdditionalVesselDetails(vesselInfo.seriesgroup);
  }

  /**
   * Detects and handles map clicks
   * Detects collisions with current vessel data
   * Draws tracks and loads vessel details
   *
   * @param event
   */
  onClickMap(event) {
    const clickLat = ~~event.latLng.lat();
    const clickLong = ~~event.latLng.lng();

    const vesselInfo = this.state.overlay.getVesselAtLocation(clickLat, clickLong);

    if (this.state.trajectory) {
      this.state.trajectory.setMap(null);
    }
    // this.props.getSeriesGroup(vesselInfo.seriesgroup, vesselInfo.series, this.props.filters);

    if (vesselInfo) {
      this.showVesselDetails(vesselInfo);
      this.props.getSeriesGroup(vesselInfo.seriesgroup, vesselInfo.series, this.props.filters);
    } else if (this.state.trajectory) {
      this.setState({ currentVesselInfo: {} });
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.token) {
      return;
    }

    if (!nextProps.map) {
      return;
    }

    this.updateLayersState(nextProps);
    this.updateFiltersState(nextProps);
    this.updateTrackLayer(nextProps);
    this.updateVesselTransparency(nextProps);

    if (this.props.map.center[0] !== nextProps.map.center[0] || this.props.map.center[1] !== nextProps.map.center[1]) {
      this.map.setCenter({ lat: nextProps.map.center[0], lng: nextProps.map.center[1] });
    }

    if (this.props.map.zoom !== nextProps.map.zoom) {
      this.map.setZoom(nextProps.map.zoom);
    }
  }

  updateTrackLayer(nextProps) {
    if (this.props.map.track !== nextProps.map.track) {
      const trackLayer = this.state.trackLayer;
      trackLayer.drawTile(nextProps.map.track.seriesGroupData, nextProps.map.track.selectedSeries, nextProps.filters);
    }
  }

  /**
   * Handles and propagates filters changes
   *
   * @param nextProps
   */
  updateFiltersState(nextProps) {
    if (!this.state.overlay) {
      return;
    }

    const newInnerExtent = nextProps.filters.timelineInnerExtent;
    if (extentChanged(newInnerExtent, this.props.filters.timelineInnerExtent)) {
      this.state.overlay.drawTimeRange(newInnerExtent[0].getTime(), newInnerExtent[1].getTime());
    }

    if (
      this.props.filters.startDate !== nextProps.filters.startDate
      || this.props.filters.endDate !== nextProps.filters.endDate
      || this.props.filters.flag !== nextProps.filters.flag
    ) {
      this.state.overlay.updateFilters(nextProps.filters);
      if (this.state.trackLayer) {
        this.state.trackLayer.regenerate();
        this.state.trackLayer.drawTile(
          this.props.map.track.seriesGroupData,
          this.props.map.track.selectedSeries,
          nextProps.filters
        );
      }
    }
  }

  /**
   * Handles and propagates layers changes
   * @param nextProps
   */
  updateLayersState(nextProps) {
    const currentLayers = this.props.map.layers;
    const newLayers = nextProps.map.layers;
    const addedLayers = this.state.addedLayers;
    const promises = [];

    let callAddVesselLayer = null;
    if (newLayers !== currentLayers) {
      for (let index = 0, length = newLayers.length; index < length; index++) {
        const newLayer = newLayers[index];
        if (!addedLayers[newLayer.title]) {
          if (!newLayer.visible) {
            continue;
          }
          if (newLayer.type === 'ClusterAnimation') {
            callAddVesselLayer = this.addVesselLayer.bind(this, newLayer, index);
          } else if (newLayer.type === 'CartoDBBasemap') {
            promises.push(this.addCartoBasemap(newLayer, index));
          } else {
            promises.push(this.addCartoLayer(newLayer, index));
          }
        } else {
          this.toggleLayerVisibility(newLayer);
        }
      }
    }

    Promise.all(promises).then((() => {
      if (callAddVesselLayer) {
        callAddVesselLayer();
      }
      this.setState({ addedLayers });
    }));
  }

  /**
   * Creates vessel track layer
   *
   * @param layerSettings
   * @param position
   */
  addVesselLayer(layerSettings, position) {
    const canvasLayer = new CanvasLayer(
      position,
      this.map,
      this.props.token,
      this.props.filters,
      this.props.map.vesselTransparency,
      layerSettings.visible);
    // Create track layer
    const Overlay = createTrackLayer(google);
    const trackLayer = new Overlay(
      this.refs.map.props.map,
      this.refs.mapContainer.offsetWidth,
      this.refs.mapContainer.offsetHeight
    );
    this.setState({ overlay: canvasLayer, trackLayer });
    this.state.addedLayers[layerSettings.title] = canvasLayer;
  }

  /**
   * Creates a Carto-based layer
   *
   * @returns {Promise}
   * @param layerSettings
   * @param index
   */
  addCartoLayer(layerSettings, index) {
    const addedLayers = this.state.addedLayers;

    const promise = new Promise(((resolve) => {
      cartodb.createLayer(this.map, layerSettings.source.args.url)
        .addTo(this.map, index)
        .done(((layer, cartoLayer) => {
          addedLayers[layer.title] = cartoLayer;
          resolve();
        }).bind(this, layerSettings));
    }));
    return promise;
  }

  /**
   * Creates a Carto-based layer
   *
   * @returns {Promise}
   * @param layerSettings
   * @param index
   */
  addCartoBasemap(layerSettings, index) {
    const addedLayers = this.state.addedLayers;

    const promise = new Promise(((resolve) => {
      cartodb.createLayer(this.map, layerSettings.source.args.url)
        .addTo(this.map, index)
        .done(((layer, cartoLayer) => {
          addedLayers[layer.title] = cartoLayer;
          resolve();
        }).bind(this, layerSettings));
    }));
    return promise;
  }

  /**
   * Toggles a layer's visibility
   *
   * @param layerSettings
   */
  toggleLayerVisibility(layerSettings) {
    const layers = this.state.addedLayers;

    if (layerSettings.visible) {
      if (layers[layerSettings.title].isVisible()) {
        return;
      }
      if (layerSettings.type === 'ClusterAnimation') {
        this.state.overlay.show();
      } else {
        layers[layerSettings.title].show();
      }
    } else {
      if (!layers[layerSettings.title].isVisible()) {
        return;
      }
      if (layerSettings.type === 'ClusterAnimation') {
        this.state.overlay.hide();
      } else {
        layers[layerSettings.title].hide();
      }
    }
  }

  onMouseMove() {
    if (!this.map) {
      return;
    }
    this.map.setOptions({ draggableCursor: 'default' });
  }

  onDragStart() {
    if (!this.map) {
      return;
    }
  }

  onDragEnd() {
    if (!this.map) {
      return;
    }
    if (this.state.trackLayer && this.props.map.track) {
      this.state.trackLayer.recalculatePosition();

      this.state.trackLayer.drawTile(
        this.props.map.track.seriesGroupData,
        this.props.map.track.selectedSeries,
        this.props.filters
      );
    }
    const center = this.map.getCenter();

    if (strictBounds.contains(center)) {
      this.props.setCenter([center.lat(), center.lng()]);
      return;
    }
  }

  /**
   * Handles map idle event (once loading is done)
   * Used here to do the initial load of the layers
   */
  onMapIdle() {
    if (!this.map) {
      this.map = this.refs.map.props.map;
      this.props.getWorkspace();
    }
  }

  /**
   * Triggered when the user updates the vessel data pickers
   * Has special handling for startDate/endDate
   *
   * @param target Name of the filter
   * @param value New value of the filter
   */
  updateFilters(target, value) {
    const filters = Object.assign({}, this.props.filters);

    filters[target] = value;

    this.props.updateFilters(filters);
    if (this.state.trackLayer) {
      this.props.getSeriesGroup(this.props.map.track.seriesgroup, this.props.map.track.selectedSeries, filters);
    }
  }

  /**
   * Handles vessel transparency changes
   *
   * @param nextProps
   */
  updateVesselTransparency(nextProps) {
    if (this.props.map.vesselTransparency === nextProps.map.vesselTransparency) {
      return;
    }

    if (!this.state.overlay) {
      return;
    }
    this.state.overlay.vesselTransparency = nextProps.map.vesselTransparency;

    if (this.state.running !== 'play') {
      this.state.overlay.refresh();
    }
  }

  /**
   * Handles clicks on the +/- buttons that manipulate the map zoom
   *
   * @param event
   */
  changeZoomLevel(event) {
    const newZoomLevel = (event.target.id === 'zoom_up')
      ? this.map.getZoom() + 1
      : this.map.getZoom() - 1;

    this.map.setZoom(newZoomLevel);
    if (this.state.trackLayer) {
      this.state.trackLayer.regenerate();
      this.state.trackLayer.drawTile(
        this.props.map.track.seriesGroupData,
        this.props.map.track.selectedSeries,
        this.props.filters
      );
    }
  }

  /**
   * Big scary map rendering method
   * TODO: see if we can split this up into multiple React components or, if not, split up into multiple render methods
   *
   * @returns {XML}
   */
  render() {
    return (<div>
      <Modal opened={!this.props.token} closeable={false}>
        <NoLogin />
      </Modal>
      <Modal opened={this.props.shareModal.open} closeable close={this.props.closeShareModal}>
        <Share />
      </Modal>
      <Header />
      <div className={map.map_container} ref="mapContainer">

        <div className={map.zoom_controls}>
          <span id="share_map" onClick={this.props.openShareModal}>S</span>
          <span id="zoom_up" onClick={this.changeZoomLevel}>+</span>
          <span id="zoom_down" onClick={this.changeZoomLevel}>-</span>
        </div>
        <div className={map.timebar_container}>
          <Timebar />
        </div>
        <ControlPanel />
        <VesselPanel vesselInfo={this.state.currentVesselInfo} />
        <GoogleMapLoader
          containerElement={
            <div className={map.map} style={{ height: '100%' }} />
          }
          googleMapElement={
            <GoogleMap
              ref="map"
              defaultZoom={this.props.map.zoom}
              defaultCenter={{ lat: this.props.map.center[0], lng: this.props.map.center[1] }}
              defaultZoomControl={false}
              defaultOptions={{
                streetViewControl: false,
                mapTypeControl: false,
                zoomControl: false
              }}
              defaultMapTypeId={google.maps.MapTypeId.SATELLITE}
              onClick={this.onClickMap}
              onMousemove={this.onMouseMove}
              onZoomChanged={this.onZoomChanged}
              onDragstart={this.onDragStart}
              onDragend={this.onDragEnd}
              onIdle={this.onMapIdle}
            />
          }
        />
      </div>
    </div>);
  }
}

Map.propTypes = {
  filters: React.PropTypes.object,
  token: React.PropTypes.string,
  setZoom: React.PropTypes.func,
  getWorkspace: React.PropTypes.func,
  getSeriesGroup: React.PropTypes.func,
  updateFilters: React.PropTypes.func,
  toggleLayerVisibility: React.PropTypes.func,
  setCenter: React.PropTypes.func,
  map: React.PropTypes.object,
  /**
   * State of the share modal: { open, workspaceId }
   */
  shareModal: React.PropTypes.object,
  /**
   * Open the share modal
   */
  openShareModal: React.PropTypes.func,
  /**
   * Close the share modal
   */
  closeShareModal: React.PropTypes.func
};

export default Map;
