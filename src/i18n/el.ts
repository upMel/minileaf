// Greek dictionary — the app's default locale.
// Typed as `Dictionary`, so a missing or misspelled key fails the build.

import type { Dictionary } from "./en";

const el: Dictionary = {
  language: {
    label: "Γλώσσα",
    el: "Ελληνικά",
    en: "English",
    switchTo: (name: string) => `Αλλαγή σε ${name}`,
  },

  common: {
    save: "Αποθήκευση",
    saving: "Αποθήκευση…",
    cancel: "Ακύρωση",
    delete: "Διαγραφή",
    deleting: "Διαγραφή…",
    rename: "Μετονομασία",
    add: "Προσθήκη",
    adding: "Προσθήκη…",
    edit: "Επεξεργασία",
    close: "Κλείσιμο",
    clear: "Καθαρισμός",
    clearAll: "Καθαρισμός όλων",
    refresh: "Ανανέωση",
    loading: "Φόρτωση…",
    tryAgain: "Δοκιμάστε ξανά",
    done: "Τέλος",
    optional: "Προαιρετικό",
    active: "Ενεργό",
    inactive: "Ανενεργό",
    activate: "Ενεργοποίηση",
    deactivate: "Απενεργοποίηση",
    all: "Όλα",
    none: "Καμία",
    prev: "← Προηγ.",
    next: "Επόμ. →",
    expand: "Ανάπτυξη",
    collapse: "Σύμπτυξη",
    somethingWentWrong: "Κάτι πήγε στραβά",
    unexpectedError: "Παρουσιάστηκε απροσδόκητο σφάλμα.",
    cannotBeUndone: "Η ενέργεια δεν μπορεί να αναιρεθεί.",
  },

  nav: {
    admin: "Διαχείριση",
    adminPanel: "Πίνακας διαχείρισης",
    backToStore: "Πίσω στο κατάστημα",
    back: "Πίσω",
    signOut: "Αποσύνδεση",
    signOutShort: "Έξοδος",
    owner: "Ιδιοκτήτης",
    products: "Προϊόντα",
    categories: "Κατηγορίες",
    layouts: "Διατάξεις",
    toggleMenu: "Εναλλαγή μενού",
  },

  home: {
    todaysDeals: "Σημερινές προσφορές",
  },

  viewTabs: {
    category: "Κατηγορίες",
    leaflet: "Φυλλάδιο",
    list: "Λίστα",
  },

  search: {
    placeholderProducts: "Αναζήτηση προϊόντων…",
    placeholderProductsOrCategories: "Αναζήτηση προϊόντων ή κατηγοριών…",
    categories: "Κατηγορίες",
    categoryCount: (n: number) => (n === 1 ? "1 κατηγορία" : `${n} κατηγορίες`),
    noCategories: "Χωρίς κατηγορίες",
    onSale: "Σε προσφορά",
    min: "Ελάχ.",
    max: "Μέγ.",
    clearSearch: "Καθαρισμός αναζήτησης",
  },

  units: {
    kg: "κιλό",
    piece: "τεμ.",
    perKg: "ανά κιλό",
    perPiece: "ανά τεμάχιο",
  },

  productDetail: {
    viewDetails: "Λεπτομέρειες",
    description: "Περιγραφή",
    noDescription: "Δεν υπάρχει διαθέσιμη περιγραφή για αυτό το προϊόν.",
    category: "Κατηγορία",
    price: "Τιμή",
    regularPrice: "Κανονική τιμή",
    pricedPerKg: "Τιμή ανά κιλό",
    pricedPerPiece: "Τιμή ανά τεμάχιο",
    competitorAt: (name: string) => `Στο ${name}`,
    offer: "Προσφορά",
    youSave: (amount: string) => `Κερδίζετε ${amount}`,
  },

  deals: {
    countOf: (shown: number, total: number) => `${shown} από ${total} προσφορές`,
    noMatch: "Καμία προσφορά δεν ταιριάζει με τα φίλτρα σας.",
    other: "Άλλα",
    competitor: "Ανταγωνιστής",
    at: (name: string) => `στο ${name}`,
  },

  leaflet: {
    noActiveLeaflet: "Κανένα ενεργό φυλλάδιο",
    noActiveLeafletHint:
      "Δημιουργήστε και ενεργοποιήστε μια διάταξη στον πίνακα διαχείρισης",
    landscape: "Οριζόντιο",
    portrait: "Κατακόρυφο",
    fullscreen: "Πλήρης οθόνη",
    exitFullscreen: "Έξοδος από πλήρη οθόνη",
    previousPage: "Προηγούμενη σελίδα",
    nextPage: "Επόμενη σελίδα",
    page: (n: number) => `Σελίδα ${n}`,
  },

  auth: {
    email: "Email",
    password: "Κωδικός πρόσβασης",
    signIn: "Σύνδεση",
    signingIn: "Σύνδεση…",
    checkingSession: "Έλεγχος συνεδρίας…",
    notConfigured:
      "Το Supabase δεν έχει ρυθμιστεί. Προσθέστε μεταβλητές περιβάλλοντος στο",
    notAdminPrefix: "Συνδεθήκατε ως",
    notAdminSuffix: ", αλλά αυτός ο χρήστης δεν είναι διαχειριστής.",
    unknownEmail: "(άγνωστο)",
    supabaseNotConfigured: "Το Supabase δεν έχει ρυθμιστεί.",
  },

  categories: {
    title: "Κατηγορίες",
    confirmDeleteAll: "Διαγραφή όλων των κατηγοριών;",
    yesClearAll: "Ναι, διαγραφή όλων",
    clearing: "Διαγραφή…",
    syncFromSource: "Συγχρονισμός από e-katanalotis",
    syncing: "Συγχρονισμός…",
    clearFailed: "Η διαγραφή απέτυχε",
    syncFailed: "Ο συγχρονισμός απέτυχε",
    synced: (top: number, sub: number) =>
      `Συγχρονίστηκαν ${top} κατηγορίες και ${sub} υποκατηγορίες.`,
    relinked: (n: number) =>
      ` Επανασυνδέθηκαν ${n} ${n !== 1 ? "προϊόντα" : "προϊόν"}.`,
    namePlaceholder: "Όνομα κατηγορίας",
    rootCategory: "Κύρια κατηγορία",
    rootHint:
      "Δεν επιλέχθηκε γονική κατηγορία — θα προστεθεί ως κύρια κατηγορία.",
    empty:
      "Δεν υπάρχουν κατηγορίες ακόμη. Προσθέστε μία παραπάνω ή συγχρονίστε από το e-katanalotis.",
  },

  products: {
    allProducts: "Όλα τα προϊόντα",
    new: "+ Νέο",
    countOf: (shown: number, total: number) => `${shown} από ${total} προϊόντα`,
    empty: "Δεν βρέθηκαν προϊόντα.",
    competitor: "Ανταγωνιστής",
    promo: "Προσφορά",
    pageOf: (current: number, total: number, count: number) =>
      `Σελίδα ${current} από ${total} · ${count} προϊόντα`,
  },

  productForm: {
    editProduct: "Επεξεργασία προϊόντος",
    newProduct: "Νέο προϊόν",
    products: "Προϊόντα",
    new: "Νέο",
    barcode: "Barcode",
    category: "Κατηγορία",
    selectPlaceholder: "— επιλέξτε —",
    allSuffix: (name: string) => `${name} (όλα)`,
    name: "Όνομα",
    description: "Περιγραφή",
    descriptionPlaceholder: "Προαιρετικό — εμφανίζεται στους πελάτες στις λεπτομέρειες του προϊόντος",
    supplier: "Προμηθευτής",
    price: "Τιμή",
    pricedPer: "Τιμή ανά",
    perPiece: "Τεμάχιο",
    perKg: "Κιλό",
    competitorName: "Όνομα ανταγωνιστή",
    competitorPrice: "Τιμή ανταγωνιστή",
    image: "Εικόνα",
    pasteImageUrl: "Επικολλήστε URL εικόνας…",
    uploadPhoto: "Μεταφόρτωση φωτογραφίας",
    uploading: "Μεταφόρτωση…",
    takePhoto: "Λήψη φωτογραφίας",
    uploadFailed: "Η μεταφόρτωση απέτυχε.",
    imageUnavailable: "Η εικόνα δεν είναι διαθέσιμη",

    promotion: "Προσφορά",
    type: "Τύπος",
    percentDiscount: "Ποσοστιαία έκπτωση",
    promoPrice: "Τιμή προσφοράς",
    bogo: "1+1",
    percentOff: "Ποσοστό έκπτωσης",
    dateWindow: "Χρονικό διάστημα",
    label: "Ετικέτα",
    labelPlaceholder: "Προαιρετικό (π.χ. -30%, 1+1)",
    promotionActive: "Ενεργή προσφορά",

    competitorLookup: "Αναζήτηση τιμών ανταγωνισμού",
    lookupHintPrefix: "Αναζητά το πεδίο",
    lookupHintSuffix:
      "παραπάνω σε 11 ελληνικά σούπερ μάρκετ (e-katanalotis.gov.gr). Τα δεδομένα ανανεώνονται καθημερινά.",
    lookUpBarcode: "Αναζήτηση barcode",
    lookingUp: "Αναζήτηση…",
    noPricesFound: "Δεν βρέθηκαν τιμές ανταγωνιστών για αυτό το barcode.",
    lookupFailed: "Η αναζήτηση απέτυχε. Δοκιμάστε ξανά.",
    foundOnSource: "Βρέθηκε στο e-katanalotis",
    nameLabel: "Όνομα: ",
    categoryLabel: "Κατηγορία: ",
    applyFromLookup: "Εφαρμογή ονόματος, κατηγορίας & εικόνας →",
    supermarket: "Σούπερ μάρκετ",
    use: "Χρήση",
  },

  deleteModal: {
    title: "Διαγραφή προϊόντος;",
    aboutToDeletePrefix: "Πρόκειται να διαγράψετε οριστικά το",
    tipPrefix: "Συμβουλή: Αν ίσως το χρειαστείτε αργότερα, επιλέξτε",
    tipSuffix:
      "αντ' αυτού — αφαιρείται από το φυλλάδιο χωρίς να χαθεί το προϊόν.",
  },

  layouts: {
    title: "Διατάξεις φυλλαδίου",
    newLayout: "Νέα διάταξη",
    namePlaceholder: "π.χ. Προσφορές Εβδομάδας 20",
    landscapeRatio: "Οριζόντιο (16:9)",
    portraitRatio: "Κατακόρυφο (A4)",
    creating: "Δημιουργία…",
    create: "Δημιουργία",
    empty: "Δεν υπάρχουν διατάξεις ακόμη. Δημιουργήστε μία παραπάνω.",
    setActive: "Ορισμός ως ενεργή",
    deleteTitle: (name: string) => `Διαγραφή «${name}»;`,
    deleteLayout: "Διαγραφή διάταξης",

    allLayouts: "Όλες οι διατάξεις",
    notFound: "Η διάταξη δεν βρέθηκε.",
    settings: "Ρυθμίσεις διάταξης",
    name: "Όνομα",
    orientation: "Προσανατολισμός",
    pagesCount: (n: number) => `Σελίδες (${n})`,
    addPage: "Προσθήκη σελίδας",
    noPages: "Δεν υπάρχουν σελίδες ακόμη. Προσθέστε την πρώτη σας σελίδα παραπάνω.",
    page: (n: number) => `Σελίδα ${n}`,
    saved: "Αποθηκεύτηκε",
    savePage: "Αποθήκευση σελίδας",
    template: "Πρότυπο",
    pinProducts: "Καρφίτσωμα προϊόντων στις θέσεις",
    movePageUp: "Μετακίνηση σελίδας πάνω",
    movePageDown: "Μετακίνηση σελίδας κάτω",
    deletePage: "Διαγραφή σελίδας",
    deletePageTitle: "Διαγραφή αυτής της σελίδας;",
    deletePageDescription:
      "Η ενέργεια δεν μπορεί να αναιρεθεί. Όλες οι αναθέσεις θέσεων σε αυτή τη σελίδα θα χαθούν.",
    deletePageConfirm: "Διαγραφή σελίδας",

    autoFill: "— αυτόματη συμπλήρωση —",
    searchProducts: "Αναζήτηση προϊόντων...",
    noResultsFor: (q: string) => `Κανένα αποτέλεσμα για «${q}»`,
    roleHero: "Κύριο",
    roleFeatured: "Προβεβλημένο",
    roleSmall: "Μικρό",
  },

  templates: {
    "weekly-special": {
      name: "Εβδομαδιαία Προσφορά",
      description: "1 μεγάλο κύριο + 4 προβεβλημένα + 4 μικρά προϊόντα",
    },
    "banner-strip": {
      name: "Λωρίδα Banner",
      description: "Banner πλήρους πλάτους + 4 προβεβλημένα + 4 μικρά",
    },
    "twin-heroes": {
      name: "Δίδυμα Κύρια",
      description: "2 μεγάλα κύρια δίπλα-δίπλα + 4 μικρά",
    },
    spotlight: {
      name: "Προβολή",
      description: "Κυρίαρχο κύριο 3 στηλών + ψηλό προβεβλημένο + 4 μικρά",
    },
    "two-rows": {
      name: "Δύο Σειρές",
      description: "4 προβεβλημένα + 4 μικρά προϊόντα",
    },
    "wide-banner": {
      name: "Πλατύ Banner",
      description: "Κύριο πλήρους πλάτους 2 σειρών + 4 προβεβλημένα",
    },
    magazine: {
      name: "Περιοδικό",
      description: "Κύριο + 2 πλατιές λωρίδες προβεβλημένων + 4 μικρά",
    },
    stacked: {
      name: "Στοιβαγμένο",
      description: "Κύριο πλήρους πλάτους + 2 πλατιά προβεβλημένα + 4 μικρά",
    },
    "compact-grid": {
      name: "Συμπαγές Πλέγμα",
      description: "12 ίσα κελιά προϊόντων — καθαρό πλέγμα",
    },
    "feature-wall": {
      name: "Τοίχος Προβολής",
      description: "Κύριο + 8 προβεβλημένα προϊόντα",
    },
  },

  layoutConfig: {
    title: "Διάταξη αρχικής σελίδας",
    description:
      "Επιλέξτε ένα πρότυπο και καρφιτσώστε συγκεκριμένα προϊόντα σε θέσεις προβολής. Οι θέσεις που δεν καρφιτσώνονται συμπληρώνονται αυτόματα με τα προϊόντα με τη μεγαλύτερη έκπτωση.",
    step1: "1 — Επιλέξτε πρότυπο",
    step2: "2 — Καρφιτσώστε προϊόντα στις θέσεις",
    autoFillHintPrefix: "Αφήστε μια θέση σε",
    autoFillHintEm: "αυτόματη συμπλήρωση",
    autoFillHintSuffix:
      "για να γεμίσει αυτόματα με τα ενεργά προϊόντα που έχουν τη μεγαλύτερη έκπτωση.",
    saveAndGoLive: "Αποθήκευση & δημοσίευση",
    live: "Η διάταξη είναι ενεργή",
    saveFailed: "Η αποθήκευση απέτυχε. Δοκιμάστε ξανά.",
  },

  errors: {
    priceRequired: "Η τιμή είναι υποχρεωτική.",
    competitorPriceNumber: "Η τιμή ανταγωνιστή πρέπει να είναι αριθμός.",
    nameRequired: "Το όνομα είναι υποχρεωτικό.",
    failedToSaveProduct: "Η αποθήκευση του προϊόντος απέτυχε.",
    promoStartInvalid: "Η ημερομηνία έναρξης της προσφοράς δεν είναι έγκυρη.",
    promoEndInvalid: "Η ημερομηνία λήξης της προσφοράς δεν είναι έγκυρη.",
    percentOffRange: "Το ποσοστό έκπτωσης πρέπει να είναι αριθμός μεταξύ 0 και 100.",
    promoPriceRequired: "Η τιμή προσφοράς είναι υποχρεωτική.",
    failedToLoadCategories: "Η φόρτωση των κατηγοριών απέτυχε.",
    failedToLoadProducts: "Η φόρτωση των προϊόντων απέτυχε.",
    fileMustBeImage: "Το αρχείο πρέπει να είναι εικόνα.",
    imageTooLarge: "Η εικόνα πρέπει να είναι μικρότερη από 8MB.",
  },
};

export default el;
