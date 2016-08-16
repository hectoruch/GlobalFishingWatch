import React, { Component } from 'react';
import Header from '../containers/Header';
import Footer from './Shared/Footer';
import ContactUsForm from './ContactUs/ContactUsForm';
import contactStyle from '../../styles/components/c-contact.scss';

class ContactUs extends Component {

  render() {
    return (<div className={contactStyle['c-contact']}>
      <div className={contactStyle['layer-cover']}>
        <Header />
        <ContactUsForm onFormSubmit={this.props.submitForm} contactStatus={this.props.contactStatus} />
      </div>
      <Footer />
    </div>);
  }
}

ContactUs.propTypes = {
  contactStatus: React.PropTypes.number,
  submitForm: React.PropTypes.func
};

export default ContactUs;
