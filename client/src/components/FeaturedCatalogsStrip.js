import React from 'react';
import { Sparkles } from 'lucide-react';
import { getImageUrl } from '../config/api';
import { CatalogPrice } from './catalogDisplay';

/**
 * Auto-scrolling strip of featured catalogs. Renders nothing if there are
 * no featured catalogs. Shared by the Home and Catalog pages.
 */
const FeaturedCatalogsStrip = ({ catalogs, onPreview, title = 'Featured Catalogs' }) => {
  const featuredCatalogs = catalogs.filter((c) => c.featured);
  if (featuredCatalogs.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-brand-gold" />
        <h2 className="text-lg font-display font-bold text-gray-900">{title}</h2>
      </div>
      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_2rem,black_calc(100%-2rem),transparent)]">
        <div
          className="flex gap-4 w-max pb-2 animate-scroll-left"
          style={{ animationDuration: `${Math.max(featuredCatalogs.length * 5, 18)}s` }}
        >
          {[...featuredCatalogs, ...featuredCatalogs].map((catalog, idx) => (
            <button
              key={`${catalog._id}-${idx}`}
              onClick={() => onPreview(catalog)}
              aria-hidden={idx >= featuredCatalogs.length}
              tabIndex={idx >= featuredCatalogs.length ? -1 : 0}
              className="group relative shrink-0 w-56 rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-shadow text-left bg-white"
            >
              <div className="relative h-32 w-full bg-gradient-to-br from-brand-yellow/20 to-brand-gold/20 overflow-hidden">
                <img
                  src={getImageUrl(catalog.image)}
                  alt={catalog.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <span className="absolute top-2 left-2 bg-brand-dark text-white px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  FEATURED
                </span>
              </div>
              <div className="p-3">
                <p className="text-sm font-bold text-gray-900 line-clamp-1">{catalog.name}</p>
                <div className="mt-1.5">
                  <CatalogPrice catalog={catalog} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedCatalogsStrip;
