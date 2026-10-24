import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  MessageCircle,
  Move,
  Palette,
  RotateCcw,
  Sparkles,
  Type,
  Upload,
  X
} from 'lucide-react';
import { getImageUrl } from '../config/api';
import { swatchColor } from '../utils/colorSwatch';

const MAX_LOGO_SIZE = 5 * 1024 * 1024;

const GOOGLE_FONT_NAMES = [
  'Abril Fatface', 'Anton', 'Archivo', 'Arimo', 'Asap', 'Barlow', 'Bebas Neue',
  'Bitter', 'Cabin', 'Cardo', 'Caveat', 'Cinzel', 'Cormorant Garamond',
  'Crimson Text', 'DM Sans', 'DM Serif Display', 'Dancing Script', 'Dosis',
  'EB Garamond', 'Exo 2', 'Fira Code', 'Fira Sans', 'Great Vibes', 'Heebo',
  'Inconsolata', 'Inter', 'Josefin Sans', 'Karla', 'Lato', 'Libre Baskerville',
  'Lobster', 'Lora', 'Manrope', 'Merriweather', 'Montserrat', 'Mulish',
  'Noto Sans', 'Noto Serif', 'Nunito', 'Nunito Sans', 'Open Sans', 'Oswald',
  'Outfit', 'Pacifico', 'Playfair Display', 'Plus Jakarta Sans', 'Poppins',
  'PT Sans', 'PT Serif', 'Quicksand', 'Raleway', 'Roboto', 'Roboto Slab',
  'Rubik', 'Satisfy', 'Source Code Pro', 'Source Sans 3', 'Space Grotesk',
  'Space Mono', 'Teko', 'Ubuntu', 'Urbanist', 'Work Sans'
].map((name) => ({
  id: name,
  label: name,
  family: `"${name}", sans-serif`,
  weight: 700,
  tracking: '0.04em'
}));

