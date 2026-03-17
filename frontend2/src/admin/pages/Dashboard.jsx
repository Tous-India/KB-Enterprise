import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Loader2 } from "lucide-react";
import dashboardService from "../../services/dashboard.service";

function Dashboard() {
  const [stats, setStats] = useState({
    pendingPOs: 0,
    activeQuotes: 0,
    openOrders: 0,
    unpaidInvoices: 0,
    lowStockProducts: 0,
    totalRevenue: 0,
    paidInvoices: 0,
    totalProducts: 0,
    dispatchedOrders: 0,
    inStockProducts: 0,
    totalOrders: 0,
    totalInvoices: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true);
      setError(null);

      const result = await dashboardService.getSummary();

      if (result.success && result.data) {
        const data = result.data;
        setStats({
          pendingPOs: data.pendingPOs || 0,
          activeQuotes: data.activeQuotations || 0,
          openOrders: data.openOrders || 0,
          unpaidInvoices: data.unpaidInvoices || 0,
          lowStockProducts: data.lowStockProducts || 0,
          totalRevenue: data.totalRevenue || 0,
          paidInvoices: data.paidInvoices || 0,
          totalProducts: data.totalProducts || 0,
          dispatchedOrders: data.dispatchedOrders || 0,
          inStockProducts: data.inStockProducts || 0,
          totalOrders: data.totalOrders || 0,
          totalInvoices: data.totalInvoices || 0,
          totalUsers: data.totalUsers || 0,
        });
      } else {
        setError(result.error || "Failed to load dashboard data");
      }

      setLoading(false);
    };

    fetchDashboardStats();
  }, []);

  const statCards = [
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      change: "+12.5%",
      changeLabel: "from last month",
      color: "#10b981",
      statusColor: "text-green-600",
      bgColor: "bg-green-50",
      link: "/admin/invoices",
    },
    {
      title: "Purchase Orders",
      value: stats.pendingPOs,
      subtitle: "Pending",
      color: "#ef4444",
      statusColor: "text-red-600",
      bgColor: "bg-red-50",
      link: "/admin/purchase-orders",
    },
    {
      title: "Active Quotations",
      value: stats.activeQuotes,
      subtitle: "Awaiting Response",
      color: "#8b5cf6",
      statusColor: "text-purple-600",
      bgColor: "bg-purple-50",
      link: "/admin/quotations",
    },
    {
      title: "Open Orders",
      value: stats.openOrders,
      subtitle: "Ready to Dispatch",
      color: "#f59e0b",
      statusColor: "text-amber-600",
      bgColor: "bg-amber-50",
      link: "/admin/orders",
    },
    {
      title: "Unpaid Invoices",
      value: stats.unpaidInvoices,
      subtitle: "Awaiting Payment",
      color: "#f97316",
      statusColor: "text-orange-600",
      bgColor: "bg-orange-50",
      link: "/admin/invoices",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockProducts,
      subtitle: "Needs Restocking",
      color: "#dc2626",
      statusColor: "text-red-600",
      bgColor: "bg-red-50",
      link: "/admin/products",
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      subtitle: `${stats.inStockProducts} In Stock`,
      color: "#06b6d4",
      statusColor: "text-cyan-600",
      bgColor: "bg-cyan-50",
      link: "/admin/products",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      subtitle: `${stats.dispatchedOrders} Dispatched`,
      color: "#84cc16",
      statusColor: "text-lime-600",
      bgColor: "bg-lime-50",
      link: "/admin/orders",
    },
    {
      title: "Total Invoices",
      value: stats.totalInvoices,
      subtitle: `${stats.paidInvoices} Paid`,
      color: "#6366f1",
      statusColor: "text-indigo-600",
      bgColor: "bg-indigo-50",
      link: "/admin/invoices",
    },
    {
      title: "Dispatched Today",
      value: stats.dispatchedOrders,
      subtitle: "Orders Shipped",
      color: "#22c55e",
      statusColor: "text-green-600",
      bgColor: "bg-green-50",
      link: "/admin/orders",
    },
    {
      title: "Paid Invoices",
      value: stats.paidInvoices,
      subtitle: "Completed Payments",
      color: "#14b8a6",
      statusColor: "text-teal-600",
      bgColor: "bg-teal-50",
      link: "/admin/invoices",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      subtitle: "Active Customers",
      color: "#64748b",
      statusColor: "text-slate-600",
      bgColor: "bg-slate-50",
      link: "/admin/users",
    },
  ];

  if (loading) {
    return (
      <div className="admin-dashboard-main-page flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-main-page">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-main-page">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0b0c1a] mb-2">
          Dashboard Overview
        </h1>
        <p className="text-base text-gray-600">
          Welcome back! Here's what's happening with your business today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
        {statCards.map((stat, index) => {
          const cardContent = (
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                {stat.title}
              </p>
              <h3 className="text-3xl font-medium text-gray-900 mb-1">
                {stat.value}
              </h3>
              {stat.subtitle && (
                <p className={`text-sm ${stat.statusColor || 'text-gray-600'}`}>
                  {stat.subtitle}
                </p>
              )}
              {stat.change && (
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="text-green-600" size={18} />
                  <span className="text-sm font-semibold text-green-600">
                    {stat.change}
                  </span>
                  <span className="text-xs text-gray-600">
                    {stat.changeLabel}
                  </span>
                </div>
              )}
            </div>
          );

          return stat.link ? (
            <Link
              key={index}
              to={stat.link}
              className="h-full bg-white rounded-lg border border-gray-200 transition-all duration-300 ease-in-out no-underline hover:-translate-y-2 hover:shadow-xl block"
              style={{ borderColor: "rgba(0, 0, 0, 0.08)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = stat.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.08)";
              }}
            >
              {cardContent}
            </Link>
          ) : (
            <div
              key={index}
              className="h-full bg-white rounded-lg border border-gray-200"
            >
              {cardContent}
            </div>
          );
        })}
      </div>

      {/* Bottom Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        {/* Order Fulfillment */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 h-full">
          <h6 className="text-lg font-bold text-[#1a237e] mb-6">
            Order Fulfillment
          </h6>
          <hr className="mb-6 border-gray-200" />
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">
                  Completed Orders
                </p>
                <p className="text-sm font-bold text-[#1a237e]">
                  {stats.dispatchedOrders}/{stats.totalOrders}
                </p>
              </div>
              <div className="w-full h-2.5 bg-blue-100 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-lg"
                  style={{
                    width: `${
                      stats.totalOrders > 0
                        ? (stats.dispatchedOrders / stats.totalOrders) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">
                  Payment Collection
                </p>
                <p className="text-sm font-bold text-[#1a237e]">
                  {stats.paidInvoices}/{stats.totalInvoices}
                </p>
              </div>
              <div className="w-full h-2.5 bg-green-100 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-lg"
                  style={{
                    width: `${
                      stats.totalInvoices > 0
                        ? (stats.paidInvoices / stats.totalInvoices) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">
                  Stock Availability
                </p>
                <p className="text-sm font-bold text-[#1a237e]">
                  {stats.inStockProducts}/{stats.totalProducts}
                </p>
              </div>
              <div className="w-full h-2.5 bg-cyan-100 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-lg"
                  style={{
                    width: `${
                      stats.totalProducts > 0
                        ? (stats.inStockProducts / stats.totalProducts) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 h-full">
          <h6 className="text-lg font-bold text-[#1a237e] mb-6">Quick Stats</h6>
          <hr className="mb-6 border-gray-200" />
          <div className="space-y-5">
            {[
              {
                label: "Pending POs",
                value: stats.pendingPOs,
                color: "#2196f3",
              },
              {
                label: "Active Quotes",
                value: stats.activeQuotes,
                color: "#9c27b0",
              },
              {
                label: "Open Orders",
                value: stats.openOrders,
                color: "#ff9800",
              },
              {
                label: "Unpaid Invoices",
                value: stats.unpaidInvoices,
                color: "#f44336",
              },
              {
                label: "Low Stock Items",
                value: stats.lowStockProducts,
                color: "#ff5722",
              },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-600">
                  {item.label}
                </p>
                <h6 className="text-xl font-bold" style={{ color: item.color }}>
                  {item.value}
                </h6>
              </div>
            ))}
          </div>
        </div>

        {/* Business Summary */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 h-full">
          <h6 className="text-lg font-bold text-[#1a237e] mb-6">
            Business Summary
          </h6>
          <hr className="mb-6 border-gray-200" />
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Total Revenue
              </p>
              <h4 className="text-4xl font-bold text-[#4caf50]">
                $
                {stats.totalRevenue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h4>
            </div>
            <hr className="border-gray-200" />
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Average Order Value
              </p>
              <h5 className="text-2xl font-bold text-[#1a237e]">
                $
                {stats.totalOrders > 0
                  ? (stats.totalRevenue / stats.totalOrders).toFixed(2)
                  : "0.00"}
              </h5>
            </div>
            <hr className="border-gray-200" />
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Inventory Value
              </p>
              <h5 className="text-2xl font-bold text-[#1a237e]">
                {stats.totalProducts} Products
              </h5>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
