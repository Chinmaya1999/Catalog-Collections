import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import SEO from '../components/SEO';

const CatalogRequest = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[0-9]{10,15}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be 10-15 digits';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Please tell us what you need';
    }

    if (formData.message.length > 1000) {
      newErrors.message = 'Message must be under 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(API_ENDPOINTS.catalogRequest, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSubmitSuccess(true);
        setFormData({
          name: '',
          phoneNumber: '',
          message: ''
        });
      } else {
        console.error('Error submitting catalog request:', data);
        alert('Error submitting request. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting catalog request:', error);
      alert('Error submitting request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `input-field ${errors[field] ? '!border-red-400 focus:!ring-red-200' : ''}`;

  if (submitSuccess) {
    return (
      <div className="pt-20 min-h-screen bg-brand-light relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid mask-radial" />
        <div className="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="rounded-[2rem] bg-white p-10 text-center shadow-lift ring-1 ring-black/5"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', damping: 12 }}
              className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-[0_12px_30px_-8px_rgba(16,185,129,0.6)]"
            >
              <CheckCircle className="h-10 w-10 text-white" />
            </motion.div>
            <h2 className="text-3xl font-display font-extrabold tracking-tight text-brand-dark mb-3">Request Submitted!</h2>
            <p className="text-ink-500 leading-7 mb-9">
              Thank you for your catalog request. Our team will contact you shortly using the provided phone number.
            </p>
            <button
              onClick={() => {
                setSubmitSuccess(false);
                navigate('/');
              }}
              className="btn-secondary !px-8"
            >
              Return to Home
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  const steps = [
    'Tell us your name and phone number',
    'Describe the products or customization you need',
    'Submit the request and our team will contact you',
    'Get personalized help with your bulk order',
  ];

  return (
    <div className="pt-20 min-h-screen bg-brand-light">
      <SEO
        title="Request a Custom Catalog | Adihuman"
        description="Can't find the right catalog? Request a custom corporate gift catalog from Adihuman and get personalized assistance from our team."
        path="/catalog-request"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-8 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-ink-600 shadow-soft ring-1 ring-black/5 transition-all hover:-translate-x-0.5 hover:text-brand-dark"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="grid overflow-hidden rounded-[2rem] bg-white shadow-lift ring-1 ring-black/5 lg:grid-cols-5"
        >
          {/* Info panel */}
          <div className="relative overflow-hidden bg-brand-dark p-8 text-white sm:p-10 lg:col-span-2">
            <div className="pointer-events-none absolute inset-0 bg-grid-dark mask-fade-b" />
            <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-brand-yellow/25 blur-3xl" />
            <div className="relative">
              <p className="eyebrow !text-white/50">Catalog Request</p>
              <h1 className="mt-4 text-4xl font-display font-extrabold leading-[1.05] tracking-tight">
                Tell us what you need.
              </h1>
              <p className="mt-4 text-white/60">
                Tell us what you need and our team will help you create it
              </p>

              <h3 className="mt-12 text-xs font-bold uppercase tracking-[0.2em] text-white/40">How it works</h3>
              <ol className="mt-5 space-y-5">
                {steps.map((step, index) => (
                  <li key={step} className="flex items-start gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-yellow font-display text-xs font-bold text-brand-dark">
                      {index + 1}
                    </span>
                    <span className="pt-1 text-sm leading-6 text-white/75">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 p-8 sm:p-10 lg:col-span-3">
            {/* Name */}
            <div>
              <label htmlFor="name" className="field-label">
                Your Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={inputClass('name')}
                placeholder="Enter your name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1.5">{errors.name}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="field-label">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={inputClass('phoneNumber')}
                placeholder="Enter your phone number (10-15 digits)"
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm mt-1.5">{errors.phoneNumber}</p>
              )}
              <p className="text-ink-400 text-xs mt-1.5">
                We'll contact you on this number regarding your request
              </p>
            </div>

            {/* Custom Message */}
            <div>
              <label htmlFor="message" className="field-label">
                What do you need? *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="6"
                maxLength="1000"
                className={`${inputClass('message')} resize-none`}
                placeholder="Tell us the products, quantity, event date, budget, or customization you need..."
              />
              <div className="flex items-center justify-between mt-1.5">
                {errors.message ? (
                  <p className="text-red-500 text-sm">{errors.message}</p>
                ) : (
                  <span />
                )}
                <p className="text-ink-400 text-xs tabular-nums">{formData.message.length}/1000</p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full !py-4 !text-[15px] group"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-dark"></div>
                  Submitting...
                </>
              ) : (
                <>
                  Submit Request
                  <Send className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CatalogRequest;
