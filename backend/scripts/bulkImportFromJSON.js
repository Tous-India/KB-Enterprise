import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns/promises";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

dns.setServers(["1.1.1.1", "8.8.8.8"]);

import Product from "../src/modules/products/products.model.js";

// ===========================
// Parse JSON and deduplicate
// ===========================
function parseProducts(jsonData) {
  const seen = new Map();

  for (const row of jsonData) {
    const rawPartNumber = row["part_number"] ?? row["__EMPTY_1"];
    const rawName = row["__EMPTY"] ?? row["product_name"];
    const rawHsn = row["__EMPTY_3"] ?? row["hsn_code"];

    // Skip header row
    if (rawPartNumber === "Part Number") continue;

    // Skip rows with no part number
    if (rawPartNumber === undefined || rawPartNumber === null || String(rawPartNumber).trim() === "") continue;

    const partNumber = String(rawPartNumber).trim().replace(/\t/g, "");
    const productName = rawName ? String(rawName).trim().replace(/\t/g, "") : "Unknown";
    const hsnCode = rawHsn ? String(rawHsn).trim() : undefined;

    // Keep first occurrence only
    if (!seen.has(partNumber)) {
      seen.set(partNumber, {
        part_number: partNumber,
        product_name: productName,
        hsn_code: hsnCode,
        is_active: true,
      });
    }
  }

  return Array.from(seen.values());
}

// ===========================
// Main import function
// ===========================
async function bulkImport() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const filePath = args.find((a) => !a.startsWith("--"));

  if (!filePath) {
    console.error("Usage: node bulkImportFromJSON.js <path-to-json> [--dry-run]");
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`);
    process.exit(1);
  }

  const rawJson = JSON.parse(fs.readFileSync(absolutePath, "utf-8"));
  const products = parseProducts(rawJson);

  console.log(`Total rows in JSON: ${rawJson.length}`);
  console.log(`Unique products (by part_number): ${products.length}`);
  if (dryRun) console.log("\n--- DRY RUN (no changes will be made) ---\n");

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB\n");

    let inserted = 0;
    let skipped = 0;
    let alreadyExists = 0;

    for (const productData of products) {
      const existing = await Product.findOne({ part_number: productData.part_number });

      if (existing) {
        alreadyExists++;
        continue;
      }

      if (dryRun) {
        console.log(`[DRY RUN] Would insert: ${productData.part_number} | ${productData.product_name}`);
        inserted++;
        continue;
      }

      try {
        const product = new Product(productData);
        await product.save();
        inserted++;
        console.log(`Inserted: ${product.product_id} | ${product.part_number} | ${product.product_name}`);
      } catch (err) {
        if (err.code === 11000) {
          skipped++;
        } else {
          console.error(`Error inserting ${productData.part_number}: ${err.message}`);
        }
      }
    }

    console.log("\n" + "-".repeat(60));
    console.log("Summary:");
    console.log(`  Total rows in file:    ${rawJson.length}`);
    console.log(`  Unique part numbers:   ${products.length}`);
    console.log(`  Already in DB:         ${alreadyExists}`);
    console.log(`  Newly inserted:        ${inserted}`);
    console.log(`  Skipped (errors):      ${skipped}`);
    console.log("-".repeat(60));
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

bulkImport();
