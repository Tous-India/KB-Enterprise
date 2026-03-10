import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Tooltip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Stack,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  FileDownload as DownloadIcon,
  Print as PrintIcon,
  Assessment as StatsIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import html2pdf from 'html2pdf.js';
import archivesService from '../../services/archives.service';
import useArchivesStore from '../../stores/useArchivesStore';

const DOCUMENT_TYPES = ['INVOICE', 'ORDER', 'QUOTATION', 'PI', 'PO', 'PAYMENT', 'OTHER'];
const PAYMENT_STATUSES = ['PAID', 'PARTIAL', 'UNPAID', 'REFUNDED', 'CANCELLED'];

// Document types for manual upload
const UPLOAD_DOC_TYPES = [
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'PI', label: 'Proforma Invoice (PI)' },
  { value: 'PO', label: 'Purchase Order (PO)' },
  { value: 'QUOTATION', label: 'Quotation' },
  { value: 'OTHER', label: 'Other' },
];

// Helper function to convert number to words (Indian format)
const numberToWords = (num) => {
  if (num === 0) return 'ZERO';

  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
    'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  const numToWords = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 ? ' ' + numToWords(n % 100) : '');
    if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 ? ' ' + numToWords(n % 1000) : '');
    if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' LAKH' + (n % 100000 ? ' ' + numToWords(n % 100000) : '');
    return numToWords(Math.floor(n / 10000000)) + ' CRORE' + (n % 10000000 ? ' ' + numToWords(n % 10000000) : '');
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let result = numToWords(rupees) + ' RUPEE';
  if (paise > 0) {
    result += ' AND ' + numToWords(paise) + ' PAISE';
  }
  return result;
};

