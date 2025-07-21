import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Avatar, 
  IconButton,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import { 
  TrendingUp, 
  ShoppingCart, 
  Assignment, 
  Event as EventIcon,
  Search,
  LocalOffer,
  ArrowForward,
  Timeline,
  CheckCircle,
  AccessTime,
  Star,
  CardGiftcard
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { buyerService } from '../../services/buyerService';
import { Button } from '../ui/Button';

export const BuyerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeOffers: 0,
    acceptedOffers: 0,
    totalOffers: 0,
  });

  useEffect(() => {
    fetchBuyerStats();
  }, []);

  useEffect(() => {
    // Check if there's an eventId parameter in the URL
    const urlParams = new URLSearchParams(location.search);
    const eventId = urlParams.get('eventId');
    
    if (eventId) {
      // Redirect to the offer creation page for this event
      navigate(`/events/${eventId}/offer`);
    }
  }, [location.search, navigate]);

  const fetchBuyerStats = async () => {
    try {
      setLoading(true);
      const [offersResponse, transactionsResponse] = await Promise.all([
        buyerService.getMyOffers(),
        buyerService.getTransactions()
      ]);
      
      const offers = offersResponse.data || [];
      const activeOffers = offers.filter(offer => offer.status === 'PENDING').length;
      const acceptedOffers = offers.filter(offer => offer.status === 'ACCEPTED').length;
      const totalOffers = offers.length;
      
      setStats({
        activeOffers,
        acceptedOffers,
        totalOffers,
      });
    } catch (error) {
      console.error('Failed to fetch buyer stats:', error);
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
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 0 } }}>
          <Avatar 
            sx={{ 
              width: { xs: 48, sm: 64 }, 
              height: { xs: 48, sm: 64 }, 
              mr: { xs: 2, sm: 3 },
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              fontSize: { xs: '1.2rem', sm: '1.5rem' },
              fontWeight: 600
            }}
          >
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              Welcome back, {user?.firstName}!
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              Ready to find your next event tickets?
            </Typography>
          </Box>
        </Box>
        <Button 
          component={Link} 
          to="/events" 
          variant="gradient" 
          size="lg"
          startIcon={<EventIcon />}
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
          Browse Events
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
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
                  <AccessTime />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Active Offers
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LinearProgress sx={{ width: 60, mr: 2 }} />
                  </Box>
                ) : stats.activeOffers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Currently pending offers
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
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
                  <CheckCircle />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Accepted Offers
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LinearProgress sx={{ width: 60, mr: 2 }} />
                  </Box>
                ) : stats.acceptedOffers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Successfully accepted offers
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={12} md={4}>
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
                  <Timeline />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Total Offers
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'secondary.main', mb: 1 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LinearProgress sx={{ width: 60, mr: 2 }} />
                  </Box>
                ) : stats.totalOffers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All offers made
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Getting Started */}
      <Card sx={{ 
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.default, 0.4)} 100%)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 3,
        mb: 4
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
            Getting Started
          </Typography>
          <Stack spacing={3}>
            <Paper sx={{ 
              p: 3, 
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.light, 0.04)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.primary.light, 0.08)} 100%)`,
                transform: 'translateY(-2px)'
              }
            }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: { xs: 2, sm: 0 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 48, height: 48 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>1</Typography>
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Browse Events
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Find the events you're interested in
                    </Typography>
                  </Box>
                </Box>
                <Button 
                  component={Link} 
                  to="/events" 
                  variant="primary" 
                  size="sm"
                  endIcon={<ArrowForward />}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Browse Events
                </Button>
              </Box>
            </Paper>

            <Paper sx={{ 
              p: 3, 
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)} 0%, ${alpha(theme.palette.success.light, 0.04)} 100%)`,
              border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.12)} 0%, ${alpha(theme.palette.success.light, 0.08)} 100%)`,
                transform: 'translateY(-2px)'
              }
            }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: { xs: 2, sm: 0 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2, width: 48, height: 48 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>2</Typography>
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Search Tickets
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Find tickets that match your criteria
                    </Typography>
                  </Box>
                </Box>
                <Button 
                  component={Link} 
                  to="/listings" 
                  variant="secondary" 
                  size="sm"
                  endIcon={<ArrowForward />}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Browse Tickets
                </Button>
              </Box>
            </Paper>

            <Paper sx={{ 
              p: 3, 
              background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.light, 0.04)} 100%)`,
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.12)} 0%, ${alpha(theme.palette.secondary.light, 0.08)} 100%)`,
                transform: 'translateY(-2px)'
              }
            }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: { xs: 2, sm: 0 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', mr: 2, width: 48, height: 48 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>3</Typography>
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Make Offers
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Submit offers on tickets you want to buy
                    </Typography>
                  </Box>
                </Box>
                <Button 
                  component={Link} 
                  to="/offers" 
                  variant="outline" 
                  size="sm"
                  endIcon={<ArrowForward />}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Browse Offers
                </Button>
              </Box>
            </Paper>
          </Stack>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card sx={{ 
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.default, 0.4)} 100%)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 3
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
            Quick Actions
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={6}>
              <Button 
                component={Link} 
                to="/listings" 
                variant="gradient" 
                size="lg"
                fullWidth
                startIcon={<ShoppingCart />}
                sx={{ 
                  py: 2, 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1.1rem'
                }}
              >
                Browse Tickets
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <Button 
                component={Link} 
                to="/my-offers" 
                variant="outline" 
                size="lg"
                fullWidth
                startIcon={<LocalOffer />}
                sx={{ 
                  py: 2, 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1.1rem'
                }}
              >
                View My Offers
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};