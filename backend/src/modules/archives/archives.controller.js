import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";
import Archive from "./archives.model.js";
import catchAsync from "../../utils/catchAsync.js";
import ApiResponse from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";

// Helper to check if string is valid ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ===========================
// Multer Configuration for File Uploads
// ===========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/archives";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Allowed: PDF, Word, Excel, Images"), false);
  }
};

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter,
});

// ===========================
// GET /api/archives
// ===========================
// Admin only — fetch all archives with filters
// No pagination needed: bounded by legacy data volume
export const getAll = catchAsync(async (req, res) => {
  const {
    document_type,
    buyer_name,
    buyer_id,
    date_from,
    date_to,
    fiscal_year,
    payment_status,
    min_amount,
    max_amount,
    tags,
    search,
  } = req.query;

  const query = {};

  // Filter by document type
  if (document_type) {
    query.document_type = document_type;
  }

  // Filter by buyer name (partial match)
  if (buyer_name) {
    query.buyer_name = { $regex: buyer_name, $options: "i" };
  }

  // Filter by buyer ID
  if (buyer_id && isValidObjectId(buyer_id)) {
    query.buyer_id = buyer_id;
  }

  // Filter by date range
  if (date_from || date_to) {
    query.document_date = {};
    if (date_from) {
      query.document_date.$gte = new Date(date_from);
    }
    if (date_to) {
      query.document_date.$lte = new Date(date_to);
    }
  }

  // Filter by fiscal year
  if (fiscal_year) {
    query.fiscal_year = fiscal_year;
  }

  // Filter by payment status
  if (payment_status) {
    query.payment_status = payment_status;
  }

  // Filter by amount range
  if (min_amount || max_amount) {
    query.total_amount = {};
    if (min_amount) {
      query.total_amount.$gte = Number(min_amount);
    }
    if (max_amount) {
      query.total_amount.$lte = Number(max_amount);
    }
  }

  // Filter by tags
  if (tags) {
    const tagArray = tags.split(",").map((t) => t.trim());
    query.tags = { $in: tagArray };
  }

  // Text search
  if (search) {
    query.$or = [
      { original_reference: { $regex: search, $options: "i" } },
      { buyer_name: { $regex: search, $options: "i" } },
      { buyer_company: { $regex: search, $options: "i" } },
      { buyer_email: { $regex: search, $options: "i" } },
      { document_name: { $regex: search, $options: "i" } },
      { document_number: { $regex: search, $options: "i" } },
      { company_name: { $regex: search, $options: "i" } },
      { "items.part_number": { $regex: search, $options: "i" } },
      { "items.product_name": { $regex: search, $options: "i" } },
    ];
  }

  const archives = await Archive.find(query)
    .populate("buyer_id", "name email user_id")
    .populate("created_by", "name email")
    .sort({ document_date: -1 });

  return ApiResponse.success(res, { archives }, "Archives fetched");
});

// ===========================
// GET /api/archives/search
// ===========================
// Admin only — full-text search
export const search = catchAsync(async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    throw new AppError("Search query must be at least 2 characters", 400);
  }

  const archives = await Archive.find({
    $text: { $search: q },
  })
    .sort({ score: { $meta: "textScore" } })
    .select({ score: { $meta: "textScore" } })
    .populate("buyer_id", "name email user_id")
    .limit(100);

  return ApiResponse.success(res, { archives }, "Search results");
});

// ===========================
// GET /api/archives/stats
// ===========================
// Admin only — get summary statistics
export const getStats = catchAsync(async (req, res) => {
  const [
    totalCount,
    byType,
    byFiscalYear,
    byPaymentStatus,
    totalValueResult,
  ] = await Promise.all([
    Archive.countDocuments(),
    Archive.aggregate([
      { $group: { _id: "$document_type", count: { $sum: 1 } } },
    ]),
    Archive.aggregate([
      { $group: { _id: "$fiscal_year", count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]),
    Archive.aggregate([
      { $group: { _id: "$payment_status", count: { $sum: 1 } } },
    ]),
    Archive.aggregate([
      { $group: { _id: null, total: { $sum: "$total_amount" } } },
    ]),
  ]);

  // Format results
  const by_type = {};
  byType.forEach((item) => {
    by_type[item._id] = item.count;
  });

  const by_fiscal_year = {};
  byFiscalYear.forEach((item) => {
    if (item._id) {
      by_fiscal_year[item._id] = item.count;
    }
  });

  const by_payment_status = {};
  byPaymentStatus.forEach((item) => {
    by_payment_status[item._id] = item.count;
  });

  const totalValue = totalValueResult[0]?.total || 0;

  return ApiResponse.success(
    res,
    {
      stats: {
        total_archives: totalCount,
        by_type,
        by_fiscal_year,
        by_payment_status,
        total_value: totalValue,
      },
    },
    "Archive stats fetched"
  );
});

// ===========================
// GET /api/archives/:id
// ===========================
// Admin only — get archive by ID
export const getById = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Build query based on whether ID is valid ObjectId
  const query = isValidObjectId(id)
    ? { $or: [{ _id: id }, { archive_id: id }] }
    : { archive_id: id };

  const archive = await Archive.findOne(query)
    .populate("buyer_id", "name email user_id company_details")
    .populate("created_by", "name email")
    .populate("updated_by", "name email");

  if (!archive) {
    throw new AppError("Archive not found", 404);
  }

  return ApiResponse.success(res, { archive }, "Archive fetched");
});

