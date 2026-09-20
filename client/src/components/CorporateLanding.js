import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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

const brandVideos = [
  { src: '/uploads/video/20260920_065151_0_UTC_0.mp4', label: 'Behind the scenes' },
  { src: '/uploads/video/PixVerse_V6_Image_Text_540P_Premium_corporate_.mp4', label: 'Blank to branded' },
  { src: '/uploads/video/PixVerse_V6_Image_Text_540P_Premium_corporate_-2.mp4', label: 'Precision printing' },
  { src: '/uploads/video/PixVerse_V6_Image_Text_540P_Premium_corporate_-3.mp4', label: 'Packed and delivered' },
].map((video) => ({ ...video, src: getImageUrl(video.src) }));

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

const heroProducts = [
  { name: 'Executive gift box', label: 'Your logo. Your story.', image: '/images/box.png' },
  { name: 'Diary and premium pen', label: 'Ideas people carry.', image: '/images/pen-diary.png' },
  { name: 'Insulated steel bottle', label: 'Your brand, on the move.', image: '/images/stell bolltel.png' },
  { name: 'Cardholder and keychain', label: 'Small details. Strong recall.', image: '/images/card.png' },
  { name: 'Premium welcome kit', label: 'Gifts people keep.', image: '/images/box3.png' },
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
  const [activeVideo, setActiveVideo] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  const handleVideoEnded = () => {
    setActiveVideo((index) => (index + 1) % brandVideos.length);
  };

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl.src = brandVideos[activeVideo].src;
    videoEl.load();
    videoEl.play().catch(() => {});
  }, [activeVideo]);

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
      } catch (error) {
        // Keep the local products when the public product service is unavailable.
      }
    };

    loadProducts();
    return () => { cancelled = true; };
  }, []);

  return (
  <div className="overflow-hidden bg-white text-[#171717]">
    <section className="relative border-b border-black/10 bg-white">
      <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(0,0,0,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.035)_1px,transparent_1px)] [background-size:52px_52px]" />
      <div className="absolute -right-24 top-10 h-80 w-80 rounded-full bg-brand-yellow/20 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-12 lg:px-8 lg:pb-24 lg:pt-20">
        <motion.div {...motionProps} className="lg:col-span-6">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
            <Sparkles className="h-4 w-4" />
            Corporate gifting, made personal
          </div>
          <h1 className="max-w-3xl text-5xl font-display font-bold leading-[0.98] tracking-tight text-[#171717] sm:text-6xl lg:text-7xl">
            Put your brand in <span className="text-brand-yellow">everyday moments.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-gray-600 sm:text-xl">
            Custom T-shirts, premium gift sets, home accessories, electronics, bottles, mugs and more, made for your people and packed for your brand.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to="/catalog-request" className="btn-primary inline-flex items-center justify-center gap-2">
              Build your gift order <ArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/shop" className="inline-flex items-center justify-center gap-2 rounded-lg border border-black/20 px-6 py-3 font-semibold text-[#171717] transition hover:border-brand-gold hover:text-brand-gold">
              Explore products <ArrowUpRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="mt-12 grid max-w-xl grid-cols-3 gap-5 border-t border-black/10 pt-6">
            <div><p className="text-2xl font-bold text-brand-gold">1000+</p><p className="mt-1 text-xs uppercase tracking-wider text-gray-500">Businesses served</p></div>
            <div><p className="text-2xl font-bold text-brand-gold">1,000+</p><p className="mt-1 text-xs uppercase tracking-wider text-gray-500">Ways to customize</p></div>
            <div><p className="text-2xl font-bold text-brand-gold">Bulk</p><p className="mt-1 text-xs uppercase tracking-wider text-gray-500">Order friendly</p></div>
          </div>
        </motion.div>

        <motion.div {...motionProps} transition={{ duration: 0.65, delay: 0.12 }} className="relative lg:col-span-6 lg:pl-8">
          <div className="relative grid aspect-[0.9] grid-cols-2 gap-3 overflow-hidden rounded-[2rem] border border-black/10 bg-[#f3f3f3] p-3 shadow-2xl shadow-black/10">
            {heroProducts.slice(0, 4).map((product) => (
              <Link to="/shop" aria-label={`Shop ${product.name}`} key={product.name} className="group relative min-h-0 overflow-hidden rounded-2xl bg-white">
                <img src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-yellow">{product.label}</p>
                  <p className="mt-1 text-sm font-bold text-white sm:text-base">{product.name}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="absolute -bottom-5 -left-4 flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#171717] shadow-xl sm:-left-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-yellow"><Palette className="h-5 w-5" /></div>
            <div><p className="text-sm font-bold">Made your way</p><p className="text-xs text-gray-500">Print · engrave · embroider</p></div>
          </div>
        </motion.div>
      </div>
    </section>

    <section className="relative overflow-hidden bg-[#0c0c0c] text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <motion.div {...motionProps} className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-yellow">See it in action</p>
            <h2 className="mt-3 text-4xl font-display font-bold leading-tight sm:text-5xl">This is what we actually do.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-white/60">From a blank product to a finished, branded piece, printed, engraved and packed, ready for your team.</p>
        </motion.div>

        <motion.div {...motionProps} transition={{ duration: 0.65, delay: 0.1 }} className="relative overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
          <div className="relative aspect-video w-full">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              poster={brandVideoPoster}
              autoPlay
              muted={isMuted}
              playsInline
              onEnded={handleVideoEnded}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-5 sm:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-yellow">{brandVideos[activeVideo].label}</p>
              <div className="flex items-center justify-between gap-4">
                <div className="flex gap-2">
                  {brandVideos.map((video, index) => (
                    <button
                      key={video.src}
                      type="button"
                      onClick={() => setActiveVideo(index)}
                      aria-label={`Play ${video.label}`}
                      className={`h-1.5 rounded-full transition-all ${index === activeVideo ? 'w-8 bg-brand-yellow' : 'w-4 bg-white/30 hover:bg-white/50'}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setIsMuted((muted) => !muted)}
                  aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur transition hover:bg-white/20"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
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
