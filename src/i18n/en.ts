// English dictionary. This file is the source of truth for the dictionary
// *shape* — `Dictionary` is derived from it, so every other locale is
// compile-time checked against these keys.
//
// Values that need runtime data are plain functions rather than "{placeholder}"
// strings, so interpolation is type-checked too.

const en = {
  // ── Language switcher ──
  language: {
    label: "Language",
    el: "Ελληνικά",
    en: "English",
    switchTo: (name: string) => `Switch to ${name}`,
  },

  // ── Generic, reused everywhere ──
  common: {
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    delete: "Delete",
    deleting: "Deleting…",
    rename: "Rename",
    add: "Add",
    adding: "Adding…",
    edit: "Edit",
    close: "Close",
    clear: "Clear",
    clearAll: "Clear all",
    refresh: "Refresh",
    loading: "Loading…",
    tryAgain: "Try again",
    done: "Done",
    optional: "Optional",
    active: "Active",
    inactive: "Inactive",
    activate: "Activate",
    deactivate: "Deactivate",
    all: "All",
    none: "None",
    prev: "← Prev",
    next: "Next →",
    expand: "Expand",
    collapse: "Collapse",
    somethingWentWrong: "Something went wrong",
    unexpectedError: "An unexpected error occurred.",
    cannotBeUndone: "This action cannot be undone.",
  },

  // ── App shell / navigation ──
  nav: {
    admin: "Admin",
    adminPanel: "Admin Panel",
    backToStore: "Back to store",
    back: "Back",
    signOut: "Sign out",
    signOutShort: "Out",
    owner: "Owner",
    products: "Products",
    categories: "Categories",
    layouts: "Layouts",
    toggleMenu: "Toggle menu",
  },

  // ── Storefront ──
  home: {
    todaysDeals: "Today's deals",
  },

  viewTabs: {
    category: "Categories",
    leaflet: "Leaflet",
    list: "List",
  },

  // ── Search / filter bar ──
  search: {
    placeholderProducts: "Search products…",
    placeholderProductsOrCategories: "Search products or categories…",
    categories: "Categories",
    categoryCount: (n: number) => (n === 1 ? "1 category" : `${n} categories`),
    noCategories: "No categories",
    onSale: "On sale",
    min: "Min",
    max: "Max",
    clearSearch: "Clear search",
  },

  // ── Pricing units ──
  units: {
    kg: "kg",
    piece: "pc",
    perKg: "per kilogram",
    perPiece: "per piece",
  },

  // ── Storefront: product detail modal ──
  productDetail: {
    viewDetails: "View details",
    description: "Description",
    noDescription: "No description available for this product.",
    category: "Category",
    price: "Price",
    regularPrice: "Regular price",
    pricedPerKg: "Priced per kilogram",
    pricedPerPiece: "Priced per piece",
    competitorAt: (name: string) => `At ${name}`,
    offer: "Offer",
    youSave: (amount: string) => `You save ${amount}`,
  },

  // ── Deals grid (storefront) ──
  deals: {
    countOf: (shown: number, total: number) => `${shown} of ${total} deals`,
    noMatch: "No deals match your filters.",
    other: "Other",
    competitor: "Competitor",
    at: (name: string) => `at ${name}`,
  },

  // ── Leaflet viewer ──
  leaflet: {
    noActiveLeaflet: "No active leaflet",
    noActiveLeafletHint: "Create and activate a layout in the admin panel",
    landscape: "Landscape",
    portrait: "Portrait",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen",
    previousPage: "Previous page",
    nextPage: "Next page",
    page: (n: number) => `Page ${n}`,
  },

  // ── Sign in / auth ──
  auth: {
    email: "Email",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in…",
    checkingSession: "Checking session…",
    notConfigured: "Supabase is not configured. Add env vars in",
    notAdminPrefix: "Signed in as",
    notAdminSuffix: ", but this user is not an admin.",
    unknownEmail: "(unknown)",
    supabaseNotConfigured: "Supabase not configured.",
  },

  // ── Admin: categories ──
  categories: {
    title: "Categories",
    confirmDeleteAll: "Delete all categories?",
    yesClearAll: "Yes, clear all",
    clearing: "Clearing…",
    syncFromSource: "Sync from e-katanalotis",
    syncing: "Syncing…",
    clearFailed: "Clear failed",
    syncFailed: "Sync failed",
    synced: (top: number, sub: number) =>
      `Synced ${top} categories and ${sub} subcategories.`,
    relinked: (n: number) => ` Re-linked ${n} product${n !== 1 ? "s" : ""}.`,
    namePlaceholder: "Category name",
    rootCategory: "Root category",
    rootHint: "No parent selected — will be added as a root category.",
    empty: "No categories yet. Add one above or sync from e-katanalotis.",
  },

  // ── Admin: product list ──
  products: {
    allProducts: "All products",
    new: "+ New",
    countOf: (shown: number, total: number) => `${shown} of ${total} products`,
    empty: "No products found.",
    competitor: "Competitor",
    promo: "Promo",
    pageOf: (current: number, total: number, count: number) =>
      `Page ${current} of ${total} · ${count} products`,
  },

  // ── Admin: product form ──
  productForm: {
    editProduct: "Edit product",
    newProduct: "New product",
    products: "Products",
    new: "New",
    barcode: "Barcode",
    category: "Category",
    selectPlaceholder: "— select —",
    allSuffix: (name: string) => `${name} (all)`,
    name: "Name",
    description: "Description",
    descriptionPlaceholder: "Optional — shown to customers in the product details",
    supplier: "Supplier",
    price: "Price",
    pricedPer: "Priced per",
    perPiece: "Piece",
    perKg: "Kilogram",
    competitorName: "Competitor name",
    competitorPrice: "Competitor price",
    image: "Image",
    pasteImageUrl: "Paste image URL…",
    uploadPhoto: "Upload photo",
    uploading: "Uploading…",
    takePhoto: "Take photo",
    uploadFailed: "Upload failed.",
    imageUnavailable: "Image unavailable",

    promotion: "Promotion",
    type: "Type",
    percentDiscount: "Percent discount",
    promoPrice: "Promo price",
    bogo: "BOGO (1+1)",
    percentOff: "Percent off",
    dateWindow: "Date window",
    label: "Label",
    labelPlaceholder: "Optional (e.g. -30%, 1+1)",
    promotionActive: "Promotion active",

    competitorLookup: "Competitor price lookup",
    lookupHintPrefix: "Looks up the",
    lookupHintSuffix:
      "field above across 11 Greek supermarkets (e-katanalotis.gov.gr). Data is refreshed daily.",
    lookUpBarcode: "Look up barcode",
    lookingUp: "Looking up…",
    noPricesFound: "No competitor prices found for this barcode.",
    lookupFailed: "Lookup failed. Try again.",
    foundOnSource: "Found on e-katanalotis",
    nameLabel: "Name: ",
    categoryLabel: "Category: ",
    applyFromLookup: "Apply name, category & image →",
    supermarket: "Supermarket",
    use: "Use",
  },

  // ── Admin: delete product modal ──
  deleteModal: {
    title: "Delete product?",
    aboutToDeletePrefix: "You are about to permanently delete",
    tipPrefix: "Tip: If you might want it later, choose",
    tipSuffix:
      "instead — it removes it from the leaflet without losing the product.",
  },

  // ── Admin: layouts ──
  layouts: {
    title: "Leaflet Layouts",
    newLayout: "New layout",
    namePlaceholder: "e.g. Week 20 Offers",
    landscapeRatio: "Landscape (16:9)",
    portraitRatio: "Portrait (A4)",
    creating: "Creating…",
    create: "Create",
    empty: "No layouts yet. Create one above.",
    setActive: "Set active",
    deleteTitle: (name: string) => `Delete "${name}"?`,
    deleteLayout: "Delete layout",

    // Editor
    allLayouts: "All layouts",
    notFound: "Layout not found.",
    settings: "Layout settings",
    name: "Name",
    orientation: "Orientation",
    pagesCount: (n: number) => `Pages (${n})`,
    addPage: "Add page",
    noPages: "No pages yet. Add your first page above.",
    page: (n: number) => `Page ${n}`,
    saved: "Saved",
    savePage: "Save page",
    template: "Template",
    pinProducts: "Pin products to slots",
    movePageUp: "Move page up",
    movePageDown: "Move page down",
    deletePage: "Delete page",
    deletePageTitle: "Delete this page?",
    deletePageDescription:
      "This action cannot be undone. All slot assignments on this page will be lost.",
    deletePageConfirm: "Delete page",

    // Slot picker
    autoFill: "— auto-fill —",
    searchProducts: "Search products...",
    noResultsFor: (q: string) => `No results for “${q}”`,
    roleHero: "Hero",
    roleFeatured: "Featured",
    roleSmall: "Small",
  },

  // ── Layout template names / descriptions ──
  templates: {
    "weekly-special": {
      name: "Weekly Special",
      description: "1 large hero + 4 featured + 4 small products",
    },
    "banner-strip": {
      name: "Banner Strip",
      description: "Full-width banner + 4 featured + 4 small",
    },
    "twin-heroes": {
      name: "Twin Heroes",
      description: "2 large heroes side by side + 4 small",
    },
    spotlight: {
      name: "Spotlight",
      description: "Dominant 3-wide hero + tall feature + 4 small",
    },
    "two-rows": {
      name: "Two Rows",
      description: "4 featured products + 4 small products",
    },
    "wide-banner": {
      name: "Wide Banner",
      description: "Full-width 2-row hero + 4 featured",
    },
    magazine: {
      name: "Magazine",
      description: "Hero + 2 wide featured strips + 4 small",
    },
    stacked: {
      name: "Stacked",
      description: "Full-width hero + 2 wide features + 4 small",
    },
    "compact-grid": {
      name: "Compact Grid",
      description: "12 equal product cells — pure grid",
    },
    "feature-wall": {
      name: "Feature Wall",
      description: "Hero + 8 featured products",
    },
  },

  // ── Admin: home page layout config ──
  layoutConfig: {
    title: "Home page layout",
    description:
      "Choose a template and pin specific products to featured slots. Unpinned slots auto-fill with the highest-discount products.",
    step1: "1 — Choose a template",
    step2: "2 — Pin products to slots",
    autoFillHintPrefix: "Leave a slot as",
    autoFillHintEm: "auto-fill",
    autoFillHintSuffix:
      "to have it filled with the best-discounted active products automatically.",
    saveAndGoLive: "Save & go live",
    live: "Layout is live",
    saveFailed: "Failed to save. Try again.",
  },

  // ── Validation / service errors ──
  errors: {
    priceRequired: "Price is required.",
    competitorPriceNumber: "Competitor price must be a number.",
    nameRequired: "Name is required.",
    failedToSaveProduct: "Failed to save product.",
    promoStartInvalid: "Promotion start date is invalid.",
    promoEndInvalid: "Promotion end date is invalid.",
    percentOffRange: "Percent off must be a number between 0 and 100.",
    promoPriceRequired: "Promo price is required.",
    failedToLoadCategories: "Failed to load categories.",
    failedToLoadProducts: "Failed to load products.",
    fileMustBeImage: "File must be an image.",
    imageTooLarge: "Image must be smaller than 8MB.",
  },
};

export type Dictionary = typeof en;

export default en;
