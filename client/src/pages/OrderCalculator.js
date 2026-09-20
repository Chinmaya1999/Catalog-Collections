import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';
import ProductOrderCalculator from '../components/ProductOrderCalculator';

const OrderCalculator = () => (
  <div className="pt-20 min-h-screen bg-brand-light">
    <SEO
      title="Bulk Order Calculator | Adihuman"
      description="Pick a category, brand and quantity to see your bulk discount instantly, then send the quotation straight to WhatsApp."
      path="/order-calculator"
    />

    <section className="relative overflow-hidden bg-gradient-to-b from-brand-light to-white">
      <div className="pointer-events-none absolute -top-32 -right-24 w-96 h-96 bg-brand-yellow/25 rounded-full blur-3xl" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 text-center">
        <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Shop
        </Link>
        <h1 className="text-4xl md:text-5xl font-display font-extrabold text-gray-900 mb-3">
          Bulk Order <span className="text-gradient">Calculator</span>
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Filter by category and price, pick a brand, choose your quantity — we will work out your bulk discount instantly and send it to WhatsApp.
        </p>
      </div>
    </section>

    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
      >
        <ProductOrderCalculator />
      </motion.div>
    </section>
  </div>
);

export default OrderCalculator;
