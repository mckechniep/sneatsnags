import React from 'react';
import { Box, Container, Typography, Link as MuiLink, Divider, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link } from 'react-router-dom';

const StyledFooter = styled(Box)(({ theme }) => ({
  marginTop: 'auto',
  backgroundColor: theme.palette.grey[50],
  borderTop: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(3, 0),
}));

const FooterSection = styled(Stack)(({ theme }) => ({
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    gap: theme.spacing(2),
    textAlign: 'center',
  },
}));

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <StyledFooter component="footer" role="contentinfo">
      <Container maxWidth="xl">
        <FooterSection spacing={2}>
          <Typography variant="body2" color="text.secondary">
            © {currentYear} SeatSnags. All rights reserved.
          </Typography>
          
          <Stack 
            direction="row" 
            spacing={3}
            divider={<Divider orientation="vertical" flexItem />}
            sx={{ 
              flexWrap: 'wrap',
              justifyContent: { xs: 'center', md: 'flex-end' }
            }}
          >
            <MuiLink
              component={Link}
              to="/about"
              variant="body2"
              color="text.secondary"
              underline="hover"
              sx={{ '&:hover': { color: 'primary.main' } }}
            >
              About
            </MuiLink>
            <MuiLink
              component={Link}
              to="/privacy"
              variant="body2"
              color="text.secondary"
              underline="hover"
              sx={{ '&:hover': { color: 'primary.main' } }}
            >
              Privacy Policy
            </MuiLink>
            <MuiLink
              component={Link}
              to="/terms"
              variant="body2"
              color="text.secondary"
              underline="hover"
              sx={{ '&:hover': { color: 'primary.main' } }}
            >
              Terms of Service
            </MuiLink>
            <MuiLink
              component={Link}
              to="/contact"
              variant="body2"
              color="text.secondary"
              underline="hover"
              sx={{ '&:hover': { color: 'primary.main' } }}
            >
              Contact
            </MuiLink>
          </Stack>
        </FooterSection>
      </Container>
    </StyledFooter>
  );
};