import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Eye, ArrowRight, Phone } from 'lucide-react';
import { getImageUrl } from '../config/api';
import { CatalogBadges, CatalogPrice } from './catalogDisplay';

/**
 * The standard catalog grid card — image with badges/save/hover-preview,
 * title, description, price, and actions. Shared by the Home and Catalog
 * pages so both stay visually identical.
 */
const CatalogCard = ({ catalog, onPreview, isSaved, onToggleSave, variants }) => (
  <motion.div variants={variants} whileHover={{ y: -6 }}>
    <div className="group bg-white rounded-2xl shadow-md hover:shadow-2xl overflow-hidden border border-gray-100 transition-shadow duration-300 h-full flex flex-col">
      {/* Image */}
      <div className="relative h-48 w-full bg-gradient-to-br from-brand-yellow/20 to-brand-gold/20 overflow-hidden">
        <div
          role="button"
          tabIndex={0}
          onClick={() => onPreview(catalog)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onPreview(catalog)}
          className="absolute inset-0 z-10 cursor-pointer"
          aria-label={`Preview ${catalog.name}`}
        />
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 items-start max-w-[75%]">
          {(catalog.categoryNames && catalog.categoryNames.length > 0 ? catalog.categoryNames : [catalog.categoryName]).filter(Boolean).map((catName, idx) => (
            <span key={idx} className="bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-900 px-2.5 py-1 rounded-full shadow-sm">
              {catName}
            </span>
          ))}
          <CatalogBadges catalog={catalog} />
        </div>
        {onToggleSave && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(catalog._id);
            }}
            className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
            aria-label={isSaved ? 'Remove from saved' : 'Save catalog'}
            title={isSaved ? 'Remove from saved' : 'Save catalog'}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-gray-500'}`} />
          </button>
        )}
        <img
          src={getImageUrl(catalog.image)}
          alt={catalog.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4 pointer-events-none">
          <span className="text-white text-sm font-semibold inline-flex items-center gap-1">
            <Eye className="w-4 h-4" />
            Preview catalog
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-gray-900 mb-1.5 line-clamp-1">{catalog.name}</h3>
        <p className="text-gray-500 text-sm mb-3 line-clamp-2 flex-1">{catalog.description}</p>

        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <CatalogPrice catalog={catalog} />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => onPreview(catalog)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-brand-yellow to-brand-gold text-brand-dark px-3 py-2.5 rounded-xl font-bold text-sm hover:shadow-md transition-all"
          >
            View Catalog
          </button>
          <Link
            to="/contact"
            className="flex items-center justify-center gap-1 bg-gray-900 text-white px-3 py-2.5 rounded-xl hover:bg-black transition-all text-sm"
            title="Contact us"
          >
            <Phone className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  </motion.div>
);

export default CatalogCard;