const ProductCustomizer = ({ product, onClose, onRequestQuote }) => {
  const images = useMemo(() => product?.images || [], [product?.images]);
  const [imageIndex, setImageIndex] = useState(() => {
    const primaryIndex = images.findIndex((image) => image.isPrimary);
    return primaryIndex >= 0 ? primaryIndex : 0;
  });
  const [brandName, setBrandName] = useState('');
  const [printColor, setPrintColor] = useState('#171817');
  const [placement, setPlacement] = useState('center');
  const [brandPosition, setBrandPosition] = useState({ x: 50, y: 50 });
  const [brandRotation, setBrandRotation] = useState(0);
  const [logoSize, setLogoSize] = useState(96);
  const [fontSize, setFontSize] = useState(18);
  const [fontStyle, setFontStyle] = useState('Montserrat');
  const [fontSearch, setFontSearch] = useState('');
  const previewRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [logo, setLogo] = useState(null);
  const [logoError, setLogoError] = useState('');
  const [customItemColor, setCustomItemColor] = useState(false);
  const [itemColorName, setItemColorName] = useState(product?.colors?.[0]?.name || 'Any color');
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#e9e4da');
  const activeImage = images[imageIndex] || images.find((image) => image.isPrimary) || images[0];
  const selectedColor = customItemColor
    ? { name: customColorName || 'Custom color', code: customColorHex }
    : product?.colors?.find((color) => color.name === itemColorName);

  useEffect(() => {
    if (!product) return;
    const primaryIndex = images.findIndex((image) => image.isPrimary);
    setImageIndex(primaryIndex >= 0 ? primaryIndex : 0);
    setItemColorName(product.colors?.[0]?.name || 'Any color');
    setCustomItemColor(false);
  }, [product, images]);

  useEffect(() => {
    if (!logo?.url) return undefined;
    return () => URL.revokeObjectURL(logo.url);
  }, [logo]);

  useEffect(() => {
    const selected = GOOGLE_FONT_NAMES.find((font) => font.id === fontStyle);
    if (!selected) return undefined;

    let stylesheet = document.getElementById('customizer-google-fonts');
    if (!stylesheet) {
      stylesheet = document.createElement('link');
      stylesheet.id = 'customizer-google-fonts';
      stylesheet.rel = 'stylesheet';
      document.head.appendChild(stylesheet);
    }
    stylesheet.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(selected.label)}&display=swap`;
    return undefined;
  }, [fontStyle]);

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setLogoError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLogoError('Choose an image file for your logo.');
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      setLogoError('Logo must be 5 MB or smaller.');
      return;
    }
    setLogo({ url: URL.createObjectURL(file), name: file.name });
  };

  const selectProductColor = (color) => {
    setCustomItemColor(false);
    setItemColorName(color.name);
  };

  const handleRequestQuote = () => {
    if (!product) return;
    onRequestQuote({
      product,
      brandName: brandName.trim(),
      printColor,
      itemColor: selectedColor?.name || 'Any color',
      itemColorCode: selectedColor?.code || '',
      placement: placementOptions.find((option) => option.id === placement)?.label || 'Custom',
      brandPosition,
      brandRotation,
      logoSize,
      fontSize,
      fontStyle: selectedFont.label,
      logoName: logo?.name || ''
    });
  };

  const placementOptions = [
    { id: 'upper', label: 'Top', y: 36 },
    { id: 'center', label: 'Center', y: 50 },
    { id: 'lower', label: 'Bottom', y: 64 }
  ];
  const fontStyles = GOOGLE_FONT_NAMES;
  const selectedFont = fontStyles.find((style) => style.id === fontStyle) || fontStyles[0];
  const visibleFonts = fontStyles.filter((style) => style.label.toLowerCase().includes(fontSearch.trim().toLowerCase()));
  const fontOptions = visibleFonts.some((style) => style.id === selectedFont.id)
    ? visibleFonts
    : [selectedFont, ...visibleFonts];
  const printColorOptions = ['#171817', '#ffffff', '#f5c842', '#bd3d3d', '#3268a8', '#2f7b58'];
  const selectPlacement = (option) => {
    setPlacement(option.id);
    setBrandPosition({ x: 50, y: option.y });
  };

  const moveBrand = (event) => {
    const bounds = previewRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const x = ((event.clientX - dragOffset.current.x - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - dragOffset.current.y - bounds.top) / bounds.height) * 100;
    setBrandPosition({
      x: Math.max(6, Math.min(94, x)),
      y: Math.max(6, Math.min(94, y))
    });
    setPlacement('custom');
  };

  const handleBrandKeyDown = (event) => {
    const step = event.shiftKey ? 5 : 1;
    const offset = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step }
    }[event.key];
    if (!offset) return;
    event.preventDefault();
    setBrandPosition((position) => ({
      x: Math.max(6, Math.min(94, position.x + offset.x)),
      y: Math.max(6, Math.min(94, position.y + offset.y))
    }));
    setPlacement('custom');
  };

  return (
    <motion.section
      aria-labelledby="customizer-title"
      initial={false}
      className="w-full overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-[#f8f7f4] shadow-lg sm:rounded-[1.75rem] xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto xl:overscroll-contain"
    >
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200/80 bg-white px-5 py-4 sm:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-800">Your fitting room</p>
                <h2 id="customizer-title" className="truncate text-base font-extrabold text-slate-950 sm:text-lg">Make it yours</h2>
              </div>
            </div>
            {product && (
              <button type="button" onClick={onClose} aria-label="Clear selected product" title="Clear selected product" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-950">
                <X className="h-5 w-5" />
              </button>
            )}
          </header>

          <div className="grid min-w-0 grid-cols-1">
            <div className="flex min-w-0 flex-col gap-3 p-3 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{product?.name || 'Choose a product'}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{product ? 'Live preview · Logo shown for placement only' : 'Click a brush on any product to start designing'}</p>
                </div>
                {product && <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700">
                  {typeof product.priceFrom === 'number' ? `From ₹${product.priceFrom.toLocaleString('en-IN')}` : 'Price on request'}
                </span>}
              </div>

              <div ref={previewRef} className="relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-[1.35rem] border border-slate-200/70 bg-[radial-gradient(ellipse_at_50%_38%,#fff_0%,#f1f0eb_67%,#e6e4dd_100%)] sm:min-h-[300px]">
                <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(rgba(23,24,23,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(23,24,23,0.025)_1px,transparent_1px)] bg-[size:24px_24px]" />
                {activeImage ? (
                  <motion.img
                    layoutId={`fitting-room-product-${product._id}`}
                    transition={{ layout: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }}
                    src={getImageUrl(activeImage.path)}
                    alt={product?.name || 'Product mockup'}
                    className="absolute inset-0 h-full w-full object-contain p-7 sm:p-10"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <ImagePlus className="h-9 w-9" />
                    <span className="text-center text-xs font-medium">{product ? 'No product photo available' : 'Your selected product appears here'}</span>
                  </div>
                )}

                {(logo || brandName) && activeImage && (
                  <div
                    role="group"
                    aria-label="Brand design. Drag to move; use arrow keys for precise positioning."
                    tabIndex={0}
                    onPointerDown={(event) => {
                      if (event.button !== 0) return;
                      event.preventDefault();
                      const bounds = previewRef.current?.getBoundingClientRect();
                      if (bounds) {
                        dragOffset.current = {
                          x: event.clientX - (bounds.left + (brandPosition.x / 100) * bounds.width),
                          y: event.clientY - (bounds.top + (brandPosition.y / 100) * bounds.height)
                        };
                      }
                      event.currentTarget.setPointerCapture(event.pointerId);
                      moveBrand(event);
                    }}
                    onPointerMove={(event) => {
                      if (event.currentTarget.hasPointerCapture(event.pointerId)) moveBrand(event);
                    }}
                    onKeyDown={handleBrandKeyDown}
                    className="absolute z-10 flex max-w-[70%] touch-none cursor-move flex-col items-center gap-1.5 rounded-lg border border-dashed border-amber-500/70 bg-white/10 p-2 text-center outline-none transition-shadow hover:border-amber-600 hover:shadow-[0_0_0_3px_rgba(245,158,11,.18)] focus-visible:shadow-[0_0_0_3px_rgba(245,158,11,.35)]"
                    style={{
                      left: `${brandPosition.x}%`,
                      top: `${brandPosition.y}%`,
                      transform: `translate(-50%, -50%) rotate(${brandRotation}deg)`
                    }}
                  >
                    {logo && <img src={logo.url} alt="Uploaded brand logo preview" className="max-w-full object-contain drop-shadow-md" style={{ width: `${logoSize}px`, height: `${Math.round(logoSize * 0.68)}px` }} />}
                    {brandName && (
                      <span
                        style={{
                          color: printColor,
                          fontFamily: selectedFont.family,
                          fontSize: `${fontSize}px`,
                          fontWeight: selectedFont.weight,
                          letterSpacing: selectedFont.tracking,
                          textShadow: printColor.toLowerCase() === '#ffffff' ? '0 1px 5px rgba(0,0,0,.7)' : '0 1px 2px rgba(255,255,255,.75)'
                        }}
                        className="break-words uppercase drop-shadow-sm"
                      >
                        {brandName}
                      </span>
                    )}
                  </div>
                )}

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous product image"
                      onClick={() => setImageIndex((index) => (index - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md transition hover:bg-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next product image"
                      onClick={() => setImageIndex((index) => (index + 1) % images.length)}
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md transition hover:bg-white"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}

                <span className="absolute bottom-3 left-3 rounded-full border border-white/80 bg-white/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 backdrop-blur">
                  Preview only
                </span>
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((image, index) => (
                    <button key={image._id || image.path} type="button" onClick={() => setImageIndex(index)} aria-label={`Preview photo ${index + 1}`} aria-pressed={index === imageIndex} className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white p-1 ${index === imageIndex ? 'ring-2 ring-amber-500' : 'ring-1 ring-slate-200'}`}>
                      <img src={getImageUrl(image.path)} alt="" className="h-full w-full object-contain" />
                    </button>
                  ))}
                </div>
              )}

              <p className="text-[11px] leading-5 text-slate-500">{product ? 'This preview helps show your branding idea. Final print size and placement are confirmed with our team.' : 'Choose a product using its brush button. It will move into this preview for customization.'}</p>
              {(logo || brandName) && activeImage && <p className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800"><Move className="h-3.5 w-3.5" /> Drag your brand on the preview. Use arrow keys for precise moves.</p>}
            </div>
          </div>

            {product && (
              <>
            <div className="min-w-0 space-y-5 border-t border-slate-200/80 bg-white p-4 sm:p-5">
              <div className="mb-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-800">Design controls</p>
                <p className="mt-1 text-xs text-slate-500">Customize your branding, then drag it onto the product preview.</p>
              </div>
              <section>
                <label htmlFor="custom-brand-name" className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                  <Type className="h-4 w-4 text-amber-700" /> Brand name
                </label>
                <input
                  id="custom-brand-name"
                  type="text"
                  maxLength={28}
                  value={brandName}
                  onChange={(event) => setBrandName(event.target.value)}
                  placeholder="e.g. YOUR COMPANY"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                />
              </section>

              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label htmlFor="brand-font-size" className="text-xs font-bold uppercase tracking-[0.1em] text-slate-600">Text size</label>
                    <span className="text-xs font-bold tabular-nums text-slate-700">{fontSize}px</span>
                  </div>
                  <input id="brand-font-size" type="range" min="10" max="42" step="1" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} aria-label="Brand name font size" className="h-2 w-full cursor-pointer accent-slate-900" />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label htmlFor="brand-logo-size" className="text-xs font-bold uppercase tracking-[0.1em] text-slate-600">Logo size</label>
                    <span className="text-xs font-bold tabular-nums text-slate-700">{logoSize}px</span>
                  </div>
                  <input id="brand-logo-size" type="range" min="40" max="200" step="4" value={logoSize} onChange={(event) => setLogoSize(Number(event.target.value))} aria-label="Brand logo size" className="h-2 w-full cursor-pointer accent-slate-900" />
                </div>
              </section>

              <section>
                <label htmlFor="brand-font-style" className="mb-2 block text-xs font-bold uppercase tracking-[0.1em] text-slate-600">Font design</label>
                <input
                  type="search"
                  value={fontSearch}
                  onChange={(event) => setFontSearch(event.target.value)}
                  placeholder="Search Google Fonts"
                  aria-label="Search Google Fonts"
                  className="mb-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                />
                <select id="brand-font-style" value={fontStyle} onChange={(event) => setFontStyle(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100">
                  {fontOptions.map((style) => <option key={style.id} value={style.id}>{style.label}</option>)}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">{visibleFonts.length} matching Google Fonts · Internet required to load the selected font</p>
                {brandName && <p className="mt-2 truncate text-center text-lg" style={{ fontFamily: selectedFont.family, fontWeight: selectedFont.weight, letterSpacing: selectedFont.tracking, color: printColor }}>{brandName}</p>}
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="custom-logo" className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                    <ImagePlus className="h-4 w-4 text-amber-700" /> Brand logo
                  </label>
                  {logo && <button type="button" onClick={() => setLogo(null)} className="text-xs font-semibold text-rose-600 hover:text-rose-800">Remove</button>}
                </div>
                <label htmlFor="custom-logo" className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 transition hover:border-amber-400 hover:bg-amber-50/40">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-500">
                    {logo ? <img src={logo.url} alt="" className="h-full w-full object-contain p-1" /> : <Upload className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">{logo?.name || 'Upload your logo'}</span>
                    <span className="mt-0.5 block text-[11px] text-slate-500">PNG, JPG or WEBP · up to 5 MB</span>
                  </span>
                  <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">Choose</span>
                  <input id="custom-logo" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoChange} className="sr-only" />
                </label>
                {logoError && <p className="mt-1.5 text-xs font-medium text-rose-600" role="alert">{logoError}</p>}
              </section>

              <section>
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                  <Palette className="h-4 w-4 text-amber-700" /> Product color
                </div>
                <div className="flex flex-wrap gap-2">
                  {product?.colors?.map((color, index) => {
                    const active = !customItemColor && itemColorName === color.name;
                    const hex = color.code || swatchColor(color.name);
                    return (
                      <button key={`${color.name}-${index}`} type="button" onClick={() => selectProductColor(color)} aria-pressed={active} className={`inline-flex items-center gap-2 rounded-full border bg-white px-3 py-2 text-xs font-semibold transition ${active ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-200 hover:border-slate-400'}`}>
                        <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: hex }} />
                        {color.name || `Color ${index + 1}`}
                        {active && <Check className="h-3.5 w-3.5" />}
                      </button>
                    );
                  })}
                  <button type="button" onClick={() => setCustomItemColor(true)} aria-pressed={customItemColor} className={`inline-flex items-center gap-2 rounded-full border bg-white px-3 py-2 text-xs font-semibold transition ${customItemColor ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-200 hover:border-slate-400'}`}>
                    <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: customColorHex }} />
                    Custom color
                    {customItemColor && <Check className="h-3.5 w-3.5" />}
                  </button>
                </div>
                {customItemColor && (
                  <div className="mt-2 flex gap-2">
                    <input type="text" value={customColorName} onChange={(event) => setCustomColorName(event.target.value)} maxLength={24} placeholder="Color name (optional)" aria-label="Custom product color name" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-amber-500" />
                    <input type="color" value={customColorHex} onChange={(event) => setCustomColorHex(event.target.value)} aria-label="Choose custom product color" className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1" />
                  </div>
                )}
                <p className="mt-2 text-[11px] leading-5 text-slate-500">Color choice is sent with your request; product photos stay unchanged in this preview.</p>
              </section>

              <section>
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                  <Palette className="h-4 w-4 text-amber-700" /> Print color
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {printColorOptions.map((color) => (
                    <button key={color} type="button" onClick={() => setPrintColor(color)} aria-label={`Set print color ${color}`} aria-pressed={printColor.toLowerCase() === color} className={`h-8 w-8 rounded-full border border-black/10 ${printColor.toLowerCase() === color ? 'ring-2 ring-slate-900 ring-offset-2' : 'hover:scale-105'}`} style={{ backgroundColor: color }} />
                  ))}
                  <label className="ml-1 inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                    Custom
                    <input type="color" value={printColor} onChange={(event) => setPrintColor(event.target.value)} aria-label="Choose custom print color" className="h-8 w-10 cursor-pointer rounded-md border border-slate-200 bg-white p-1" />
                  </label>
                </div>
              </section>

              <section>
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-600">Brand placement</div>
                <div className="grid grid-cols-3 gap-2">
                  {placementOptions.map((option) => (
                    <button key={option.id} type="button" onClick={() => selectPlacement(option)} aria-pressed={placement === option.id} className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition ${placement === option.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'}`}>
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <label htmlFor="brand-rotation" className="text-xs font-semibold text-slate-600">Rotate design</label>
                  <span className="min-w-12 text-right text-xs font-bold tabular-nums text-slate-700">{brandRotation}°</span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <input id="brand-rotation" type="range" min="-180" max="180" step="1" value={brandRotation} onChange={(event) => setBrandRotation(Number(event.target.value))} aria-label="Rotate brand design" className="h-2 flex-1 cursor-pointer accent-slate-900" />
                  <button type="button" onClick={() => setBrandRotation(0)} aria-label="Reset brand rotation" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-400 hover:text-slate-900">
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-slate-500">Custom position: {Math.round(brandPosition.x)}%, {Math.round(brandPosition.y)}%</p>
              </section>
            </div>

          <footer className="flex shrink-0 flex-col gap-3 border-t border-slate-200/80 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="text-[11px] leading-5 text-slate-500">Your logo stays on this device for preview. Attach the original logo after WhatsApp opens.</p>
            <button type="button" onClick={handleRequestQuote} disabled={!product} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#171817] px-5 py-3 text-sm font-bold text-white transition hover:bg-amber-500 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:cursor-not-allowed disabled:opacity-40">
              <MessageCircle className="h-4 w-4" /> Request custom quote <ArrowRight className="h-4 w-4" />
            </button>
          </footer>
              </>
            )}
    </motion.section>
  );
};

export default ProductCustomizer;
