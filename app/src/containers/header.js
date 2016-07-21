'use strict';

import {connect} from "react-redux";
import Header from "../components/shared/header";

const mapStateToProps = (state) => {
  return {
    loggedUser: state.user.loggedUser
  };
};

export default connect(mapStateToProps)(Header);