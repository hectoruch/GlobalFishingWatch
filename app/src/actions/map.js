import PelagosClient from '../lib/pelagosClient';
import _ from 'lodash';
import {
  SET_LAYERS,
  SET_ZOOM,
  SET_CENTER,
  TOGGLE_LAYER_VISIBILITY,
  SET_TIMELINE_DATES,
  GET_SERIESGROUP
} from '../constants';
const urlVessel = 'https://skytruth-pleuston.appspot.com/v1/tilesets/tms-format-2015-2016-v1/sub/';

export function toggleLayerVisibility(layer) {
  return {
    type: TOGGLE_LAYER_VISIBILITY,
    payload: layer
  };
}

function groupData(vectorArray) {
  const data = vectorArray[0];
  if (vectorArray && vectorArray.length > 1) {
    for (let index = 1, length = vectorArray.length; index < length; index++) {
      if (vectorArray[index] !== null) {
        if (index === 1) {
          data.category = Array.prototype.slice.call(data.category).concat(
            Array.prototype.slice.call(vectorArray[index].category)
          );
          data.datetime = Array.prototype.slice.call(data.datetime).concat(
            Array.prototype.slice.call(vectorArray[index].datetime)
          );
          data.latitude = Array.prototype.slice.call(data.latitude).concat(
            Array.prototype.slice.call(vectorArray[index].latitude)
          );
          data.longitude = Array.prototype.slice.call(data.longitude).concat(
            Array.prototype.slice.call(vectorArray[index].longitude)
          );
          data.series = Array.prototype.slice.call(data.series).concat(
            Array.prototype.slice.call(vectorArray[index].series)
          );
          data.seriesgroup = Array.prototype.slice.call(data.seriesgroup).concat(
            Array.prototype.slice.call(vectorArray[index].seriesgroup)
          );
          data.sigma = Array.prototype.slice.call(data.sigma).concat(
            Array.prototype.slice.call(vectorArray[index].sigma)
          );
          data.weight = Array.prototype.slice.call(data.weight).concat(
            Array.prototype.slice.call(vectorArray[index].weight)
          );
        } else {
          data.category = data.category.concat(Array.prototype.slice.call(vectorArray[index].category));
          data.datetime = data.datetime.concat(Array.prototype.slice.call(vectorArray[index].datetime));
          data.latitude = data.latitude.concat(Array.prototype.slice.call(vectorArray[index].latitude));
          data.longitude = data.longitude.concat(Array.prototype.slice.call(vectorArray[index].longitude));
          data.series = data.series.concat(Array.prototype.slice.call(vectorArray[index].series));
          data.seriesgroup = data.seriesgroup.concat(Array.prototype.slice.call(vectorArray[index].seriesgroup));
          data.sigma = data.sigma.concat(Array.prototype.slice.call(vectorArray[index].sigma));
          data.weight = data.weight.concat(Array.prototype.slice.call(vectorArray[index].weight));
        }
      }
    }
  }
  return data;
}

export function getSeriesGroup(seriesGroup, series, filters) {
  return (dispatch, getState) => {
    const state = getState();

    const startYear = new Date(filters.startDate).getUTCFullYear();
    const endYear = new Date(filters.endDate).getUTCFullYear();
    const urls = [];
    for (let i = startYear; i <= endYear; i++) {
      urls.push(`${urlVessel}seriesgroup=${seriesGroup}/${i}-01-01T00:00:00.000Z,${i + 1}-01-01T00:00:00.000Z;0,0,0`);
    }
    const promises = [];
    for (let urlIndex = 0, length = urls.length; urlIndex < length; urlIndex++) {
      promises.push(new PelagosClient().obtainTile(urls[urlIndex], state.user.token));
    }

    Promise.all(promises).then((rawTileData) => {
      if (rawTileData[0]) {
        const data = groupData(rawTileData);
        dispatch({
          type: GET_SERIESGROUP,
          payload: {
            seriesgroup: seriesGroup,
            seriesGroupData: data,
            series: _.uniq(data.series),
            selectedSeries: series
          }
        });
      } else {
        dispatch({
          type: GET_SERIESGROUP,
          payload: null
        });
      }
    });
  };
}

export function setZoom(zoom) {
  return {
    type: SET_ZOOM,
    payload: zoom
  };
}
export function setCenter(center) {
  return {
    type: SET_CENTER,
    payload: center
  };
}
/*
 ** CartoDB layers:
 ** MPA
 ** EEZ
 ** High Seas Pockets
 ** RFMOs
 */
export function getWorkspace(workspace) {
  return (dispatch, getState) => {
    const state = getState();

    let path = '/workspace.json';
    if (state.user.token) {
      path = '/workspace-logged.json';
    }

    if (!!~[1, 2].indexOf(+workspace)) {
      path = `/workspace-${workspace}.json`;
    }

    fetch(path, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${state.user.token}`
      }
    }).then((response) => {
      if (response.ok) {
        return response.json();
      }
      return null;
    }).then((data) => {
      const layers = [];
      const allowedTypes = ['CartoDBAnimation', 'ClusterAnimation'];

      for (let animationsIndex = 0, length = data.map.animations.length; animationsIndex < length; animationsIndex++) {
        const animation = data.map.animations[animationsIndex];
        if (allowedTypes.indexOf(animation.type) !== -1 && animation.args.source.args.url.indexOf('http') === 0) {
          const layerDetails = animation.args;
          layerDetails.type = animation.type;
          layers.push(layerDetails);
        }
      }

      return {
        layers,
        zoom: data.state.zoom,
        center: [data.state.lat, data.state.lon],
        timeline: [data.state.start_date, data.state.end_date]
      };
    })
      .then(({
        layers, zoom, center, timeline
      }) => {
        dispatch({
          type: SET_LAYERS,
          payload: layers
        });

        if (zoom) {
          dispatch({
            type: SET_ZOOM,
            payload: zoom
          });
        }

        if (center) {
          dispatch({
            type: SET_CENTER,
            payload: center
          });
        }

        if (timeline) {
          dispatch({
            type: SET_TIMELINE_DATES,
            payload: timeline
          });
        }
      })
      .catch(err => console.warn(`Unable to fetch the layers: ${err}`));
  };
}
