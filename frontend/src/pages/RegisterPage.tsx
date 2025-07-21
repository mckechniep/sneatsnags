import React from 'react';
import { Box, useTheme, useMediaQuery, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { RegisterForm } from '../components/auth/RegisterForm';

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
    background: 'radial-gradient(circle at 30% 20%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%)',
    pointerEvents: 'none',
  },
}));

const BackgroundShape = styled(Box)<{ delay?: string }>(({ theme, delay }) => ({
  position: 'absolute',
  borderRadius: '30px',
  background: `linear-gradient(45deg, ${theme.palette.primary.light}20, ${theme.palette.secondary.light}20)`,
  filter: 'blur(40px)',
  opacity: 0.4,
  animation: 'float 10s ease-in-out infinite',
  animationDelay: delay || '0s',
  '@keyframes float': {
    '0%, 100%': {
      transform: 'translateY(0px) rotate(0deg)',
    },
    '25%': {
      transform: 'translateY(-25px) rotate(3deg)',
    },
    '50%': {
      transform: 'translateY(-10px) rotate(-2deg)',
    },
    '75%': {
      transform: 'translateY(15px) rotate(4deg)',
    },
  },
}));

const ContentWrapper = styled(Paper)(({ theme }) => ({
  position: 'relative',
  zIndex: 10,
  width: '100%',
  maxWidth: '520px',
  padding: 0,
  borderRadius: theme.spacing(2),
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[8],
  overflow: 'hidden',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '580px',
  },
}));

export const RegisterPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <StyledContainer>
      {/* Background Shapes */}
      <BackgroundShape
        sx={{
          top: '15%',
          left: '10%',
          width: { xs: '180px', sm: '220px', md: '280px' },
          height: { xs: '90px', sm: '110px', md: '140px' },
        }}
      />
      <BackgroundShape
        delay="4s"
        sx={{
          bottom: '15%',
          right: '10%',
          width: { xs: '150px', sm: '190px', md: '240px' },
          height: { xs: '150px', sm: '190px', md: '240px' },
          borderRadius: '50%',
        }}
      />
      <BackgroundShape
        delay="2s"
        sx={{
          top: '55%',
          left: '5%',
          width: { xs: '120px', sm: '150px', md: '180px' },
          height: { xs: '70px', sm: '90px', md: '110px' },
        }}
      />
      <BackgroundShape
        delay="6s"
        sx={{
          top: '25%',
          right: '5%',
          width: { xs: '100px', sm: '130px', md: '160px' },
          height: { xs: '60px', sm: '80px', md: '100px' },
        }}
      />
      
      <ContentWrapper elevation={0}>
        <RegisterForm />
      </ContentWrapper>
    </StyledContainer>
  );
};