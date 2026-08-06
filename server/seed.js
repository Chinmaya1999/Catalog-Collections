const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Category = require('./models/Category');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');

    // Create default admin if not exists
    const existingAdmin = await Admin.findOne({ email: 'admin@adihuman.com' });
    if (!existingAdmin) {
      const admin = new Admin({
        username: 'admin',
        email: 'admin@adihuman.com',
        password: 'admin123',
        role: 'admin'
      });
      await admin.save();
      console.log('Default admin created: admin@adihuman.com / admin123');
    } else {
      console.log('Admin already exists');
    }

    // Create default superadmin if not exists
    const existingSuper = await Admin.findOne({ email: 'superadmin@adihuman.com' });
    if (!existingSuper) {
      const superadmin = new Admin({
        username: 'superadmin',
        email: 'superadmin@adihuman.com',
        password: 'superadmin123',
        role: 'superadmin'
      });
      await superadmin.save();
      console.log('Default superadmin created: superadmin@adihuman.com / superadmin123');
    } else {
      console.log('Superadmin already exists');
    }

    // Create default categories if not exist
    const defaultCategories = [
      { name: 'Combo Sets', slug: 'combo-sets', icon: '🎁', order: 1, featured: true },
      { name: 'Accessories', slug: 'accessories', icon: '🔑', order: 2, featured: true },
      { name: 'Drinkware', slug: 'drinkware', icon: '☕', order: 3, featured: true },
      { name: 'Stationery', slug: 'stationery', icon: '📓', order: 4, featured: true },
      { name: 'Electronics', slug: 'electronics', icon: '📱', order: 5, featured: true },
      { name: 'Eco-Friendly', slug: 'eco-friendly', icon: '🌱', order: 6, featured: true }
    ];

    for (const catData of defaultCategories) {
      const existingCategory = await Category.findOne({ slug: catData.slug });
      if (!existingCategory) {
        const category = new Category(catData);
        await category.save();
        console.log(`Category created: ${catData.name}`);
      } else {
        console.log(`Category already exists: ${catData.name}`);
      }
    }

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
