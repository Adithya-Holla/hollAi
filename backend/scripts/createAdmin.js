/**
 * One-time script to seed the single admin account.
 * Run: node scripts/createAdmin.js <username> <email> <password>
 * Never expose this over HTTP.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const [username, email, password] = process.argv.slice(2);

  if (!username || !email || !password) {
    console.error('Usage: node scripts/createAdmin.js <username> <email> <password>');
    process.exit(1);
  }
  if (password.length < 6) {
    console.error('Password must be at least 6 characters.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const existingCount = await User.countDocuments();
  if (existingCount > 0) {
    console.error(`Refusing to create another admin: ${existingCount} user(s) already exist. Delete the existing user first if you want to replace it.`);
    await mongoose.connection.close();
    process.exit(1);
  }

  const user = new User({ username, email, password });
  await user.save();

  console.log(`Admin user created: ${user.username} <${user.email}>`);
  await mongoose.connection.close();
}

main().catch((err) => {
  console.error('Failed to create admin:', err);
  process.exit(1);
});
