/**
 * Clear Test Data Script
 * Clears all test/transaction data while keeping essential records
 *
 * Usage: node scripts/clearTestData.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// Collections to clear (test/transaction data)
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

// Collections to keep (master data)
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
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    console.log('\n=== Clearing Test Data ===\n');

    for (const collectionName of COLLECTIONS_TO_CLEAR) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();

        if (count > 0) {
          const result = await collection.deleteMany({});
          console.log(`✓ Cleared ${collectionName}: ${result.deletedCount} documents deleted`);
        } else {
          console.log(`- ${collectionName}: already empty`);
        }
      } catch (err) {
        console.log(`- ${collectionName}: collection not found or error`);
      }
    }

    console.log('\n=== Kept Collections (Master Data) ===\n');

    for (const collectionName of COLLECTIONS_TO_KEEP) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`✓ ${collectionName}: ${count} documents (kept)`);
      } catch (err) {
        console.log(`- ${collectionName}: not found`);
      }
    }

    console.log('\n=== Test Data Cleared Successfully ===\n');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

clearTestData();
