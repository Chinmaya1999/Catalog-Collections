import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin, ArrowUpRight, MessageCircle } from 'lucide-react';

const socialLinks = [
  { href: 'https://facebook.com/adihuman', label: 'Facebook', Icon: Facebook },
  { href: 'https://instagram.com/adihuman', label: 'Instagram', Icon: Instagram },
  { href: 'https://twitter.com/adihuman', label: 'Twitter', Icon: Twitter },
  { href: 'https://linkedin.com/company/adihuman', label: 'LinkedIn', Icon: Linkedin },
];

const linkGroups = [
  {
    title: 'Shop',
    links: [
      { to: '/shop', label: 'All products' },
      { to: '/order-calculator', label: 'Bulk calculator' },
      { to: '/catalog-request', label: 'Request a catalog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/', label: 'Home' },
      { to: '/about', label: 'About Us' },
      { to: '/contact', label: 'Contact' },
      { to: '/admin/login', label: 'Admin Login' },
    ],
  },
];

const Footer = memo(() => {
  return (
    <footer className="relative overflow-hidden bg-brand-dark text-white">
      <div className="pointer-events-none absolute inset-0 bg-grid-dark mask-fade-b opacity-60" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[48rem] -translate-x-1/2 rounded-full bg-brand-yellow/10 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* CTA band */}
        <div className="flex flex-col gap-8 border-b border-white/10 py-14 md:flex-row md:items-end md:justify-between lg:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow !text-white/50">Let's work together</p>
            <h2 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Gifts your team will <span className="text-gradient">actually keep.</span>
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/catalog-request" className="btn-primary !px-7 !py-4 group">
              Start a project
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <a
              href="https://wa.me/918296810381"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-glass !px-7 !py-4"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp us
            </a>
          </div>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-2 gap-10 py-14 md:grid-cols-12">
          {/* Brand */}
          <div className="col-span-2 space-y-5 md:col-span-5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-white/5 ring-1 ring-white/10 rounded-full flex items-center justify-center">
                <img
                  src="/images/logo.png"
                  alt="Adihuman Logo"
                  className="w-7 h-7 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<span class="text-xl font-bold text-white">A</span>';
                  }}
                />
              </div>
              <span className="text-xl font-display font-extrabold tracking-tight">
                adihuman<span className="text-brand-yellow">.</span>
              </span>
            </div>
            <p className="max-w-sm text-sm leading-6 text-white/55">
              Premium personalized products for corporate gifting and personal use. Designed, branded and delivered from Bangalore.
            </p>
            <div className="flex gap-2">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-yellow hover:bg-brand-yellow hover:text-brand-dark"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {linkGroups.map((group) => (
            <div key={group.title} className="md:col-span-2">
              <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-white/40">{group.title}</h3>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="group inline-flex items-center gap-1 text-sm text-white/70 transition-colors hover:text-white"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition-all group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div className="col-span-2 md:col-span-3">
            <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-white/40">Contact Us</h3>
            <ul className="space-y-3">
              <li>
                <a href="mailto:contact@adihuman.com" className="flex items-center gap-3 text-sm text-white/70 transition-colors hover:text-white">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10"><Mail className="h-3.5 w-3.5" /></span>
                  contact@adihuman.com
                </a>
              </li>
              <li>
                <a href="tel:+918296810381" className="flex items-center gap-3 text-sm text-white/70 transition-colors hover:text-white">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10"><Phone className="h-3.5 w-3.5" /></span>
                  +91 82968 10381
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/70">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10"><MapPin className="h-3.5 w-3.5" /></span>
                Bangalore, India
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-xs text-white/40 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Adihuman. All rights reserved.</p>
          <p>Crafted with care in Bangalore, India.</p>
        </div>
      </div>

      {/* Oversized wordmark */}
      <div className="pointer-events-none relative select-none overflow-hidden" aria-hidden="true">
        <p className="text-outline -mb-[0.22em] text-center font-display text-[22vw] font-extrabold leading-none tracking-tightest">
          adihuman
        </p>
      </div>
    </footer>
  );
});

export default Footer;
