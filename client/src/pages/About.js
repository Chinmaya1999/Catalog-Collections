import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Gift, Users, Target, Shirt, Package, Briefcase, Wallet, HardHat, Sparkles, ArrowRight, ArrowUpRight } from 'lucide-react';
import SEO from '../components/SEO';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const values = [
  { title: 'Passion', description: 'Driven by love for innovation and creativity', Icon: Heart },
  { title: 'Customization', description: 'Personalized solutions for every need', Icon: Gift },
  { title: 'Customer Focus', description: 'Your satisfaction is our priority', Icon: Users },
  { title: 'Quality', description: 'Excellence in every product we create', Icon: Target },
];

const offerings = [
  { title: 'Personalized T-Shirts', description: 'Custom designs on premium quality t-shirts', Icon: Shirt },
  { title: 'Custom Hoodies', description: 'Comfortable hoodies with your unique branding', Icon: Sparkles },
  { title: 'Branded Caps', description: 'Stylish caps with custom logo printing', Icon: HardHat },
  { title: 'Custom Wallets', description: 'Personalized wallets for corporate gifting', Icon: Wallet },
  { title: 'Employee Kits', description: 'Complete branded kits for your team', Icon: Package },
  { title: 'Corporate Gifting', description: 'Premium gifts for clients and partners', Icon: Briefcase },
];

const About = memo(() => {
  return (
    <div className="min-h-screen bg-brand-light">
      <SEO
        title="About Us | Custom Corporate Gifting Experts – Adihuman"
        description="Adihuman specializes in personalized corporate gifting — custom T-shirts, hoodies, caps, wallets, employee kits and branded merchandise for businesses across India."
        path="/about"
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-brand-dark pt-36 pb-24 text-white sm:pt-44 sm:pb-32">
        <div className="pointer-events-none absolute inset-0 bg-grid-dark mask-radial" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-brand-yellow/20 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-4xl text-center"
          >
            <p className="eyebrow !text-white/50 justify-center">About Us</p>
            <h1 className="mt-6 text-5xl font-display font-extrabold leading-[0.95] tracking-tightest sm:text-7xl lg:text-8xl">
              Passionate about <span className="text-gradient-animated">custom gifting.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-white/60">
              Passionate about innovation and custom gifting — we turn everyday products into things your people remember.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="relative z-10 -mt-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          {...fadeUp}
          className="mx-auto max-w-5xl rounded-[2rem] bg-white p-8 shadow-lift ring-1 ring-black/5 md:p-14"
        >
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="eyebrow">Our story</p>
              <h2 className="mt-4 text-3xl font-display font-extrabold leading-tight tracking-tight">Making every gift feel like it belongs.</h2>
            </div>
            <div className="space-y-5 md:col-span-8">
              <p className="text-lg leading-8 text-ink-600">
                At Adihuman, we are passionate about innovation and custom gifting. We specialize in personalizing T-shirts, Hoodies, Caps, wallets, and much more. Our mission is to help you add your brand to employee kits and create memorable, personalized products that make a lasting impression.
              </p>
              <p className="text-lg leading-8 text-ink-600">
                Whether you're looking for corporate gifting solutions, personalized merchandise for events, or custom products for your team, we bring creativity and quality to every project. Our commitment to excellence and attention to detail ensures that each product reflects your unique identity and brand values.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Values */}
      <section className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="eyebrow">What drives us</p>
            <h2 className="section-title mt-4">Four values, every order.</h2>
          </motion.div>
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ title, description, Icon }, index) => (
              <motion.div
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: index * 0.08 }}
                key={title}
                className="group relative overflow-hidden rounded-3xl border border-ink-200/70 bg-white p-7 shadow-soft transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lift"
              >
                <span className="absolute right-6 top-6 font-display text-5xl font-extrabold text-ink-100 transition-colors duration-500 group-hover:text-brand-yellow/40">
                  0{index + 1}
                </span>
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-dark text-brand-yellow transition-all duration-500 group-hover:rotate-6 group-hover:bg-brand-yellow group-hover:text-brand-dark">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="relative mt-10 text-xl font-display font-bold text-brand-dark">{title}</h3>
                <p className="relative mt-2 text-sm leading-6 text-ink-500">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="bg-white py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="eyebrow">What We Offer</p>
              <h2 className="section-title mt-4">Everything, made yours.</h2>
            </div>
            <Link to="/shop" className="btn-outline group self-start md:self-auto">
              Browse the shop <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </motion.div>

          <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-3xl bg-ink-200/70 ring-1 ring-ink-200/70 md:grid-cols-2 lg:grid-cols-3">
            {offerings.map(({ title, description, Icon }, index) => (
              <motion.div
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: index * 0.05 }}
                key={title}
                className="group flex items-start gap-5 bg-white p-8 transition-colors duration-300 hover:bg-ink-50"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-yellow/25 text-brand-dark transition-all duration-300 group-hover:bg-brand-yellow">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-display font-bold text-brand-dark">{title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-ink-500">{description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <motion.div
          {...fadeUp}
          className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-brand-yellow px-8 py-16 text-center shadow-glow sm:px-16"
        >
          <div className="pointer-events-none absolute inset-0 bg-grid mask-radial opacity-60" />
          <div className="relative">
            <h2 className="text-4xl font-display font-extrabold tracking-tight text-brand-dark sm:text-5xl">
              Ready to Get Started?
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-brand-dark/70">
              Let's create something amazing together. Contact us to discuss your custom gifting needs.
            </p>
            <Link to="/contact" className="btn-secondary group mt-9 !px-8 !py-4 !text-[15px]">
              Contact Us Today <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
});

export default About;
