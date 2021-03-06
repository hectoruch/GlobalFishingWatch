import React, { Component } from 'react';
import MapContainer from '../containers/Map';
import MapIFrameContainer from '../containers/MapIFrame';

class AuthMap extends Component {

  componentWillMount() {
    if (!this.props.token && this.props.canRedirect) {
      this.props.login();
    }
  }

  render() {
    return (EMBED_MAP_URL) ? <MapIFrameContainer location={this.props.location} /> :
      <MapContainer location={this.props.location} />;
  }
}

AuthMap.propTypes = {
  /**
   * Location from React Router Redux
   */
  location: React.PropTypes.object,
  /**
   * User token for the map
   */
  token: React.PropTypes.string,
  /**
   * Whether the user can be redirected to SalesForce to get the token
   */
  canRedirect: React.PropTypes.bool,
  /**
   * Method to redirect the user to SalesForce to login and get the token
   */
  login: React.PropTypes.func
};

export default AuthMap;
