import React, { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle } from 'lucide-react';

const Contact = memo(() => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real application, you would send this data to a backend
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', message: '' });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-brand-light">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-brand-yellow to-brand-gold py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-brand-dark mb-4">
              Contact Us
            </h1>
            <p className="text-xl text-brand-dark/80 max-w-2xl mx-auto">
              We are delighted to learn that you have some questions for us, and we assure you that we are easily approachable and ready to assist.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-display font-bold text-brand-dark mb-6">
                  Drop us a line
                </h2>
                
                {submitted ? (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
                    Thank you for your message! We'll get back to you soon.
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none transition-all"
                        placeholder="Your name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none transition-all"
                        placeholder="your@email.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows="5"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none transition-all resize-none"
                        placeholder="Your message..."
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      Submit
                    </button>
                  </form>
                )}
              </div>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              {/* Contact Methods */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-display font-bold text-brand-dark mb-6">
                  Get in Touch
                </h2>
                
                <div className="space-y-4">
                  <a
                    href="mailto:contact@adihuman.com"
                    className="flex items-center gap-4 p-4 bg-brand-light rounded-lg hover:bg-brand-yellow/20 transition-colors"
                  >
                    <div className="w-12 h-12 bg-brand-yellow rounded-full flex items-center justify-center">
                      <Mail className="w-6 h-6 text-brand-dark" />
                    </div>
                    <div>
                      <p className="font-semibold text-brand-dark">Email</p>
                      <p className="text-gray-600">contact@adihuman.com</p>
                    </div>
                  </a>
                  
                  <a
                    href="https://wa.me/918296810381"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-brand-light rounded-lg hover:bg-brand-yellow/20 transition-colors"
                  >
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-brand-dark">WhatsApp</p>
                      <p className="text-gray-600">+91 82968 10381</p>
                    </div>
                  </a>
                  
                  <a
                    href="tel:+918296810381"
                    className="flex items-center gap-4 p-4 bg-brand-light rounded-lg hover:bg-brand-yellow/20 transition-colors"
                  >
                    <div className="w-12 h-12 bg-brand-yellow rounded-full flex items-center justify-center">
                      <Phone className="w-6 h-6 text-brand-dark" />
                    </div>
                    <div>
                      <p className="font-semibold text-brand-dark">Phone</p>
                      <p className="text-gray-600">+91 82968 10381</p>
                    </div>
                  </a>
                </div>
              </div>

              {/* Store Information */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-display font-bold text-brand-dark mb-6">
                  Adihuman Innovation Studio
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-yellow rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-brand-dark" />
                    </div>
                    <div>
                      <p className="font-semibold text-brand-dark mb-1">Address</p>
                      <p className="text-gray-600">
                        Shop No. 8, Shri Balaji, KKR Complex, 1st Floor,<br />
                        Opposite SCT College, Kaggadasapura, Bangalore.<br />
                        Pin - 560075
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-yellow rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-brand-dark" />
                    </div>
                    <div>
                      <p className="font-semibold text-brand-dark mb-1">Store Hours</p>
                      <p className="text-gray-600">
                        Open every day from 11 AM to 8 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Details */}
              <div className="bg-brand-dark rounded-2xl shadow-lg p-8 text-white">
                <h2 className="text-xl font-display font-bold mb-4">
                  Company Details
                </h2>
                <div className="space-y-2 text-gray-300">
                  <p>
                    <span className="text-brand-yellow">Owned by:</span> UUO Innovation Private Limited
                  </p>
                  <p>
                    <span className="text-brand-yellow">GST Number:</span> 29AACCU4243J1Z4
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Terms Notice */}
      <section className="py-8 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-600">
            By using the website, you acknowledge that you have read, understood, and agreed to these Terms of Service.
          </p>
        </div>
      </section>
    </div>
  );
});

export default Contact;
