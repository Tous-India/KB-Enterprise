/**
 * Delete Users Script
 * Permanently removes specified users and ALL their related data
 *
 * Usage: node scripts/deleteUsers.js
 */

import mongoose from "mongoose";
import dns from "node:dns/promises";
import dotenv from "dotenv";

// Import all models
import User from "../src/modules/users/users.model.js";
import Order from "../src/modules/orders/orders.model.js";
 
import Quotation from "../src/modules/quotations/quotations.model.js";
import ProformaInvoice from "../src/modules/proformaInvoices/proformaInvoices.model.js";
import Invoice from "../src/modules/invoices/invoices.model.js";
import Dispatch from "../src/modules/dispatches/dispatches.model.js";
import Payment from "../src/modules/payments/payments.model.js";
import PaymentRecord from "../src/modules/paymentRecords/paymentRecords.model.js";
import Cart from "../src/modules/carts/carts.model.js";
import Statement from "../src/modules/statements/statements.model.js";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/kb_crm";

// Users to KEEP (all others will be deleted)
const USERS_TO_KEEP = [
  "kbenterprise5230@gmail.com",
  "nitin7284@hotmail.com",
];

const deleteUsers = async () => {
  try {
    // Set DNS servers for MongoDB Atlas
    dns.setServers(["1.1.1.1", "8.8.8.8"]);

    console.log("==========================================");
    console.log("KB CRM - Delete Users Script");
    console.log("==========================================\n");

    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB\n");

    // Find users to delete (everyone EXCEPT the ones to keep)
    const users = await User.find({ email: { $nin: USERS_TO_KEEP } });

    if (users.length === 0) {
      console.log("No users to delete. Only protected users exist.");
      process.exit(0);
    }

    console.log(`Keeping ${USERS_TO_KEEP.length} users:`);
    USERS_TO_KEEP.forEach((email) => console.log(`  + ${email}`));
    console.log("");

    console.log(`Found ${users.length} users to DELETE:\n`);
    users.forEach((user) => {
      console.log(`  - ${user.email} (${user.user_id})`);
    });
    console.log("");

    const userIds = users.map((u) => u._id);
    const summary = {};

    // 1. Delete Carts
    const cartsDeleted = await Cart.deleteMany({ user: { $in: userIds } });
    summary.carts = cartsDeleted.deletedCount;
    console.log(`Deleted ${cartsDeleted.deletedCount} carts`);

    // 2. Delete Payment Records
    const paymentRecordsDeleted = await PaymentRecord.deleteMany({
      buyer: { $in: userIds },
    });
    summary.paymentRecords = paymentRecordsDeleted.deletedCount;
    console.log(`Deleted ${paymentRecordsDeleted.deletedCount} payment records`);

    // 3. Delete Payments
    const paymentsDeleted = await Payment.deleteMany({
      buyer: { $in: userIds },
    });
    summary.payments = paymentsDeleted.deletedCount;
    console.log(`Deleted ${paymentsDeleted.deletedCount} payments`);

    // 4. Delete Dispatches (by buyer or by related orders/PIs)
    const orders = await Order.find({ buyer: { $in: userIds } });
    const orderIds = orders.map((o) => o._id);

    const pis = await ProformaInvoice.find({ buyer: { $in: userIds } });
    const piIds = pis.map((pi) => pi._id);

    const dispatchesDeleted = await Dispatch.deleteMany({
      $or: [
        { source: { $in: orderIds } },
        { source: { $in: piIds } },
      ],
    });
    summary.dispatches = dispatchesDeleted.deletedCount;
    console.log(`Deleted ${dispatchesDeleted.deletedCount} dispatches`);

    // 5. Delete Invoices
    const invoicesDeleted = await Invoice.deleteMany({
      buyer: { $in: userIds },
    });
    summary.invoices = invoicesDeleted.deletedCount;
    console.log(`Deleted ${invoicesDeleted.deletedCount} invoices`);

    // 6. Delete Proforma Invoices
    const pisDeleted = await ProformaInvoice.deleteMany({
      buyer: { $in: userIds },
    });
    summary.proformaInvoices = pisDeleted.deletedCount;
    console.log(`Deleted ${pisDeleted.deletedCount} proforma invoices`);

    // 7. Delete Quotations
    const quotationsDeleted = await Quotation.deleteMany({
      buyer: { $in: userIds },
    });
    summary.quotations = quotationsDeleted.deletedCount;
    console.log(`Deleted ${quotationsDeleted.deletedCount} quotations`);

    // 8. Delete Orders
    const ordersDeleted = await Order.deleteMany({
      buyer: { $in: userIds },
    });
    summary.orders = ordersDeleted.deletedCount;
    console.log(`Deleted ${ordersDeleted.deletedCount} orders`);

 
    // console.log(`Deleted ${posDeleted.deletedCount} purchase orders`);

    // 10. Delete Statements
    const statementsDeleted = await Statement.deleteMany({
      buyer: { $in: userIds },
    });
    summary.statements = statementsDeleted.deletedCount;
    console.log(`Deleted ${statementsDeleted.deletedCount} statements`);

    // 11. Finally, delete the Users
    const usersDeleted = await User.deleteMany({
      email: { $nin: USERS_TO_KEEP },
    });
    summary.users = usersDeleted.deletedCount;
    console.log(`Deleted ${usersDeleted.deletedCount} users`);

    // Summary
    console.log("\n==========================================");
    console.log("DELETION SUMMARY");
    console.log("==========================================");
    console.log(`Users:            ${summary.users}`);
    console.log(`Carts:            ${summary.carts}`);

    console.log(`Quotations:       ${summary.quotations}`);
    console.log(`Orders:           ${summary.orders}`);
    console.log(`Proforma Invoices:${summary.proformaInvoices}`);
    console.log(`Invoices:         ${summary.invoices}`);
    console.log(`Dispatches:       ${summary.dispatches}`);
    console.log(`Payments:         ${summary.payments}`);
    console.log(`Payment Records:  ${summary.paymentRecords}`);
    console.log(`Statements:       ${summary.statements}`);
    console.log("==========================================");
    console.log("All data deleted successfully!");
    console.log("==========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
};

deleteUsers();
