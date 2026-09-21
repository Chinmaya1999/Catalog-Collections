import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Check,
  Palette,
  Phone,
  ShieldCheck,
  Sparkles,
  Truck,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { API_ENDPOINTS, getImageUrl } from '../config/api';
import { categoryImage } from '../utils/categoryImages';

const IMAGE_SLIDE_DURATION = 5000;

const heroSlides = [
  { type: 'video', src: '/uploads/video/20260920_065151_0_UTC_0.mp4', label: 'Behind the scenes' },
  { type: 'video', src: '/uploads/video/PixVerse_V6_Image_Text_540P_Premium_corporate_.mp4', label: 'Blank to branded' },
  { type: 'video', src: '/uploads/video/PixVerse_V6_Image_Text_540P_Premium_corporate_-2.mp4', label: 'Precision printing' },
  { type: 'video', src: '/uploads/video/PixVerse_V6_Image_Text_540P_Premium_corporate_-3.mp4', label: 'Packed and delivered' },
].map((slide) => ({ ...slide, src: getImageUrl(slide.src) }));

heroSlides.push({ type: 'image', src: '/images/brand-showcase.png', label: 'Everything we make' });

const brandVideoPoster = getImageUrl(`/uploads/video/${encodeURIComponent('ChatGPT Image Sep 20, 2026 at 12_34_56 PM.png')}`);

const productLines = [
  {
    title: 'Premium gift sets',
    label: 'Ready to impress',
    description: 'Curated kits with diaries, pens, bottles, cardholders and more.',
    image: '/images/box2.png',
    className: 'md:col-span-2 md:row-span-2',
    tone: 'text-white',
  },
  {
    title: 'Custom apparel',
    label: 'Wear your brand',
    description: 'T-shirts, uniforms and everyday merch made your way.',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&h=1100&fit=crop',
    className: '',
    tone: 'text-white',
  },
  {
    title: 'Drinkware',
    label: 'Made to be used',
    description: 'Bottles, mugs and tumblers for teams on the move.',
    image: '/images/stell bolltel.png',
    className: '',
    tone: 'text-white',
  },
  {
    title: 'Office essentials',
    label: 'Useful, every day',
    description: 'Pens, notebooks, tech accessories and desk-ready gifts.',
    image: '/images/pen-diary.png',
    className: 'md:col-span-2',
    tone: 'text-white',
  },
  {
    title: 'Home & lifestyle',
    label: 'Beyond the desk',
    description: 'Thoughtful accessories for homes, festivals and celebrations.',
    image: '/images/box3.png',
    className: '',
    tone: 'text-white',
  },
  {
    title: 'Diwali & festival gifts',
    label: 'Celebrate together',
    description: 'Branded festive hampers and thoughtful gift sets for every celebration.',
    image: '/images/box2.png',
    className: 'md:col-span-2',
    tone: 'text-white',
  },
];

const featuredProducts = [
  { name: 'Executive gift box', category: 'Gift sets', image: '/images/box.png' },
  { name: 'Diary & premium pen', category: 'Office essentials', image: '/images/pen-diary.png' },
  { name: 'Insulated steel bottle', category: 'Drinkware', image: '/images/stell bolltel.png' },
  { name: 'Cardholder & keychain', category: 'Accessories', image: '/images/card.png' },
  { name: 'Custom keychain', category: 'Brand merchandise', image: '/images/keychain.png' },
  { name: 'Premium welcome kit', category: 'Corporate gifting', image: '/images/box3.png' },
];

const techniqueTiles = [
  { title: 'T-shirt printing', description: 'Screen printing, DTF, sublimation, digital printing', image: '/images/showcase/tshirt-printing.png' },
  { title: 'Bottle branding', description: 'UV printing, laser engraving, logo printing', image: '/images/showcase/bottle-branding.png' },
  { title: 'Pen branding', description: 'Precision engraving, logo printing', image: '/images/showcase/pen-branding.png' },
  { title: 'Diary & notebooks', description: 'Embossing, debossing, printing', image: '/images/showcase/diary-notebooks.png' },
  { title: 'Laser engraving', description: 'Precision, premium finish', image: '/images/showcase/laser-engraving.png' },
  { title: 'Mug customization', description: 'Your design, your style', image: '/images/showcase/mug-customization.png' },
];

