import React from 'react';
import { Info, MessageCircle } from 'lucide-react';

// Same WhatsApp number the rest of the site sends quotation/product requests to.
const WHATSAPP_NUMBER = '918296810381';

// Shown on the Catalog and Shop pages so customers don't mistake the listed prices for
// final/checkout prices - this is a browse-and-enquire catalog, not a live storefront.
const PriceNoticeBanner = () => {
  const message = encodeURIComponent("Hi! I'd like to know the actual price for a product I found on your site.");
  return (
    <div className="flex h-full flex-col sm:flex-row sm:items-center gap-4 rounded-3xl bg-white px-5 py-5 shadow-soft ring-1 ring-black/5 sm:px-6">
      <div className="flex items-start gap-4 flex-1">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
          <Info className="w-5 h-5 text-amber-600" />
        </span>
        <p className="text-sm leading-6 text-ink-600">
          <span className="font-bold text-brand-dark">Prices shown are indicative, not final.</span>{' '}
          Choose the product(s) you like and connect with us — we'll confirm the actual price for your order.
        </p>
      </div>
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-whatsapp shrink-0 !px-5 !py-2.5"
      >
        <MessageCircle className="w-4 h-4" />
        Connect with us
      </a>
    </div>
  );
};

export default PriceNoticeBanner;
