import React, { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import SEO from '../components/SEO';
import { SITE_URL } from '../config/seo';

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Adihuman',
  url: SITE_URL,
  image: `${SITE_URL}/images/logo.png`,
  email: 'contact@adihuman.com',
  telephone: '+91-82968-10381',
  taxID: '29AACCU4243J1Z4',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Shop No. 8, Shri Balaji, KKR Complex, 1st Floor, Opposite SCT College, Kaggadasapura',
    addressLocality: 'Bangalore',
    postalCode: '560075',
    addressCountry: 'IN',
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '11:00',
    closes: '20:00',
  },
};

const Contact = memo(() => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(API_ENDPOINTS.contact, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', message: '' });
        setTimeout(() => {
          setSubmitted(false);
        }, 3000);
      } else {
        setError(data.message || 'Failed to send message. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again later.');
      console.error('Error submitting form:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light">
      <SEO
        title="Contact Us | Adihuman – Corporate Gifting & Custom Merchandise"
        description="Get in touch with Adihuman for corporate gifting, custom combo sets and bulk branded merchandise orders. Bangalore-based, WhatsApp and email support."
        path="/contact"
        structuredData={localBusinessSchema}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-36 pb-14 sm:pt-44">
        <div className="pointer-events-none absolute inset-0 bg-grid mask-radial" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[50rem] -translate-x-1/2 rounded-full bg-brand-yellow/30 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-3xl text-center"
          >
            <p className="eyebrow justify-center">Contact Us</p>
            <h1 className="mt-6 text-5xl font-display font-extrabold leading-[0.95] tracking-tightest text-brand-dark sm:text-7xl">
              Let's <span className="text-gradient-animated">talk gifting.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-ink-500">
              We are delighted to learn that you have some questions for us, and we assure you that we are easily approachable and ready to assist.
            </p>
          </motion.div>

          {/* Quick contact methods */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3"
          >
            <a
              href="mailto:contact@adihuman.com"
              className="group flex items-center gap-4 rounded-3xl bg-white p-4 shadow-soft ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-yellow transition-transform duration-300 group-hover:rotate-6">
                <Mail className="h-5 w-5 text-brand-dark" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Email</p>
                <p className="truncate font-semibold text-brand-dark">contact@adihuman.com</p>
              </div>
            </a>

            <a
              href="https://wa.me/918296810381"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-3xl bg-white p-4 shadow-soft ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#25D366] transition-transform duration-300 group-hover:rotate-6">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">WhatsApp</p>
                <p className="truncate font-semibold text-brand-dark">+91 82968 10381</p>
              </div>
            </a>

            <a
              href="tel:+918296810381"
              className="group flex items-center gap-4 rounded-3xl bg-white p-4 shadow-soft ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-dark transition-transform duration-300 group-hover:rotate-6">
                <Phone className="h-5 w-5 text-brand-yellow" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Phone</p>
                <p className="truncate font-semibold text-brand-dark">+91 82968 10381</p>
              </div>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-7"
            >
              <div className="h-full rounded-[2rem] bg-white p-7 shadow-card ring-1 ring-black/5 sm:p-10">
                <h2 className="text-3xl font-display font-extrabold tracking-tight text-brand-dark">
                  Drop us a line
                </h2>
                <p className="mt-2 mb-8 text-ink-500">We usually reply within a few hours.</p>

                {submitted ? (
                  <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-5 py-4 text-emerald-700 ring-1 ring-emerald-200">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"><Send className="h-4 w-4" /></span>
                    Thank you for your message! We'll get back to you soon.
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                      <div className="rounded-2xl bg-red-50 px-5 py-4 text-red-700 ring-1 ring-red-200">
                        {error}
                      </div>
                    )}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="field-label">
                          Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="input-field"
                          placeholder="Your name"
                        />
                      </div>

                      <div>
                        <label className="field-label">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="input-field"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="field-label">
                        Message
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows="6"
                        className="input-field resize-none"
                        placeholder="Your message..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-secondary w-full !py-4 !text-[15px] group"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          Submit
                          <Send className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col gap-6 lg:col-span-5"
            >
              {/* Store Information */}
              <div className="relative overflow-hidden rounded-[2rem] bg-brand-dark p-7 text-white shadow-card sm:p-10">
                <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-yellow/20 blur-3xl" />
                <p className="eyebrow !text-white/50">Visit us</p>
                <h2 className="relative mt-3 text-2xl font-display font-extrabold tracking-tight">
                  Adihuman Innovation Studio
                </h2>

                <div className="relative mt-8 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                      <MapPin className="h-5 w-5 text-brand-yellow" />
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-semibold text-white">Address</p>
                      <p className="text-sm leading-6 text-white/60">
                        Shop No. 8, Shri Balaji, KKR Complex, 1st Floor,<br />
                        Opposite SCT College, Kaggadasapura, Bangalore.<br />
                        Pin - 560075
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                      <Clock className="h-5 w-5 text-brand-yellow" />
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-semibold text-white">Store Hours</p>
                      <p className="text-sm text-white/60">
                        Open every day from 11 AM to 8 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Details */}
              <div className="rounded-[2rem] bg-white p-7 shadow-soft ring-1 ring-black/5 sm:p-8">
                <h2 className="text-lg font-display font-bold text-brand-dark">
                  Company Details
                </h2>
                <dl className="mt-5 divide-y divide-ink-200/70 text-sm">
                  <div className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-ink-500">Owned by</dt>
                    <dd className="text-right font-semibold text-brand-dark">UUO Innovation Private Limited</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-ink-500">GST Number</dt>
                    <dd className="font-mono font-semibold text-brand-dark">29AACCU4243J1Z4</dd>
                  </div>
                </dl>
              </div>
            </motion.div>
          </div>

          {/* Terms Notice */}
          <p className="mt-12 text-center text-xs text-ink-400">
            By using the website, you acknowledge that you have read, understood, and agreed to these Terms of Service.
          </p>
        </div>
      </section>
    </div>
  );
});

export default Contact;