// Generate print HTML with proper styling
const generatePrintHTML = (archive) => {
  const items = archive.items || [];
  const seller = archive.original_data?.seller || {};
  const buyer = archive.original_data?.buyer || {};
  const shipTo = archive.original_data?.ship_to || {};
  const taxBreakdown = archive.original_data?.tax_breakdown || {};
  const bankDetails = archive.original_data?.bank_details || {};
  const terms = archive.original_data?.terms || [];

  // Detect if this invoice has qty_ordered/qty_delivered/pending columns
  const hasDeliveryTracking = items.some(item => item.qty_ordered !== undefined || item.qty_delivered !== undefined);
  const isHighSeaSale = archive.original_data?.invoice_type === 'BILL OF SUPPLY - HIGH SEA SALE';
  const hasShipTo = shipTo.name || shipTo.address;

  // Calculate totals
  const totalQtyOrdered = archive.original_data?.total_qty_ordered || items.reduce((sum, item) => sum + (item.qty_ordered || item.quantity || 0), 0);
  const totalQtyDelivered = archive.original_data?.total_qty_delivered || items.reduce((sum, item) => sum + (item.qty_delivered || 0), 0);
  const totalQtyPending = archive.original_data?.total_qty_pending || items.reduce((sum, item) => sum + (item.pending || 0), 0);
  const totalQty = archive.original_data?.total_qty || totalQtyOrdered;

  const docDate = archive.document_date ? new Date(archive.document_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '';
  const shippingMethod = archive.original_data?.shipping_method || '';

  // Default terms if not provided
  const defaultTerms = [
    "IGST as per applicable",
    "Freight, Custom Clearance, Duty and CHA charges charged @actual third party invoices",
    "Freight charges @actual as per freight carrier invoices",
    "Typo errors are subjected to correction and then considerable",
    "Bank Charges extra (as per actual)"
  ];
  const displayTerms = terms.length > 0 ? terms : defaultTerms;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${archive.original_reference || archive.archive_id}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11px; padding: 15px; background: white; }
        table { border-collapse: collapse; width: 100%; }
        .header { display: flex; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
        .logo { width: 60px; height: 60px; border: 2px solid #000; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; margin-right: 15px; }
        .title { flex: 1; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; }
        .subtitle { text-align: center; font-weight: bold; text-decoration: underline; border-bottom: 1px solid #000; padding: 5px 0; margin-bottom: 10px; }
        .info-section { display: flex; border: 1px solid #000; margin-bottom: 10px; }
        .info-box { flex: 1; padding: 8px; border-right: 1px solid #000; font-size: 10px; }
        .info-box:last-child { border-right: none; }
        .label { font-weight: bold; text-decoration: underline; margin-bottom: 3px; }
        .company { font-weight: bold; font-size: 11px; }
        .highlight-row { background: #ffff00; }
        .details-row { display: flex; border: 1px solid #000; margin-bottom: 10px; font-size: 10px; }
        .details-cell { padding: 5px 8px; border-right: 1px solid #000; }
        .details-cell:last-child { border-right: none; }
        .details-cell.gray { background: #f0f0f0; }
        .items-table { border: 1px solid #000; margin-bottom: 10px; }
        .items-table th, .items-table td { border: 1px solid #ccc; padding: 3px 5px; font-size: 9px; }
        .items-table th { background: #ffff00; font-weight: bold; }
        .items-table tr:nth-child(even) { background: #fafafa; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .pending { color: #ed6c02; }
        .delivered { color: #2e7d32; }
        .summary-section { display: flex; gap: 15px; margin-bottom: 10px; }
        .summary-left { flex: 1; }
        .summary-right { width: 40%; }
        .total-box { border: 1px solid #000; padding: 8px; }
        .total-box.no-top { border-top: none; }
        .tax-table { border: 1px solid #000; }
        .tax-table td { border: 1px solid #000; padding: 3px 8px; font-size: 10px; }
        .tax-table .highlight { background: #f0f0f0; font-weight: bold; }
        .terms { margin-bottom: 10px; }
        .terms-title { font-weight: bold; text-decoration: underline; margin-bottom: 3px; }
        .terms p { font-size: 9px; margin: 2px 0; }
        .footer { display: flex; justify-content: space-between; margin-top: 15px; }
        .bank-details { font-size: 10px; }
        .bank-table { border: 1px solid #000; }
        .bank-table td { border: 1px solid #000; padding: 3px 8px; font-size: 10px; }
        .signature-box { border: 1px solid #000; padding: 10px 20px; text-align: center; min-width: 160px; }
        .signature-name { font-style: italic; margin-top: 25px; font-size: 12px; }
        @media print { body { padding: 10px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">KB</div>
        <div class="title">BILL OF SUPPLY</div>
      </div>

      ${isHighSeaSale ? '<div class="subtitle">HIGH SEA SALE</div>' : ''}

      <div class="info-section">
        <div class="info-box">
          <div class="label">FROM:-</div>
          <div class="company">${seller.name || 'KB ENTERPRISES'}</div>
          <div>${seller.address || 'PLOT NO 145 GF POCKET 25 SECTOR 24 ROHINI EAST DELHI 110085'}</div>
          <div>GSTIN – ${seller.gstin || '07CARPR7906M1ZR'}</div>
          <div>ATTN.:- ${seller.contact_person || 'MR. NITIN'}, ${seller.phone || '9315151910'}</div>
          <div>EMAIL:- ${seller.email || 'INFO@KBENTERPRISE.ORG'}</div>
          ${archive.original_data?.hss_number ? `<div style="background:#ffff00;margin-top:3px"><strong>HSS:-</strong> ${archive.original_data.hss_number}</div>` : ''}
        </div>
        <div class="info-box">
          <div class="label">BILL TO:-</div>
          <div class="company">${archive.buyer_company || ''}</div>
          <div>${buyer.address || ''}</div>
          <div>GSTIN- ${buyer.gstin || ''}</div>
          <div>ATTN.:- ${archive.buyer_name || ''}</div>
          <div>CONTACT:- ${buyer.phone || ''}</div>
          <div>EMAIL:- ${archive.buyer_email || ''}</div>
          ${archive.original_data?.awb_number ? `<div style="background:#ffff00;margin-top:3px"><strong>AWB NO:-</strong> ${archive.original_data.awb_number}</div>` : ''}
        </div>
        <div class="info-box">
          <div class="label">SHIP TO:-</div>
          ${hasShipTo ? `
            <div class="company">${shipTo.name || ''}</div>
            <div>${shipTo.address || ''}</div>
            <div>GSTIN- ${shipTo.gstin || ''}</div>
            <div>ATTN.:- ${shipTo.contact_person || ''}</div>
            <div>CONTACT:- ${shipTo.phone || ''}</div>
            <div>EMAIL:- ${shipTo.email || ''}</div>
          ` : ''}
          ${archive.original_data?.usd_rate_consideration ? `<div style="background:#ffff00;margin-top:3px"><strong>USD RATE CONSIDERATION</strong> ${archive.original_data.usd_rate_consideration}</div>` : ''}
        </div>
      </div>

      <div class="details-row">
        <div class="details-cell gray" style="width:10%"><strong>QuoteRef.:-</strong><br><strong>Dated:-</strong></div>
        <div class="details-cell" style="width:12%">${archive.original_data?.quote_ref || 'BYMAIL'}<br>${archive.original_data?.quote_date || ''}</div>
        <div class="details-cell gray" style="width:10%"><strong>Invoice No.:-</strong><br><strong>Dated:-</strong></div>
        <div class="details-cell" style="width:15%;background:#ffff00"><strong>${archive.original_reference || ''}</strong><br>${docDate}</div>
        <div class="details-cell gray" style="width:10%"><strong>Shipping:-</strong><br><strong>Payment:-</strong></div>
        <div class="details-cell" style="flex:1;background:#ffff00"><strong>${shippingMethod}</strong><br><strong>${archive.original_data?.payment_terms || '100%PREPAID'}</strong></div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th style="width:3%">S/n.</th>
            <th style="width:18%">Item Description</th>
            <th style="width:15%">Part Number</th>
            ${hasDeliveryTracking ? `
              <th style="width:6%" class="text-center">Qty. Order</th>
              <th style="width:6%" class="text-center">Qty delivered</th>
              <th style="width:5%" class="text-center">Pending</th>
            ` : `
              <th style="width:6%" class="text-center">Qty.</th>
            `}
            <th style="width:4%" class="text-center">UOM</th>
            <th style="width:8%" class="text-center">STATUS</th>
            <th style="width:10%" class="text-right">UNIT PRICE INR</th>
            <th style="width:12%" class="text-right">TOTAL PRICE INR</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, index) => {
            const isPending = (item.pending > 0) || item.status === 'Pending' || item.description?.includes('PENDING');
            return `
            <tr>
              <td>${item.sn || index + 1}</td>
              <td>${item.product_name || ''}</td>
              <td>${item.part_number || ''}</td>
              ${hasDeliveryTracking ? `
                <td class="text-center">${item.qty_ordered ?? item.quantity ?? ''}</td>
                <td class="text-center">${item.qty_delivered ?? ''}</td>
                <td class="text-center">${item.pending ?? ''}</td>
              ` : `
                <td class="text-center">${item.quantity || ''}</td>
              `}
              <td class="text-center">${item.uom || 'EA'}</td>
              <td class="text-center ${isPending ? 'pending' : 'delivered'}">
                ${isPending ? 'Pending' : 'Delivered'}
              </td>
              <td class="text-right">${(item.unit_price || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
              <td class="text-right">${(item.total_price || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            </tr>
          `}).join('')}
          ${hasDeliveryTracking ? `
            <tr style="font-weight:bold;background:#f0f0f0">
              <td colspan="3" class="text-right">TOTAL</td>
              <td class="text-center">${totalQtyOrdered}</td>
              <td class="text-center">${totalQtyDelivered}</td>
              <td class="text-center">${totalQtyPending}</td>
              <td colspan="4"></td>
            </tr>
          ` : ''}
        </tbody>
      </table>

      <div class="summary-section">
        <div class="summary-left">
          ${!hasDeliveryTracking ? `
            <div class="total-box" style="display:flex;justify-content:space-between">
              <strong>TOTAL QTY:</strong>
              <strong>${totalQty}</strong>
            </div>
          ` : ''}
          <div class="total-box ${!hasDeliveryTracking ? 'no-top' : ''}">
            <strong>AMOUNT IN INR</strong><br>
            ${numberToWords(archive.total_amount || 0)}
          </div>
          <div class="terms" style="margin-top:10px">
            <div class="terms-title">QuotTerms:-</div>
            ${displayTerms.map((term, i) => `<p>${i + 1}. ${term}</p>`).join('')}
          </div>
        </div>
        <div class="summary-right">
          <table class="tax-table">
            <tr><td colspan="2" class="text-right"><strong>TOTAL</strong></td><td class="text-right"><strong>${(archive.total_amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</strong></td></tr>
            <tr><td colspan="2"><strong>IGST@5%:-</strong></td><td class="text-right">${(taxBreakdown['IGST @ 5%'] || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>
            <tr><td colspan="2"><strong>IGST@18%:-</strong></td><td class="text-right">${(taxBreakdown['IGST @ 18%'] || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>
            <tr><td colspan="2"><strong>IGST@28%:-</strong></td><td class="text-right">${(taxBreakdown['IGST @ 28%'] || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>
            <tr><td colspan="2"><strong>Freight:-</strong></td><td class="text-right">${(taxBreakdown['Freight'] || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>
            <tr><td colspan="2"><strong>Round Off:-</strong></td><td class="text-right"></td></tr>
            <tr class="highlight"><td colspan="2"><strong>GrandTotal:-</strong></td><td class="text-right"><strong>${(archive.total_amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</strong></td></tr>
          </table>
          <div class="signature-box" style="margin-top:10px">
            <div>For KB ENTERPRISES</div>
            <div style="margin-top:30px"><strong>AUTH. SIGNATORY</strong></div>
          </div>
        </div>
      </div>

      <div class="footer">
        <table class="bank-table">
          <tr>
            <td><strong>Bank</strong></td>
            <td>${bankDetails.bank || 'ICICI bank ltd'}</td>
            <td><strong>Branch</strong></td>
            <td>${bankDetails.branch || 'Sec 11 Rohini'}</td>
          </tr>
          <tr>
            <td><strong>Acc no</strong></td>
            <td>${bankDetails.account_no || '036705501190'}</td>
            <td><strong>IFSC</strong></td>
            <td>${bankDetails.ifsc || 'ICIC0000367'}</td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;
};

// Print function - opens in new window
const handlePrint = (archive) => {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(generatePrintHTML(archive));
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 300);
};

const Archives = () => {
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Create modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [createForm, setCreateForm] = useState({
    document_type: '',
    document_date: '',
    company_name: '',
    document_name: '',
    document_number: '',
    notes: '',
  });

  const {
    filters,
    setFilter,
    resetFilters,
    selectedArchive,
    isDetailModalOpen,
    closeDetailModal,
    openDetailModal,
    isDeleteDialogOpen,
    openDeleteDialog,
    closeDeleteDialog,
    stats,
    setStats,
    fiscalYears,
    setFiscalYears,
    buyers,
    setBuyers,
    getQueryParams,
    getActiveFiltersCount,
  } = useArchivesStore();

  // Fetch archives
  const fetchArchives = useCallback(async () => {
    setLoading(true);
    try {
      const params = getQueryParams();
      const result = await archivesService.getAll(params);

      if (result.success) {
        setArchives(result.data.archives || []);
      } else {
        toast.error(result.error);
        setArchives([]);
      }
    } catch (error) {
      console.error('Error fetching archives:', error);
      toast.error('Failed to fetch archives');
    } finally {
      setLoading(false);
    }
  }, [getQueryParams]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const result = await archivesService.getStats();
      if (result.success) {
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [setStats]);

  // Fetch fiscal years
  const fetchFiscalYears = useCallback(async () => {
    try {
      const result = await archivesService.getFiscalYears();
      if (result.success) {
        setFiscalYears(result.data.fiscal_years || []);
      }
    } catch (error) {
      console.error('Error fetching fiscal years:', error);
    }
  }, [setFiscalYears]);

  // Fetch buyers
  const fetchBuyers = useCallback(async () => {
    try {
      const result = await archivesService.getBuyers();
      if (result.success) {
        setBuyers(result.data.buyers || []);
      }
    } catch (error) {
      console.error('Error fetching buyers:', error);
    }
  }, [setBuyers]);

  // Initial load
  useEffect(() => {
    fetchArchives();
    fetchStats();
    fetchFiscalYears();
    fetchBuyers();
  }, [fetchArchives, fetchStats, fetchFiscalYears, fetchBuyers]);

  // Handle delete
  const handleDelete = async () => {
    if (!selectedArchive) return;

    try {
      const result = await archivesService.delete(selectedArchive._id);
      if (result.success) {
        toast.success('Archive deleted successfully');
        closeDeleteDialog();
        fetchArchives();
        fetchStats();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Error deleting archive:', error);
      toast.error('Failed to delete archive');
    }
  };

  // Handle search
  const handleSearch = () => {
    fetchArchives();
  };

  // Handle clear filters
  const handleClearFilters = () => {
    resetFilters();
    setTimeout(() => fetchArchives(), 100);
  };

  // Handle create form change
  const handleCreateFormChange = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload PDF, Word, or Excel files only.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit.');
        return;
      }
      setSelectedFile(file);
    }
  };

  // Handle create archive submit
  const handleCreateArchive = async () => {
    // Validate required fields
    if (!createForm.document_type || !createForm.document_date || !createForm.company_name ||
        !createForm.document_name || !createForm.document_number || !selectedFile) {
      toast.error('Please fill in all required fields and upload a file.');
      return;
    }

    setCreateLoading(true);
    try {
      const formData = new FormData();
      formData.append('document_type', createForm.document_type);
      formData.append('document_date', createForm.document_date);
      formData.append('company_name', createForm.company_name);
      formData.append('document_name', createForm.document_name);
      formData.append('document_number', createForm.document_number);
      formData.append('notes', createForm.notes || '');
      formData.append('file', selectedFile);

      const result = await archivesService.createWithFile(formData);
      if (result.success) {
        toast.success('Archive created successfully');
        setIsCreateOpen(false);
        setCreateForm({
          document_type: '',
          document_date: '',
          company_name: '',
          document_name: '',
          document_number: '',
          notes: '',
        });
        setSelectedFile(null);
        fetchArchives();
        fetchStats();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Error creating archive:', error);
      toast.error('Failed to create archive');
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle close create modal
  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    setCreateForm({
      document_type: '',
      document_date: '',
      company_name: '',
      document_name: '',
      document_number: '',
      notes: '',
    });
    setSelectedFile(null);
  };

  // DataGrid columns
  const columns = [
    {
      field: 'archive_id',
      headerName: 'Archive ID',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      field: 'document_type',
      headerName: 'Type',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === 'INVOICE' ? 'success' :
            params.value === 'ORDER' ? 'primary' :
            params.value === 'QUOTATION' ? 'info' :
            'default'
          }
        />
      ),
    },
    {
      field: 'original_reference',
      headerName: 'Reference',
      width: 150,
    },
    {
      field: 'buyer_name',
      headerName: 'Buyer',
      width: 180,
    },
    {
      field: 'document_date',
      headerName: 'Date',
      width: 120,
      valueFormatter: (params) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleDateString();
      },
    },
    {
      field: 'fiscal_year',
      headerName: 'FY',
      width: 100,
    },
    {
      field: 'total_amount',
      headerName: 'Amount (USD)',
      width: 130,
      valueFormatter: (params) => {
        return `$${params.value?.toLocaleString() || 0}`;
      },
    },
    {
      field: 'payment_status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === 'PAID' ? 'success' :
            params.value === 'PARTIAL' ? 'warning' :
            params.value === 'UNPAID' ? 'error' :
            'default'
          }
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => openDetailModal(params.row)}
              color="primary"
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {params.row.file?.path && (
            <Tooltip title="Download File">
              <IconButton
                size="small"
                onClick={() => archivesService.downloadFile(params.row.file.path)}
                color="success"
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => openDeleteDialog(params.row)}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box className="p-0">
      {/* Header */}
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h4" className="font-bold">
          Archives
        </Typography>
        <Box className="flex gap-2">
          <Button
            variant="outlined"
            startIcon={<StatsIcon />}
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? 'Hide Stats' : 'Show Stats'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsCreateOpen(true)}
          >
            Add Archive
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      {showStats && stats && (
        <Grid container spacing={3} className="mb-6">
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Archives
                </Typography>
                <Typography variant="h4">{stats.total_archives || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Value
                </Typography>
                <Typography variant="h4">
                  ${(stats.total_value || 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  By Type
                </Typography>
                {stats.by_type && Object.entries(stats.by_type).map(([type, count]) => (
                  <Typography key={type} variant="body2">
                    {type}: {count}
                  </Typography>
                ))}
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{xs:12, md:23}}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  By Status
                </Typography>
                {stats.by_payment_status && Object.entries(stats.by_payment_status).map(([status, count]) => (
                  <Typography key={status} variant="body2">
                    {status}: {count}
                  </Typography>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper className="p-4 mb-4">
        <Box className="flex items-center justify-between mb-4">
          <Typography variant="h6" className="flex items-center gap-2">
            <FilterIcon /> Filters
            {getActiveFiltersCount() > 0 && (
              <Chip
                label={`${getActiveFiltersCount()} active`}
                size="small"
                color="primary"
              />
            )}
          </Typography>
          <Button
            size="small"
            startIcon={<ClearIcon />}
            onClick={handleClearFilters}
            disabled={getActiveFiltersCount() === 0}
          >
            Clear All
          </Button>
        </Box>

        {/* Search Bar - Full Width at Top */}
        <TextField
          fullWidth
          size="small"
          label="Search"
          placeholder="Search by reference, buyer name, part number, items..."
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          InputProps={{
            endAdornment: (
              <IconButton
                size="small"
                onClick={handleSearch}
                disabled={loading}
              >
                <SearchIcon />
              </IconButton>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Filter Fields */}
        <Grid container spacing={2}>
          {/* Document Type */}
          <Grid size={{xs:6, md:2}}>
            <TextField
              select
              fullWidth
              size="small"
              label="Document Type"
              value={filters.document_type}
              onChange={(e) => setFilter('document_type', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {DOCUMENT_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Fiscal Year */}
          <Grid size={{xs:6, md:2}}>
            <TextField
              select
              fullWidth
              size="small"
              label="Fiscal Year"
              value={filters.fiscal_year}
              onChange={(e) => setFilter('fiscal_year', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {fiscalYears.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Payment Status */}
          <Grid size={{xs:6, md:2}}>
            <TextField
              select
              fullWidth
              size="small"
              label="Payment Status"
              value={filters.payment_status}
              onChange={(e) => setFilter('payment_status', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {PAYMENT_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
          </Grid>


          {/* Date From */}
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Date From"
              value={filters.date_from || ''}
              onChange={(e) => setFilter('date_from', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Date To */}
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Date To"
              value={filters.date_to || ''}
              onChange={(e) => setFilter('date_to', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Min Amount */}
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Min Amount (USD)"
              value={filters.min_amount}
              onChange={(e) => setFilter('min_amount', e.target.value)}
            />
          </Grid>

          {/* Max Amount */}
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Max Amount (USD)"
              value={filters.max_amount}
              onChange={(e) => setFilter('max_amount', e.target.value)}
            />
          </Grid>

          {/* Apply Filters Button */}
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              startIcon={<FilterIcon />}
              disabled={loading}
            >
              Apply Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Data Table */}
      <Paper className="p-4">
        <DataGrid
          rows={archives}
          columns={columns}
          pageSize={20}
          rowsPerPageOptions={[20, 50, 100]}
          autoHeight
          loading={loading}
          getRowId={(row) => row._id}
          disableSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
          }}
        />
      </Paper>

      {/* Detail Modal - PDF Preview Only */}
      <Dialog
        open={isDetailModalOpen}
        onClose={closeDetailModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { maxHeight: '95vh' } }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
          {selectedArchive && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {selectedArchive.document_name || selectedArchive.original_reference || 'Archive Document'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                <Chip label={selectedArchive.document_type} size="small" color="primary" />
                <Typography variant="body2" color="textSecondary">
                  {selectedArchive.company_name || selectedArchive.buyer_company}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedArchive.document_number}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedArchive.document_date ? new Date(selectedArchive.document_date).toLocaleDateString() : ''}
                </Typography>
              </Box>
              {selectedArchive.notes && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Notes: {selectedArchive.notes}
                </Typography>
              )}
            </Box>
          )}
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: '#f5f5f5' }}>
          {selectedArchive && (
            <Box sx={{ height: 'calc(95vh - 200px)', minHeight: 500 }}>
              {selectedArchive.file?.path ? (
                selectedArchive.file.mimetype === 'application/pdf' ? (
                  <iframe
                    src={selectedArchive.file.path}
                    width="100%"
                    height="100%"
                    title="PDF Preview"
                    style={{ border: 'none' }}
                  />
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      {selectedArchive.file.filename}
                    </Typography>
                    <Typography color="textSecondary" sx={{ mb: 3 }}>
                      This file type ({selectedArchive.file.mimetype}) cannot be previewed in browser.
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<DownloadIcon />}
                      onClick={() => window.open(selectedArchive.file.path, '_blank')}
                    >
                      Download File
                    </Button>
                  </Box>
                )
              ) : (
                <Box sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <Typography color="error" variant="h6">
                    No file uploaded for this archive
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', p: 2, justifyContent: 'space-between' }}>
          <Button onClick={closeDetailModal} color="inherit">Close</Button>
          {selectedArchive?.file?.path && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => window.open(selectedArchive.file.path, '_blank')}
            >
              Download File
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
      >
        <DialogTitle>Delete Archive?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this archive entry?
            {selectedArchive && (
              <Box className="mt-2">
                <strong>{selectedArchive.archive_id}</strong> - {selectedArchive.original_reference}
              </Box>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Archive Modal */}
      <Dialog
        open={isCreateOpen}
        onClose={handleCloseCreate}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Archive Document</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Document Type */}
            <FormControl fullWidth required>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={createForm.document_type}
                label="Document Type"
                onChange={(e) => handleCreateFormChange('document_type', e.target.value)}
              >
                {UPLOAD_DOC_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Document Date */}
            <TextField
              label="Document Date"
              type="date"
              required
              fullWidth
              value={createForm.document_date}
              onChange={(e) => handleCreateFormChange('document_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="The original date when the document was created"
            />

            {/* Company Name */}
            <TextField
              label="Company Name"
              required
              fullWidth
              value={createForm.company_name}
              onChange={(e) => handleCreateFormChange('company_name', e.target.value)}
              placeholder="e.g., ABC Corporation"
            />

            {/* Document Name */}
            <TextField
              label="Document Name"
              required
              fullWidth
              value={createForm.document_name}
              onChange={(e) => handleCreateFormChange('document_name', e.target.value)}
              placeholder="e.g., Invoice March 2024"
            />

            {/* Document Number */}
            <TextField
              label="Document Number"
              required
              fullWidth
              value={createForm.document_number}
              onChange={(e) => handleCreateFormChange('document_number', e.target.value)}
              placeholder="e.g., INV-001, PI-2024-05"
            />

            {/* File Upload */}
            <Box>
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ py: 1.5 }}
              >
                {selectedFile ? 'Change File' : 'Upload Document (PDF, Word, Excel)'}
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileSelect}
                />
              </Button>
              {selectedFile && (
                <Chip
                  label={selectedFile.name}
                  onDelete={() => setSelectedFile(null)}
                  sx={{ mt: 1 }}
                  color="primary"
                  variant="outlined"
                />
              )}
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                Max file size: 10MB. Supported: PDF, Word, Excel
              </Typography>
            </Box>

            {/* Notes */}
            <TextField
              label="Notes (Optional)"
              fullWidth
              multiline
              rows={3}
              value={createForm.notes}
              onChange={(e) => handleCreateFormChange('notes', e.target.value)}
              placeholder="Any additional notes about this document..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreate} disabled={createLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateArchive}
            disabled={createLoading}
            startIcon={createLoading ? <CircularProgress size={16} /> : null}
          >
            {createLoading ? 'Uploading...' : 'Save Archive'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Archives;
