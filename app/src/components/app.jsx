'use strict';

import React, {Component} from "react";

const ACCESS_TOKEN_REGEX = /#access_token=([a-zA-Z0-9.\-\_]*)(&[a-z=])?/g

class App extends Component {

  componentWillMount() {
    ACCESS_TOKEN_REGEX.lastIndex = 0;
    if (ACCESS_TOKEN_REGEX.test(window.location.hash)) {
      ACCESS_TOKEN_REGEX.lastIndex = 0;
      const parts = ACCESS_TOKEN_REGEX.exec(window.location.hash);
      if (parts && parts.length >= 2) {
        this.props.setToken(parts[1]);
      }
    }
    this.props.getLoggedUser();
  }

  render() {
    return (
      <div>
        {this.props.loading && <div>Loading....</div>}
        {this.props.children}
      </div>
    );
  }

}

export default App;