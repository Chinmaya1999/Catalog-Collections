import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Heart, Gift, Users, Target } from 'lucide-react';
import SEO from '../components/SEO';

const About = memo(() => {
  return (
    <div className="min-h-screen bg-brand-light">
      <SEO
        title="About Us | Custom Corporate Gifting Experts – Adihuman"
        description="Adihuman specializes in personalized corporate gifting — custom T-shirts, hoodies, caps, wallets, employee kits and branded merchandise for businesses across India."
        path="/about"
      />
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-brand-yellow to-brand-gold py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-brand-dark mb-4">
              About Us
            </h1>
            <p className="text-xl text-brand-dark/80 max-w-2xl mx-auto">
              Passionate about innovation and custom gifting
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* About Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12"
          >
            <div className="max-w-3xl mx-auto">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                At Adihuman, we are passionate about innovation and custom gifting. We specialize in personalizing T-shirts, Hoodies, Caps, wallets, and much more. Our mission is to help you add your brand to employee kits and create memorable, personalized products that make a lasting impression.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Whether you're looking for corporate gifting solutions, personalized merchandise for events, or custom products for your team, we bring creativity and quality to every project. Our commitment to excellence and attention to detail ensures that each product reflects your unique identity and brand values.
              </p>
            </div>
          </motion.div>

          {/* Values */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-brand-dark" />
              </div>
              <h3 className="text-xl font-display font-bold text-brand-dark mb-2">
                Passion
              </h3>
              <p className="text-gray-600 text-sm">
                Driven by love for innovation and creativity
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-brand-dark" />
              </div>
              <h3 className="text-xl font-display font-bold text-brand-dark mb-2">
                Customization
              </h3>
              <p className="text-gray-600 text-sm">
                Personalized solutions for every need
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-brand-dark" />
              </div>
              <h3 className="text-xl font-display font-bold text-brand-dark mb-2">
                Customer Focus
              </h3>
              <p className="text-gray-600 text-sm">
                Your satisfaction is our priority
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-brand-dark" />
              </div>
              <h3 className="text-xl font-display font-bold text-brand-dark mb-2">
                Quality
              </h3>
              <p className="text-gray-600 text-sm">
                Excellence in every product we create
              </p>
            </div>
          </motion.div>

          {/* What We Offer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg p-8 md:p-12"
          >
            <h2 className="text-3xl font-display font-bold text-brand-dark mb-8 text-center">
              What We Offer
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 bg-brand-light rounded-xl">
                <h3 className="text-lg font-semibold text-brand-dark mb-2">
                  Personalized T-Shirts
                </h3>
                <p className="text-gray-600 text-sm">
                  Custom designs on premium quality t-shirts
                </p>
              </div>

              <div className="p-6 bg-brand-light rounded-xl">
                <h3 className="text-lg font-semibold text-brand-dark mb-2">
                  Custom Hoodies
                </h3>
                <p className="text-gray-600 text-sm">
                  Comfortable hoodies with your unique branding
                </p>
              </div>

              <div className="p-6 bg-brand-light rounded-xl">
                <h3 className="text-lg font-semibold text-brand-dark mb-2">
                  Branded Caps
                </h3>
                <p className="text-gray-600 text-sm">
                  Stylish caps with custom logo printing
                </p>
              </div>

              <div className="p-6 bg-brand-light rounded-xl">
                <h3 className="text-lg font-semibold text-brand-dark mb-2">
                  Custom Wallets
                </h3>
                <p className="text-gray-600 text-sm">
                  Personalized wallets for corporate gifting
                </p>
              </div>

              <div className="p-6 bg-brand-light rounded-xl">
                <h3 className="text-lg font-semibold text-brand-dark mb-2">
                  Employee Kits
                </h3>
                <p className="text-gray-600 text-sm">
                  Complete branded kits for your team
                </p>
              </div>

              <div className="p-6 bg-brand-light rounded-xl">
                <h3 className="text-lg font-semibold text-brand-dark mb-2">
                  Corporate Gifting
                </h3>
                <p className="text-gray-600 text-sm">
                  Premium gifts for clients and partners
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl font-display font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Let's create something amazing together. Contact us to discuss your custom gifting needs.
            </p>
            <a
              href="/contact"
              className="inline-block btn-primary"
            >
              Contact Us Today
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
});

export default About;
