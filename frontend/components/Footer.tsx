import React, { useState } from 'react';
import { Car, Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';
import { Language, translations } from '../translations';

interface FooterProps {
  language: Language;
}

const Footer: React.FC<FooterProps> = ({ language }) => {
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
              <a href="#" className="hover:text-blue-400 transition-colors"><Facebook size={20} /></a>
              <a href="#" className="hover:text-pink-400 transition-colors"><Instagram size={20} /></a>
              <a href="#" className="hover:text-blue-300 transition-colors"><Twitter size={20} /></a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">{t.servicesFooter}</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">{t.findMechanic}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t.sparePartsShops}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t.towingAssistance}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t.diagnosticAI}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">{t.company}</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">{t.aboutUs}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t.forProfessionals}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t.pricing}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t.contact}</a></li>
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
            <a href="#" className="hover:text-white">{t.privacyPolicy}</a>
            <a href="#" className="hover:text-white">{t.termsOfService}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;