const processTiles = [
  { title: 'Your design', description: 'Share your logo or design', image: '/images/showcase/your-design.png' },
  { title: 'Corporate gift sets', description: 'Thoughtful gifts, stronger relationships', image: '/images/showcase/corporate-gift-sets.png' },
  { title: 'Bulk orders', description: 'For companies, events and promotions', image: '/images/showcase/bulk-orders.png' },
  { title: 'Premium packaging', description: 'Make a lasting impression', image: '/images/showcase/premium-packaging.png' },
  { title: 'Ready to deliver', description: 'From our team to your team', image: '/images/showcase/ready-to-deliver.png' },
];

const servicePoints = [
  'Logo printing, engraving and embroidery',
  'Custom colours, packaging and gift notes',
  'Small teams to large corporate rollouts',
  'One partner from idea to delivery',
];

const processSteps = [
  { number: '01', title: 'Tell us the occasion', description: 'Share your event, audience, quantity and budget.' },
  { number: '02', title: 'Choose your products', description: 'Mix apparel, drinkware, desk goods, tech and gift sets.' },
  { number: '03', title: 'Make it yours', description: 'We add your logo, message, colours and packaging details.' },
  { number: '04', title: 'We deliver in bulk', description: 'Quality checked, packed and delivered on your timeline.' },
];

const motionProps = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.16 },
  transition: { duration: 0.55 },
};

