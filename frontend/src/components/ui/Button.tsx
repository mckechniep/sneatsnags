import React from 'react';
import { Button as MuiButton, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { ButtonProps as MuiButtonProps } from '@mui/material/Button';

interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'size'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'gradient' | 'glass';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  animated?: boolean;
}

const StyledButton = styled(MuiButton)<{ customvariant: string; customsize: string }>(({ theme, customvariant, customsize }) => {
  const variants = {
    primary: {
      background: 'linear-gradient(45deg, #1D3557 30%, #457B9D 90%)',
      color: 'white',
      border: 'none',
      '&:hover': {
        background: 'linear-gradient(45deg, #0F1C2E 30%, #1D3557 90%)',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(29, 53, 87, 0.4)',
      },
    },
    secondary: {
      background: '#F7F7F7',
      color: '#2C2C2C',
      border: '1px solid #A8DADC',
      '&:hover': {
        background: '#FFFFFF',
        color: '#1D3557',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(168, 218, 220, 0.3)',
      },
    },
    outline: {
      border: '2px solid #1D3557',
      color: '#1D3557',
      background: 'transparent',
      '&:hover': {
        background: '#1D3557',
        color: 'white',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(29, 53, 87, 0.4)',
      },
    },
    ghost: {
      color: '#555555',
      background: 'transparent',
      border: 'none',
      '&:hover': {
        background: 'rgba(168, 218, 220, 0.1)',
        color: '#1D3557',
        transform: 'translateY(-1px)',
      },
    },
    destructive: {
      background: 'linear-gradient(45deg, #ef4444 30%, #dc2626 90%)',
      color: 'white',
      border: 'none',
      '&:hover': {
        background: 'linear-gradient(45deg, #dc2626 30%, #b91c1c 90%)',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
      },
    },
    gradient: {
      background: 'linear-gradient(45deg, #1D3557 30%, #457B9D 50%, #A8DADC 90%)',
      color: 'white',
      border: 'none',
      '&:hover': {
        background: 'linear-gradient(45deg, #0F1C2E 30%, #2C5F7A 50%, #7BB5B8 90%)',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(29, 53, 87, 0.4)',
      },
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.25)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(168, 218, 220, 0.3)',
      color: '#2C2C2C',
      '&:hover': {
        background: 'rgba(255, 255, 255, 0.35)',
        color: '#1D3557',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(168, 218, 220, 0.2)',
      },
    },
  };

  const sizes = {
    xs: {
      padding: '4px 12px',
      fontSize: '0.75rem',
      minHeight: '28px',
      lineHeight: 1.2,
    },
    sm: {
      padding: '6px 16px',
      fontSize: '0.875rem',
      minHeight: '36px',
      lineHeight: 1.3,
    },
    md: {
      padding: '10px 20px',
      fontSize: '0.875rem',
      minHeight: '44px',
      lineHeight: 1.4,
    },
    lg: {
      padding: '12px 28px',
      fontSize: '1rem',
      minHeight: '52px',
      lineHeight: 1.5,
    },
    xl: {
      padding: '16px 36px',
      fontSize: '1.125rem',
      minHeight: '60px',
      lineHeight: 1.5,
    },
  };

  return {
    ...variants[customvariant as keyof typeof variants],
    ...sizes[customsize as keyof typeof sizes],
    borderRadius: '12px',
    fontWeight: 600,
    textTransform: 'none' as const,
    transition: 'all 0.2s ease-in-out',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    '&:focus-visible': {
      outline: '3px solid #1D3557',
      outlineOffset: '2px',
      position: 'relative',
      zIndex: 1,
    },
    '&:focus:not(:focus-visible)': {
      outline: 'none',
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
      transform: 'none',
      background: '#f1f5f9',
      color: '#94a3b8',
      border: '1px solid #e2e8f0',
    },
  };
});

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    isLoading, 
    children, 
    disabled, 
    sx,
    ...props 
  }, ref) => {
    return (
      <StyledButton
        customvariant={variant}
        customsize={size}
        disabled={disabled || isLoading}
        ref={ref}
        sx={sx}
        {...props}
      >
        {isLoading && (
          <>
            <CircularProgress size={16} sx={{ mr: 1, color: 'inherit' }} />
            Loading...
          </>
        )}
        {!isLoading && children}
      </StyledButton>
    );
  }
);

Button.displayName = 'Button';

export { Button };