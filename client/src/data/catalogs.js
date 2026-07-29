export const catalogs = [
  {
    id: 1,
    name: '2 in 1 - Dairy & Pen',
    description: 'Premium dairy and pen combo set for professionals',
    type: 'combo',
    comboCount: 2,
    image: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=500&h=500&fit=crop',
    driveLink: 'https://drive.google.com/file/d/1wX2Nidaa9vEwzn4-bOf9o3haXrOEzLQm/view?usp=sharing',
    featured: true,
    new: true,
    order: 1,
    products: [
      { code: 'HGS-D101', name: 'Dairy & Pen Set - Blue', page: 1 },
      { code: 'HGS-D102', name: 'Dairy & Pen Set - Black', page: 2 },
      { code: 'HGS-D103', name: 'Dairy & Pen Set - Red', page: 3 }
    ]
  },
  {
    id: 2,
    name: '2 in 1 - Pen, Keychain & Cardholder',
    description: 'Essential office combo with pen, keychain and cardholder',
    type: 'combo',
    comboCount: 3,
    image: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=500&h=500&fit=crop',
    driveLink: 'https://drive.google.com/file/d/12TfSy9FmPYRUXXIphnBe1ypNpPZ-8LEK/view?usp=sharing',
    featured: true,
    new: true,
    order: 2,
    products: [
      { code: 'DNO-01', name: 'Pen & Keychain Combo', page: 1 },
      { code: 'DNO-02', name: 'Pen & Cardholder Set', page: 2 },
      { code: 'DNO-03', name: 'Keychain & Cardholder', page: 3 }
    ]
  },
  {
    id: 3,
    name: '3 in 1',
    description: 'Versatile 3-in-1 product set',
    type: 'combo',
    comboCount: 3,
    image: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=500&h=500&fit=crop',
    driveLink: 'https://drive.google.com/file/d/10hmnbefsRIL2Tu--9FWLDRJTCur6JEM-/view?usp=sharing',
    featured: true,
    order: 3,
    products: [
      { code: 'TGS-301', name: '3-in-1 Office Set', page: 1 },
      { code: 'TGS-302', name: '3-in-1 Travel Set', page: 2 },
      { code: 'TGS-303', name: '3-in-1 Premium Set', page: 3 }
    ]
  },
  {
    id: 4,
    name: '4 in 1',
    description: 'Complete 4-in-1 product collection',
    type: 'combo',
    comboCount: 4,
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=500&h=500&fit=crop',
    driveLink: 'https://drive.google.com/file/d/1bzxwRFUBL__WoVXolay6tnREhV3d4wi2/view?usp=sharing',
    featured: true,
    order: 4,
    products: [
      { code: 'FGS-401', name: '4-in-1 Basic Set', page: 1 },
      { code: 'FGS-402', name: '4-in-1 Pro Set', page: 2 },
      { code: 'FGS-403', name: '4-in-1 Elite Set', page: 3 }
    ]
  },
  {
    id: 5,
    name: '5 in 1',
    description: 'Ultimate 5-in-1 premium combo',
    type: 'combo',
    comboCount: 5,
    image: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=500&h=500&fit=crop',
    driveLink: 'https://drive.google.com/file/d/1OML0fYi2A6o9N-L6yz_AOMMSqa7LsPkx/view?usp=sharing',
    featured: true,
    order: 5,
    products: [
      { code: 'VGS-501', name: '5-in-1 Complete Set', page: 1 },
      { code: 'VGS-502', name: '5-in-1 Executive Set', page: 2 }
    ]
  },
  {
    id: 6,
    name: '6 & 7 in 1',
    description: 'Extended combo sets with 6 or 7 items',
    type: 'combo',
    comboCount: 7,
    image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=500&h=500&fit=crop',
    driveLink: 'https://drive.google.com/file/d/1auzDsrwu5-Z8MU5X6dTyIWExDvG8c3uL/view?usp=sharing',
    featured: true,
    order: 6,
    products: [
      { code: 'XGS-601', name: '6-in-1 Premium Set', page: 1 },
      { code: 'XGS-701', name: '7-in-1 Ultimate Set', page: 2 }
    ]
  },
  {
    id: 7,
    name: 'Eco-friendly Products',
    description: 'Sustainable and eco-friendly product range',
    type: 'eco-friendly',
    comboCount: 0,
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500&h=500&fit=crop',
    driveLink: 'https://drive.google.com/file/d/1ddesMWFknmLE_AnxYS2jqge88itHSuMT/view?usp=sharing',
    featured: true,
    order: 7,
    products: [
      { code: 'ECO-101', name: 'Eco Notebook', page: 1 },
      { code: 'ECO-102', name: 'Eco Tote Bag', page: 2 },
      { code: 'ECO-103', name: 'Bamboo Pen Set', page: 3 }
    ]
  }
];

