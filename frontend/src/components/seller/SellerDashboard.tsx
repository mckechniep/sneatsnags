import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Avatar, 
  Chip,
  Divider,
  LinearProgress,
  Stack,
  Paper,
  useTheme,
  alpha,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { 
  Store, 
  Assignment, 
  CheckCircle, 
  AttachMoney,
  TrendingUp,
  Add,
  Visibility,
  LocalOffer,
  Star,
  Timeline,
  Assessment,
  ArrowUpward,
  ArrowForward,
  Lightbulb,
  Speed,
  Support,
  Analytics
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { sellerService } from '../../services/sellerService';
import { Button } from '../ui/Button';

export const SellerDashboard = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    soldListings: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchSellerStats();
  }, []);

  const fetchSellerStats = async () => {
    try {
      setLoading(true);
      const [listingsResponse, transactionsResponse] = await Promise.all([
        sellerService.getListings(),
        sellerService.getTransactions()
      ]);
      
      const listings = listingsResponse.data || [];
      const transactions = transactionsResponse.data || [];
      
      const activeListings = listings.filter(listing => listing.status === 'ACTIVE').length;
      const soldListings = listings.filter(listing => listing.status === 'SOLD').length;
      const totalRevenue = transactions
        .filter(transaction => transaction.status === 'COMPLETED')
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      
      setStats({
        totalListings: listings.length,
        activeListings,
        soldListings,
        totalRevenue,
      });
    } catch (error) {
      console.error('Failed to fetch seller stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        gap: { xs: 2, sm: 0 },
        mb: 4,
        p: { xs: 2, sm: 3 },
        background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 0 } }}>
          <Avatar 
            sx={{ 
              width: { xs: 48, sm: 64 }, 
              height: { xs: 48, sm: 64 }, 
              mr: { xs: 2, sm: 3 },
              background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
              fontSize: { xs: '1.2rem', sm: '1.5rem' },
              fontWeight: 600
            }}
          >
            <Store sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              Welcome back, {user?.firstName}!
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              Ready to manage your ticket listings?
            </Typography>
          </Box>
        </Box>
        <Button 
          component={Link} 
          to="/seller/listings/new" 
          variant="gradient" 
          size="lg"
          startIcon={<Add />}
          sx={{ 
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 600,
            px: { xs: 2, sm: 3 },
            py: { xs: 1, sm: 1.5 },
            fontSize: { xs: '0.9rem', sm: '1rem' },
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          Create New Listing
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ 
            height: '100%',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            borderRadius: 3,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.15)}`
            }
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Assignment />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Total Listings
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                {loading ? (
                  <LinearProgress sx={{ width: 60 }} />
                ) : stats.totalListings}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All your listings
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ 
            height: '100%',
            background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.light, 0.05)} 100%)`,
            border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
            borderRadius: 3,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 12px 24px ${alpha(theme.palette.success.main, 0.15)}`
            }
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <TrendingUp />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Active Listings
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
                {loading ? (
                  <LinearProgress sx={{ width: 60 }} />
                ) : stats.activeListings}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Currently available
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ 
            height: '100%',
            background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.05)} 100%)`,
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
            borderRadius: 3,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 12px 24px ${alpha(theme.palette.secondary.main, 0.15)}`
            }
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Sold Listings
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'secondary.main', mb: 1 }}>
                {loading ? (
                  <LinearProgress sx={{ width: 60 }} />
                ) : stats.soldListings}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Successfully sold
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ 
            height: '100%',
            background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.light, 0.05)} 100%)`,
            border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
            borderRadius: 3,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 12px 24px ${alpha(theme.palette.warning.main, 0.15)}`
            }
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <AttachMoney />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Total Revenue
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'warning.main', mb: 1 }}>
                {loading ? (
                  <LinearProgress sx={{ width: 60 }} />
                ) : `$${Number(stats.totalRevenue).toFixed(2)}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Earnings to date
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={12} md={6} lg={4}>
          <Card sx={{ 
            height: '100%',
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.default, 0.4)} 100%)`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: 3
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
                Quick Actions
              </Typography>
              <Stack spacing={2}>
                <Button 
                  component={Link} 
                  to="/seller/listings/new" 
                  variant="gradient" 
                  fullWidth
                  startIcon={<Add />}
                  sx={{ py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  Create New Listing
                </Button>
                <Button 
                  component={Link} 
                  to="/seller/listings" 
                  variant="outline" 
                  fullWidth
                  startIcon={<Visibility />}
                  sx={{ py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  Manage Listings
                </Button>
                <Button 
                  component={Link} 
                  to="/seller/offers" 
                  variant="outline" 
                  fullWidth
                  startIcon={<LocalOffer />}
                  sx={{ py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  Browse Offers
                </Button>
                <Button 
                  component={Link} 
                  to="/seller/transactions" 
                  variant="outline" 
                  fullWidth
                  startIcon={<Assignment />}
                  sx={{ py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  View Transactions
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={12} md={6} lg={4}>
          <Card sx={{ 
            height: '100%',
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.default, 0.4)} 100%)`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: 3
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
                Getting Started
              </Typography>
              <Stack spacing={2}>
                <Paper sx={{ 
                  p: 2, 
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.light, 0.04)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  borderRadius: 2
                }}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: { xs: 2, sm: 0 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 32, height: 32 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>1</Typography>
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Create Your First Listing
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Start selling tickets by creating your first listing
                        </Typography>
                      </Box>
                    </Box>
                    <Button 
                      component={Link} 
                      to="/seller/listings/new" 
                      variant="primary" 
                      size="xs"
                      endIcon={<ArrowForward />}
                      sx={{ width: { xs: '100%', sm: 'auto' } }}
                    >
                      Create
                    </Button>
                  </Box>
                </Paper>

                <Paper sx={{ 
                  p: 2, 
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)} 0%, ${alpha(theme.palette.success.light, 0.04)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                  borderRadius: 2
                }}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: { xs: 2, sm: 0 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <Avatar sx={{ bgcolor: 'success.main', mr: 2, width: 32, height: 32 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>2</Typography>
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Manage Your Listings
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          View and edit your active listings
                        </Typography>
                      </Box>
                    </Box>
                    <Button 
                      component={Link} 
                      to="/seller/listings" 
                      variant="secondary" 
                      size="xs"
                      endIcon={<ArrowForward />}
                      sx={{ width: { xs: '100%', sm: 'auto' } }}
                    >
                      Manage
                    </Button>
                  </Box>
                </Paper>

                <Paper sx={{ 
                  p: 2, 
                  background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.light, 0.04)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                  borderRadius: 2
                }}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: { xs: 2, sm: 0 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <Avatar sx={{ bgcolor: 'secondary.main', mr: 2, width: 32, height: 32 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>3</Typography>
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Manage Transactions
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Track sales and deliver tickets to buyers
                        </Typography>
                      </Box>
                    </Box>
                    <Button 
                      component={Link} 
                      to="/seller/transactions" 
                      variant="outline" 
                      size="xs"
                      endIcon={<ArrowForward />}
                      sx={{ width: { xs: '100%', sm: 'auto' } }}
                    >
                      View
                    </Button>
                  </Box>
                </Paper>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={12} md={12} lg={4}>
          <Card sx={{ 
            height: '100%',
            background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)} 0%, ${alpha(theme.palette.info.light, 0.04)} 100%)`,
            border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
            borderRadius: 3
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <Analytics />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Performance
                </Typography>
              </Box>
              <Stack spacing={2}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  p: 2,
                  bgcolor: alpha(theme.palette.success.main, 0.05),
                  borderRadius: 2
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Speed sx={{ color: 'success.main', mr: 1, fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      Success Rate
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {stats.totalListings && stats.soldListings 
                      ? Math.round((stats.soldListings / stats.totalListings) * 100) 
                      : 0}%
                  </Typography>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  p: 2,
                  bgcolor: alpha(theme.palette.warning.main, 0.05),
                  borderRadius: 2
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AttachMoney sx={{ color: 'warning.main', mr: 1, fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      Avg. Sale Price
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    ${stats.soldListings && stats.totalRevenue 
                      ? (Number(stats.totalRevenue) / stats.soldListings).toFixed(2)
                      : '0.00'}
                  </Typography>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  p: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: 2
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Timeline sx={{ color: 'primary.main', mr: 1, fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      Active vs Total
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {stats.totalListings && stats.activeListings
                      ? Math.round((stats.activeListings / stats.totalListings) * 100)
                      : 0}%
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tips and Resources */}
      <Card sx={{ 
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.default, 0.4)} 100%)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 3
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
              <Lightbulb />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Tips for Success
            </Typography>
          </Box>
          <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                p: { xs: 2, sm: 3 },
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)} 0%, ${alpha(theme.palette.success.light, 0.04)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                borderRadius: 2
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'success.main' }}>
                  Optimize Your Listings
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon><CheckCircle sx={{ color: 'success.main', fontSize: 20 }} /></ListItemIcon>
                    <ListItemText 
                      primary="Upload clear photos of your tickets" 
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircle sx={{ color: 'success.main', fontSize: 20 }} /></ListItemIcon>
                    <ListItemText 
                      primary="Set competitive prices" 
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircle sx={{ color: 'success.main', fontSize: 20 }} /></ListItemIcon>
                    <ListItemText 
                      primary="Include detailed seat information" 
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircle sx={{ color: 'success.main', fontSize: 20 }} /></ListItemIcon>
                    <ListItemText 
                      primary="Respond quickly to buyer inquiries" 
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                </List>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                p: { xs: 2, sm: 3 },
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.light, 0.04)} 100%),`
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                borderRadius: 2
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                  Increase Sales
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon><ArrowUpward sx={{ color: 'primary.main', fontSize: 20 }} /></ListItemIcon>
                    <ListItemText 
                      primary="Browse and respond to buyer offers" 
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><ArrowUpward sx={{ color: 'primary.main', fontSize: 20 }} /></ListItemIcon>
                    <ListItemText 
                      primary="Keep your listings up to date" 
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><ArrowUpward sx={{ color: 'primary.main', fontSize: 20 }} /></ListItemIcon>
                    <ListItemText 
                      primary="Deliver tickets promptly after sale" 
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><ArrowUpward sx={{ color: 'primary.main', fontSize: 20 }} /></ListItemIcon>
                    <ListItemText 
                      primary="Maintain good seller ratings" 
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                </List>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};