const CorporateLanding = () => {
  const [allProducts, setAllProducts] = useState(featuredProducts);
  const [categories, setCategories] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [iconOffset, setIconOffset] = useState(0);
  const videoRef = useRef(null);
  const currentSlide = heroSlides[activeSlide];
  const heroIconCount = Math.min(4, allProducts.length);

  const advanceSlide = () => {
    setActiveSlide((index) => (index + 1) % heroSlides.length);
  };

  useEffect(() => {
    if (currentSlide.type !== 'video') return;
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl.src = currentSlide.src;
    videoEl.load();
    videoEl.play().catch(() => {});
  }, [activeSlide, currentSlide]);

  useEffect(() => {
    if (currentSlide.type !== 'image') return undefined;
    const timer = setTimeout(advanceSlide, IMAGE_SLIDE_DURATION);
    return () => clearTimeout(timer);
  }, [activeSlide, currentSlide]);

  useEffect(() => {
    if (allProducts.length <= heroIconCount) return undefined;
    const interval = setInterval(() => {
      setIconOffset((offset) => (offset + heroIconCount) % allProducts.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [allProducts.length, heroIconCount]);

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.products}?limit=60&sort=newest`);
        if (!response.ok) return;

        const data = await response.json();
        const products = (data.products || [])
          .map((product) => {
            const primaryImage = product.images?.find((image) => image.isPrimary) || product.images?.[0];
            if (!primaryImage?.path) return null;
            return {
              name: product.name || 'Featured product',
              category: product.categoryName || product.category || 'Corporate gifting',
              image: getImageUrl(primaryImage.path),
              href: `/shop/${product._id}`,
            };
          })
          .filter(Boolean);

        if (!cancelled && products.length > 0) setAllProducts(products);
        // Reuses this same request's category facet rather than firing a second network call
        // just to populate the Home page's category marquee.
        if (!cancelled && (data.filters?.categories?.length || 0) > 0) setCategories(data.filters.categories);
      } catch (error) {
        // Keep the local products when the public product service is unavailable.
      }
    };

    loadProducts();
    return () => { cancelled = true; };
  }, []);

  // Split into two roughly-even rows for the opposite-direction marquee below.
  const categoryHalf = Math.ceil(categories.length / 2);
  const categoryRow1 = categories.slice(0, categoryHalf);
  const categoryRow2 = categories.slice(categoryHalf);

  return (
  <div className="overflow-hidden bg-white text-[#171717]">
    <section className="relative overflow-hidden border-b border-black/10 bg-[#0a0a0a] text-white">
      <div className="absolute inset-0">
        {currentSlide.type === 'video' ? (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            poster={brandVideoPoster}
            autoPlay
            muted={isMuted}
            playsInline
            onEnded={advanceSlide}
          />
        ) : (
          <img src={currentSlide.src} alt={currentSlide.label} className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
        {currentSlide.type === 'video' && (
          <div className="pointer-events-none absolute right-3 top-3 flex items-center rounded-lg bg-black/60 px-2.5 py-1.5 backdrop-blur-md sm:right-5 sm:top-5 lg:right-6">
            <img src="/images/logo-mark.png" alt="Adihuman" className="h-4 w-auto sm:h-5" />
          </div>
        )}
      </div>

      <div className="relative mx-auto flex min-h-[640px] max-w-7xl flex-col justify-center px-4 pb-16 pt-28 sm:px-6 lg:min-h-[720px] lg:px-8 lg:pb-24 lg:pt-32">
        <motion.div {...motionProps} className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-yellow backdrop-blur-md">
            <Sparkles className="h-4 w-4" />
            Corporate gifting, made personal
          </div>
          <h1 className="text-5xl font-display font-bold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
            Put your brand in <span className="text-brand-yellow">everyday moments.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-white/75 sm:text-xl">
            Custom T-shirts, premium gift sets, home accessories, electronics, bottles, mugs and more, made for your people and packed for your brand.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to="/catalog-request" className="btn-primary inline-flex items-center justify-center gap-2">
              Build your gift order <ArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/shop" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 px-6 py-3 font-semibold text-white transition hover:border-brand-yellow hover:text-brand-yellow">
              Explore products <ArrowUpRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="mt-12 grid max-w-xl grid-cols-3 gap-5 border-t border-white/15 pt-6">
            <div><p className="text-2xl font-bold text-brand-yellow">1000+</p><p className="mt-1 text-xs uppercase tracking-wider text-white/55">Businesses served</p></div>
            <div><p className="text-2xl font-bold text-brand-yellow">1,000+</p><p className="mt-1 text-xs uppercase tracking-wider text-white/55">Ways to customize</p></div>
            <div><p className="text-2xl font-bold text-brand-yellow">Bulk</p><p className="mt-1 text-xs uppercase tracking-wider text-white/55">Order friendly</p></div>
          </div>
        </motion.div>
      </div>

      {heroIconCount > 0 && (
        <div className="pointer-events-none absolute inset-y-0 right-4 z-10 hidden flex-col items-center justify-center gap-5 md:right-8 md:flex lg:right-14">
          {Array.from({ length: heroIconCount }).map((_, slot) => {
            const product = allProducts[(iconOffset + slot) % allProducts.length];
            return (
              <Link
                key={slot}
                to={product.href || '/shop'}
                aria-label={`Shop ${product.name}`}
                className="pointer-events-auto block transition hover:scale-110"
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`${product.name}-${iconOffset}-${slot}`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.35 }}
                    className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-white/30 bg-white/10 shadow-lg backdrop-blur-md transition hover:border-brand-yellow sm:h-16 sm:w-16"
                  >
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  </motion.span>
                </AnimatePresence>
              </Link>
            );
          })}
        </div>
      )}

      <div className="absolute inset-x-4 bottom-6 flex items-center justify-between gap-4 sm:inset-x-6 lg:inset-x-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-md">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-yellow opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-yellow" />
          </span>
          <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-white sm:text-[10px]">{currentSlide.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden gap-1.5 sm:flex">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.src}
                type="button"
                onClick={() => setActiveSlide(index)}
                aria-label={`Show ${slide.label}`}
                className="h-1 w-8 overflow-hidden rounded-full bg-white/25"
              >
                <span className={`block h-full rounded-full bg-brand-yellow transition-all duration-300 ${index === activeSlide ? 'w-full' : index < activeSlide ? 'w-full opacity-60' : 'w-0'}`} />
              </button>
            ))}
          </div>
          {currentSlide.type === 'video' && (
            <button
              type="button"
              onClick={() => setIsMuted((muted) => !muted)}
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </section>

    <section className="border-b border-black/10 bg-brand-yellow">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-black/10 px-4 sm:grid-cols-4 sm:px-6 lg:px-8">
        {[['Custom branding', Palette], ['Bulk pricing', Boxes], ['On-time delivery', Truck], ['Quality checked', ShieldCheck]].map(([label, Icon]) => (
          <div key={label} className="flex items-center gap-3 px-3 py-5 sm:px-6"><Icon className="h-5 w-5 shrink-0" /><span className="text-xs font-bold uppercase tracking-wider sm:text-sm">{label}</span></div>
        ))}
      </div>
    </section>

    <section className="overflow-hidden bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div {...motionProps} className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">Your complete gifting shelf</p>
            <h2 className="mt-3 text-4xl font-display font-bold leading-tight sm:text-5xl">Explore every product.</h2>
          </div>
          <Link to="/shop" className="inline-flex items-center gap-2 font-bold text-[#171717] underline decoration-brand-yellow decoration-4 underline-offset-4 hover:text-brand-gold">
            Open the Shop <ArrowUpRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
      <div className="relative mt-10 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />
        <div
          className="flex w-max animate-scroll-left gap-4 px-4 hover:[animation-play-state:paused]"
          style={{ animationDuration: `${Math.max(allProducts.length * 3, 18)}s` }}
        >
          {[...allProducts, ...allProducts].map((product, index) => (
            <Link
              to={product.href || '/shop'}
              key={`${product.name}-${index}`}
              className="group w-44 shrink-0 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand-yellow hover:shadow-lg sm:w-52"
            >
              <div className="aspect-square overflow-hidden bg-[#f5f5f5]">
                <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <div className="p-4">
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-brand-gold">{product.category}</p>
                <p className="mt-2 line-clamp-2 min-h-10 text-sm font-bold">{product.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>

    {categories.length > 0 && (
      <section className="overflow-hidden bg-[#fafafa] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...motionProps}>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">Shop by category</p>
            <h2 className="mt-3 text-4xl font-display font-bold leading-tight sm:text-5xl">Find it faster.</h2>
          </motion.div>
        </div>

        {/* Row 1 scrolls right-to-left, row 2 scrolls the opposite way - the mismatch keeps
            it feeling alive rather than like one static block, and hovering either row
            pauses it (see .animate-scroll-left/-right in index.css) so it's easy to click. */}
        <div className="relative mt-10 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#fafafa] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#fafafa] to-transparent" />
          <div
            className="flex w-max animate-scroll-left gap-4 px-4"
            style={{ animationDuration: `${Math.max(categoryRow1.length * 4, 20)}s` }}
          >
            {[...categoryRow1, ...categoryRow1].map((c, index) => (
              <Link
                key={`${c.id}-${index}`}
                to={`/shop?category=${c.id}`}
                className="group relative aspect-[4/5] w-36 shrink-0 overflow-hidden rounded-2xl shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:w-48"
              >
                <img src={categoryImage(c.name)} alt={c.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="text-sm font-bold text-white leading-tight line-clamp-2">{c.name}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-white/70">{c.count} items</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {categoryRow2.length > 0 && (
          <div className="relative mt-4 overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#fafafa] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#fafafa] to-transparent" />
            <div
              className="flex w-max animate-scroll-right gap-4 px-4"
              style={{ animationDuration: `${Math.max(categoryRow2.length * 4, 20)}s` }}
            >
              {[...categoryRow2, ...categoryRow2].map((c, index) => (
                <Link
                  key={`${c.id}-${index}`}
                  to={`/shop?category=${c.id}`}
                  className="group relative aspect-[4/5] w-36 shrink-0 overflow-hidden rounded-2xl shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:w-48"
                >
                  <img src={categoryImage(c.name)} alt={c.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="text-sm font-bold text-white leading-tight line-clamp-2">{c.name}</p>
                    <p className="mt-0.5 text-[11px] font-medium text-white/70">{c.count} items</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    )}

    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <motion.div {...motionProps} className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">A few favourites</p>
            <h2 className="mt-3 text-4xl font-display font-bold leading-tight sm:text-5xl">Products people love to receive.</h2>
          </div>
          <Link to="/shop" className="inline-flex items-center gap-2 font-bold text-[#171717] underline decoration-brand-yellow decoration-4 underline-offset-4 hover:text-brand-gold">
            See all products <ArrowUpRight className="h-4 w-4" />
          </Link>
        </motion.div>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {featuredProducts.map((product, index) => (
            <motion.div {...motionProps} transition={{ duration: 0.45, delay: index * 0.05 }} key={product.name} className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand-yellow hover:shadow-xl">
              <div className="aspect-square overflow-hidden bg-[#f5f5f5]">
                <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <div className="p-3 sm:p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-gold">{product.category}</p>
                <h3 className="mt-2 text-sm font-bold leading-5 sm:text-base">{product.name}</h3>
                <p className="mt-3 text-xs font-semibold text-gray-500">Customise for your brand</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    <section className="bg-[#fafafa] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div {...motionProps} className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">How we brand it</p>
          <h2 className="mt-3 text-4xl font-display font-bold leading-tight sm:text-5xl">Our techniques, up close.</h2>
        </motion.div>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {techniqueTiles.map((tile, index) => (
            <motion.div {...motionProps} transition={{ duration: 0.45, delay: index * 0.05 }} key={tile.title} className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand-yellow hover:shadow-xl">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={tile.image} alt={`${tile.title}: ${tile.description}`} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div {...motionProps} className="mt-16 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">From idea to your doorstep</p>
          <h2 className="mt-3 text-4xl font-display font-bold leading-tight sm:text-5xl">Here is exactly what we do.</h2>
        </motion.div>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {processTiles.map((tile, index) => (
            <motion.div {...motionProps} transition={{ duration: 0.45, delay: index * 0.05 }} key={tile.title} className="group relative overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand-yellow hover:shadow-xl">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#171717] text-xs font-bold text-brand-yellow absolute left-3 top-3 z-10">{index + 1}</div>
              <div className="aspect-[4/3] overflow-hidden">
                <img src={tile.image} alt={`${tile.title}: ${tile.description}`} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div {...motionProps} className="mt-10">
          <Link to="/catalog-request" className="group block overflow-hidden rounded-2xl shadow-lg transition hover:shadow-2xl">
            <img src="/images/showcase/closing-banner.png" alt="Let's create something branded. Get a custom quote." loading="lazy" className="h-auto w-full object-cover transition duration-500 group-hover:scale-[1.02]" />
          </Link>
        </motion.div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <motion.div {...motionProps} className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">One partner, every category</p><h2 className="mt-3 max-w-2xl text-4xl font-display font-bold leading-tight sm:text-5xl">Everything your brand needs to gift well.</h2></div>
        <p className="max-w-sm text-sm leading-6 text-gray-600">From a first-day welcome kit to a 5,000-person annual celebration, we make it feel considered.</p>
      </motion.div>
      <div className="grid auto-rows-[230px] grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {productLines.map((product, index) => (
          <motion.div {...motionProps} transition={{ duration: 0.5, delay: index * 0.05 }} key={product.title} className={`group relative overflow-hidden rounded-2xl bg-[#292929] text-white ${product.className}`}>
            <img src={product.image} alt={product.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow">{product.label}</p>
              <h3 className="mt-2 text-2xl font-display font-bold">{product.title}</h3>
              <p className="mt-2 max-w-sm text-sm leading-5 text-white/70">{product.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>

    <section className="bg-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:items-center lg:px-8 lg:py-28">
        <motion.div {...motionProps} className="lg:col-span-5">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">Make it unmistakably yours</p>
          <h2 className="mt-3 text-4xl font-display font-bold leading-tight sm:text-5xl">Customization that carries your identity.</h2>
          <p className="mt-5 leading-7 text-gray-600">Your brand deserves more than a logo placed at the last minute. We help you create useful, memorable products that feel like they belong to your team.</p>
          <ul className="mt-8 space-y-4">
            {servicePoints.map((point) => <li key={point} className="flex items-start gap-3 text-sm font-semibold"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-yellow"><Check className="h-3.5 w-3.5" /></span>{point}</li>)}
          </ul>
          <Link to="/contact" className="mt-9 inline-flex items-center gap-2 font-bold text-[#171717] underline decoration-brand-yellow decoration-4 underline-offset-4 hover:text-brand-gold">Talk to a gifting specialist <ArrowRight className="h-4 w-4" /></Link>
        </motion.div>
        <motion.div {...motionProps} className="relative lg:col-span-7 lg:pl-12">
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <div className="overflow-hidden rounded-3xl bg-[#e8e1d6] pt-10"><img src="/images/pen-diary.png" alt="Customized diary and pen" className="h-full w-full object-cover mix-blend-multiply transition duration-500 hover:scale-105" /></div>
            <div className="mt-10 overflow-hidden rounded-3xl bg-[#252525]"><img src="/images/card.png" alt="Customized cardholder and keychain" className="h-full w-full object-cover transition duration-500 hover:scale-105" /></div>
          </div>
          <div className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-brand-yellow px-5 py-3 shadow-lg"><Zap className="h-5 w-5" /><span className="text-sm font-bold">Ideas into branded keepsakes</span></div>
        </motion.div>
      </div>
    </section>

    <section className="border-y border-black/10 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <motion.div {...motionProps} className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">A smoother way to gift</p><h2 className="mt-3 text-4xl font-display font-bold leading-tight sm:text-5xl">From a rough idea to a room full of happy teams.</h2></motion.div>
        <div className="mt-12 grid gap-3 md:grid-cols-4">
          {processSteps.map((step, index) => <motion.div {...motionProps} transition={{ duration: 0.5, delay: index * 0.08 }} key={step.number} className="border border-black/10 bg-white p-6 sm:p-8"><p className="text-sm font-bold text-brand-gold">{step.number}</p><h3 className="mt-12 text-xl font-display font-bold">{step.title}</h3><p className="mt-3 text-sm leading-6 text-gray-600">{step.description}</p></motion.div>)}
        </div>
      </div>
    </section>

    <section className="relative overflow-hidden bg-[#171717] text-white">
      <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-brand-yellow/20 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:items-center lg:px-8 lg:py-24">
        <motion.div {...motionProps} className="lg:col-span-8"><p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-yellow">Bulk orders, beautifully handled</p><h2 className="mt-3 max-w-3xl text-4xl font-display font-bold leading-tight sm:text-5xl">Planning a team event, festive hamper or company launch?</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-white/65">Tell us how many people you are gifting and what you have in mind. We will help you shape the range, branding and delivery plan.</p></motion.div>
        <motion.div {...motionProps} className="lg:col-span-4 lg:flex lg:justify-end"><Link to="/catalog-request" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-yellow px-6 py-4 font-bold text-[#171717] shadow-lg transition hover:bg-brand-gold">Start a bulk order <ArrowRight className="h-5 w-5" /></Link></motion.div>
      </div>
    </section>

    <section className="bg-brand-yellow">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#171717] text-brand-yellow"><Phone className="h-5 w-5" /></div><div><p className="text-xs font-bold uppercase tracking-wider">Need a fast recommendation?</p><p className="text-lg font-display font-bold">Our gifting team is ready to help.</p></div></div><Link to="/contact" className="inline-flex items-center gap-2 font-bold underline underline-offset-4">Contact us <ArrowRight className="h-4 w-4" /></Link></div>
    </section>
  </div>
  );
};

export default CorporateLanding;