// ===========================
// POST /api/archives
// ===========================
// Admin only — create new archive entry
export const create = catchAsync(async (req, res) => {
  const {
    document_type,
    original_reference,
    document_date,
    fiscal_year,
    buyer_name,
    buyer_email,
    buyer_company,
    buyer_id,
    currency,
    exchange_rate,
    subtotal,
    tax,
    discount,
    shipping,
    total_amount,
    total_amount_inr,
    amount_paid,
    balance_due,
    payment_status,
    items,
    original_data,
    notes,
    internal_notes,
    tags,
    source_system,
  } = req.body || {};

  if (!document_type) {
    throw new AppError("Document type is required", 400);
  }

  const archiveData = {
    document_type,
    original_reference,
    document_date: document_date ? new Date(document_date) : new Date(),
    fiscal_year,
    buyer_name,
    buyer_email,
    buyer_company,
    buyer_id: buyer_id && isValidObjectId(buyer_id) ? buyer_id : undefined,
    currency: currency || "USD",
    exchange_rate: exchange_rate || 83.5,
    subtotal: subtotal || 0,
    tax: tax || 0,
    discount: discount || 0,
    shipping: shipping || 0,
    total_amount: total_amount || 0,
    total_amount_inr: total_amount_inr || 0,
    amount_paid: amount_paid || 0,
    balance_due: balance_due || 0,
    payment_status: payment_status || "PAID",
    items: items || [],
    original_data: original_data || {},
    notes,
    internal_notes,
    tags: tags || [],
    source_system: source_system || "LEGACY",
    created_by: req.user._id,
  };

  const archive = await Archive.create(archiveData);

  return ApiResponse.created(res, { archive }, "Archive created");
});

// ===========================
// POST /api/archives/bulk
// ===========================
// Admin only — bulk import archives
export const bulkImport = catchAsync(async (req, res) => {
  const { archives } = req.body || {};

  if (!archives || !Array.isArray(archives) || archives.length === 0) {
    throw new AppError("Archives array is required", 400);
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  // Process each archive
  for (let i = 0; i < archives.length; i++) {
    try {
      const data = archives[i];

      const archiveData = {
        document_type: data.document_type || "INVOICE",
        original_reference: data.original_reference,
        document_date: data.document_date ? new Date(data.document_date) : new Date(),
        fiscal_year: data.fiscal_year,
        buyer_name: data.buyer_name,
        buyer_email: data.buyer_email,
        buyer_company: data.buyer_company,
        buyer_id: data.buyer_id && isValidObjectId(data.buyer_id) ? data.buyer_id : undefined,
        currency: data.currency || "USD",
        exchange_rate: data.exchange_rate || 83.5,
        subtotal: data.subtotal || 0,
        tax: data.tax || 0,
        discount: data.discount || 0,
        shipping: data.shipping || 0,
        total_amount: data.total_amount || 0,
        total_amount_inr: data.total_amount_inr || 0,
        amount_paid: data.amount_paid || 0,
        balance_due: data.balance_due || 0,
        payment_status: data.payment_status || "PAID",
        items: data.items || [],
        original_data: data.original_data || data,
        notes: data.notes,
        internal_notes: data.internal_notes,
        tags: data.tags || ["legacy", "bulk-import"],
        source_system: data.source_system || "LEGACY",
        created_by: req.user._id,
      };

      await Archive.create(archiveData);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        index: i,
        reference: archives[i]?.original_reference || `Record ${i}`,
        error: error.message,
      });
    }
  }

  return ApiResponse.success(
    res,
    { results },
    `Imported ${results.success} archives, ${results.failed} failed`
  );
});

