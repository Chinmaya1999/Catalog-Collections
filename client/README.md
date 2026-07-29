# Adihuman Premium Digital Catalog

A modern, responsive digital catalog built with React featuring premium UI/UX design for Adihuman personalized products. This is a static React application for showcasing products to clients with inline Google Drive PDF viewing.

## Features

- **Premium UI/UX Design**: Modern, clean interface with smooth animations
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile devices
- **Product Catalog**: Browse products by categories and collections
- **Google Drive Integration**: Inline PDF viewing of product catalogs
- **Advanced Filtering**: Filter by category and search functionality
- **Search Functionality**: Real-time catalog and product search
- **Combo Sets**: Special catalog sections for combo products (2-in-1, 3-in-1, etc.)
- **Eco-Friendly Products**: Dedicated section for sustainable products
- **Tab Navigation**: Easy switching between catalog collections and individual products
- **Grid/List Views**: Toggle between different viewing modes
- **Inline PDF Viewer**: View catalogs directly within the page
- **Download Option**: Download catalogs directly from the viewer

## Tech Stack

- **React 18**: Modern React with hooks
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **Lucide React**: Beautiful icon library

## Project Structure

```
catlog/
├── client/                 # React application
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── Footer.js
│   │   │   └── PDFViewer.js
│   │   ├── data/
│   │   │   └── catalogs.js    # Static catalog data with Google Drive links
│   │   ├── pages/
│   │   │   ├── Home.js
│   │   │   └── Catalog.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
├── package.json
└── README.md
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup Instructions

1. **Navigate to the project directory**
   ```bash
   cd /Users/chinmayakumarmallick/Desktop/catlog
   ```

2. **Install dependencies**
   ```bash
   cd client
   npm install
   ```

## Running the Application

### Development Mode

Start the React development server:
```bash
cd client
npm start
```

Or from the root:
```bash
npm start
```

The application will be available at `http://localhost:3000`

### Production Build

1. Build the React app:
```bash
npm run build
```

2. Deploy the `client/build` folder to any static hosting service (Netlify, Vercel, GitHub Pages, etc.)

## Catalog Collections

### Combo Sets
- 2 in 1 - Dairy & Pen
- 2 in 1 - Pen, Keychain & Cardholder
- 3 in 1
- 4 in 1
- 5 in 1
- 6 & 7 in 1

### Individual Products
- Keychain
- Cardholder
- Gadgets
- Wooden Stand
- Bottle
- Mug
- Eco-friendly Notebook
- Notebook
- Bag
- Tote Bag

### Special Collections
- Eco-friendly Products

## Design Features

### Color Scheme
- **Primary**: Brand Yellow (#FFD700)
- **Secondary**: Gold (#FFA500)
- **Dark**: #1a1a1a
- **Light**: #f5f5f5

### Typography
- **Display Font**: Poppins (headings)
- **Body Font**: Inter (body text)

### UI Components
- Responsive navigation with mobile menu
- Catalog cards with hover effects
- Tab navigation (Catalog Collections / Individual Products)
- Category filter sidebar
- Grid/List view toggle
- Search functionality
- Inline PDF viewer with Google Drive integration

### Animations
- Page transitions with Framer Motion
- Hover effects on catalog cards
- Smooth scroll behavior
- Staggered animations for grids

## Customization

### Adding New Catalogs or Products
Edit `client/src/data/catalogs.js` to add new catalogs or products:
- Add catalog objects with Google Drive links
- Add product objects with category information
- Update categories array as needed

### Modifying Google Drive Links
Simply update the `driveLink` property in the catalog data file with your new Google Drive URLs.

### Modifying Design
- Edit `client/tailwind.config.js` for theme customization
- Modify `client/src/index.css` for custom styles
- Update components in `client/src/components/`
- Modify pages in `client/src/pages/`

## Deployment

### Static Hosting (Recommended)
Since this is a static React app, deploy to:
- **Netlify**: Drag and drop the build folder
- **Vercel**: Connect your GitHub repository
- **GitHub Pages**: Use gh-pages branch
- **AWS S3**: Upload build folder to S3 bucket

### Build for Production
```bash
cd client
npm run build
```

The `client/build` folder contains the optimized production files ready for deployment.

## Usage

This catalog is designed for:
- **Client Presentations**: Show clients your complete product range
- **Sales Meetings**: Quick access to downloadable catalogs
- **Product Showcases**: Display products with direct links to detailed information

Simply navigate to the catalog, browse products or collections, and click on any item to view the PDF inline.

## License

MIT License - Copyright (c) 2024 Adihuman

## Support

For support, contact info@adihuman.com or visit https://adihuman.com
