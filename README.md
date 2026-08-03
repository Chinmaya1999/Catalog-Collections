# Adihuman Catalog Management System

A dynamic catalog management system with admin portal for uploading and managing product catalogs.

## Features

- **Admin Portal**: Secure login system for admin users
- **Dashboard**: Overview of catalog statistics and recent items
- **Catalog Management**: Create, read, update, and delete catalog items
- **Category Management**: Organize catalogs into categories
- **File Upload**: Support for images and PDF files
- **Dynamic Frontend**: Public catalog page that fetches data from the backend
- **Responsive Design**: Mobile-friendly interface

## Tech Stack

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT Authentication
- Multer for file uploads
- CORS enabled

### Frontend
- React 18
- React Router
- Framer Motion for animations
- Tailwind CSS for styling
- Axios for API calls

## Setup Instructions

### 1. Backend Setup

```bash
cd server
npm install
```

Configure environment variables in `server/.env`:
```
MONGODB_URI=mongodb+srv://your-connection-string
PORT=5002
JWT_SECRET=your-secret-key
```

Seed the database with default admin and categories:
```bash
node seed.js
```

Default admin credentials:
- Email: admin@adihuman.com
- Password: admin123

Start the backend server:
```bash
npm start
# or for development
npm run dev
```

The backend will run on `http://localhost:5002`

### 2. Frontend Setup

```bash
cd client
npm install
npm start
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new admin
- `POST /api/auth/login` - Login admin
- `GET /api/auth/me` - Get current admin (protected)

### Categories
- `GET /api/category` - Get all categories
- `GET /api/category/:id` - Get single category
- `POST /api/category` - Create category (protected)
- `PUT /api/category/:id` - Update category (protected)
- `DELETE /api/category/:id` - Delete category (protected)

### Catalogs
- `GET /api/catalog` - Get all catalogs
- `GET /api/catalog/:id` - Get single catalog
- `POST /api/catalog` - Create catalog (protected)
- `PUT /api/catalog/:id` - Update catalog (protected)
- `DELETE /api/catalog/:id` - Delete catalog (protected)
- `POST /api/catalog/image` - Upload catalog image (protected)

### Admin
- `GET /api/admin/dashboard` - Get dashboard statistics (protected)

## Usage

### Admin Portal

1. Navigate to `http://localhost:3000/admin/login`
2. Login with admin credentials
3. Access the dashboard at `http://localhost:3000/admin/dashboard`

### Adding a New Catalog

1. Go to Admin Dashboard
2. Click "Add Catalog" button
3. Fill in the catalog details:
   - Name
   - Description
   - Category (select from dropdown)
   - Type (product/combo/eco-friendly)
   - Upload image
   - Add Google Drive link for PDF/files
   - Set flags (featured, new, eco-friendly)
   - Set display order
4. Click "Create Catalog"

### Managing Catalogs

- **Edit**: Click the edit icon to modify catalog details
- **Delete**: Click the delete icon to remove a catalog
- **View**: Switch between Dashboard, Catalogs, and Categories tabs

### Public Catalog Page

The public catalog page at `http://localhost:3000/catalog` automatically fetches data from the backend and displays it. If the backend is unavailable, it falls back to static data.

## File Structure

```
catlog/
├── client/
│   ├── public/
│   │   └── images/          # Static images
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   │   ├── AdminLogin.js
│   │   │   ├── AdminDashboard.js
│   │   │   ├── Catalog.js
│   │   │   └── ...
│   │   └── data/           # Static data (fallback)
│   └── package.json
├── server/
│   ├── middleware/         # Express middleware
│   │   ├── auth.js
│   │   └── upload.js
│   ├── models/            # Mongoose models
│   │   ├── Admin.js
│   │   ├── Catalog.js
│   │   └── Category.js
│   ├── routes/            # API routes
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── catalog.js
│   │   └── category.js
│   ├── uploads/           # Uploaded files
│   │   ├── catalogs/
│   │   ├── categories/
│   │   └── files/
│   ├── .env
│   ├── server.js
│   ├── seed.js
│   └── package.json
└── README.md
```

## Security Notes

- Change the default admin password after first login
- Update JWT_SECRET in production
- Use environment variables for sensitive data
- Implement rate limiting for production
- Add HTTPS in production

## Development

### Adding New Features

1. **Backend**: Add new routes in the `routes/` directory
2. **Frontend**: Create new components in `src/components/` or pages in `src/pages/`
3. **Database**: Update models in `models/` and reseed if needed

### Troubleshooting

- **MongoDB Connection**: Check MONGODB_URI in .env
- **Port Conflicts**: Change PORT in .env if needed
- **CORS Issues**: Ensure CORS is properly configured in server.js
- **File Uploads**: Check uploads directory permissions

## License

This project is proprietary and confidential.
