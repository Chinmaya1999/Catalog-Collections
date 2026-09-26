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

    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid mask-radial" />
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[50rem] h-96 bg-brand-yellow/25 rounded-full blur-3xl" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6 sm:pt-16 text-center">
        <Link to="/shop" className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-ink-600 shadow-soft ring-1 ring-black/5 transition-all hover:-translate-x-0.5 hover:text-brand-dark mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Shop
        </Link>
        <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tightest leading-[0.95] text-brand-dark mb-5">
          Bulk order <span className="text-gradient-animated">calculator</span>
        </h1>
        <p className="text-ink-500 text-lg max-w-2xl mx-auto">
          Filter by category and price, pick a brand, choose your quantity — we will work out your bulk discount instantly and send it to WhatsApp.
        </p>
      </div>
    </section>

    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
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
