import React, { memo } from 'react';
import SEO from '../components/SEO';
import { SITE_URL, DEFAULT_TITLE, DEFAULT_DESCRIPTION } from '../config/seo';
import CorporateLanding from '../components/CorporateLanding';

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Adihuman',
  url: SITE_URL,
  logo: `${SITE_URL}/images/logo.png`,
  description: DEFAULT_DESCRIPTION,
  email: 'contact@adihuman.com',
  telephone: '+91-82968-10381',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Shop No. 8, Shri Balaji, KKR Complex, 1st Floor, Opposite SCT College, Kaggadasapura',
    addressLocality: 'Bangalore',
    postalCode: '560075',
    addressCountry: 'IN',
  },
};

const Home = memo(() => {
  return (
    <div className="pt-20">
      <SEO title={DEFAULT_TITLE} description={DEFAULT_DESCRIPTION} path="/" structuredData={organizationSchema} />
      <CorporateLanding />
    </div>
  );
});

export default Home;
