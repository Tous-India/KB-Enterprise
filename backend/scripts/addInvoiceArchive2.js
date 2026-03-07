import mongoose from "mongoose";
import dns from "node:dns/promises";

// Set DNS for Atlas
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const MONGODB_URI = "mongodb+srv://kbenterprise5230_db_user:Trythekbenterprise123@cluster0.4jryl8r.mongodb.net/kb_crm?retryWrites=true&w=majority";

// Invoice Data from Bill of Supply KB-FSTC-25-26-15A
const invoiceData = {
  document_type: "INVOICE",
  original_reference: "KB-FSTC-25-26-15A",
  document_date: new Date("2025-09-03"),
  fiscal_year: "2025-26",

  // Buyer Info
  buyer_name: "MR. VED PRAKASH",
  buyer_company: "FSTC FLYING SCHOOL PVT. LTD.",
  buyer_email: "MM@FSTCFTO.IN",

  // Financial
  currency: "INR",
  exchange_rate: 88, // USD Rate Consideration
  subtotal: 894168.00,
  tax: 0,
  discount: 0,
  shipping: 0,
  total_amount: 894168.00,
  total_amount_inr: 894168.00,
  amount_paid: 894168.00,
  balance_due: 0,
  payment_status: "PAID",

  // Items
  items: [
    { sn: 1, product_name: "MOUNT KIT", part_number: "J-23502-1", quantity: 2, qty_ordered: 2, qty_delivered: 2, pending: 0, uom: "EA", unit_price: 69080.00, total_price: 138160.00, status: "Delivered" },
    { sn: 2, product_name: "HOSE ASSY.", part_number: "AE3663161G0164", quantity: 2, qty_ordered: 2, qty_delivered: 1, pending: 1, uom: "EA", unit_price: 11704.00, total_price: 11704.00, status: "Pending", description: "1 PENDING FROM ORDERED QUANTITY" },
    { sn: 3, product_name: "HOSE ASSY.", part_number: "AE6695H0180-180", quantity: 2, qty_ordered: 2, qty_delivered: 0, pending: 2, uom: "EA", unit_price: 82896.00, total_price: 0, status: "Pending", description: "2 PENDING FROM ORDERED QUANTITY" },
    { sn: 4, product_name: "HOSE ASSY.", part_number: "AE3663161H0184", quantity: 2, qty_ordered: 2, qty_delivered: 2, pending: 0, uom: "EA", unit_price: 15136.00, total_price: 30272.00, status: "Delivered" },
    { sn: 5, product_name: "HOSE ASSY.", part_number: "AE3663163E0240", quantity: 2, qty_ordered: 2, qty_delivered: 2, pending: 0, uom: "EA", unit_price: 13640.00, total_price: 27280.00, status: "Delivered" },
    { sn: 6, product_name: "HOSE ASSY.", part_number: "LW-12798-4S370", quantity: 2, qty_ordered: 2, qty_delivered: 2, pending: 0, uom: "EA", unit_price: 36344.00, total_price: 72688.00, status: "Delivered" },
    { sn: 7, product_name: "HOSE ASSY.", part_number: "LW-12798-4S172", quantity: 2, qty_ordered: 2, qty_delivered: 0, pending: 2, uom: "EA", unit_price: 25872.00, total_price: 0, status: "Pending", description: "2 PENDING FROM ORDERED QUANTITY" },
    { sn: 8, product_name: "HOSE ASSY.", part_number: "LW12799-6S180", quantity: 2, qty_ordered: 2, qty_delivered: 2, pending: 0, uom: "EA", unit_price: 30096.00, total_price: 60192.00, status: "Delivered" },
    { sn: 9, product_name: "THROTTLE ASSY", part_number: "6403", quantity: 2, qty_ordered: 2, qty_delivered: 2, pending: 0, uom: "EA", unit_price: 63008.00, total_price: 126016.00, status: "Delivered" },
    { sn: 10, product_name: "MIXTURE ASSY", part_number: "6404-1", quantity: 2, qty_ordered: 2, qty_delivered: 2, pending: 0, uom: "EA", unit_price: 61688.00, total_price: 123376.00, status: "Delivered" },
    { sn: 11, product_name: "Nut", part_number: "MS21045L7", quantity: 20, qty_ordered: 20, qty_delivered: 0, pending: 20, uom: "EA", unit_price: 308.00, total_price: 0, status: "Pending", description: "20 PENDING FROM ORDERED QUANTITY" },
    { sn: 12, product_name: "Attitude Gyro-OH-EX", part_number: "S3326-2 / 5000B-75/ 1U149-015-15", quantity: 1, qty_ordered: 1, qty_delivered: 0, pending: 1, uom: "EA", unit_price: 140800.00, total_price: 0, status: "Pending", description: "1 PENDING FROM ORDERED QUANTITY" },
    { sn: 13, product_name: "Lamp", part_number: "A-7512-24", quantity: 15, qty_ordered: 15, qty_delivered: 15, pending: 0, uom: "EA", unit_price: 12672.00, total_price: 190080.00, status: "Delivered" },
    { sn: 14, product_name: "Flap Motor", part_number: "C301002-121", quantity: 1, qty_ordered: 1, qty_delivered: 1, pending: 0, uom: "EA", unit_price: 114400.00, total_price: 114400.00, status: "Delivered" },
    { sn: 15, product_name: "Light Bar Assy-Flight Instrument", part_number: "S3312-1", quantity: 2, qty_ordered: 2, qty_delivered: 0, pending: 2, uom: "EA", unit_price: 13377.76, total_price: 0, status: "Pending", description: "2 PENDING FROM ORDERED QUANTITY" },
    { sn: 16, product_name: "Hinge", part_number: "0531103-3", quantity: 1, qty_ordered: 1, qty_delivered: 0, pending: 1, uom: "EA", unit_price: 48896.32, total_price: 0, status: "Pending", description: "1 PENDING FROM ORDERED QUANTITY" },
    { sn: 17, product_name: "Cockpit fire Ext.", part_number: "C421001-0201", quantity: 1, qty_ordered: 1, qty_delivered: 0, pending: 1, uom: "EA", unit_price: 65000.00, total_price: 0, status: "Pending", description: "1 PENDING FROM ORDERED QUANTITY" },
  ],

  // Original data for reference
  original_data: {
    invoice_type: "BILL OF SUPPLY",
    hss_number: "IN-DL33187594505974X",
    awb_number: "471868330253",
    quote_ref: "BYMAIL",
    quote_date: "26-Jul-25",
    shipping_method: "BYAIR",
    payment_terms: "100%PREPAID",
    usd_rate_consideration: 88,
    seller: {
      name: "KB ENTERPRISES",
      address: "PLOT NO 145 GF, POCKET 25 SECTOR 24 ROHINI EAST DELHI 110085",
      gstin: "07CARPR7906M1ZR",
      contact_person: "MR. NITIN",
      phone: "9315151910",
      email: "INFO@KBENTERPRISE.ORG"
    },
    buyer: {
      name: "FSTC FLYING SCHOOL PVT. LTD.",
      address: "AERODROME HANGER #1, SH-16A, VILL GUJRANI, BHIWANI, HRY-127031",
      gstin: "06AADCF7984L2ZZ",
      contact_person: "MR. VED PRAKASH",
      phone: "9897379477",
      email: "MM@FSTCFTO.IN"
    },
    ship_to: {
      name: "FSTC FLYING SCHOOL PVT. LTD.",
      address: "AERODROME HANGER #1, SH-16A, VILL GUJRANI, BHIWANI, HRY-127031",
      gstin: "06AADCF7984L2ZZ",
      contact_person: "MR. VED PRAKASH",
      phone: "9897379477",
      email: "MM@FSTCFTO.IN"
    },
    tax_breakdown: {
      "IGST @ 5%": 0,
      "IGST @ 18%": 0,
      "IGST @ 28%": 0,
      "Freight": 0,
      "Round Off": 0
    },
    bank_details: {
      bank: "ICICI bank ltd",
      account_no: "036705501190",
      branch: "Sec 11 Rohini",
      ifsc: "ICIC0000367"
    },
    total_qty_ordered: 61,
    total_qty_delivered: 31,
    total_qty_pending: 30,
    terms: [
      "Freight, Custom Clearance, Duty and CHA charges charged @ actual third party invoices.",
      "Freight charges @actual as per freight carrier invoices,",
      "Typo errors are subjected to correction and then considerable,"
    ]
  },

  notes: "Bill of Supply. Payment: 100% PREPAID. Shipping: BYAIR. AWB: 471868330253",
  tags: ["FSTC", "2025-26", "AVIATION", "BYAIR", "PARTIAL_DELIVERY"],
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
    console.log("Qty Ordered:", invoiceData.original_data.total_qty_ordered);
    console.log("Qty Delivered:", invoiceData.original_data.total_qty_delivered);
    console.log("Qty Pending:", invoiceData.original_data.total_qty_pending);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

addArchive();
