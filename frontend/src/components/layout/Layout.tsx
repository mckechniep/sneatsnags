import React from 'react';
import { Box, Container } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const StyledBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #e8f4fd 100%)',
  paddingTop: theme.spacing(2),
  [theme.breakpoints.up('lg')]: {
    paddingTop: theme.spacing(3),
  },
}));

const MainContent = styled('main')(({ theme }) => ({
  flex: 1,
  paddingTop: theme.spacing(10),
  paddingBottom: theme.spacing(4),
  [theme.breakpoints.up('sm')]: {
    paddingTop: theme.spacing(12),
  },
  [theme.breakpoints.up('lg')]: {
    paddingTop: theme.spacing(14),
  },
}));

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <StyledBox>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Header />
      <MainContent id="main-content" role="main" aria-label="Main content">
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          {children}
        </Container>
      </MainContent>
      <Footer />
    </StyledBox>
  );
};