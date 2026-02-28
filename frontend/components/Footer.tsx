import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, Mail, Phone, MapPin, Instagram, Github } from 'lucide-react';
import { Language, translations } from '../translations';
import { PageView } from '../types';

interface FooterProps {
  language: Language;
  onChangeView: (view: PageView) => void;
}

const Footer: React.FC<FooterProps> = ({ language, onChangeView }) => {
  const t = translations[language];
  
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4 text-white">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Car size={20} />
              </div>
              <span className="font-bold text-xl">SOS Auto DZ</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              {t.footerTagline}
            </p>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors"><Instagram size={20} /></a>
              <a href="https://x.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 512 512" fill="currentColor"><path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8l164.9-188.5L26.8 48h145.6l100.5 132.9L389.2 48zm-24.8 373.8h39.1L151.1 88h-42L364.4 421.8z"/></svg>
              </a>
              <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><Github size={20} /></a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">{t.servicesFooter}</h3>
            <ul className="space-y-3 text-sm">
              <li><button onClick={() => onChangeView(PageView.GARAGE)} className="hover:text-white transition-colors">{t.findMechanic}</button></li>
              <li><button onClick={() => onChangeView(PageView.PARTS)} className="hover:text-white transition-colors">{t.sparePartsShops}</button></li>
              <li><button onClick={() => onChangeView(PageView.TOWING)} className="hover:text-white transition-colors">{t.towingAssistance}</button></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">{t.company}</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">{t.aboutUs}</Link></li>
              <li><Link to="/for-professionals" className="hover:text-white transition-colors">{t.forProfessionals}</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">{t.pricing}</Link></li>
              <li><a href="mailto:nedjari088@gmail.com" className="hover:text-white transition-colors">{t.contact}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">{t.contact}</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-blue-500 mt-0.5" />
                <span>Dergana, Bordj El Kiffan,<br />Algiers, DZ</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-blue-500" />
                <a href="tel:+213791341641" className="hover:text-white transition-colors">+213 791 34 16 41</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-blue-500" />
                <a href="mailto:nedjari088@gmail.com" className="hover:text-white transition-colors">nedjari088@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} SOS Auto DZ. {t.allRightsReserved}</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link to="/privacy" className="hover:text-white">{t.privacyPolicy}</Link>
            <Link to="/terms" className="hover:text-white">{t.termsOfService}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;