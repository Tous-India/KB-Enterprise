import mongoose from "mongoose";
import dns from "node:dns/promises";

// Set DNS for Atlas
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const MONGODB_URI = "mongodb+srv://kbenterprise5230_db_user:Trythekbenterprise123@cluster0.4jryl8r.mongodb.net/kb_crm?retryWrites=true&w=majority";

// Invoice Data from Bill of Supply KB-25-26-007
const invoiceData = {
  document_type: "INVOICE",
  original_reference: "KB-25-26-007",
  document_date: new Date("2025-08-08"),
  fiscal_year: "2025-26",

  // Buyer Info
  buyer_name: "MR. VED PRAKASH",
  buyer_company: "FSTC FLYING SCHOOL PVT. LTD.",
  buyer_email: "MM@FSTCFTO.IN",

  // Financial
  currency: "INR",
  exchange_rate: 1,
  subtotal: 2695807.23,
  tax: 0,  // IGST @ 5% is included in subtotal
  discount: 0,
  shipping: 0,
  total_amount: 2703007.23,
  total_amount_inr: 2703007.23,
  amount_paid: 2703007.23,
  balance_due: 0,
  payment_status: "PAID",

  // Items
  items: [
    { sn: 1, product_name: "COWL MOUNT Sky Bolt", part_number: "SK2003-42A (PMA)", quantity: 50, uom: "EA", unit_price: 3567, total_price: 178350 },
    { sn: 2, product_name: "GYRO FILTER", part_number: "D9-18-1/AAD9-18-1", quantity: 20, uom: "EA", unit_price: 2844.9, total_price: 56898 },
    { sn: 3, product_name: "VRV FILTER", part_number: "B3-5-1/RA-B3-5-1", quantity: 50, uom: "EA", unit_price: 274.05, total_price: 13702.5 },
    { sn: 4, product_name: "SAFETY WIRE", part_number: "MS20995C25SSILB/ MS20995C025-1LB", quantity: 2, uom: "EA", unit_price: 3445.2, total_price: 6890.4 },
    { sn: 5, product_name: "LAMP", part_number: "MS35478-307/ 307", quantity: 10, uom: "EA", unit_price: 1201.47, total_price: 12014.7 },
    { sn: 6, product_name: "LAMP ASSY", part_number: "02-0350433-01", quantity: 5, uom: "EA", unit_price: 23272.5, total_price: 116362.5 },
    { sn: 7, product_name: "TIRE", part_number: "606C66-8", quantity: 15, uom: "EA", unit_price: 26361, total_price: 395415 },
    { sn: 8, product_name: "BRAKE LINING", part_number: "066-10500/ RA066-10500", quantity: 50, uom: "EA", unit_price: 1017.9, total_price: 50895 },
    { sn: 10, product_name: "GASKET", part_number: "71973", quantity: 10, uom: "EA", unit_price: 123.54, total_price: 1235.4 },
    { sn: 12, product_name: "CONTRACTOR", part_number: "X61-0029", quantity: 2, uom: "EA", unit_price: 9570, total_price: 19140 },
    { sn: 13, product_name: "WASHER", part_number: "STD-475", quantity: 100, uom: "EA", unit_price: 130.5, total_price: 13050 },
    { sn: 14, product_name: "SAFETY WIRE", part_number: "MS20995C-032", quantity: 5, uom: "EA", unit_price: 1436.37, total_price: 7181.85 },
    { sn: 15, product_name: "COTTER PIN", part_number: "STD-713", quantity: 100, uom: "EA", unit_price: 174, total_price: 17400 },
    { sn: 16, product_name: "RIVET", part_number: "RA105-00200", quantity: 200, uom: "EA", unit_price: 67.86, total_price: 13572 },
    { sn: 17, product_name: "LED", part_number: "01-0770818-00 / 01-0771987-00", quantity: 5, uom: "EA", unit_price: 39150, total_price: 195750, description: "3 PENDING FROM ORDERED QUANTITY" },
    { sn: 18, product_name: "BONDING STRAP", part_number: "MC1570102-14", quantity: 5, uom: "EA", unit_price: 6090, total_price: 30450 },
    { sn: 19, product_name: "TIRE 4 PLY", part_number: "606C41B1", quantity: 3, uom: "EA", unit_price: 14050.5, total_price: 42151.5, description: "3 PENDING DELIVERED FROM INVOICE NO 4" },
    { sn: 20, product_name: "HINGE", part_number: "0411185-7", quantity: 2, uom: "EA", unit_price: 12287.01, total_price: 24574.02 },
    { sn: 21, product_name: "LINE ASSY. RH", part_number: "0500118-524", quantity: 2, uom: "EA", unit_price: 49068, total_price: 98136 },
    { sn: 22, product_name: "GASKET", part_number: "0756041-1", quantity: 100, uom: "EA", unit_price: 2934.51, total_price: 293451 },
    { sn: 23, product_name: "OIL FILTER", part_number: "CH48110-1", quantity: 100, uom: "EA", unit_price: 3784.5, total_price: 378450 },
    { sn: 24, product_name: "GASKET", part_number: "06E19769-1.00", quantity: 100, uom: "EA", unit_price: 200.1, total_price: 20010 },
    { sn: 25, product_name: "AIR FILTER", part_number: "P198281 / AA198281", quantity: 10, uom: "EA", unit_price: 12314.85, total_price: 123148.5 },
    { sn: 26, product_name: "VACCUM PUMP", part_number: "AA3215CC", quantity: 2, uom: "EA", unit_price: 47806.5, total_price: 95613 },
    { sn: 27, product_name: "LED FLASHER", part_number: "01-0770006-17 / 01-0771985-17", quantity: 5, uom: "EA", unit_price: 34582.5, total_price: 172912.5, description: "1 PENDING FROM ORDERED QUANTITY" },
    { sn: 28, product_name: "LINE ASSY. LH", part_number: "0500118-523", quantity: 2, uom: "EA", unit_price: 48751.32, total_price: 97502.64 },
    { sn: 29, product_name: "LED(RED)", part_number: "01-0771015-08", quantity: 1, uom: "EA", unit_price: 38336.55, total_price: 38336.55, description: "1 PENDING FROM ORDERED QUANTITY" },
    { sn: 30, product_name: "PLUG", part_number: "541139", quantity: 5, uom: "EA", unit_price: 3523.5, total_price: 17617.5 },
    { sn: 31, product_name: "AIR FILTER BOX ASSY.", part_number: "0550364-13", quantity: 1, uom: "EA", unit_price: 164535.27, total_price: 164535.27 },
    { sn: 33, product_name: "BULB", part_number: "MS15584-15 / 306", quantity: 5, uom: "EA", unit_price: 191.4, total_price: 957 },
    { sn: 36, product_name: "SCREW", part_number: "MS35206-228", quantity: 20, uom: "EA", unit_price: 5.22, total_price: 104.4, description: "20 PENDING FROM ORDERED QUANTITY" },
  ],

  // Original data for reference
  original_data: {
    invoice_type: "BILL OF SUPPLY - HIGH SEA SALE",
    quote_ref: "BY MAIL",
    quote_date: "02-Jul-25",
    payment_terms: "100% PREPAID",
    seller: {
      name: "KB ENTERPRISES",
      address: "PLOT NO 145 GF, POCKET 25 SECTOR 24 ROHINI EAST DELHI 110085",
      gstin: "07CARPR7906M1ZR",
      contact_person: "MR. NITIN",
      phone: "+91-9315151910",
      email: "INFO@KBENTERPRISE.ORG"
    },
    buyer: {
      name: "FSTC FLYING SCHOOL PVT. LTD.",
      address: "AERODROME HANGER #1, SH-16A, VILLAGE GUJRANI, BHIWANI, HARYANA",
      gstin: "06AADCF7984L2ZZ",
      contact_person: "MR. VED PRAKASH",
      phone: "9897379477",
      email: "MM@FSTCFTO.IN"
    },
    tax_breakdown: {
      "IGST @ 5%": 2695807.23,
      "IGST @ 18%": 0,
      "IGST @ 28%": 0,
      "Bank Charges": 7200,
      "Freight": 0
    },
    bank_details: {
      bank: "ICICI bank ltd",
      account_no: "36705501190",
      branch: "Sec 11 Rohini",
      ifsc: "ICIC0000367"
    },
    total_qty: 987
  },

  notes: "Bill of Supply - High Sea Sale. Payment: 100% PREPAID",
  tags: ["HIGH_SEA_SALE", "FSTC", "2025-26", "AVIATION"],
  source_system: "LEGACY"
};

async function addArchive() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB\n");

    const db = mongoose.connection.db;

    // Generate archive_id
    const lastArchive = await db.collection("archives")
      .find({ archive_id: /^ARC-/ })
      .sort({ archive_id: -1 })
      .limit(1)
      .toArray();

    let nextNum = 1;
    if (lastArchive.length > 0) {
      const lastNum = parseInt(lastArchive[0].archive_id.split("-")[1], 10);
      nextNum = lastNum + 1;
    }

    invoiceData.archive_id = `ARC-${String(nextNum).padStart(5, "0")}`;
    invoiceData.createdAt = new Date();
    invoiceData.updatedAt = new Date();

    // Insert the archive
    await db.collection("archives").insertOne(invoiceData);

    console.log("Invoice archived successfully!");
    console.log("Archive ID:", invoiceData.archive_id);
    console.log("Invoice No:", invoiceData.original_reference);
    console.log("Buyer:", invoiceData.buyer_company);
    console.log("Total Amount:", invoiceData.total_amount.toLocaleString("en-IN"));
    console.log("Items:", invoiceData.items.length);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

addArchive();
