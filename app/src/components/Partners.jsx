import React, { Component } from 'react';
import CoverPrimary from './Shared/CoverPrimary';
import Footer from './Shared/Footer';
import PartnerSection from './Partners/PartnerSection';
import FunderSection from './Partners/FunderSection';
import ResearchSection from './Partners/ResearchSection';
import OtherSection from './Partners/OtherSection';

class Partners extends Component {

  render() {
    return (<div>
      <CoverPrimary
        title="Global Fishing Watch Partners"
        subtitle="Global Fishing Watch was created by Oceana, SkyTruth and Google, and works in partnership
        with a growing number of organizations that contribute data, expertise
        and funding to make global fishing activity more transparent."
        backgroundImageIndex={2}
      />
      <PartnerSection />
      <FunderSection />
      <ResearchSection />
      <OtherSection />
      <Footer />
    </div>);
  }

}

export default Partners;
