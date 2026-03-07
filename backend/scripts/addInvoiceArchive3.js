import mongoose from "mongoose";
import dns from "node:dns/promises";

// Set DNS for Atlas
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const MONGODB_URI = "mongodb+srv://kbenterprise5230_db_user:Trythekbenterprise123@cluster0.4jryl8r.mongodb.net/kb_crm?retryWrites=true&w=majority";

// Invoice Data from INVOICE KB/2025/07-02
const invoiceData = {
  document_type: "INVOICE",
  original_reference: "KB/2025/07-02",
  document_date: new Date("2025-07-24"),
  fiscal_year: "2025-26",

  // Buyer Info
  buyer_name: "MR. VED PRAKASH",
  buyer_company: "FSTC FLYING SCHOOL PVT. LTD.",
  buyer_email: "MM@FSTCFTO.IN",

  // Financial
  currency: "INR",
  exchange_rate: 1,
  subtotal: 371317.74,
  tax: 0,
  discount: 0,
  shipping: 0,
  total_amount: 371317.74,
  total_amount_inr: 371317.74,
  amount_paid: 371317.74,
  balance_due: 0,
  payment_status: "PAID",

  // Items
  items: [
    { sn: 1, product_name: "TUBE", part_number: "302-246-401", quantity: 2, uom: "EA", hsn_sac_code: "401390", unit_price: 10701, total_price: 21402 },
    { sn: 2, product_name: "GASKET", part_number: "LW12681", quantity: 50, uom: "EA", hsn_sac_code: "732690", unit_price: 174, total_price: 8700 },
    { sn: 3, product_name: "TIRE 4 PLY", part_number: "606C41B1", quantity: 7, uom: "EA", hsn_sac_code: "401130", unit_price: 14050.5, total_price: 98353.5 },
    { sn: 4, product_name: "SCREW", part_number: "MS35206-246", quantity: 20, uom: "EA", hsn_sac_code: "731815", unit_price: 8.7, total_price: 174 },
    { sn: 5, product_name: "FAIRING-LH MAIN LANDING", part_number: "1741005-59", quantity: 1, uom: "EA", hsn_sac_code: "392690", unit_price: 34883.52, total_price: 34883.52 },
    { sn: 6, product_name: "FAIRING-RH MAIN LANDING", part_number: "1741005-60", quantity: 1, uom: "EA", hsn_sac_code: "392690", unit_price: 36412.98, total_price: 36412.98 },
    { sn: 7, product_name: "TUBE ASSY- PARKING BRAKE", part_number: "0713070-50", quantity: 2, uom: "EA", hsn_sac_code: "880730", unit_price: 39966.06, total_price: 79932.12 },
    { sn: 8, product_name: "HINGE ASSY.", part_number: "0550364-9", quantity: 2, uom: "EA", hsn_sac_code: "880730", unit_price: 45729.81, total_price: 91459.62 },
  ],

  // Original data for reference
  original_data: {
    invoice_type: "INVOICE",
    order_ref: "BY MAIL",
    order_date: "02-Jul-25",
    shipping_method: "BY AIR",
    payment_terms: "Per email dtd. 02/07/2025",
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
      address: "AERODROME HANGER #1, SH-16A, VILLAGE GUJRANI, BHIWANI, HARYANA-127031",
      gstin: "06AADCF7984L2ZZ",
      contact_person: "MR. VED PRAKASH",
      phone: "9897379477",
      email: "MM@FSTCFTO.IN"
    },
    tax_breakdown: {
      "IGST @ 5%": 0,
      "IGST @ 28%": 0,
      "Duty": 0,
      "Freight": 0
    },
    total_qty: 85
  },

  notes: "Invoice. Payment: Per email dtd. 02/07/2025. Shipping: BY AIR",
  tags: ["FSTC", "2025-26", "AVIATION", "BYAIR"],
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
