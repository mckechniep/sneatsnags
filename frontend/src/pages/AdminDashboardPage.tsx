import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Card,
  Avatar,
  useTheme,
  alpha,
  Skeleton,
} from "@mui/material";
import {
  People as Users,
  Event as Calendar,
  AttachMoney as DollarSign,
  TrendingUp,
  Settings,
  Error as AlertCircle,
  Timeline as Activity,
  Analytics as BarChart3,
  VerifiedUser as UserCheck,
  Description as FileText,
  Public as Globe,
  Shield,
  ArrowUpward as ArrowUp,
  GpsFixed as Target,
  FlashOn as Zap,
  Storage as Database,
  Forum as MessageSquare,
  GetApp as Download,
  Refresh as RefreshCw,
  Dashboard,
} from "@mui/icons-material";
import { Button } from "../components/ui/Button";
import {
  adminService,
  type AdminDashboardStats,
} from "../services/adminService";
import { SweetAlert } from "../utils/sweetAlert";

export const AdminDashboardPage: React.FC = () => {
  const theme = useTheme();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const data = await adminService.getDashboard();
      setStats(data);
      setLastRefresh(new Date());
      setError(null);
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      setError("Failed to load dashboard statistics");
      SweetAlert.error("Failed to load dashboard", "Please try again later");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const refreshData = async () => {
    await fetchDashboardStats(false);
    SweetAlert.success("Dashboard refreshed", "Data has been updated");
  };

  const exportData = async (type: string) => {
    try {
      SweetAlert.loading("Exporting data", "Please wait...");
      const result = await adminService.exportData({ type });
      SweetAlert.success(
        "Export ready",
        "Your data export is ready for download"
      );
      window.open(result.url, "_blank");
    } catch (error) {
      console.error("Export failed:", error);
      SweetAlert.error("Export failed", "Unable to export data");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ p: 3 }}>
          <Skeleton variant="text" width="25%" height={40} sx={{ mb: 4 }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
            {[...Array(4)].map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={140}
                sx={{ borderRadius: 2 }}
              />
            ))}
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
            <Skeleton
              variant="rectangular"
              height={300}
              sx={{ borderRadius: 2 }}
            />
            <Skeleton
              variant="rectangular"
              height={300}
              sx={{ borderRadius: 2 }}
            />
          </Box>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ textAlign: "center", p: 8 }}>
          <AlertCircle sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Dashboard Error
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {error}
          </Typography>
          <Button onClick={() => fetchDashboardStats()} variant="primary" size="lg">
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
            p: 3,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.1
            )} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                mr: 3,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                fontSize: "1.5rem",
                fontWeight: 600,
              }}
            >
              <Dashboard sx={{ fontSize: "2rem" }} />
            </Avatar>
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: "text.primary", mb: 0.5 }}
              >
                Admin Dashboard
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                Platform overview and management
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </Typography>
            <Button
              onClick={() => refreshData()}
              variant="outline"
              startIcon={<RefreshCw />}
              sx={{ borderRadius: 2 }}
            >
              Refresh
            </Button>
            <Button
              onClick={() => exportData("dashboard")}
              variant="outline"
              startIcon={<Download />}
              sx={{ borderRadius: 2 }}
            >
              Export
            </Button>
          </Box>
        </Box>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Users Stats */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats ? formatNumber(stats.users.total) : "0"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats ? formatNumber(stats.users.activeThisMonth) : "0"}{" "}
                  active this month
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex space-x-4 text-sm">
              <div>
                <span className="text-gray-500">Buyers:</span>{" "}
                <span className="font-medium">
                  {stats ? formatNumber(stats.users.buyers) : "0"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Sellers:</span>{" "}
                <span className="font-medium">
                  {stats ? formatNumber(stats.users.sellers) : "0"}
                </span>
              </div>
            </div>
          </Card>

          {/* Events Stats */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Events</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats ? formatNumber(stats.events.total) : "0"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats ? formatNumber(stats.events.upcoming) : "0"} upcoming
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          {/* Transactions Stats */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Transactions
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats ? formatNumber(stats.transactions.total) : "0"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats ? formatNumber(stats.transactions.pending) : "0"}{" "}
                  pending
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>

          {/* Revenue Stats */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats ? formatCurrency(stats.transactions.revenue) : "$0"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Volume:{" "}
                  {stats ? formatCurrency(stats.transactions.volume) : "$0"}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Offers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats ? formatNumber(stats.offers.total) : "0"}
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {stats ? formatNumber(stats.offers.active) : "0"} active
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Listings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats ? formatNumber(stats.listings.total) : "0"}
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {stats ? formatNumber(stats.listings.available) : "0"}{" "}
                  available
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Ticket</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats
                    ? formatCurrency(
                        stats.transactions.volume /
                          Math.max(stats.transactions.total, 1)
                      )
                    : "$0"}
                </p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Platform avg.
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats
                    ? `${(
                        (stats.transactions.completed /
                          Math.max(stats.transactions.total, 1)) *
                        100
                      ).toFixed(1)}%`
                    : "0%"}
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  Success rate
                </p>
              </div>
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Users
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats ? formatNumber(stats.users.activeThisMonth) : "0"}
                </p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <Activity className="h-3 w-3 mr-1" />
                  This month
                </p>
              </div>
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Platform Health
                </p>
                <p className="text-2xl font-bold text-green-600">99.9%</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <Shield className="h-3 w-3 mr-1" />
                  Uptime
                </p>
              </div>
              <Database className="h-8 w-8 text-green-600" />
            </div>
          </Card>
        </div>

        {/* Management Sections */}
        <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {/* User Management */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                User Management
              </h3>
              <UserCheck className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <Link
                to="/admin/users"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">Manage Users</div>
                <div className="text-sm text-gray-600">
                  View and manage all platform users
                </div>
              </Link>
              <Link
                to="/admin/users?role=BUYER"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">Buyers</div>
                <div className="text-sm text-gray-600">
                  {stats ? formatNumber(stats.users.buyers) : "0"} registered
                  buyers
                </div>
              </Link>
              <Link
                to="/admin/users?role=SELLER"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">Sellers</div>
                <div className="text-sm text-gray-600">
                  {stats ? formatNumber(stats.users.sellers) : "0"} registered
                  sellers
                </div>
              </Link>
            </div>
          </Card>

          {/* Event Management */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Event Management
              </h3>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <Link
                to="/admin/events"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">All Events</div>
                <div className="text-sm text-gray-600">
                  Manage platform events
                </div>
              </Link>
              <Link
                to="/admin/events/create"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">Create Event</div>
                <div className="text-sm text-gray-600">
                  Add new events to platform
                </div>
              </Link>
              <Link
                to="/admin/events?status=upcoming"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">Upcoming Events</div>
                <div className="text-sm text-gray-600">
                  {stats ? formatNumber(stats.events.upcoming) : "0"} events
                  scheduled
                </div>
              </Link>
            </div>
          </Card>

          {/* Transaction Management */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Transactions
              </h3>
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <Link
                to="/admin/transactions"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">
                  All Transactions
                </div>
                <div className="text-sm text-gray-600">
                  View and manage all transactions
                </div>
              </Link>
              <Link
                to="/admin/transactions?status=pending"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">Pending</div>
                <div className="text-sm text-gray-600">
                  {stats ? formatNumber(stats.transactions.pending) : "0"}{" "}
                  pending transactions
                </div>
              </Link>
              <Link
                to="/admin/refunds"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">Refunds</div>
                <div className="text-sm text-gray-600">
                  Process refund requests
                </div>
              </Link>
            </div>
          </Card>

          {/* Support & Communications */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Support & Communications
              </h3>
              <MessageSquare className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <Link
                to="/admin/support"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">Support Tickets</div>
                <div className="text-sm text-gray-600">
                  Manage customer support requests
                </div>
              </Link>
              <Link
                to="/admin/communications"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">Communications</div>
                <div className="text-sm text-gray-600">
                  Send announcements and notifications
                </div>
              </Link>
              <Link
                to="/admin/feedback"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">User Feedback</div>
                <div className="text-sm text-gray-600">
                  Review platform feedback and suggestions
                </div>
              </Link>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <Link
            to="/admin/analytics"
            className="group p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white hover:from-blue-600 hover:to-blue-700 transition-all"
          >
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 mr-3" />
              <div>
                <div className="font-semibold">Analytics</div>
                <div className="text-sm opacity-90">View detailed reports</div>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/support"
            className="group p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white hover:from-green-600 hover:to-green-700 transition-all"
          >
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 mr-3" />
              <div>
                <div className="font-semibold">Support</div>
                <div className="text-sm opacity-90">Manage tickets</div>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/settings"
            className="group p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white hover:from-purple-600 hover:to-purple-700 transition-all"
          >
            <div className="flex items-center">
              <Settings className="h-8 w-8 mr-3" />
              <div>
                <div className="font-semibold">Settings</div>
                <div className="text-sm opacity-90">Platform configuration</div>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/activity"
            className="group p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-white hover:from-orange-600 hover:to-orange-700 transition-all"
          >
            <div className="flex items-center">
              <Activity className="h-8 w-8 mr-3" />
              <div>
                <div className="font-semibold">Activity</div>
                <div className="text-sm opacity-90">System logs</div>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/reports"
            className="group p-4 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg text-white hover:from-indigo-600 hover:to-indigo-700 transition-all"
          >
            <div className="flex items-center">
              <FileText className="h-8 w-8 mr-3" />
              <div>
                <div className="font-semibold">Reports</div>
                <div className="text-sm opacity-90">Generate reports</div>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/monitoring"
            className="group p-4 bg-gradient-to-r from-red-500 to-red-600 rounded-lg text-white hover:from-red-600 hover:to-red-700 transition-all"
          >
            <div className="flex items-center">
              <Globe className="h-8 w-8 mr-3" />
              <div>
                <div className="font-semibold">Monitoring</div>
                <div className="text-sm opacity-90">System health</div>
              </div>
            </div>
          </Link>
        </div>
      </Box>
    </Container>
  );
};
