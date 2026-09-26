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

const SectionHeader = ({ eyebrow, title, link, linkLabel, aside, className = '' }) => (
  <motion.div {...motionProps} className={`flex flex-col justify-between gap-5 md:flex-row md:items-end ${className}`}>
    <div className="max-w-2xl">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="section-title mt-4">{title}</h2>
    </div>
    {link && (
      <Link to={link} className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-ink-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-dark transition-all hover:border-brand-dark hover:bg-brand-dark hover:text-white">
        {linkLabel} <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </Link>
    )}
    {aside}
  </motion.div>
);

const CategoryTile = ({ c }) => (
  <Link
    to={`/shop?category=${c.id}`}
    className="group relative aspect-[4/5] w-40 shrink-0 overflow-hidden rounded-3xl ring-1 ring-black/5 transition duration-500 hover:-translate-y-1.5 hover:shadow-lift sm:w-52"
  >
    <img src={categoryImage(c.name)} alt={c.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
    <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white opacity-0 backdrop-blur-md transition-all duration-300 group-hover:opacity-100">
      <ArrowUpRight className="h-4 w-4" />
    </span>
    <div className="absolute inset-x-0 bottom-0 p-4">
      <p className="line-clamp-2 font-display text-base font-bold leading-tight text-white">{c.name}</p>
      <p className="mt-1 text-[11px] font-medium text-white/65">{c.count} items</p>
    </div>
  </Link>
);

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
  <div className="overflow-hidden bg-brand-light text-brand-dark">
    {/* ================= HERO ================= */}
    <section className="relative -mt-20 overflow-hidden bg-brand-dark text-white">
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
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
        <div className="absolute inset-0 bg-grid-dark mask-radial opacity-40" />
        {currentSlide.type === 'video' && (
          <div className="pointer-events-none absolute right-4 top-24 flex items-center rounded-full glass-dark px-3 py-1.5 sm:right-6 lg:right-8">
            <img src="/images/logo-mark.png" alt="Adihuman" className="h-4 w-auto sm:h-5" />
          </div>
        )}
      </div>

      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-4 pb-32 pt-36 sm:px-6 lg:min-h-[820px] lg:px-8 lg:pb-40">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          <div className="mb-7 inline-flex items-center gap-2 rounded-full glass-dark py-1.5 pl-1.5 pr-4 text-xs font-semibold text-white/85">
            <span className="flex items-center gap-1 rounded-full bg-brand-yellow px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-dark">
              <Sparkles className="h-3 w-3" /> New
            </span>
            Corporate gifting, made personal
          </div>
          <h1 className="font-display text-[44px] font-extrabold leading-[0.95] tracking-tightest sm:text-7xl lg:text-[88px]">
            Put your brand in <br className="hidden sm:block" />
            <span className="text-gradient-animated">everyday moments.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
            Custom T-shirts, premium gift sets, home accessories, electronics, bottles, mugs and more, made for your people and packed for your brand.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link to="/catalog-request" className="btn-primary !px-7 !py-4 !text-[15px] group">
              Build your gift order <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/shop" className="btn-glass !px-7 !py-4 !text-[15px] group">
              Explore products <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
          <div className="mt-14 grid max-w-xl grid-cols-3 gap-3">
            {[['1000+', 'Businesses served'], ['1,000+', 'Ways to customize'], ['Bulk', 'Order friendly']].map(([value, label]) => (
              <div key={label} className="rounded-2xl glass-dark px-4 py-3.5">
                <p className="font-display text-2xl font-extrabold text-brand-yellow sm:text-3xl">{value}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/50 sm:text-[11px]">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {heroIconCount > 0 && (
        <div className="pointer-events-none absolute inset-y-0 right-4 z-10 hidden flex-col items-center justify-center gap-4 md:right-8 md:flex lg:right-14">
          <div className="flex flex-col items-center gap-4 rounded-full glass-dark p-2.5">
            {Array.from({ length: heroIconCount }).map((_, slot) => {
              const product = allProducts[(iconOffset + slot) % allProducts.length];
              return (
                <Link
                  key={slot}
                  to={product.href || '/shop'}
                  aria-label={`Shop ${product.name}`}
                  className="pointer-events-auto block transition duration-300 hover:scale-110"
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`${product.name}-${iconOffset}-${slot}`}
                      initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.5, rotate: 20 }}
                      transition={{ duration: 0.35 }}
                      className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-white shadow-lg ring-2 ring-white/20 transition hover:ring-brand-yellow sm:h-16 sm:w-16"
                    >
                      <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                    </motion.span>
                  </AnimatePresence>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="absolute inset-x-4 bottom-28 flex items-center justify-between gap-4 sm:inset-x-6 lg:bottom-32 lg:inset-x-8">
        <div className="inline-flex items-center gap-2 rounded-full glass-dark px-3.5 py-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-yellow opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-yellow" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white">{currentSlide.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden gap-1.5 sm:flex">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.src}
                type="button"
                onClick={() => setActiveSlide(index)}
                aria-label={`Show ${slide.label}`}
                className={`h-1.5 overflow-hidden rounded-full bg-white/20 transition-all duration-500 ${index === activeSlide ? 'w-12' : 'w-6 hover:bg-white/40'}`}
              >
                <span className={`block h-full rounded-full bg-brand-yellow transition-all duration-300 ${index === activeSlide ? 'w-full' : index < activeSlide ? 'w-full opacity-50' : 'w-0'}`} />
              </button>
            ))}
          </div>
          {currentSlide.type === 'video' && (
            <button
              type="button"
              onClick={() => setIsMuted((muted) => !muted)}
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full glass-dark text-white transition hover:bg-white/20"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </section>

    {/* ================= VALUE PROPS (overlapping card) ================= */}
    <section className="relative z-10 mx-auto -mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
      <motion.div
        {...motionProps}
        className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-ink-200 shadow-lift ring-1 ring-black/5 lg:grid-cols-4"
      >
        {[
          ['Custom branding', 'Print, engrave, emboss', Palette],
          ['Bulk pricing', 'Better rates at scale', Boxes],
          ['On-time delivery', 'Pan-India shipping', Truck],
          ['Quality checked', 'Every single piece', ShieldCheck],
        ].map(([label, sub, Icon]) => (
          <div key={label} className="group flex items-center gap-4 bg-white px-5 py-6 sm:px-7">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-yellow/20 text-brand-dark transition-all duration-300 group-hover:rotate-6 group-hover:bg-brand-yellow">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-sm font-bold sm:text-base">{label}</p>
              <p className="mt-0.5 hidden text-xs text-ink-500 sm:block">{sub}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </section>

    {/* ================= PRODUCT MARQUEE ================= */}
    <section className="overflow-hidden py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Your complete gifting shelf" title="Explore every product." link="/shop" linkLabel="Open the Shop" />
      </div>
      <div className="relative mt-12 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-brand-light to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-brand-light to-transparent" />
        <div
          className="flex w-max animate-scroll-left gap-5 px-4 py-2 hover:[animation-play-state:paused]"
          style={{ animationDuration: `${Math.max(allProducts.length * 3, 18)}s` }}
        >
          {[...allProducts, ...allProducts].map((product, index) => (
            <Link
              to={product.href || '/shop'}
              key={`${product.name}-${index}`}
              className="group w-48 shrink-0 overflow-hidden rounded-3xl bg-white p-2 shadow-soft ring-1 ring-black/5 transition duration-500 hover:-translate-y-1.5 hover:shadow-lift sm:w-60"
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-ink-100">
                <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                <span className="absolute right-2.5 top-2.5 flex h-8 w-8 translate-y-1 items-center justify-center rounded-full bg-white text-brand-dark opacity-0 shadow-soft transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
              <div className="px-2 pb-2 pt-3.5">
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-ink-400">{product.category}</p>
                <p className="mt-1.5 line-clamp-2 min-h-10 text-sm font-semibold leading-5">{product.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>

    {/* ================= CATEGORIES ================= */}
    {categories.length > 0 && (
      <section className="overflow-hidden bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Shop by category" title="Find it faster." link="/shop" linkLabel="All categories" />
        </div>

        {/* Row 1 scrolls right-to-left, row 2 scrolls the opposite way - the mismatch keeps
            it feeling alive rather than like one static block, and hovering either row
            pauses it (see .animate-scroll-left/-right in index.css) so it's easy to click. */}
        <div className="relative mt-12 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />
          <div
            className="flex w-max animate-scroll-left gap-5 px-4 py-2"
            style={{ animationDuration: `${Math.max(categoryRow1.length * 4, 20)}s` }}
          >
            {[...categoryRow1, ...categoryRow1].map((c, index) => (
              <CategoryTile key={`${c.id}-${index}`} c={c} />
            ))}
          </div>
        </div>

        {categoryRow2.length > 0 && (
          <div className="relative mt-3 overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />
            <div
              className="flex w-max animate-scroll-right gap-5 px-4 py-2"
              style={{ animationDuration: `${Math.max(categoryRow2.length * 4, 20)}s` }}
            >
              {[...categoryRow2, ...categoryRow2].map((c, index) => (
                <CategoryTile key={`${c.id}-${index}`} c={c} />
              ))}
            </div>
          </div>
        )}
      </section>
    )}

    {/* ================= FAVOURITES ================= */}
    <section>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionHeader eyebrow="A few favourites" title="Products people love to receive." link="/shop" linkLabel="See all products" />
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {featuredProducts.map((product, index) => (
            <motion.div {...motionProps} transition={{ duration: 0.45, delay: index * 0.05 }} key={product.name} className="group overflow-hidden rounded-3xl bg-white p-2 shadow-soft ring-1 ring-black/5 transition duration-500 hover:-translate-y-1.5 hover:shadow-lift">
              <div className="aspect-square overflow-hidden rounded-2xl bg-ink-100">
                <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
              </div>
              <div className="px-2 pb-2 pt-3.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-400">{product.category}</p>
                <h3 className="mt-1.5 text-sm font-bold leading-5 sm:text-[15px]">{product.name}</h3>
                <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-gold">
                  Customise for your brand <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* ================= TECHNIQUES + PROCESS ================= */}
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="How we brand it" title="Our techniques, up close." />
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {techniqueTiles.map((tile, index) => (
            <motion.div {...motionProps} transition={{ duration: 0.45, delay: index * 0.05 }} key={tile.title} className="group overflow-hidden rounded-3xl ring-1 ring-black/5 shadow-soft transition duration-500 hover:-translate-y-1.5 hover:shadow-lift">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={tile.image} alt={`${tile.title}: ${tile.description}`} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
              </div>
            </motion.div>
          ))}
        </div>

        <SectionHeader eyebrow="From idea to your doorstep" title="Here is exactly what we do." className="mt-24" />
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {processTiles.map((tile, index) => (
            <motion.div {...motionProps} transition={{ duration: 0.45, delay: index * 0.05 }} key={tile.title} className="group relative overflow-hidden rounded-3xl ring-1 ring-black/5 shadow-soft transition duration-500 hover:-translate-y-1.5 hover:shadow-lift">
              <div className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-brand-dark font-display text-xs font-bold text-brand-yellow ring-4 ring-white/40">{String(index + 1).padStart(2, '0')}</div>
              <div className="aspect-[4/3] overflow-hidden">
                <img src={tile.image} alt={`${tile.title}: ${tile.description}`} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div {...motionProps} className="mt-12">
          <Link to="/catalog-request" className="group relative block overflow-hidden rounded-3xl shadow-card ring-1 ring-black/5 transition duration-500 hover:shadow-lift">
            <img src="/images/showcase/closing-banner.png" alt="Let's create something branded. Get a custom quote." loading="lazy" className="h-auto w-full object-cover transition duration-700 group-hover:scale-[1.02]" />
          </Link>
        </motion.div>
      </div>
    </section>

    {/* ================= BENTO ================= */}
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <SectionHeader
        eyebrow="One partner, every category"
        title="Everything your brand needs to gift well."
        className="mb-12"
        aside={<p className="max-w-sm text-sm leading-6 text-ink-500">From a first-day welcome kit to a 5,000-person annual celebration, we make it feel considered.</p>}
      />
      <div className="grid auto-rows-[260px] grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {productLines.map((product, index) => (
          <motion.div {...motionProps} transition={{ duration: 0.5, delay: index * 0.05 }} key={product.title} className={`group relative overflow-hidden rounded-3xl bg-ink-800 text-white ring-1 ring-black/5 ${product.className}`}>
            <img src={product.image} alt={product.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-500 group-hover:opacity-90" />
            <span className="absolute right-4 top-4 rounded-full glass-dark px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-yellow">{product.label}</span>
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
              <div>
                <h3 className="font-display text-2xl font-extrabold tracking-tight">{product.title}</h3>
                <p className="mt-2 max-w-sm text-sm leading-5 text-white/70">{product.description}</p>
              </div>
              <span className="flex h-11 w-11 shrink-0 translate-y-2 items-center justify-center rounded-full bg-brand-yellow text-brand-dark opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                <ArrowUpRight className="h-5 w-5" />
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>

    {/* ================= CUSTOMIZATION ================= */}
    <section className="bg-white">
      <div className="mx-auto grid max-w-7xl gap-16 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:items-center lg:px-8 lg:py-28">
        <motion.div {...motionProps} className="lg:col-span-5">
          <p className="eyebrow">Make it unmistakably yours</p>
          <h2 className="section-title mt-4">Customization that carries your identity.</h2>
          <p className="mt-6 text-base leading-7 text-ink-500">Your brand deserves more than a logo placed at the last minute. We help you create useful, memorable products that feel like they belong to your team.</p>
          <ul className="mt-9 space-y-3">
            {servicePoints.map((point) => (
              <li key={point} className="flex items-center gap-3 rounded-2xl border border-ink-200/70 bg-ink-50 px-4 py-3 text-sm font-semibold transition-colors hover:border-brand-yellow">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-dark text-brand-yellow"><Check className="h-3.5 w-3.5" /></span>
                {point}
              </li>
            ))}
          </ul>
          <Link to="/contact" className="btn-secondary mt-10 group">
            Talk to a gifting specialist <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
        <motion.div {...motionProps} className="relative lg:col-span-7 lg:pl-12">
          <div className="pointer-events-none absolute -inset-10 rounded-full bg-brand-yellow/20 blur-3xl" />
          <div className="relative grid grid-cols-2 gap-4 sm:gap-6">
            <div className="overflow-hidden rounded-[2rem] bg-[#ece6db] pt-10 shadow-card ring-1 ring-black/5"><img src="/images/pen-diary.png" alt="Customized diary and pen" className="h-full w-full object-cover mix-blend-multiply transition duration-700 hover:scale-105" /></div>
            <div className="mt-14 overflow-hidden rounded-[2rem] bg-ink-800 shadow-card ring-1 ring-black/5"><img src="/images/card.png" alt="Customized cardholder and keychain" className="h-full w-full object-cover transition duration-700 hover:scale-105" /></div>
          </div>
          <div className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 animate-float items-center gap-3 whitespace-nowrap rounded-full bg-brand-dark px-5 py-3 text-white shadow-lift">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-yellow text-brand-dark"><Zap className="h-4 w-4" /></span>
            <span className="text-sm font-semibold">Ideas into branded keepsakes</span>
          </div>
        </motion.div>
      </div>
    </section>

    {/* ================= PROCESS STEPS ================= */}
    <section>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionHeader eyebrow="A smoother way to gift" title="From a rough idea to a room full of happy teams." />
        <div className="relative mt-14 grid gap-4 md:grid-cols-4">
          <div className="pointer-events-none absolute left-0 right-0 top-[52px] hidden h-px bg-gradient-to-r from-transparent via-ink-300 to-transparent md:block" />
          {processSteps.map((step, index) => (
            <motion.div
              {...motionProps}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              key={step.number}
              className="group relative rounded-3xl border border-ink-200/70 bg-white p-7 shadow-soft transition duration-500 hover:-translate-y-1.5 hover:border-brand-yellow hover:shadow-lift"
            >
              <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-dark font-display text-sm font-bold text-brand-yellow transition-all duration-500 group-hover:rotate-6 group-hover:bg-brand-yellow group-hover:text-brand-dark">
                {step.number}
              </span>
              <h3 className="mt-10 font-display text-xl font-bold tracking-tight">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink-500">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* ================= BULK CTA ================= */}
    <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-brand-dark text-white shadow-lift">
        <div className="pointer-events-none absolute inset-0 bg-grid-dark mask-radial" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-yellow/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-brand-gold/15 blur-3xl" />
        <div className="relative grid gap-10 px-6 py-16 sm:px-12 lg:grid-cols-12 lg:items-center lg:px-16 lg:py-20">
          <motion.div {...motionProps} className="lg:col-span-8">
            <p className="eyebrow !text-white/50">Bulk orders, beautifully handled</p>
            <h2 className="mt-4 max-w-3xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">Planning a team event, festive hamper or <span className="text-gradient">company launch?</span></h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/60">Tell us how many people you are gifting and what you have in mind. We will help you shape the range, branding and delivery plan.</p>
          </motion.div>
          <motion.div {...motionProps} className="flex flex-col gap-3 lg:col-span-4 lg:items-end">
            <Link to="/catalog-request" className="btn-primary !px-8 !py-4 !text-[15px] group">
              Start a bulk order <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/contact" className="inline-flex items-center gap-2 text-sm font-semibold text-white/60 transition hover:text-white">
              <Phone className="h-4 w-4" /> Need a fast recommendation? Talk to us
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  </div>
  );
};

export default CorporateLanding;
