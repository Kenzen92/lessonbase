import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Box, Typography, CircularProgress, Button, Paper } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { verifyEmail, resendVerification } from '../services/authService';
import { toast } from 'react-toastify';

function VerifyEmail() {
  const { key } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (key) {
      handleVerifyEmail();
    }
  }, [key]);

  const handleVerifyEmail = async () => {
    try {
      const data = await verifyEmail(key);
      setStatus('success');
      setMessage(data.message || 'Email verified successfully!');
      setEmail(data.email);
      
      toast.success('Email verified! You can now log in.');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Email verification error:', error);
      setStatus('error');
      setMessage(error.message || 'Email verification failed.');
      toast.error(error.message || 'Email verification failed.');
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Please enter your email address to resend verification.');
      return;
    }

    try {
      await resendVerification(email);
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      console.error('Resend verification error:', error);
      toast.error(error.message || 'Failed to resend verification email.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(0deg, rgba(0,28,91,1) 0%, rgba(9,85,121,1) 52%, rgba(0,212,255,1) 100%)',
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 500,
          width: '100%',
          textAlign: 'center',
        }}
      >
        {status === 'verifying' && (
          <>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Verifying Your Email
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Please wait while we verify your email address...
            </Typography>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h5" gutterBottom color="success.main">
              Email Verified!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {message}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Redirecting to login...
            </Typography>
            <Box mt={2}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button variant="contained" color="primary">
                  Go to Login
                </Button>
              </Link>
            </Box>
          </>
        )}

        {status === 'error' && (
          <>
            <ErrorIcon color="error" sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h5" gutterBottom color="error.main">
              Verification Failed
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {message}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              The verification link may have expired or is invalid.
            </Typography>
            <Box mt={2}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button variant="contained" color="primary">
                  Go to Login
                </Button>
              </Link>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}

export default VerifyEmail;
