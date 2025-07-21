import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Alert,
  Checkbox,
  FormControlLabel,
  IconButton,
  Divider,
  Avatar,
  TextField,
  InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import type { ApiError } from '../../types/api';
import { socialAuthService } from '../../services/socialAuthService';
import SweetAlert from '../../utils/sweetAlert';
import { Mail, Lock, Ticket } from 'lucide-react';
import { UserRole } from '../../types/auth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setApiError('');
      const user = await login(data.email, data.password);
      SweetAlert.success('Welcome back!', 'You have successfully logged in');
      
      // Check if there's a redirect URL stored (for "Get Tickets Now" flow)
      const redirectUrl = localStorage.getItem('redirectAfterLogin');
      if (redirectUrl) {
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectUrl);
        return;
      }
      
      // Navigate to role-specific dashboard
      if (user.role === UserRole.BUYER) {
        navigate('/buyer/dashboard');
      } else if (user.role === UserRole.SELLER) {
        navigate('/seller/dashboard');
      } else if (user.role === UserRole.ADMIN) {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      const apiErr = error as ApiError;
      const errorMessage = apiErr.message || 'Login failed';
      setApiError(errorMessage);
      SweetAlert.error('Login Failed', errorMessage);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setApiError('');
      await socialAuthService.signInWithGoogle();
    } catch (error) {
      const apiErr = error as ApiError;
      setApiError(apiErr.message || 'Google login failed');
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setApiError('');
      await socialAuthService.signInWithFacebook();
    } catch (error) {
      const apiErr = error as ApiError;
      setApiError(apiErr.message || 'Facebook login failed');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              mx: 'auto',
              mb: 3,
              bgcolor: 'primary.main',
              boxShadow: 2,
            }}
          >
            <Ticket size={28} style={{ color: 'white' }} />
          </Avatar>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontSize: { xs: '1.75rem', sm: '2rem' },
              fontWeight: 600,
              color: 'text.primary',
              mb: 1,
            }}
          >
            Welcome Back
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sign in to your SeatSnags account
          </Typography>
        </Box>
        <form onSubmit={handleSubmit(onSubmit)} aria-label="Login form">
          {apiError && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                borderRadius: 2,
              }}
            >
              {apiError}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              variant="outlined"
              error={!!errors.email}
              helperText={errors.email?.message}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail size={20} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              variant="outlined"
              error={!!errors.password}
              helperText={errors.password?.message}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...register('password')}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock size={20} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: 'text.secondary' }}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  sx={{
                    '& .MuiSvgIcon-root': {
                      color: 'primary.main',
                    }
                  }}
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  Remember me
                </Typography>
              }
              aria-label="Remember me checkbox"
            />

            <Typography
              component={Link}
              to="/forgot-password"
              variant="body2"
              sx={{
                color: 'primary.main',
                textDecoration: 'none',
                fontWeight: 500,
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Forgot password?
            </Typography>
          </Box>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            sx={{ width: '100%', mb: 3 }}
            isLoading={isSubmitting}
            aria-describedby={apiError ? 'form-error' : undefined}
          >
            {!isSubmitting ? (
              <>
                <Lock size={20} style={{ marginRight: 8 }} />
                Sign In
              </>
            ) : (
              'Signing In...'
            )}
          </Button>

          <Box sx={{ position: 'relative', mb: 3 }}>
            <Divider sx={{ color: 'text.secondary' }}>
              <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
                Or continue with
              </Typography>
            </Divider>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
            <Button
              type="button"
              variant="outline"
              size="md"
              sx={{ minWidth: '140px' }}
              onClick={handleGoogleLogin}
              aria-label="Sign in with Google"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 8 }} aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              sx={{ minWidth: '140px' }}
              onClick={handleFacebookLogin}
              aria-label="Sign in with Facebook"
            >
              <svg width="20" height="20" fill="#1877F2" viewBox="0 0 24 24" style={{ marginRight: 8 }} aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </Button>
          </Box>
        </form>

        <Box sx={{ textAlign: 'center', pt: 3, mt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Typography
              component={Link}
              to="/register"
              variant="body2"
              sx={{
                color: 'primary.main',
                textDecoration: 'none',
                fontWeight: 600,
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Create one now
            </Typography>
          </Typography>
        </Box>
    </Box>
  );
};