import React from 'react';
import { Shield, MessageSquare, Linkedin, Twitter } from 'lucide-react';
import { Link } from '../lib/router';

interface FooterProps {
  onOpenContact: () => void;
  onOpenAdminAuth?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenContact, onOpenAdminAuth }) => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200/60 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 4-column Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Column 1: Brand Info */}
          <div>
            <Link href="/" className="text-2xl font-black text-blue-950 tracking-tight block mb-3 hover:text-blue-900 transition">
              AFINBO
            </Link>
            <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
              Your trusted partner for professional fiber optic tools, advanced testing equipment, and comprehensive calibration services across West Africa.
            </p>
          </div>

          {/* Column 2: PRODUCTS */}
          <div>
            <h4 className="text-slate-900 font-extrabold text-xs tracking-wider uppercase mb-4">
              PRODUCTS
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li>
                <Link
                  href="/strippers"
                  className="hover:text-rose-600 transition"
                >
                  Strippers
                </Link>
              </li>
              <li>
                <Link
                  href="/cleavers"
                  className="hover:text-rose-600 transition"
                >
                  Cleavers
                </Link>
              </li>
              <li>
                <Link
                  href="/testers"
                  className="hover:text-rose-600 transition"
                >
                  Testers
                </Link>
              </li>
              <li>
                <Link
                  href="/splicers"
                  className="hover:text-rose-600 transition"
                >
                  Splicers
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="hover:text-rose-600 transition font-semibold text-blue-600"
                >
                  View Full Catalog →
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: COMPANY */}
          <div>
            <h4 className="text-slate-900 font-extrabold text-xs tracking-wider uppercase mb-4">
              COMPANY
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li>
                <Link href="/about-afinbo" className="hover:text-rose-600 transition">
                  About AFINBO
                </Link>
              </li>
              <li>
                <Link href="/about-afinbo" className="hover:text-rose-600 transition">
                  Calibration Services
                </Link>
              </li>
              <li>
                <button 
                  onClick={onOpenContact} 
                  className="hover:text-rose-600 transition cursor-pointer text-left"
                >
                  Contact Sales & Engineering
                </button>
              </li>
              <li className="pt-1">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-slate-500" />
                  <span>Admin Portal</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: CONTACT */}
          <div>
            <h4 className="text-slate-900 font-extrabold text-xs tracking-wider uppercase mb-4">
              CONTACT
            </h4>
            <p className="text-slate-600 text-xs mb-2">
              Whitesand Avenue, Ikate Lagos
            </p>
            <p className="text-slate-600 text-xs mb-3 font-medium">
              Phone: +234 803 392 2029
            </p>

            {/* WhatsApp Us Button */}
            <a
              href="https://wa.me/2348033922029"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-semibold text-xs px-3.5 py-2 rounded-lg border border-emerald-200/80 inline-flex items-center gap-2 transition"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Us</span>
            </a>
          </div>

        </div>

        {/* Bottom Horizontal Line & Copyright */}
        <div className="border-t border-slate-200/60 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 Afinbo Nigeria LTD. All rights reserved.</p>

          <div className="flex items-center space-x-4">
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 transition" aria-label="LinkedIn">
              <Linkedin className="w-4 h-4" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 transition" aria-label="Twitter">
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
