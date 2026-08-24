import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { X, PartyPopper, ArrowRight } from 'lucide-react';

export const THEME_META = {
  confetti: {
    label: 'Confetti',
    emoji: '🎉',
    kind: 'fall',
    glyphs: ['▮', '▮', '●', '▮', '●'],
    colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#A78BFA', '#FB7185'],
    bgClass: 'bg-gradient-to-br from-brand-yellow via-brand-gold to-orange-500',
    count: 26,
    size: '0.7rem'
  },
  snow: {
    label: 'Snowfall',
    emoji: '❄️',
    kind: 'fall',
    glyphs: ['❄', '❅', '❆'],
    colors: ['#ffffff'],
    bgClass: 'bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700',
    count: 22,
    size: '1.1rem'
  },
  fireworks: {
    label: 'Fireworks',
    emoji: '🎆',
    kind: 'rise',
    glyphs: ['✨', '🎆', '🎇'],
    colors: ['#ffffff'],
    bgClass: 'bg-gradient-to-br from-purple-700 via-fuchsia-600 to-rose-600',
    count: 16,
    size: '1.2rem'
  },
  diyas: {
    label: 'Diyas',
    emoji: '🪔',
    kind: 'twinkle',
    glyphs: ['🪔'],
    colors: ['#ffffff'],
    bgClass: 'bg-gradient-to-br from-amber-700 via-orange-700 to-red-800',
    count: 12,
    size: '1.5rem'
  },
  none: {
    label: 'No animation',
    emoji: '📣',
    kind: 'none',
    glyphs: [],
    colors: [],
    bgClass: 'bg-gradient-to-br from-gray-800 to-gray-900',
    count: 0,
    size: '1rem'
  }
};

// Twinkling particles (diyas) sit still, so keep them in a top/bottom
// border band rather than scattered over the middle — otherwise they sit
// on top of the title/message text and make it hard to read.
const twinkleTop = () => (Math.random() < 0.5 ? Math.random() * 16 : 84 + Math.random() * 16);

const buildParticles = (meta) =>
  Array.from({ length: meta.count }).map((_, i) => ({
    id: i,
    left: Math.round(Math.random() * 100),
    top: meta.kind === 'twinkle' ? twinkleTop() : Math.round(Math.random() * 100),
    delay: +(Math.random() * 4).toFixed(2),
    duration: +(4 + Math.random() * 4).toFixed(2),
    glyph: meta.glyphs[i % meta.glyphs.length],
    color: meta.colors[i % meta.colors.length]
  }));

const FestiveParticles = ({ theme }) => {
  const meta = THEME_META[theme] || THEME_META.confetti;
  const particles = useMemo(() => buildParticles(meta), [meta]);

  if (meta.kind === 'none') return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className={`offer-particle offer-particle-${meta.kind}`}
          style={{
            left: `${p.left}%`,
            top: meta.kind === 'twinkle' ? `${p.top}%` : undefined,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            color: p.color,
            fontSize: meta.size
          }}
        >
          {p.glyph}
        </span>
      ))}
    </div>
  );
};

/**
 * Shared festive offer visual — used both for the live preview in the
 * Superadmin "Announcements" tab and the public-facing popup.
 */
const FestiveOfferCard = ({ announcement, onClose, compact = false }) => {
  if (!announcement) return null;

  const meta = THEME_META[announcement.theme] || THEME_META.confetti;
  const hasDiscount = Number(announcement.discountPercent) > 0;
  const ctaLink = announcement.ctaLink || '/catalog';
  const isExternal = /^https?:\/\//.test(ctaLink);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl shadow-2xl text-center text-white ${meta.bgClass} ${
        compact ? 'p-6' : 'p-8 sm:p-10'
      }`}
    >
      <FestiveParticles theme={announcement.theme} />

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          aria-label="Close offer"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
          <PartyPopper className="w-4 h-4" />
          {meta.emoji} Special Offer
        </div>

        {hasDiscount && (
          <p className={`font-display font-extrabold leading-none mb-2 ${compact ? 'text-4xl' : 'text-6xl sm:text-7xl'}`}>
            {announcement.discountPercent}% OFF
          </p>
        )}

        <h2 className={`font-display font-bold mb-2 ${compact ? 'text-lg' : 'text-2xl sm:text-3xl'}`}>
          {announcement.title}
        </h2>
        <p className={`text-white/90 max-w-md mx-auto ${compact ? 'text-sm mb-5' : 'text-base mb-7'}`}>
          {announcement.message}
        </p>

        {isExternal ? (
          <a
            href={ctaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-6 py-3 rounded-xl hover:scale-105 transition-transform shadow-lg"
          >
            {announcement.ctaText || 'Shop Now'}
            <ArrowRight className="w-4 h-4" />
          </a>
        ) : (
          <Link
            to={ctaLink}
            onClick={onClose}
            className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-6 py-3 rounded-xl hover:scale-105 transition-transform shadow-lg"
          >
            {announcement.ctaText || 'Shop Now'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default FestiveOfferCard;
