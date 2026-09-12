import React from 'react';
import { Info, MessageCircle } from 'lucide-react';

// Same WhatsApp number the rest of the site sends quotation/product requests to.
const WHATSAPP_NUMBER = '918296810381';

// Shown on the Catalog and Shop pages so customers don't mistake the listed prices for
// final/checkout prices - this is a browse-and-enquire catalog, not a live storefront.
const PriceNoticeBanner = () => {
  const message = encodeURIComponent("Hi! I'd like to know the actual price for a product I found on your site.");
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
      <div className="flex items-start gap-3 flex-1">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-900">
          <span className="font-semibold">Prices shown are indicative, not final.</span>{' '}
          Choose the product(s) you like and connect with us — we'll confirm the actual price for your order.
        </p>
      </div>
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 shrink-0 px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        Connect with us
      </a>
    </div>
  );
};

export default PriceNoticeBanner;