export const products = [
  {
    id: 1,
    name: 'Keychain',
    description: 'Premium keychains with customization options',
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
    driveLink: 'https://drive.google.com/file/d/18Nu6HXDn2bNpAZVwcEHhIeRSXhDTjTNa/view?usp=sharing',
    featured: true,
    order: 1
  },
  {
    id: 2,
    name: 'Cardholder',
    description: 'Elegant cardholders with RFID protection',
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&h=500&fit=crop',
    driveLink: 'https://drive.google.com/file/d/1o5AWKvGF2QbHumKR5WTgkmxn0zazoD22/view?usp=sharing',
    featured: true,
    order: 2
  },
  {
    id: 3,
    name: 'Gadgets',
    description: 'Modern tech gadgets and accessories',
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500&h=500&fit=crop',
    driveLink: 'https://drive.google.com/file/d/1ioC3yOMUtsAGiNbrJw14Pdmhfr9jJf4F/view?usp=sharing',
    featured: true,
    order: 3
  },
  {
    id: 4,
    name: 'Wooden Stand',
    description: 'Handcrafted wooden stands for devices',
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop',
    driveLink: 'https://drive.google.com/file/d/1rCuz9V_EpMbRmX2BYpVe0cWoluXfheb4/view?usp=sharing',
    featured: true,
    order: 4
  },
  {
    id: 5,
    name: 'Bottle',
    description: 'Premium water bottles with customization',
    category: 'Drinkware',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&h=500&fit=crop',
    driveLink: 'https://drive.google.com/file/d/1aHHNCaafeYPoiGyiiljnfrVwnIvceMNx/view?usp=sharing',
    featured: true,
    order: 5
  },
  {
    id: 6,
    name: 'Mug',
    description: 'Customizable mugs for personal and corporate use',
    category: 'Drinkware',
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500&h=500&fit=crop',
    driveLink: 'https://drive.google.com/file/d/1d1-PJtrbYV6mHiY-xA35bXcSfpPcsr_X/view?usp=sharing',
    featured: true,
    order: 6
  },
  {
    id: 7,
    name: 'Eco-friendly Notebook',
    description: 'Sustainable notebooks made from recycled materials',
    category: 'Stationery',
    image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=500&h=500&fit=crop',
    driveLink: 'https://drive.google.com/file/d/1y3xV1Ee4gx3EYW92-e-_ByVDYM1ZjXrO/view?usp=sharing',
    featured: true,
    ecoFriendly: true,
    order: 7
  },
  {
    id: 8,
    name: 'Notebook',
    description: 'Premium notebooks for professionals',
    category: 'Stationery',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=500&h=500&fit=crop',
    driveLink: 'https://drive.google.com/file/d/1ReZ1E06QWZQm6NxAKLzdJckMAdb6xHfi/view?usp=sharing',
    featured: true,
    order: 8
  },
  {
    id: 9,
    name: 'Bag',
    description: 'Stylish bags for everyday use',
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500&h=500&fit=crop',
    driveLink: 'https://drive.google.com/file/d/1WmJW6vVmzeVORxjPPP6W-EGzsJf2TC64/view?usp=sharing',
    featured: true,
    order: 9
  },
  {
    id: 10,
    name: 'Tote Bag',
    description: 'Eco-friendly tote bags with customization',
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?w=500&h=500&fit=crop',
    driveLink: 'https://drive.google.com/file/d/1jHLYw8r913lD9QwtIW4cQr6nXotcPaTy/view?usp=sharing',
    featured: true,
    ecoFriendly: true,
    order: 10
  }
];

export const categories = [
  { id: 1, name: 'Combo Sets', slug: 'combo-sets', icon: '🎁', order: 1, featured: true },
  { id: 2, name: 'Accessories', slug: 'accessories', icon: '🔑', order: 2, featured: true },
  { id: 3, name: 'Drinkware', slug: 'drinkware', icon: '☕', order: 3, featured: true },
  { id: 4, name: 'Stationery', slug: 'stationery', icon: '📓', order: 4, featured: true },
  { id: 5, name: 'Electronics', slug: 'electronics', icon: '📱', order: 5, featured: true },
  { id: 6, name: 'Eco-Friendly', slug: 'eco-friendly', icon: '🌱', order: 6, featured: true }
];
