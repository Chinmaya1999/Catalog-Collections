const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Admin = require('./models/Admin');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const email = 'superadmin@adihuman.com';
    const admin = await Admin.findOne({ email }).lean();
    if (!admin) {
      console.log('No admin found with email', email);
      process.exit(0);
    }

    console.log('Admin record (lean):', { id: admin._id, username: admin.username, email: admin.email, role: admin.role, passwordHash: admin.password });

    // Need a full mongoose document to use comparePassword
    const adminDoc = await Admin.findOne({ email });
    const ok = await adminDoc.comparePassword('superadmin123');
    console.log('Password compare for "superadmin123":', ok);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
