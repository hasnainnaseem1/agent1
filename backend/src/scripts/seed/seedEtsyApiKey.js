/**
 * Seed Etsy API Key
 * 
 * Inserts an Etsy API key into the EtsyApiKey collection so the key pool has
 * at least one active key for keyword search and other Etsy API calls.
 * 
 * Usage:
 *   node src/scripts/seed/seedEtsyApiKey.js
 * 
 * Requires:
 *   - MONGODB_URI in .env
 *   - ENCRYPTION_KEY in .env (or set in Admin → Integrations → Etsy)
 *   - ETSY_API_KEY and ETSY_SHARED_SECRET in .env
 */
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const ETSY_API_KEY = process.env.ETSY_API_KEY;
const ETSY_SHARED_SECRET = process.env.ETSY_SHARED_SECRET;

async function seed() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }
  if (!ETSY_API_KEY) {
    console.error('ETSY_API_KEY not set in .env');
    process.exit(1);
  }
  if (!ETSY_SHARED_SECRET) {
    console.error('ETSY_SHARED_SECRET not set in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Initialize encryption key from DB/env
  const { initEncryptionKey, encrypt } = require('../../utils/encryption');
  await initEncryptionKey();

  const { EtsyApiKey } = require('../../models/integrations');

  // Check if this key already exists
  const existing = await EtsyApiKey.findOne({ apiKey: ETSY_API_KEY.trim() });
  if (existing) {
    console.log(`API key already exists: label="${existing.label}" status=${existing.status}`);
    if (existing.status !== 'active') {
      existing.status = 'active';
      existing.errorCount = 0;
      await existing.save();
      console.log('Re-activated existing key.');
    }
    await mongoose.disconnect();
    return;
  }

  // Find any admin user for createdBy (required field)
  const { User } = require('../../models/user');
  const admin = await User.findOne({ accountType: 'admin' }).select('_id');
  if (!admin) {
    console.error('No admin user found — create a super admin first (node src/scripts/seed/seedSuperAdmin.js)');
    await mongoose.disconnect();
    process.exit(1);
  }

  const key = await EtsyApiKey.create({
    label: 'Primary Etsy Key',
    apiKey: ETSY_API_KEY.trim(),
    sharedSecret: encrypt(ETSY_SHARED_SECRET.trim()),
    status: 'active',
    createdBy: admin._id,
  });

  console.log(`Etsy API key seeded successfully!`);
  console.log(`  _id:    ${key._id}`);
  console.log(`  label:  ${key.label}`);
  console.log(`  apiKey: ${key.apiKey.slice(0, 8)}...`);
  console.log(`  status: ${key.status}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
