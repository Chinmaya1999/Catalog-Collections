import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

const Footer = memo(() => {
  return (
    <footer className="bg-brand-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <img 
                  src="/images/logo.png" 
                  alt="Adihuman Logo" 
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<span class="text-xl font-bold text-white">A</span>';
                  }}
                />
              </div>
              <span className="text-xl font-display font-bold">adihuman</span>
            </div>
            <p className="text-gray-400 text-sm">
              Premium personalized products for corporate gifting and personal use.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com/adihuman" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-yellow transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://instagram.com/adihuman" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-yellow transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://twitter.com/adihuman" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-yellow transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com/company/adihuman" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-yellow transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-brand-yellow">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/catalog" className="text-gray-400 hover:text-white transition-colors">Catalog</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/admin/login" className="text-gray-400 hover:text-brand-yellow transition-colors font-semibold">Admin Login</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-brand-yellow">Categories</h3>
            <ul className="space-y-2">
              <li><Link to="/catalog?featured=true" className="text-gray-400 hover:text-white transition-colors">Combo Sets</Link></li>
              <li><Link to="/catalog?ecoFriendly=true" className="text-gray-400 hover:text-white transition-colors">Eco-Friendly</Link></li>
              <li><Link to="/category/keychains" className="text-gray-400 hover:text-white transition-colors">Keychains</Link></li>
              <li><Link to="/category/cardholders" className="text-gray-400 hover:text-white transition-colors">Cardholders</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-brand-yellow">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3 text-gray-400">
                <Mail className="w-5 h-5" />
                <span>contact@adihuman.com</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400">
                <Phone className="w-5 h-5" />
                <span>+91 82968 10381</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400">
                <MapPin className="w-5 h-5" />
                <span>Bangalore, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; 2024 Adihuman. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
