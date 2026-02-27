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
  searchAllProviders: string;
  searchResults: string;
  allServices: string;

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
  hoursNotSet: string;
  everyDay: string;
  satThu: string;
  customSchedule: string;
  currentlyUnavailable: string;

  // Footer
  footerTagline: string;
  servicesFooter: string;
  findMechanic: string;
  sparePartsShops: string;
  towingAssistance: string;
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

  // ServicesPage filters
  allWilayas: string;
  selectWilayaFirst: string;
  allCommunes: string;
  allGarageTypes: string;
  mechanicType: string;
  electricianType: string;
  autoBodyType: string;
  searchCarBrand: string;
  allBrands: string;
  noBrandsFound: string;
  loadingProviders: string;

  // BookingModal
  bookService: string;
  scheduleWith: string;
  fullName: string;
  phoneNumber: string;
  preferredDate: string;
  problemDescription: string;
  describeIssue: string;
  creatingBooking: string;
  confirmBooking: string;
  bookingConfirmed: string;
  bookingConfirmedDesc: string;
  close: string;

  // Dashboard – header & sidebar
  dashboardTitle: string;
  manageAccount: string;
  overview: string;
  myBookings: string;
  requests: string;
  settings: string;

  // Dashboard – Client overview
  activeBookings: string;
  completedServices: string;
  recentActivity: string;
  leaveReview: string;

  // Review Modal
  reviewModalTitle: string;
  reviewForProvider: string;
  yourRating: string;
  tapToRate: string;
  yourReview: string;
  reviewPlaceholder: string;
  submitReview: string;
  submittingReview: string;
  reviewSuccess: string;
  reviewAlreadyExists: string;
  reviewed: string;

  // Dashboard – Professional overview
  welcomePro: string;
  manageGarage: string;
  online: string;
  offline: string;
  pendingRequests: string;
  todaysJobs: string;
  totalRevenue: string;
  ratingLabel: string;
  incomingRequests: string;
  viewAll: string;
  noPendingRequests: string;
  issueLabel: string;
  decline: string;
  acceptJob: string;

  // Dashboard – Admin overview
  adminTitle: string;
  adminSubtitle: string;
  totalUsers: string;
  verifiedProviders: string;
  pendingApprovals: string;
  reports: string;
  pendingProviderApprovals: string;
  nameCol: string;
  typeCol: string;
  wilayaCol: string;
  actionCol: string;
  reviewAction: string;

  // Dashboard – Bookings tab
  bookingHistory: string;
  serviceRequests: string;
  noBookingsFound: string;

  // Dashboard – Settings tab
  accountSettings: string;
  changeProfilePicture: string;
  changeShopPhoto: string;
  shopPhotoDesc: string;
  emailLabel: string;
  emailCannotChange: string;
  phoneLabel: string;
  saving: string;
  saveChanges: string;
  changesSaved: string;
  saveFailed: string;
  changePassword: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  updatePassword: string;

  // AuthModal – tabs & header
  signInTab: string;
  signUpTab: string;
  signInTitle: string;
  createAccountTitle: string;
  welcomeBack: string;
  joinTitle: string;
  signInSubtitle: string;
  signUpSubtitle: string;

  // AuthModal – role selector
  iAmA: string;
  roleGarage: string;
  rolePartsShop: string;
  roleTowing: string;
  roleClient: string;

  // AuthModal – common fields
  businessName: string;
  emailAddress: string;
  password: string;

  // AuthModal – professional section
  businessDetails: string;
  garageType: string;
  selectType: string;
  generalMechanic: string;
  autoElectrician: string;
  autoBodyPaint: string;
  workSchedule: string;
  startTime: string;
  endTime: string;
  wilaya: string;
  commune: string;
  selectPlaceholder: string;
  description: string;
  optional: string;
  descriptionPlaceholder: string;
  supportedBrands: string;
  searchBrands: string;
  selectAll: string;
  unselectAll: string;
  noBrandsFoundShort: string;
  brandsSelected: string;

  // AuthModal – submit & links
  processing: string;
  forgotPassword: string;

  // Forgot / Reset Password flow
  forgotPasswordTitle: string;
  forgotPasswordSubtitle: string;
  sendResetLink: string;
  sendingResetLink: string;
  resetLinkSent: string;
  resetLinkSentDesc: string;
  backToLogin: string;
  resetPasswordTitle: string;
  resetPasswordSubtitle: string;
  newPassword: string;
  confirmNewPassword: string;
  resetPassword: string;
  resettingPassword: string;
  passwordResetSuccess: string;
  passwordResetSuccessDesc: string;
  passwordsDoNotMatch: string;
  passwordMinLength: string;

  // Email Verification
  verifyEmailTitle: string;
  verifyEmailSentTitle: string;
  verifyEmailSentDesc: string;
  verifyEmailResend: string;
  verifyEmailResending: string;
  verifyEmailResent: string;
  verifyEmailVerifying: string;
  verifyEmailSuccess: string;
  verifyEmailSuccessDesc: string;
  verifyEmailFailed: string;
  verifyEmailExpired: string;
  goToLogin: string;

  // Provider Profile
  providerProfile: string;
  contactInfo: string;
  workingSchedule: string;
  customerReviews: string;
  noReviewsYet: string;
  specialties: string;
  viewProfile: string;
  backToList: string;
  providerNotFound: string;
  dayNames: string[];

  // Map
  mapView: string;
  listView: string;
  showOnMap: string;

  // NotificationDropdown
  notifications: string;
  clearAll: string;
  noNewNotifications: string;
  markAsRead: string;

  // DistanceIndicator
  distanceUnknown: string;
  nearYou: string;
  moderateDistance: string;
  farLocation: string;
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
    searchAllProviders: 'Search mechanics, parts shops, towing...',
    searchResults: 'Search Results',
    allServices: 'All service providers across Algeria',

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
    hoursNotSet: 'Hours not set',
    everyDay: 'Every Day',
    satThu: 'Sat – Thu',
    customSchedule: 'Custom Schedule',
    currentlyUnavailable: 'Currently Unavailable',

    // Footer
    footerTagline: "Algeria's #1 platform for connecting vehicle owners with trusted mechanics, spare parts, and towing services.",
    servicesFooter: 'Services',
    findMechanic: 'Garage Services',
    sparePartsShops: 'Spare Parts Shops',
    towingAssistance: 'Towing Assistance',
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

    // ServicesPage filters
    allWilayas: 'All Wilayas',
    selectWilayaFirst: 'Select Wilaya First',
    allCommunes: 'All Communes',
    allGarageTypes: 'All Garage Types',
    mechanicType: 'Mechanic',
    electricianType: 'Electrician',
    autoBodyType: 'Auto Body',
    searchCarBrand: 'Search Car Brand...',
    allBrands: 'All Brands',
    noBrandsFound: 'No brands found matching',
    loadingProviders: 'Loading providers...',

    // BookingModal
    bookService: 'Book Service',
    scheduleWith: 'Schedule an appointment with',
    fullName: 'Full Name',
    phoneNumber: 'Phone Number',
    preferredDate: 'Preferred Date',
    problemDescription: 'Problem Description',
    describeIssue: 'Describe the issue...',
    creatingBooking: 'Creating Booking...',
    confirmBooking: 'Confirm Booking',
    bookingConfirmed: 'Booking Confirmed!',
    bookingConfirmedDesc: 'Your request has been sent. They will contact you shortly.',
    close: 'Close',

    // Dashboard – header & sidebar
    dashboardTitle: 'Dashboard',
    manageAccount: 'Manage your account and services',
    overview: 'Overview',
    myBookings: 'My Bookings',
    requests: 'Requests',
    settings: 'Settings',

    // Dashboard – Client overview
    activeBookings: 'Active Bookings',
    completedServices: 'Completed Services',
    recentActivity: 'Recent Activity',
    leaveReview: 'Leave Review',

    // Review Modal
    reviewModalTitle: 'Leave a Review',
    reviewForProvider: 'How was your experience with',
    yourRating: 'Your Rating',
    tapToRate: 'Tap a star to rate',
    yourReview: 'Your Review',
    reviewPlaceholder: 'Tell us about your experience (optional)...',
    submitReview: 'Submit Review',
    submittingReview: 'Submitting...',
    reviewSuccess: 'Thank you! Your review has been submitted.',
    reviewAlreadyExists: 'You have already reviewed this booking.',
    reviewed: 'Reviewed',

    // Dashboard – Professional overview
    welcomePro: 'Welcome,',
    manageGarage: 'Manage your garage and incoming requests.',
    online: 'Online',
    offline: 'Offline',
    pendingRequests: 'Pending Requests',
    todaysJobs: "Today's Jobs",
    totalRevenue: 'Total Revenue',
    ratingLabel: 'Rating',
    incomingRequests: 'Incoming Requests',
    viewAll: 'View All',
    noPendingRequests: 'No pending requests at the moment.',
    issueLabel: 'Issue:',
    decline: 'Decline',
    acceptJob: 'Accept Job',

    // Dashboard – Admin overview
    adminTitle: 'Admin Control Center',
    adminSubtitle: 'System overview and user management.',
    totalUsers: 'Total Users',
    verifiedProviders: 'Verified Providers',
    pendingApprovals: 'Pending Approvals',
    reports: 'Reports',
    pendingProviderApprovals: 'Pending Provider Approvals',
    nameCol: 'Name',
    typeCol: 'Type',
    wilayaCol: 'Wilaya',
    actionCol: 'Action',
    reviewAction: 'Review',

    // Dashboard – Bookings tab
    bookingHistory: 'Booking History',
    serviceRequests: 'Service Requests',
    noBookingsFound: 'No bookings found.',

    // Dashboard – Settings tab
    accountSettings: 'Account Settings',
    changeProfilePicture: 'Change profile picture',
    changeShopPhoto: 'Change shop photo',
    shopPhotoDesc: 'This photo is shown on your public profile and service card.',
    emailLabel: 'Email',
    emailCannotChange: 'Email address cannot be changed.',
    phoneLabel: 'Phone',
    saving: 'Saving...',
    saveChanges: 'Save Changes',
    changesSaved: 'Changes saved successfully!',
    saveFailed: 'Failed to save changes.',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmNewPassword: 'Confirm New Password',
    updatePassword: 'Update Password',

    // AuthModal – tabs & header
    signInTab: 'SIGN IN',
    signUpTab: 'SIGN UP',
    signInTitle: 'Sign In',
    createAccountTitle: 'Create Account',
    welcomeBack: 'Welcome Back',
    joinTitle: 'Join SOS Auto DZ',
    signInSubtitle: 'Enter your credentials to access your account',
    signUpSubtitle: 'Create an account to connect with the best automotive network in Algeria',

    // AuthModal – role selector
    iAmA: 'I am a:',
    roleGarage: 'Garage',
    rolePartsShop: 'Parts Shop',
    roleTowing: 'Broken-down Service',
    roleClient: 'Client',

    // AuthModal – common fields
    businessName: 'Business / Shop Name',
    emailAddress: 'Email Address',
    password: 'Password',

    // AuthModal – professional section
    businessDetails: 'Business Details',
    garageType: 'Garage Type',
    selectType: 'Select Type...',
    generalMechanic: 'General Mechanic',
    autoElectrician: 'Auto Electrician',
    autoBodyPaint: 'Auto Body & Paint',
    workSchedule: 'Work Schedule',
    startTime: 'Start Time',
    endTime: 'End Time',
    wilaya: 'Wilaya',
    commune: 'Commune',
    selectPlaceholder: 'Select...',
    description: 'Description',
    optional: 'Optional',
    descriptionPlaceholder: 'Briefly describe your services, hours, or specialties...',
    supportedBrands: 'Supported Car Brands',
    searchBrands: 'Search brands (e.g. BMW, Toyota)...',
    selectAll: 'Select All',
    unselectAll: 'Unselect All',
    noBrandsFoundShort: 'No brands found.',
    brandsSelected: 'brands selected',

    // AuthModal – submit & links
    processing: 'Processing...',
    forgotPassword: 'Forgot your password?',

    // Forgot / Reset Password flow
    forgotPasswordTitle: 'Reset your password',
    forgotPasswordSubtitle: 'Enter your email and we\'ll send you a link to reset your password.',
    sendResetLink: 'Send Reset Link',
    sendingResetLink: 'Sending...',
    resetLinkSent: 'Check your email',
    resetLinkSentDesc: 'If an account with that email exists, we sent a password reset link. Check your inbox (and spam folder).',
    backToLogin: 'Back to Login',
    resetPasswordTitle: 'Set new password',
    resetPasswordSubtitle: 'Enter your new password below.',
    newPassword: 'New Password',
    confirmNewPassword: 'Confirm New Password',
    resetPassword: 'Reset Password',
    resettingPassword: 'Resetting...',
    passwordResetSuccess: 'Password reset!',
    passwordResetSuccessDesc: 'Your password has been reset successfully. You can now log in with your new password.',
    passwordsDoNotMatch: 'Passwords do not match.',
    passwordMinLength: 'Password must be at least 6 characters.',

    // Email Verification
    verifyEmailTitle: 'Verify Your Email',
    verifyEmailSentTitle: 'Check Your Email',
    verifyEmailSentDesc: 'We sent a verification link to your email address. Please check your inbox and click the link to verify your account.',
    verifyEmailResend: 'Resend verification email',
    verifyEmailResending: 'Sending...',
    verifyEmailResent: 'Verification email sent!',
    verifyEmailVerifying: 'Verifying your email...',
    verifyEmailSuccess: 'Email Verified!',
    verifyEmailSuccessDesc: 'Your email has been verified successfully. You can now log in to your account.',
    verifyEmailFailed: 'Verification Failed',
    verifyEmailExpired: 'This verification link is invalid or has expired. Please request a new one.',
    goToLogin: 'Go to Login',

    // Provider Profile
    providerProfile: 'Provider Profile',
    contactInfo: 'Contact Information',
    workingSchedule: 'Working Schedule',
    customerReviews: 'Customer Reviews',
    noReviewsYet: 'No reviews yet. Be the first to leave a review!',
    specialties: 'Specialties',
    viewProfile: 'View Profile',
    backToList: 'Back to list',
    providerNotFound: 'Provider not found',
    dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],

    // Map
    mapView: 'Map View',
    listView: 'List View',
    showOnMap: 'Show on map',

    // NotificationDropdown
    notifications: 'Notifications',
    clearAll: 'Clear all',
    noNewNotifications: 'No new notifications',
    markAsRead: 'Mark as read',

    // DistanceIndicator
    distanceUnknown: 'Distance unknown',
    nearYou: 'Near you',
    moderateDistance: 'Moderate distance',
    farLocation: 'Far location',
  },
  fr: {
    // Navbar
    home: 'Accueil',
    garage: 'Services Garage',
    spareParts: 'Pièces Détachées',
    towing: 'Dépannage',
    dashboard: 'Tableau de Bord',
    signIn: "Se Connecter / S'inscrire",
    signOut: 'Se Déconnecter',

    // Hero - Home Page
    heroTagline: "Réseau Automobile Premium d'Algérie",
    heroTitle1: 'Garages Experts',
    heroTitle2: 'À Votre Portée',
    heroSubtitle: "Trouvez des mécaniciens de confiance, électriciens automobiles, carrossiers, pièces détachées et services de dépannage 24h/24 partout en Algérie.",
    findGarage: 'Trouver un Garage',
    emergencyTowing: "Dépannage d'Urgence",

    // Services Grid - Home Page
    servicesTitle: 'Tout ce dont Votre Véhicule a Besoin',
    servicesSubtitle: "Nous avons simplifié le processus d'entretien de votre voiture. Choisissez une catégorie ci-dessous pour commencer.",
    garageServicesTitle: 'Services Garage',
    garageServicesDesc: 'Mécaniciens certifiés, électriciens et experts en carrosserie pour tous vos besoins de réparation.',
    browseGarages: 'Parcourir les Garages',
    sparePartsTitle: 'Pièces Détachées',
    sparePartsDesc: 'Pièces authentiques pour toutes les marques. Recherchez par nom de pièce ou modèle de véhicule.',
    findParts: 'Trouver des Pièces',
    roadsideTitle: 'Assistance Routière',
    roadsideDesc: "Bloqué sur la route ? Trouvez le service de dépannage le plus proche et obtenez de l'aide rapidement.",
    getHelpNow: "Obtenir de l'Aide",

    // Features Section - Home Page
    whyChooseTitle: 'Pourquoi Choisir SOS Auto DZ ?',
    smartGeoTitle: 'Géolocalisation Intelligente',
    smartGeoDesc: "Notre algorithme trouve les prestataires les plus proches de vous, vous faisant gagner du temps et de l'argent.",
    verifiedProsTitle: 'Professionnels Vérifiés',
    verifiedProsDesc: "Chaque mécanicien et atelier est vérifié pour garantir un service de qualité et la sécurité.",
    instantBookingTitle: 'Réservation Instantanée',
    instantBookingDesc: "Planifiez des rendez-vous directement via l'application sans interminables appels téléphoniques.",
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
    noResultsDesc: "Essayez d'ajuster vos filtres ou recherchez un autre mot-clé.",

    // Service Card
    openNow: 'Ouvert Maintenant',
    closedNow: 'Fermé Maintenant',
    closedToday: "Fermé Aujourd'hui",
    unavailable: 'Indisponible',
    hoursNotSet: 'Horaires non définis',
    everyDay: 'Tous les jours',
    satThu: 'Sam – Jeu',
    customSchedule: 'Horaires personnalisés',
    currentlyUnavailable: 'Actuellement indisponible',

    // Footer
    footerTagline: "La plateforme n°1 en Algérie pour connecter les propriétaires de véhicules avec des mécaniciens de confiance, des pièces détachées et des services de dépannage.",
    servicesFooter: 'Services',
    findMechanic: 'Services Garage',
    sparePartsShops: 'Magasins de Pièces Détachées',
    towingAssistance: 'Assistance au Dépannage',
    company: 'Entreprise',
    aboutUs: 'À Propos',
    forProfessionals: 'Pour les Professionnels',
    pricing: 'Tarifs',
    contact: 'Contact',
    allRightsReserved: 'Tous droits réservés.',
    privacyPolicy: 'Politique de Confidentialité',
    termsOfService: "Conditions d'Utilisation",

    // Language names
    english: 'English',
    french: 'Français',
    arabic: 'العربية',

    // ServicesPage filters
    allWilayas: 'Toutes les Wilayas',
    selectWilayaFirst: "Sélectionner d'abord une Wilaya",
    allCommunes: 'Toutes les Communes',
    allGarageTypes: 'Tous les Types de Garage',
    mechanicType: 'Mécanicien',
    electricianType: 'Électricien',
    autoBodyType: 'Carrosserie',
    searchCarBrand: 'Rechercher une Marque...',
    allBrands: 'Toutes les Marques',
    noBrandsFound: 'Aucune marque trouvée pour',
    loadingProviders: 'Chargement des prestataires...',

    // BookingModal
    bookService: 'Réserver un Service',
    scheduleWith: 'Prendre rendez-vous avec',
    fullName: 'Nom Complet',
    phoneNumber: 'Numéro de Téléphone',
    preferredDate: 'Date Souhaitée',
    problemDescription: 'Description du Problème',
    describeIssue: 'Décrivez le problème...',
    creatingBooking: 'Création en cours...',
    confirmBooking: 'Confirmer la Réservation',
    bookingConfirmed: 'Réservation Confirmée !',
    bookingConfirmedDesc: 'Votre demande a été envoyée. Ils vous contacteront bientôt.',
    close: 'Fermer',

    // Dashboard – header & sidebar
    dashboardTitle: 'Tableau de Bord',
    manageAccount: 'Gérez votre compte et vos services',
    overview: 'Aperçu',
    myBookings: 'Mes Réservations',
    requests: 'Demandes',
    settings: 'Paramètres',

    // Dashboard – Client overview
    activeBookings: 'Réservations Actives',
    completedServices: 'Services Terminés',
    recentActivity: 'Activité Récente',
    leaveReview: 'Laisser un Avis',

    // Review Modal
    reviewModalTitle: 'Laisser un Avis',
    reviewForProvider: 'Comment était votre expérience avec',
    yourRating: 'Votre Note',
    tapToRate: 'Appuyez sur une étoile pour noter',
    yourReview: 'Votre Avis',
    reviewPlaceholder: 'Parlez-nous de votre expérience (optionnel)...',
    submitReview: 'Envoyer l\'Avis',
    submittingReview: 'Envoi...',
    reviewSuccess: 'Merci ! Votre avis a été envoyé.',
    reviewAlreadyExists: 'Vous avez déjà donné un avis pour cette réservation.',
    reviewed: 'Avis donné',

    // Dashboard – Professional overview
    welcomePro: 'Bienvenue,',
    manageGarage: 'Gérez votre garage et les demandes entrantes.',
    online: 'En ligne',
    offline: 'Hors ligne',
    pendingRequests: 'Demandes en Attente',
    todaysJobs: 'Travaux du Jour',
    totalRevenue: 'Revenu Total',
    ratingLabel: 'Note',
    incomingRequests: 'Demandes Entrantes',
    viewAll: 'Voir Tout',
    noPendingRequests: 'Aucune demande en attente pour le moment.',
    issueLabel: 'Problème :',
    decline: 'Refuser',
    acceptJob: 'Accepter',

    // Dashboard – Admin overview
    adminTitle: 'Centre de Contrôle Admin',
    adminSubtitle: "Vue d'ensemble du système et gestion des utilisateurs.",
    totalUsers: 'Utilisateurs Totaux',
    verifiedProviders: 'Prestataires Vérifiés',
    pendingApprovals: 'Approbations en Attente',
    reports: 'Rapports',
    pendingProviderApprovals: 'Approbations de Prestataires en Attente',
    nameCol: 'Nom',
    typeCol: 'Type',
    wilayaCol: 'Wilaya',
    actionCol: 'Action',
    reviewAction: 'Examiner',

    // Dashboard – Bookings tab
    bookingHistory: 'Historique des Réservations',
    serviceRequests: 'Demandes de Service',
    noBookingsFound: 'Aucune réservation trouvée.',

    // Dashboard – Settings tab
    accountSettings: 'Paramètres du Compte',
    changeProfilePicture: 'Changer la photo de profil',
    changeShopPhoto: 'Changer la photo du commerce',
    shopPhotoDesc: 'Cette photo est affichée sur votre profil public et votre fiche de service.',
    emailLabel: 'E-mail',
    emailCannotChange: "L'adresse e-mail ne peut pas être modifiée.",
    phoneLabel: 'Téléphone',
    saving: 'Enregistrement...',
    saveChanges: 'Enregistrer',
    changesSaved: 'Modifications enregistrées !',
    saveFailed: "Échec de l'enregistrement.",
    changePassword: 'Changer le Mot de Passe',
    currentPassword: 'Mot de Passe Actuel',
    newPassword: 'Nouveau Mot de Passe',
    confirmNewPassword: 'Confirmer le Nouveau Mot de Passe',
    updatePassword: 'Mettre à Jour le Mot de Passe',

    // AuthModal – tabs & header
    signInTab: 'CONNEXION',
    signUpTab: 'INSCRIPTION',
    signInTitle: 'Se Connecter',
    createAccountTitle: 'Créer un Compte',
    welcomeBack: 'Bon Retour',
    joinTitle: 'Rejoindre SOS Auto DZ',
    signInSubtitle: 'Entrez vos identifiants pour accéder à votre compte',
    signUpSubtitle: 'Créez un compte pour vous connecter avec le meilleur réseau automobile en Algérie',

    // AuthModal – role selector
    iAmA: 'Je suis :',
    roleGarage: 'Garage',
    rolePartsShop: 'Pièces Détachées',
    roleTowing: 'Service de Dépannage',
    roleClient: 'Client',

    // AuthModal – common fields
    businessName: 'Nom du Commerce / Atelier',
    emailAddress: 'Adresse E-mail',
    password: 'Mot de Passe',

    // AuthModal – professional section
    businessDetails: 'Informations Professionnelles',
    garageType: 'Type de Garage',
    selectType: 'Sélectionner...',
    generalMechanic: 'Mécanicien Général',
    autoElectrician: 'Électricien Auto',
    autoBodyPaint: 'Carrosserie & Peinture',
    workSchedule: 'Horaires de Travail',
    startTime: 'Heure de Début',
    endTime: 'Heure de Fin',
    wilaya: 'Wilaya',
    commune: 'Commune',
    selectPlaceholder: 'Sélectionner...',
    description: 'Description',
    optional: 'Facultatif',
    descriptionPlaceholder: 'Décrivez brièvement vos services, horaires ou spécialités...',
    supportedBrands: 'Marques de Voitures Supportées',
    searchBrands: 'Rechercher des marques (ex. BMW, Toyota)...',
    selectAll: 'Tout Sélectionner',
    unselectAll: 'Tout Désélectionner',
    noBrandsFoundShort: 'Aucune marque trouvée.',
    brandsSelected: 'marques sélectionnées',

    // AuthModal – submit & links
    processing: 'Traitement...',
    forgotPassword: 'Mot de passe oublié ?',

    // Forgot / Reset Password flow
    forgotPasswordTitle: 'Réinitialiser le mot de passe',
    forgotPasswordSubtitle: 'Entrez votre email et nous vous enverrons un lien de réinitialisation.',
    sendResetLink: 'Envoyer le lien',
    sendingResetLink: 'Envoi...',
    resetLinkSent: 'Vérifiez votre email',
    resetLinkSentDesc: 'Si un compte avec cet email existe, nous avons envoyé un lien de réinitialisation. Vérifiez votre boîte de réception (et les spams).',
    backToLogin: 'Retour à la connexion',
    resetPasswordTitle: 'Nouveau mot de passe',
    resetPasswordSubtitle: 'Entrez votre nouveau mot de passe ci-dessous.',
    newPassword: 'Nouveau mot de passe',
    confirmNewPassword: 'Confirmer le mot de passe',
    resetPassword: 'Réinitialiser',
    resettingPassword: 'Réinitialisation...',
    passwordResetSuccess: 'Mot de passe réinitialisé !',
    passwordResetSuccessDesc: 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
    passwordsDoNotMatch: 'Les mots de passe ne correspondent pas.',
    passwordMinLength: 'Le mot de passe doit contenir au moins 6 caractères.',

    // Email Verification
    verifyEmailTitle: 'Vérifiez votre email',
    verifyEmailSentTitle: 'Consultez votre email',
    verifyEmailSentDesc: 'Nous avons envoyé un lien de vérification à votre adresse email. Veuillez consulter votre boîte de réception et cliquer sur le lien pour vérifier votre compte.',
    verifyEmailResend: 'Renvoyer l\'email de vérification',
    verifyEmailResending: 'Envoi...',
    verifyEmailResent: 'Email de vérification envoyé !',
    verifyEmailVerifying: 'Vérification de votre email...',
    verifyEmailSuccess: 'Email vérifié !',
    verifyEmailSuccessDesc: 'Votre email a été vérifié avec succès. Vous pouvez maintenant vous connecter à votre compte.',
    verifyEmailFailed: 'Échec de la vérification',
    verifyEmailExpired: 'Ce lien de vérification est invalide ou a expiré. Veuillez en demander un nouveau.',
    goToLogin: 'Aller à la connexion',

    // Provider Profile
    providerProfile: 'Profil du prestataire',
    contactInfo: 'Coordonnées',
    workingSchedule: 'Horaires de travail',
    customerReviews: 'Avis des clients',
    noReviewsYet: 'Aucun avis pour le moment. Soyez le premier à laisser un avis !',
    specialties: 'Spécialités',
    viewProfile: 'Voir le profil',
    backToList: 'Retour à la liste',
    providerNotFound: 'Prestataire introuvable',
    dayNames: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],

    // Map
    mapView: 'Vue carte',
    listView: 'Vue liste',
    showOnMap: 'Voir sur la carte',

    // NotificationDropdown
    notifications: 'Notifications',
    clearAll: 'Tout effacer',
    noNewNotifications: 'Aucune nouvelle notification',
    markAsRead: 'Marquer comme lu',

    // DistanceIndicator
    distanceUnknown: 'Distance inconnue',
    nearYou: 'Près de vous',
    moderateDistance: 'Distance moyenne',
    farLocation: 'Emplacement éloigné',
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
    searchAllProviders: 'ابحث عن ميكانيكيين، قطع غيار، سحب...',
    searchResults: 'نتائج البحث',
    allServices: 'جميع مقدمي الخدمات عبر الجزائر',

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
    hoursNotSet: 'لم يتم تحديد الأوقات',
    everyDay: 'كل يوم',
    satThu: 'السبت – الخميس',
    customSchedule: 'جدول مخصص',
    currentlyUnavailable: 'غير متاح حاليًا',

    // Footer
    footerTagline: 'المنصة رقم 1 في الجزائر لربط أصحاب السيارات بالميكانيكيين الموثوقين وقطع الغيار وخدمات السحب.',
    servicesFooter: 'الخدمات',
    findMechanic: 'خدمات الكراج',
    sparePartsShops: 'محلات قطع الغيار',
    towingAssistance: 'المساعدة في السحب',
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

    // ServicesPage filters
    allWilayas: 'جميع الولايات',
    selectWilayaFirst: 'اختر الولاية أولاً',
    allCommunes: 'جميع البلديات',
    allGarageTypes: 'جميع أنواع الكراجات',
    mechanicType: 'ميكانيكي',
    electricianType: 'كهربائي',
    autoBodyType: 'هيكل السيارة',
    searchCarBrand: 'ابحث عن ماركة السيارة...',
    allBrands: 'جميع الماركات',
    noBrandsFound: 'لا توجد ماركات تطابق',
    loadingProviders: 'جارٍ تحميل مقدمي الخدمة...',

    // BookingModal
    bookService: 'حجز خدمة',
    scheduleWith: 'حدد موعدًا مع',
    fullName: 'الاسم الكامل',
    phoneNumber: 'رقم الهاتف',
    preferredDate: 'التاريخ المفضل',
    problemDescription: 'وصف المشكلة',
    describeIssue: 'صف المشكلة...',
    creatingBooking: 'جارٍ إنشاء الحجز...',
    confirmBooking: 'تأكيد الحجز',
    bookingConfirmed: 'تم تأكيد الحجز!',
    bookingConfirmedDesc: 'تم إرسال طلبك. سيتصلون بك قريبًا.',
    close: 'إغلاق',

    // Dashboard – header & sidebar
    dashboardTitle: 'لوحة التحكم',
    manageAccount: 'أدر حسابك وخدماتك',
    overview: 'نظرة عامة',
    myBookings: 'حجوزاتي',
    requests: 'الطلبات',
    settings: 'الإعدادات',

    // Dashboard – Client overview
    activeBookings: 'الحجوزات النشطة',
    completedServices: 'الخدمات المنجزة',
    recentActivity: 'النشاط الأخير',
    leaveReview: 'اترك تقييمًا',

    // Review Modal
    reviewModalTitle: 'اترك تقييمًا',
    reviewForProvider: 'كيف كانت تجربتك مع',
    yourRating: 'تقييمك',
    tapToRate: 'اضغط على نجمة للتقييم',
    yourReview: 'مراجعتك',
    reviewPlaceholder: 'أخبرنا عن تجربتك (اختياري)...',
    submitReview: 'إرسال التقييم',
    submittingReview: 'جارٍ الإرسال...',
    reviewSuccess: 'شكرًا! تم إرسال تقييمك.',
    reviewAlreadyExists: 'لقد قمت بتقييم هذا الحجز مسبقًا.',
    reviewed: 'تم التقييم',

    // Dashboard – Professional overview
    welcomePro: 'مرحبًا،',
    manageGarage: 'أدر كراجك وطلباتك الواردة.',
    online: 'متصل',
    offline: 'غير متصل',
    pendingRequests: 'الطلبات المعلقة',
    todaysJobs: 'أعمال اليوم',
    totalRevenue: 'إجمالي الإيرادات',
    ratingLabel: 'التقييم',
    incomingRequests: 'الطلبات الواردة',
    viewAll: 'عرض الكل',
    noPendingRequests: 'لا توجد طلبات معلقة في الوقت الحالي.',
    issueLabel: 'المشكلة:',
    decline: 'رفض',
    acceptJob: 'قبول العمل',

    // Dashboard – Admin overview
    adminTitle: 'مركز تحكم المدير',
    adminSubtitle: 'نظرة عامة على النظام وإدارة المستخدمين.',
    totalUsers: 'إجمالي المستخدمين',
    verifiedProviders: 'مقدمو الخدمة الموثقون',
    pendingApprovals: 'الموافقات المعلقة',
    reports: 'التقارير',
    pendingProviderApprovals: 'موافقات مقدمي الخدمة المعلقة',
    nameCol: 'الاسم',
    typeCol: 'النوع',
    wilayaCol: 'الولاية',
    actionCol: 'الإجراء',
    reviewAction: 'مراجعة',

    // Dashboard – Bookings tab
    bookingHistory: 'سجل الحجوزات',
    serviceRequests: 'طلبات الخدمة',
    noBookingsFound: 'لا توجد حجوزات.',

    // Dashboard – Settings tab
    accountSettings: 'إعدادات الحساب',
    changeProfilePicture: 'تغيير صورة الملف الشخصي',
    changeShopPhoto: 'تغيير صورة المحل',
    shopPhotoDesc: 'تظهر هذه الصورة في ملفك العام وبطاقة الخدمة.',
    emailLabel: 'البريد الإلكتروني',
    emailCannotChange: 'لا يمكن تغيير عنوان البريد الإلكتروني.',
    phoneLabel: 'الهاتف',
    saving: 'جارٍ الحفظ...',
    saveChanges: 'حفظ التغييرات',
    changesSaved: 'تم حفظ التغييرات بنجاح!',
    saveFailed: 'فشل حفظ التغييرات.',
    changePassword: 'تغيير كلمة المرور',
    currentPassword: 'كلمة المرور الحالية',
    newPassword: 'كلمة المرور الجديدة',
    confirmNewPassword: 'تأكيد كلمة المرور الجديدة',
    updatePassword: 'تحديث كلمة المرور',

    // AuthModal – tabs & header
    signInTab: 'تسجيل الدخول',
    signUpTab: 'إنشاء حساب',
    signInTitle: 'تسجيل الدخول',
    createAccountTitle: 'إنشاء حساب',
    welcomeBack: 'مرحبًا بعودتك',
    joinTitle: 'انضم إلى SOS Auto DZ',
    signInSubtitle: 'أدخل بيانات اعتمادك للوصول إلى حسابك',
    signUpSubtitle: 'أنشئ حسابًا للتواصل مع أفضل شبكة سيارات في الجزائر',

    // AuthModal – role selector
    iAmA: 'أنا:',
    roleGarage: 'كراج',
    rolePartsShop: 'محل قطع غيار',
    roleTowing: 'خدمة السحب',
    roleClient: 'عميل',

    // AuthModal – common fields
    businessName: 'اسم المشروع / المحل',
    emailAddress: 'عنوان البريد الإلكتروني',
    password: 'كلمة المرور',

    // AuthModal – professional section
    businessDetails: 'تفاصيل العمل',
    garageType: 'نوع الكراج',
    selectType: 'اختر النوع...',
    generalMechanic: 'ميكانيكي عام',
    autoElectrician: 'كهربائي سيارات',
    autoBodyPaint: 'هيكل وطلاء',
    workSchedule: 'جدول العمل',
    startTime: 'وقت البداية',
    endTime: 'وقت النهاية',
    wilaya: 'الولاية',
    commune: 'البلدية',
    selectPlaceholder: 'اختر...',
    description: 'الوصف',
    optional: 'اختياري',
    descriptionPlaceholder: 'صف خدماتك وأوقاتك أو تخصصاتك باختصار...',
    supportedBrands: 'ماركات السيارات المدعومة',
    searchBrands: 'ابحث عن ماركات (مثل BMW، Toyota)...',
    selectAll: 'تحديد الكل',
    unselectAll: 'إلغاء تحديد الكل',
    noBrandsFoundShort: 'لا توجد ماركات.',
    brandsSelected: 'ماركة مختارة',

    // AuthModal – submit & links
    processing: 'جارٍ المعالجة...',
    forgotPassword: 'نسيت كلمة المرور؟',

    // Forgot / Reset Password flow
    forgotPasswordTitle: 'إعادة تعيين كلمة المرور',
    forgotPasswordSubtitle: 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.',
    sendResetLink: 'إرسال رابط التعيين',
    sendingResetLink: 'جارٍ الإرسال...',
    resetLinkSent: 'تحقق من بريدك',
    resetLinkSentDesc: 'إذا كان هناك حساب بهذا البريد، فقد أرسلنا رابط إعادة التعيين. تحقق من صندوق الوارد (ومجلد الرسائل غير المرغوبة).',
    backToLogin: 'العودة لتسجيل الدخول',
    resetPasswordTitle: 'كلمة مرور جديدة',
    resetPasswordSubtitle: 'أدخل كلمة المرور الجديدة أدناه.',
    newPassword: 'كلمة المرور الجديدة',
    confirmNewPassword: 'تأكيد كلمة المرور',
    resetPassword: 'إعادة التعيين',
    resettingPassword: 'جارٍ إعادة التعيين...',
    passwordResetSuccess: 'تم إعادة التعيين!',
    passwordResetSuccessDesc: 'تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.',
    passwordsDoNotMatch: 'كلمات المرور غير متطابقة.',
    passwordMinLength: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.',

    // Email Verification
    verifyEmailTitle: 'تحقق من بريدك الإلكتروني',
    verifyEmailSentTitle: 'تحقق من بريدك',
    verifyEmailSentDesc: 'لقد أرسلنا رابط التحقق إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد والنقر على الرابط لتأكيد حسابك.',
    verifyEmailResend: 'إعادة إرسال بريد التحقق',
    verifyEmailResending: 'جارٍ الإرسال...',
    verifyEmailResent: 'تم إرسال بريد التحقق!',
    verifyEmailVerifying: 'جارٍ التحقق من بريدك الإلكتروني...',
    verifyEmailSuccess: 'تم التحقق من البريد!',
    verifyEmailSuccessDesc: 'تم التحقق من بريدك الإلكتروني بنجاح. يمكنك الآن تسجيل الدخول إلى حسابك.',
    verifyEmailFailed: 'فشل التحقق',
    verifyEmailExpired: 'رابط التحقق هذا غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.',
    goToLogin: 'الذهاب لتسجيل الدخول',

    // Provider Profile
    providerProfile: 'ملف مقدم الخدمة',
    contactInfo: 'معلومات الاتصال',
    workingSchedule: 'جدول العمل',
    customerReviews: 'آراء العملاء',
    noReviewsYet: 'لا توجد تقييمات بعد. كن أول من يترك تقييماً!',
    specialties: 'التخصصات',
    viewProfile: 'عرض الملف',
    backToList: 'العودة للقائمة',
    providerNotFound: 'مقدم الخدمة غير موجود',
    dayNames: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],

    // Map
    mapView: 'عرض الخريطة',
    listView: 'عرض القائمة',
    showOnMap: 'عرض على الخريطة',

    // NotificationDropdown
    notifications: 'الإشعارات',
    clearAll: 'مسح الكل',
    noNewNotifications: 'لا توجد إشعارات جديدة',
    markAsRead: 'وضع علامة كمقروء',

    // DistanceIndicator
    distanceUnknown: 'المسافة غير معروفة',
    nearYou: 'بالقرب منك',
    moderateDistance: 'مسافة متوسطة',
    farLocation: 'موقع بعيد',
  },
};
