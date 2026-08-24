import React from 'react';
import { Sparkles, Leaf, Package, Tag } from 'lucide-react';

export const CatalogSkeletonCard = () => (
  <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 animate-pulse">
    <div className="h-48 w-full bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-5/6" />
      <div className="h-6 bg-gray-100 rounded-full w-24" />
      <div className="flex gap-2 pt-2">
        <div className="h-10 bg-gray-200 rounded-xl flex-1" />
        <div className="h-10 w-10 bg-gray-200 rounded-xl" />
      </div>
    </div>
  </div>
);

export const CatalogBadges = ({ catalog }) => (
  <div className="flex flex-wrap gap-1">
    {catalog.new && (
      <span className="bg-brand-yellow text-brand-dark px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
        NEW
      </span>
    )}
    {catalog.featured && (
      <span className="bg-brand-dark text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm inline-flex items-center gap-0.5">
        <Sparkles className="w-2.5 h-2.5" />
        FEATURED
      </span>
    )}
    {catalog.ecoFriendly && (
      <span className="bg-green-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm inline-flex items-center gap-0.5">
        <Leaf className="w-2.5 h-2.5" />
        ECO
      </span>
    )}
    {catalog.comboCount > 0 && (
      <span className="bg-white/90 text-gray-900 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm inline-flex items-center gap-0.5">
        <Package className="w-2.5 h-2.5" />
        {catalog.comboCount} ITEMS
      </span>
    )}
  </div>
);

export const CatalogPrice = ({ catalog }) => {
  if (catalog.priceRange && (catalog.priceRange.minPrice > 0 || catalog.priceRange.maxPrice > 0)) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 rounded-full">
        <Tag className="w-3 h-3 text-brand-gold" />
        <p className="text-xs font-semibold text-gray-900">
          {catalog.priceRange.currency}{catalog.priceRange.minPrice} - {catalog.priceRange.currency}{catalog.priceRange.maxPrice}
        </p>
      </div>
    );
  }
  return (
    <span className="text-xs font-semibold text-gray-400">
      {catalog.comboCount > 0 ? `${catalog.comboCount} items` : 'View catalog'}
    </span>
  );
};
