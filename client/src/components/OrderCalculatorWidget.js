import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X, Calculator } from 'lucide-react';
import OrderCalculator from './OrderCalculator';

const OrderCalculatorWidget = ({ catalogs = [], categories = [] }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed z-50 bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] max-w-sm max-h-[75vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-brand-yellow to-brand-gold px-4 py-3.5 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-white/40 flex items-center justify-center shrink-0">
                  <Calculator className="w-5 h-5 text-brand-dark" />
                </div>
                <div className="min-w-0">
                  <p className="font-display font-bold text-brand-dark text-sm leading-tight">
                    What do you want to order?
                  </p>
                  <p className="text-brand-dark/70 text-xs leading-tight mt-0.5">
                    Get your bulk price instantly
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="shrink-0 w-8 h-8 rounded-lg bg-white/40 hover:bg-white/60 flex items-center justify-center text-brand-dark transition-colors"
                aria-label="Close order calculator"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Panel body */}
            <div className="overflow-y-auto">
              <OrderCalculator catalogs={catalogs} categories={categories} compact />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating toggle button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed z-50 bottom-6 right-4 sm:right-6 w-14 h-14 rounded-full bg-gradient-to-r from-brand-yellow to-brand-gold shadow-xl flex items-center justify-center text-brand-dark hover:shadow-2xl transition-shadow"
        aria-label={isOpen ? 'Close order calculator' : 'What do you want to order?'}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ opacity: 0, rotate: -45 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 45 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.span>
          ) : (
            <motion.span
              key="chat"
              initial={{ opacity: 0, rotate: 45 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -45 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="w-6 h-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
};

export default OrderCalculatorWidget;
