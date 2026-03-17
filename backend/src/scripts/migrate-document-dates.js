/**
 * Migration Script: Set Document Dates from createdAt
 *
 * This script sets document dates for existing records where the date field is not set:
 
 * - Orders: order_date = createdAt
 * - Quotations: quote_date = createdAt
 * - ProformaInvoices: issue_date = createdAt
 * - Invoices: invoice_date = createdAt
 *
 * This is a one-time migration to ensure all existing documents have proper dates.
 * Run with: node src/scripts/migrate-document-dates.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";

// Fix DNS SRV lookup issues on Windows/restricted networks
dns.setServers(["1.1.1.1", "8.8.8.8"]);

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

// Import models
import Order from "../modules/orders/orders.model.js";
import Quotation from "../modules/quotations/quotations.model.js";
import ProformaInvoice from "../modules/proformaInvoices/proformaInvoices.model.js";
import Invoice from "../modules/invoices/invoices.model.js";

async function migrateDocumentDates() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/kb_crm";
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const stats = {
      orders: { total: 0, updated: 0, skipped: 0, errors: 0 },
      quotations: { total: 0, updated: 0, skipped: 0, errors: 0 },
      proformaInvoices: { total: 0, updated: 0, skipped: 0, errors: 0 },
      invoices: { total: 0, updated: 0, skipped: 0, errors: 0 },
    };

 

    // ===========================
    // Migrate Orders
    // ===========================
    console.log("\n=== Migrating Orders ===");
    const orders = await Order.find({});
    stats.orders.total = orders.length;
    console.log(`Found ${orders.length} orders`);

    for (const order of orders) {
      try {
        if (!order.order_date && order.createdAt) {
          await Order.updateOne(
            { _id: order._id },
            { $set: { order_date: order.createdAt } }
          );
          stats.orders.updated++;
          console.log(`  Updated Order ${order.order_number || order._id}: order_date = ${order.createdAt}`);
        } else {
          stats.orders.skipped++;
        }
      } catch (err) {
        stats.orders.errors++;
        console.error(`  Error updating Order ${order.order_number || order._id}:`, err.message);
      }
    }

    // ===========================
    // Migrate Quotations
    // ===========================
    console.log("\n=== Migrating Quotations ===");
    const quotations = await Quotation.find({});
    stats.quotations.total = quotations.length;
    console.log(`Found ${quotations.length} quotations`);

    for (const quote of quotations) {
      try {
        if (!quote.quote_date && quote.createdAt) {
          await Quotation.updateOne(
            { _id: quote._id },
            { $set: { quote_date: quote.createdAt } }
          );
          stats.quotations.updated++;
          console.log(`  Updated Quotation ${quote.quote_number || quote._id}: quote_date = ${quote.createdAt}`);
        } else {
          stats.quotations.skipped++;
        }
      } catch (err) {
        stats.quotations.errors++;
        console.error(`  Error updating Quotation ${quote.quote_number || quote._id}:`, err.message);
      }
    }

    // ===========================
    // Migrate Proforma Invoices
    // ===========================
    console.log("\n=== Migrating Proforma Invoices ===");
    const proformaInvoices = await ProformaInvoice.find({});
    stats.proformaInvoices.total = proformaInvoices.length;
    console.log(`Found ${proformaInvoices.length} proforma invoices`);

    for (const pi of proformaInvoices) {
      try {
        if (!pi.issue_date && pi.createdAt) {
          await ProformaInvoice.updateOne(
            { _id: pi._id },
            { $set: { issue_date: pi.createdAt } }
          );
          stats.proformaInvoices.updated++;
          console.log(`  Updated PI ${pi.proforma_number || pi._id}: issue_date = ${pi.createdAt}`);
        } else {
          stats.proformaInvoices.skipped++;
        }
      } catch (err) {
        stats.proformaInvoices.errors++;
        console.error(`  Error updating PI ${pi.proforma_number || pi._id}:`, err.message);
      }
    }

    // ===========================
    // Migrate Invoices
    // ===========================
    console.log("\n=== Migrating Invoices ===");
    const invoices = await Invoice.find({});
    stats.invoices.total = invoices.length;
    console.log(`Found ${invoices.length} invoices`);

    for (const invoice of invoices) {
      try {
        if (!invoice.invoice_date && invoice.createdAt) {
          await Invoice.updateOne(
            { _id: invoice._id },
            { $set: { invoice_date: invoice.createdAt } }
          );
          stats.invoices.updated++;
          console.log(`  Updated Invoice ${invoice.invoice_number || invoice._id}: invoice_date = ${invoice.createdAt}`);
        } else {
          stats.invoices.skipped++;
        }
      } catch (err) {
        stats.invoices.errors++;
        console.error(`  Error updating Invoice ${invoice.invoice_number || invoice._id}:`, err.message);
      }
    }

    // ===========================
    // Print Summary
    // ===========================
    console.log("\n========================================");
    console.log("       MIGRATION SUMMARY");
    console.log("========================================");

 

    console.log("\nOrders:");
    console.log(`  Total: ${stats.orders.total}`);
    console.log(`  Updated: ${stats.orders.updated}`);
    console.log(`  Skipped (already had date): ${stats.orders.skipped}`);
    console.log(`  Errors: ${stats.orders.errors}`);

    console.log("\nQuotations:");
    console.log(`  Total: ${stats.quotations.total}`);
    console.log(`  Updated: ${stats.quotations.updated}`);
    console.log(`  Skipped (already had date): ${stats.quotations.skipped}`);
    console.log(`  Errors: ${stats.quotations.errors}`);

    console.log("\nProforma Invoices:");
    console.log(`  Total: ${stats.proformaInvoices.total}`);
    console.log(`  Updated: ${stats.proformaInvoices.updated}`);
    console.log(`  Skipped (already had date): ${stats.proformaInvoices.skipped}`);
    console.log(`  Errors: ${stats.proformaInvoices.errors}`);

    console.log("\nInvoices:");
    console.log(`  Total: ${stats.invoices.total}`);
    console.log(`  Updated: ${stats.invoices.updated}`);
    console.log(`  Skipped (already had date): ${stats.invoices.skipped}`);
    console.log(`  Errors: ${stats.invoices.errors}`);

 

    console.log("\n----------------------------------------");
    console.log(`Total records updated: ${totalUpdated}`);
    console.log(`Total errors: ${totalErrors}`);
    console.log("========================================\n");

    // Disconnect
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
migrateDocumentDates();
