import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button as MuiButton, 
  IconButton, 
  Menu as MuiMenu, 
  MenuItem, 
  Box, 
  Container,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Menu as MenuIcon, 
  Close as CloseIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  ConfirmationNumber as TicketIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Dashboard as DashboardIcon,
  Event as EventIcon,
  LocalOffer as OfferIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { NotificationDropdown } from '../notifications/NotificationDropdown';
import { UserRole } from '../../types/auth';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  color: theme.palette.text.primary,
  transition: 'all 0.3s ease-in-out',
  minHeight: '64px',
  [theme.breakpoints.up('sm')]: {
    minHeight: '70px',
  },
}));

const LogoText = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.5rem',
  background: 'linear-gradient(45deg, #1D3557, #457B9D)', // Navy to Sky Blue gradient
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  textDecoration: 'none',
  cursor: 'pointer',
}));

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    handleProfileMenuClose();
  };

  const getMainNavigation = () => {
    const baseNav = [
      { name: 'Events', href: '/events', icon: <EventIcon /> },
    ];

    if (user?.role === UserRole.BUYER) {
      baseNav.push(
        { name: 'Browse Tickets', href: '/listings', icon: <TicketIcon /> },
        { name: 'Browse Offers', href: '/offers', icon: <OfferIcon /> }
      );
    } else if (user?.role === UserRole.SELLER) {
      baseNav.push(
        { name: 'Browse Offers', href: '/seller/offers', icon: <OfferIcon /> }
      );
    } else if (user?.role === UserRole.ADMIN) {
      baseNav.push(
        { name: 'Browse Tickets', href: '/listings', icon: <TicketIcon /> },
        { name: 'Browse Offers', href: '/offers', icon: <OfferIcon /> }
      );
    } else {
      // For non-authenticated users, show public pages
      baseNav.push(
        { name: 'Browse Tickets', href: '/listings', icon: <TicketIcon /> }
      );
    }

    return baseNav;
  };

  const getUserNavigation = () => {
    if (!user) return [];
    
    const baseNav = [
      { name: 'Profile', href: '/profile', icon: <PersonIcon /> },
    ];

    if (user.role === UserRole.BUYER) {
      baseNav.unshift(
        { name: 'Buyer Dashboard', href: '/buyer/dashboard', icon: <DashboardIcon /> }
      );
      baseNav.push(
        { name: 'My Offers', href: '/my-offers', icon: <OfferIcon /> },
        { name: 'Search Tickets', href: '/tickets/search', icon: <SearchIcon /> }
      );
    }

    if (user.role === UserRole.SELLER) {
      baseNav.unshift(
        { name: 'Seller Dashboard', href: '/seller/dashboard', icon: <DashboardIcon /> }
      );
      baseNav.push(
        { name: 'My Listings', href: '/seller/listings', icon: <TicketIcon /> },
        { name: 'Browse Offers', href: '/seller/offers', icon: <OfferIcon /> }
      );
    }

    if (user.role === UserRole.ADMIN) {
      baseNav.unshift(
        { name: 'Admin Dashboard', href: '/admin/dashboard', icon: <DashboardIcon /> }
      );
      baseNav.push(
        { name: 'Users', href: '/admin/users', icon: <PersonIcon /> },
        { name: 'Events', href: '/admin/events', icon: <EventIcon /> },
        { name: 'Analytics', href: '/admin/analytics', icon: <SettingsIcon /> }
      );
    }

    return baseNav;
  };

  const renderDesktopNav = () => (
    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
      {getMainNavigation().map((item) => (
        <MuiButton
          key={item.name}
          component={Link}
          to={item.href}
          startIcon={item.icon}
          sx={{
            color: 'text.primary',
            textTransform: 'none',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: 'rgba(168, 218, 220, 0.1)', // Turquoise accent hover
            },
            '&:focus-visible': {
              outline: '3px solid #1D3557', // Navy focus outline
              outlineOffset: '2px'
            }
          }}
        >
          {item.name}
        </MuiButton>
      ))}
    </Box>
  );

  const renderMobileNav = () => (
    <Drawer
      anchor="left"
      open={isMenuOpen}
      onClose={() => setIsMenuOpen(false)}
      role="navigation"
      aria-label="Mobile navigation menu"
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <LogoText>SeatSnags</LogoText>
      </Box>
      <Divider />
      <List>
        {getMainNavigation().map((item) => (
          <ListItem key={item.name} disablePadding>
            <ListItemButton
              component={Link}
              to={item.href}
              onClick={() => setIsMenuOpen(false)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      {isAuthenticated && (
        <>
          <Divider />
          <List>
            {getUserNavigation().map((item) => (
              <ListItem key={item.name} disablePadding>
                <ListItemButton
                  component={Link}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Drawer>
  );

  const renderUserMenu = () => (
    <MuiMenu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleProfileMenuClose}
      role="menu"
      aria-label="User account menu"
      PaperProps={{
        sx: {
          mt: 1,
          minWidth: 200,
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {user?.firstName} {user?.lastName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user?.email}
        </Typography>
      </Box>
      <Divider />
      {getUserNavigation().map((item) => (
        <MenuItem
          key={item.name}
          component={Link}
          to={item.href}
          onClick={handleProfileMenuClose}
        >
          <ListItemIcon>{item.icon}</ListItemIcon>
          <ListItemText primary={item.name} />
        </MenuItem>
      ))}
      <Divider />
      <MenuItem onClick={handleLogout}>
        <ListItemIcon>
          <LogoutIcon />
        </ListItemIcon>
        <ListItemText primary="Logout" />
      </MenuItem>
    </MuiMenu>
  );

  return (
    <>
      <StyledAppBar 
        position="fixed" 
        component="nav"
        role="navigation"
        aria-label="Main navigation"
        sx={{ 
          background: isScrolled 
            ? 'rgba(255, 255, 255, 0.95)' 
            : 'rgba(255, 255, 255, 0.9)',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            {/* Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {isMobile && (
                <IconButton
                  edge="start"
                  color="inherit"
                  aria-label="Open navigation menu"
                  onClick={() => setIsMenuOpen(true)}
                  sx={{ mr: 2 }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              <LogoText
                component={Link}
                to="/"
                sx={{ textDecoration: 'none' }}
              >
                SeatSnags
              </LogoText>
            </Box>

            {/* Desktop Navigation */}
            {renderDesktopNav()}

            {/* Right side - Auth buttons or user menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {isAuthenticated ? (
                <>
                  <NotificationDropdown />
                  <IconButton
                    onClick={handleProfileMenuOpen}
                    aria-label="Open user menu"
                    aria-expanded={Boolean(anchorEl)}
                    aria-haspopup="true"
                    sx={{ 
                      border: '2px solid',
                      borderColor: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'rgba(168, 218, 220, 0.1)', // Turquoise accent hover
                      },
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32,
                        bgcolor: 'primary.main',
                        fontSize: '0.875rem',
                      }}
                    >
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </Avatar>
                  </IconButton>
                  {renderUserMenu()}
                </>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    component={Link}
                    to="/login"
                    variant="ghost"
                    size="sm"
                  >
                    Login
                  </Button>
                  <Button
                    component={Link}
                    to="/register"
                    variant="primary"
                    size="sm"
                  >
                    Sign Up
                  </Button>
                </Box>
              )}
            </Box>
          </Toolbar>
        </Container>
      </StyledAppBar>

      {/* Mobile Navigation Drawer */}
      {renderMobileNav()}
    </>
  );
};