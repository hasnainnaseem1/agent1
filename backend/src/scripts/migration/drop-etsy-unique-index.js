/**
 * Migration: Drop old unique userId index on etsyshops collection
 * 
 * The EtsyShop model previously had `unique: true` on the userId field,
 * which only allowed 1 shop per user. For multi-shop support, we need
 * to drop that index and replace it with a compound unique index on
 * { userId, shopId } to prevent duplicate shop connections per user.
 * 
 * Run this script ONCE on the production database:
 *   node backend/src/scripts/migration/drop-etsy-unique-index.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const run = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('No MONGODB_URI or MONGO_URI found in environment');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const collection = mongoose.connection.collection('etsyshops');

  // List current indexes
  const indexes = await collection.indexes();
  console.log('Current indexes:', JSON.stringify(indexes, null, 2));

  // Drop the old unique userId index if it exists
  const userIdUniqueIndex = indexes.find(
    idx => idx.key?.userId === 1 && idx.unique === true
  );

  if (userIdUniqueIndex) {
    console.log(`Dropping unique index: ${userIdUniqueIndex.name}`);
    await collection.dropIndex(userIdUniqueIndex.name);
    console.log('Old unique userId index dropped successfully');
  } else {
    console.log('No unique userId index found — already migrated or never existed');
  }

  // Ensure the new compound unique index exists
  await collection.createIndex(
    { userId: 1, shopId: 1 },
    { unique: true, name: 'userId_1_shopId_1_unique' }
  );
  console.log('Created compound unique index on { userId, shopId }');

  // Ensure the non-unique userId index exists
  await collection.createIndex(
    { userId: 1 },
    { name: 'userId_1' }
  );
  console.log('Created non-unique userId index');

  // Verify final indexes
  const finalIndexes = await collection.indexes();
  console.log('Final indexes:', JSON.stringify(finalIndexes, null, 2));

  await mongoose.disconnect();
  console.log('Migration complete');
};

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
