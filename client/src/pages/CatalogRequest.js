import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import SEO from '../components/SEO';

const CatalogRequest = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    catalogCode: '',
    catalogNumber: '',
    phoneNumber: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.catalogCode.trim()) {
      newErrors.catalogCode = 'Catalog code is required';
    }
    
    if (!formData.catalogNumber.trim()) {
      newErrors.catalogNumber = 'Catalog number is required';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[0-9]{10,15}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be 10-15 digits';
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
          catalogCode: '',
          catalogNumber: '',
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

  if (submitSuccess) {
    return (
      <div className="pt-20 min-h-screen bg-brand-light">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg p-8 text-center"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Request Submitted!</h2>
            <p className="text-gray-600 mb-8">
              Thank you for your catalog request. Our team will contact you shortly using the provided phone number.
            </p>
            <button
              onClick={() => {
                setSubmitSuccess(false);
                navigate('/');
              }}
              className="btn-primary inline-flex items-center"
            >
              Return to Home
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-brand-light">
      <SEO
        title="Request a Custom Catalog | Adihuman"
        description="Can't find the right catalog? Request a custom corporate gift catalog from Adihuman and get personalized assistance from our team."
        path="/catalog-request"
      />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-8 py-6">
              <h1 className="text-3xl font-bold text-gray-900">Catalog Request</h1>
              <p className="text-gray-800 mt-2">
                Submit your catalog code and details to get personalized assistance
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Catalog Code */}
              <div>
                <label htmlFor="catalogCode" className="block text-sm font-semibold text-gray-900 mb-2">
                  Catalog Code *
                </label>
                <input
                  type="text"
                  id="catalogCode"
                  name="catalogCode"
                  value={formData.catalogCode}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.catalogCode ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all`}
                  placeholder="Enter your catalog code"
                />
                {errors.catalogCode && (
                  <p className="text-red-500 text-sm mt-1">{errors.catalogCode}</p>
                )}
              </div>

              {/* Catalog Number */}
              <div>
                <label htmlFor="catalogNumber" className="block text-sm font-semibold text-gray-900 mb-2">
                  Catalog Number *
                </label>
                <input
                  type="text"
                  id="catalogNumber"
                  name="catalogNumber"
                  value={formData.catalogNumber}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.catalogNumber ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all`}
                  placeholder="Enter your catalog number"
                />
                {errors.catalogNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.catalogNumber}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-900 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all`}
                  placeholder="Enter your phone number (10-15 digits)"
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  We'll contact you on this number regarding your request
                </p>
              </div>

              {/* Custom Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-900 mb-2">
                  Message <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="4"
                  maxLength="1000"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.message ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all resize-none`}
                  placeholder="Add any specific details, quantities, or questions you'd like us to know..."
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.message ? (
                    <p className="text-red-500 text-sm">{errors.message}</p>
                  ) : (
                    <span />
                  )}
                  <p className="text-gray-400 text-xs">{formData.message.length}/1000</p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Request
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Info Card */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-2">How it works</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 text-sm">
              <li>Enter your catalog code and number from our catalog</li>
              <li>Provide your phone number for contact</li>
              <li>Submit the request and our team will reach out to you</li>
              <li>Get personalized assistance with your catalog selection</li>
            </ol>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CatalogRequest;