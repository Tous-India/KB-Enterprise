/**
 * Clear Test Data Script (CommonJS version)
 * Run with: node scripts/clearTestData.cjs
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const COLLECTIONS_TO_CLEAR = [
  'invoices',
  'paymentrecords',
  'proformainvoices',
  'orders',
  'quotations',
  'statements',
  'dispatches',
  'supplierorders',
  'piallocations',
  'archives',
  'payments',
  'carts',
];

const COLLECTIONS_TO_KEEP = [
  'users',
  'categories',
  'brands',
  'products',
  'suppliers',
];

async function clearTestData() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('URI:', MONGODB_URI ? 'Found' : 'Not found');

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    console.log('\n=== Clearing Test Data ===\n');

    for (const collectionName of COLLECTIONS_TO_CLEAR) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();

        if (count > 0) {
          const result = await collection.deleteMany({});
          console.log(`Cleared ${collectionName}: ${result.deletedCount} documents deleted`);
        } else {
          console.log(`${collectionName}: already empty`);
        }
      } catch (err) {
        console.log(`${collectionName}: collection not found`);
      }
    }

    console.log('\n=== Kept Collections ===\n');

    for (const collectionName of COLLECTIONS_TO_KEEP) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`${collectionName}: ${count} documents (kept)`);
      } catch (err) {
        console.log(`${collectionName}: not found`);
      }
    }

    console.log('\n=== Done ===\n');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

clearTestData();