// ===========================
// PUT /api/archives/:id
// ===========================
// Admin only — update archive
export const update = catchAsync(async (req, res) => {
  const { id } = req.params;

  const query = isValidObjectId(id)
    ? { $or: [{ _id: id }, { archive_id: id }] }
    : { archive_id: id };

  const archive = await Archive.findOne(query);

  if (!archive) {
    throw new AppError("Archive not found", 404);
  }

  // Updateable fields
  const updateFields = [
    "document_type",
    "original_reference",
    "document_date",
    "fiscal_year",
    "buyer_name",
    "buyer_email",
    "buyer_company",
    "buyer_id",
    "currency",
    "exchange_rate",
    "subtotal",
    "tax",
    "discount",
    "shipping",
    "total_amount",
    "total_amount_inr",
    "amount_paid",
    "balance_due",
    "payment_status",
    "items",
    "original_data",
    "notes",
    "internal_notes",
    "tags",
  ];

  updateFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (field === "document_date" && req.body[field]) {
        archive[field] = new Date(req.body[field]);
      } else if (field === "buyer_id") {
        archive[field] = isValidObjectId(req.body[field]) ? req.body[field] : archive[field];
      } else {
        archive[field] = req.body[field];
      }
    }
  });

  archive.updated_by = req.user._id;
  await archive.save();

  return ApiResponse.success(res, { archive }, "Archive updated");
});

// ===========================
// DELETE /api/archives/:id
// ===========================
// Admin only — delete archive
export const remove = catchAsync(async (req, res) => {
  const { id } = req.params;

  const query = isValidObjectId(id)
    ? { $or: [{ _id: id }, { archive_id: id }] }
    : { archive_id: id };

  const archive = await Archive.findOne(query);

  if (!archive) {
    throw new AppError("Archive not found", 404);
  }

  await Archive.deleteOne({ _id: archive._id });

  return ApiResponse.success(res, null, "Archive deleted");
});

// ===========================
// GET /api/archives/fiscal-years
// ===========================
// Admin only — get list of fiscal years
export const getFiscalYears = catchAsync(async (req, res) => {
  const fiscalYears = await Archive.distinct("fiscal_year");

  // Sort in descending order
  fiscalYears.sort((a, b) => {
    if (!a) return 1;
    if (!b) return -1;
    return b.localeCompare(a);
  });

  return ApiResponse.success(res, { fiscal_years: fiscalYears }, "Fiscal years fetched");
});

// ===========================
// GET /api/archives/buyers
// ===========================
// Admin only — get list of unique buyers
export const getBuyers = catchAsync(async (req, res) => {
  const buyers = await Archive.aggregate([
    {
      $group: {
        _id: "$buyer_name",
        buyer_email: { $first: "$buyer_email" },
        buyer_company: { $first: "$buyer_company" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return ApiResponse.success(res, { buyers }, "Buyers fetched");
});

// ===========================
// POST /api/archives/upload
// ===========================
// Admin only — create archive with file upload
export const createWithFile = catchAsync(async (req, res) => {
  const {
    document_type,
    document_date,
    company_name,
    document_name,
    document_number,
    notes,
    fiscal_year,
  } = req.body || {};

  // Validation
  if (!document_type) {
    throw new AppError("Document type is required", 400);
  }
  if (!document_date) {
    throw new AppError("Document date is required", 400);
  }
  if (!company_name) {
    throw new AppError("Company name is required", 400);
  }
  if (!document_name) {
    throw new AppError("Document name is required", 400);
  }
  if (!document_number) {
    throw new AppError("Document number is required", 400);
  }

  const archiveData = {
    document_type,
    document_date: new Date(document_date),
    company_name,
    document_name,
    document_number,
    buyer_name: company_name, // Also set buyer_name for consistency
    notes: notes || "",
    fiscal_year: fiscal_year || "",
    source_system: "MANUAL_UPLOAD",
    tags: ["manual-upload"],
    created_by: req.user._id,
  };

  // Handle file upload
  if (req.file) {
    archiveData.file = {
      filename: req.file.originalname,
      path: `/uploads/archives/${req.file.filename}`,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploaded_at: new Date(),
    };
  }

  const archive = await Archive.create(archiveData);

  return ApiResponse.created(res, { archive }, "Archive created successfully");
});

// ===========================
// GET /api/archives/download/:id
// ===========================
// Admin only — download archive file
export const downloadFile = catchAsync(async (req, res) => {
  const { id } = req.params;

  const query = isValidObjectId(id)
    ? { $or: [{ _id: id }, { archive_id: id }] }
    : { archive_id: id };

  const archive = await Archive.findOne(query);

  if (!archive) {
    throw new AppError("Archive not found", 404);
  }

  if (!archive.file || !archive.file.path) {
    throw new AppError("No file attached to this archive", 404);
  }

  const filePath = path.join(process.cwd(), archive.file.path);

  if (!fs.existsSync(filePath)) {
    throw new AppError("File not found on server", 404);
  }

  res.download(filePath, archive.file.filename);
});
