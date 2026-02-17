export type Language = 'en' | 'fr' | 'ar';

export interface Translations {
  // Navbar
  home: string;
  garage: string;
  spareParts: string;
  towing: string;
  dashboard: string;
  signIn: string;
  signOut: string;
  
  // Hero - Home Page
  heroTagline: string;
  heroTitle1: string;
  heroTitle2: string;
  heroSubtitle: string;
  findGarage: string;
  emergencyTowing: string;
  
  // Services Grid - Home Page
  servicesTitle: string;
  servicesSubtitle: string;
  garageServicesTitle: string;
  garageServicesDesc: string;
  browseGarages: string;
  sparePartsTitle: string;
  sparePartsDesc: string;
  findParts: string;
  roadsideTitle: string;
  roadsideDesc: string;
  getHelpNow: string;
  
  // Features Section - Home Page
  whyChooseTitle: string;
  smartGeoTitle: string;
  smartGeoDesc: string;
  verifiedProsTitle: string;
  verifiedProsDesc: string;
  instantBookingTitle: string;
  instantBookingDesc: string;
  wilayasCovered: string;
  activeMechanics: string;
  avgResponseTime: string;
  userRating: string;
  
  // Buttons
  bookNow: string;
  callNow: string;
  
  // Common
  search: string;
  filter: string;
  location: string;
  phone: string;
  rating: string;
  noResultsFound: string;
  noResultsDesc: string;
  
  // Service Card
  openNow: string;
  closedNow: string;
  closedToday: string;
  unavailable: string;
  
  // Footer
  footerTagline: string;
  servicesFooter: string;
  findMechanic: string;
  sparePartsShops: string;
  towingAssistance: string;
  diagnosticAI: string;
  company: string;
  aboutUs: string;
  forProfessionals: string;
  pricing: string;
  contact: string;
  allRightsReserved: string;
  privacyPolicy: string;
  termsOfService: string;
  
  // Language names
  english: string;
  french: string;
  arabic: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Navbar
    home: 'Home',
    garage: 'Garage Services',
    spareParts: 'Spare Parts',
    towing: 'Towing',
    dashboard: 'Dashboard',
    signIn: 'Sign In / Sign Up',
    signOut: 'Sign Out',
    
    // Hero - Home Page
    heroTagline: "Algeria's Premium Automotive Network",
    heroTitle1: 'Expert Garages',
    heroTitle2: 'Within Reach',
    heroSubtitle: 'Find trusted mechanics, electricians, auto body shops, spare parts, and 24/7 towing services anywhere in Algeria.',
    findGarage: 'Find a Garage',
    emergencyTowing: 'Emergency Towing',
    
    // Services Grid - Home Page
    servicesTitle: 'Everything Your Vehicle Needs',
    servicesSubtitle: "We've simplified the process of maintaining your car. Choose a category below to get started.",
    garageServicesTitle: 'Garage Services',
    garageServicesDesc: 'Certified mechanics, electricians, and body shop experts for all your repair needs.',
    browseGarages: 'Browse Garages',
    sparePartsTitle: 'Spare Parts',
    sparePartsDesc: 'Genuine parts for all brands. Search by part name or vehicle model.',
    findParts: 'Find Parts',
    roadsideTitle: 'Roadside Assistance',
    roadsideDesc: 'Stuck on the road? Find the nearest towing service and get help fast.',
    getHelpNow: 'Get Help Now',
    
    // Features Section - Home Page
    whyChooseTitle: 'Why Choose SOS Auto DZ?',
    smartGeoTitle: 'Smart Geolocation',
    smartGeoDesc: 'Our algorithm finds providers closest to you, saving you time and money on towing.',
    verifiedProsTitle: 'Verified Professionals',
    verifiedProsDesc: 'Every mechanic and shop is verified to ensure quality service and safety.',
    instantBookingTitle: 'Instant Booking',
    instantBookingDesc: 'Schedule appointments directly through the app without endless phone calls.',
    wilayasCovered: 'Wilayas Covered',
    activeMechanics: 'Active Mechanics',
    avgResponseTime: 'Avg. Response Time',
    userRating: 'User Rating',
    
    // Buttons
    bookNow: 'Book Now',
    callNow: 'Call Now',
    
    // Common
    search: 'Search',
    filter: 'Filter',
    location: 'Location',
    phone: 'Phone',
    rating: 'Rating',
    noResultsFound: 'No results found',
    noResultsDesc: 'Try adjusting your filters or search for a different keyword.',
    
    // Service Card
    openNow: 'Open Now',
    closedNow: 'Closed Now',
    closedToday: 'Closed Today',
    unavailable: 'Unavailable',
    
