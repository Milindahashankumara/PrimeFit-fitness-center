/**
 * Create Admin User Script
 * 
 * This script creates an admin user in the database.
 * Run this once to set up your first admin account.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    console.log('🔧 Creating admin user...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Admin details - CHANGE THESE!
    const adminData = {
      name: 'Admin User',
      email: 'admin@fitness.com',
      password: 'admin123', // Change this to a secure password!
      phone: '+1234567890',
      role: 'admin'
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with email:', adminData.email);
      console.log('   To create a new admin, change the email in this script.\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create(adminData);

    console.log('✅ Admin user created successfully!\n');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Password:', adminData.password);
    console.log('👤 User ID:', admin._id);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!\n');

    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

// Run the script
createAdmin();
