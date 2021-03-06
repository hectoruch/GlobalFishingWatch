import { connect } from 'react-redux';
import Header from '../components/Shared/Header';
import { login, logout } from '../actions/user';
import { getWorkspace } from '../actions/map';
import { setVisibleMenu } from '../actions/appearence';

const mapStateToProps = (state) => ({
  loggedUser: state.user.loggedUser
});

const mapDispatchToProps = (dispatch) => ({
  login: () => {
    dispatch(login());
  },
  logout: () => {
    const queryParams = location.query;
    const workspace = queryParams ? queryParams.workspace : null;
    dispatch(logout());
    dispatch(getWorkspace(workspace));
  },
  setVisibleMenu: (visible) => {
    dispatch(setVisibleMenu(visible));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(Header);