    // Footer
    footerTagline: "Algeria's #1 platform for connecting vehicle owners with trusted mechanics, spare parts, and towing services.",
    servicesFooter: 'Services',
    findMechanic: 'Find a Mechanic',
    sparePartsShops: 'Spare Parts Shops',
    towingAssistance: 'Towing Assistance',
    diagnosticAI: 'Diagnostic AI',
    company: 'Company',
    aboutUs: 'About Us',
    forProfessionals: 'For Professionals',
    pricing: 'Pricing',
    contact: 'Contact',
    allRightsReserved: 'All rights reserved.',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    
    // Language names
    english: 'English',
    french: 'Français',
    arabic: 'العربية',
  },
  fr: {
    // Navbar
    home: 'Accueil',
    garage: 'Services Garage',
    spareParts: 'Pièces Détachées',
    towing: 'Dépannage',
    dashboard: 'Tableau de Bord',
    signIn: 'Se Connecter / S\'inscrire',
    signOut: 'Se Déconnecter',
    
    // Hero - Home Page
    heroTagline: 'Réseau Automobile Premium d\'Algérie',
    heroTitle1: 'Garages Experts',
    heroTitle2: 'À Votre Portée',
    heroSubtitle: 'Trouvez des mécaniciens de confiance, électriciens automobiles, carrossiers, pièces détachées et services de dépannage 24h/24 partout en Algérie.',
    findGarage: 'Trouver un Garage',
    emergencyTowing: 'Dépannage d\'Urgence',
    
    // Services Grid - Home Page
    servicesTitle: 'Tout ce dont Votre Véhicule a Besoin',
    servicesSubtitle: 'Nous avons simplifié le processus d\'entretien de votre voiture. Choisissez une catégorie ci-dessous pour commencer.',
    garageServicesTitle: 'Services Garage',
    garageServicesDesc: 'Mécaniciens certifiés, électriciens et experts en carrosserie pour tous vos besoins de réparation.',
    browseGarages: 'Parcourir les Garages',
    sparePartsTitle: 'Pièces Détachées',
    sparePartsDesc: 'Pièces authentiques pour toutes les marques. Recherchez par nom de pièce ou modèle de véhicule.',
    findParts: 'Trouver des Pièces',
    roadsideTitle: 'Assistance Routière',
    roadsideDesc: 'Bloqué sur la route ? Trouvez le service de dépannage le plus proche et obtenez de l\'aide rapidement.',
    getHelpNow: 'Obtenir de l\'Aide',
    
    // Features Section - Home Page
    whyChooseTitle: 'Pourquoi Choisir SOS Auto DZ ?',
    smartGeoTitle: 'Géolocalisation Intelligente',
    smartGeoDesc: 'Notre algorithme trouve les prestataires les plus proches de vous, vous faisant gagner du temps et de l\'argent.',
    verifiedProsTitle: 'Professionnels Vérifiés',
    verifiedProsDesc: 'Chaque mécanicien et atelier est vérifié pour garantir un service de qualité et la sécurité.',
    instantBookingTitle: 'Réservation Instantanée',
    instantBookingDesc: 'Planifiez des rendez-vous directement via l\'application sans interminables appels téléphoniques.',
    wilayasCovered: 'Wilayas Couvertes',
    activeMechanics: 'Mécaniciens Actifs',
    avgResponseTime: 'Temps de Réponse Moyen',
    userRating: 'Note Utilisateur',
    
    // Buttons
    bookNow: 'Réserver',
    callNow: 'Appeler',
    
    // Common
    search: 'Rechercher',
    filter: 'Filtrer',
    location: 'Localisation',
    phone: 'Téléphone',
    rating: 'Note',
    noResultsFound: 'Aucun résultat trouvé',
    noResultsDesc: 'Essayez d\'ajuster vos filtres ou recherchez un autre mot-clé.',
    
    // Service Card
    openNow: 'Ouvert Maintenant',
    closedNow: 'Fermé Maintenant',
    closedToday: 'Fermé Aujourd\'hui',
    unavailable: 'Indisponible',
    
    // Footer
    footerTagline: 'La plateforme n°1 en Algérie pour connecter les propriétaires de véhicules avec des mécaniciens de confiance, des pièces détachées et des services de dépannage.',
    servicesFooter: 'Services',
    findMechanic: 'Trouver un Mécanicien',
    sparePartsShops: 'Magasins de Pièces Détachées',
    towingAssistance: 'Assistance au Dépannage',
    diagnosticAI: 'Diagnostic IA',
    company: 'Entreprise',
    aboutUs: 'À Propos',
    forProfessionals: 'Pour les Professionnels',
    pricing: 'Tarifs',
    contact: 'Contact',
    allRightsReserved: 'Tous droits réservés.',
    privacyPolicy: 'Politique de Confidentialité',
    termsOfService: 'Conditions d\'Utilisation',
    
    // Language names
    english: 'English',
    french: 'Français',
    arabic: 'العربية',
  },
  ar: {
    // Navbar
    home: 'الرئيسية',
    garage: 'خدمات الكراج',
    spareParts: 'قطع الغيار',
    towing: 'السحب',
    dashboard: 'لوحة التحكم',
    signIn: 'تسجيل الدخول / التسجيل',
    signOut: 'تسجيل الخروج',
    
    // Hero - Home Page
    heroTagline: 'شبكة السيارات الممتازة في الجزائر',
    heroTitle1: 'كراجات متخصصة',
    heroTitle2: 'في متناول يديك',
    heroSubtitle: 'اعثر على ميكانيكيين موثوقين، كهربائيين، ورش تصليح، قطع غيار، وخدمات السحب على مدار 24/7 في أي مكان في الجزائر.',
    findGarage: 'ابحث عن كراج',
    emergencyTowing: 'سحب طارئ',
    
    // Services Grid - Home Page
    servicesTitle: 'كل ما تحتاجه سيارتك',
    servicesSubtitle: 'لقد بسطنا عملية صيانة سيارتك. اختر فئة أدناه للبدء.',
    garageServicesTitle: 'خدمات الكراج',
    garageServicesDesc: 'ميكانيكيون معتمدون، كهربائيون وخبراء تصليح الهياكل لجميع احتياجات الإصلاح الخاصة بك.',
    browseGarages: 'تصفح الكراجات',
    sparePartsTitle: 'قطع الغيار',
    sparePartsDesc: 'قطع أصلية لجميع الماركات. ابحث باسم القطعة أو طراز السيارة.',
    findParts: 'ابحث عن القطع',
    roadsideTitle: 'المساعدة على الطريق',
    roadsideDesc: 'عالق على الطريق؟ اعثر على أقرب خدمة سحب واحصل على المساعدة بسرعة.',
    getHelpNow: 'احصل على المساعدة الآن',
    
    // Features Section - Home Page
    whyChooseTitle: 'لماذا تختار SOS Auto DZ؟',
    smartGeoTitle: 'تحديد الموقع الذكي',
    smartGeoDesc: 'خوارزميتنا تجد أقرب مقدمي الخدمة إليك، مما يوفر لك الوقت والمال.',
    verifiedProsTitle: 'محترفون موثقون',
    verifiedProsDesc: 'يتم التحقق من كل ميكانيكي وورشة لضمان جودة الخدمة والأمان.',
    instantBookingTitle: 'حجز فوري',
    instantBookingDesc: 'حدد المواعيد مباشرة عبر التطبيق دون مكالمات هاتفية لا نهاية لها.',
    wilayasCovered: 'الولايات المغطاة',
    activeMechanics: 'ميكانيكيون نشطون',
    avgResponseTime: 'متوسط وقت الاستجابة',
    userRating: 'تقييم المستخدم',
    
    // Buttons
    bookNow: 'احجز الآن',
    callNow: 'اتصل الآن',
    
    // Common
    search: 'بحث',
    filter: 'تصفية',
    location: 'الموقع',
    phone: 'الهاتف',
    rating: 'التقييم',
    noResultsFound: 'لم يتم العثور على نتائج',
    noResultsDesc: 'حاول تعديل الفلاتر أو البحث عن كلمة مفتاحية مختلفة.',
    
    // Service Card
    openNow: 'مفتوح الآن',
    closedNow: 'مغلق الآن',
    closedToday: 'مغلق اليوم',
    unavailable: 'غير متاح',
    
    // Footer
    footerTagline: 'المنصة رقم 1 في الجزائر لربط أصحاب السيارات بالميكانيكيين الموثوقين وقطع الغيار وخدمات السحب.',
    servicesFooter: 'الخدمات',
    findMechanic: 'ابحث عن ميكانيكي',
    sparePartsShops: 'محلات قطع الغيار',
    towingAssistance: 'المساعدة في السحب',
    diagnosticAI: 'تشخيص بالذكاء الاصطناعي',
    company: 'الشركة',
    aboutUs: 'من نحن',
    forProfessionals: 'للمحترفين',
    pricing: 'الأسعار',
    contact: 'اتصل بنا',
    allRightsReserved: 'جميع الحقوق محفوظة.',
    privacyPolicy: 'سياسة الخصوصية',
    termsOfService: 'شروط الخدمة',
    
    // Language names
    english: 'English',
    french: 'Français',
    arabic: 'العربية',
  },
};
