import React from 'react';
import { Box, Container, useTheme, useMediaQuery, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { LoginForm } from '../components/auth/LoginForm';

const StyledContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: `linear-gradient(135deg, ${theme.palette.grey[50]} 0%, ${theme.palette.background.default} 100%)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(3),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(120, 119, 198, 0.1) 0%, transparent 50%)',
    pointerEvents: 'none',
  },
}));

const BackgroundShape = styled(Box)<{ delay?: string }>(({ theme, delay }) => ({
  position: 'absolute',
  borderRadius: '30px',
  background: `linear-gradient(45deg, ${theme.palette.primary.light}20, ${theme.palette.secondary.light}20)`,
  filter: 'blur(40px)',
  opacity: 0.4,
  animation: 'float 8s ease-in-out infinite',
  animationDelay: delay || '0s',
  '@keyframes float': {
    '0%, 100%': {
      transform: 'translateY(0px) rotate(0deg)',
    },
    '33%': {
      transform: 'translateY(-20px) rotate(5deg)',
    },
    '66%': {
      transform: 'translateY(10px) rotate(-3deg)',
    },
  },
}));

const ContentWrapper = styled(Paper)(({ theme }) => ({
  position: 'relative',
  zIndex: 10,
  width: '100%',
  maxWidth: '440px',
  padding: 0,
  borderRadius: theme.spacing(2),
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[8],
  overflow: 'hidden',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '480px',
  },
}));

export const LoginPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <StyledContainer role="main" aria-label="Login page">
      {/* Background Shapes */}
      <BackgroundShape
        sx={{
          top: '20%',
          left: '15%',
          width: { xs: '150px', sm: '200px', md: '250px' },
          height: { xs: '80px', sm: '100px', md: '120px' },
        }}
      />
      <BackgroundShape
        delay="3s"
        sx={{
          bottom: '20%',
          right: '15%',
          width: { xs: '120px', sm: '160px', md: '200px' },
          height: { xs: '120px', sm: '160px', md: '200px' },
          borderRadius: '50%',
        }}
      />
      <BackgroundShape
        delay="1.5s"
        sx={{
          top: '60%',
          left: '5%',
          width: { xs: '100px', sm: '130px', md: '160px' },
          height: { xs: '60px', sm: '80px', md: '100px' },
        }}
      />
      
      <ContentWrapper elevation={0}>
        <LoginForm />
      </ContentWrapper>
    </StyledContainer>
  );
};