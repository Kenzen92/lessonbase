import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, TextField, Button, Paper, CircularProgress } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import { requestPasswordReset } from '../services/authService';
import { toast } from 'react-toastify';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await requestPasswordReset(email);
      setEmailSent(true);
      toast.success('Password reset email sent! Please check your inbox.');
    } catch (error) {
      console.error('Password reset request error:', error);
      toast.error(error.message || 'Failed to send password reset email.');
    } finally {
      setIsLoading(false);
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
        }}
      >
        {!emailSent ? (
          <>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <EmailIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Forgot Password?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter your email address and we'll send you a link to reset your password.
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                variant="outlined"
                type="email"
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoFocus
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                color="primary"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Send Reset Link'}
              </Button>
            </form>

            <Box textAlign="center" mt={2}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button variant="text" color="secondary">
                  Back to Login
                </Button>
              </Link>
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ textAlign: 'center' }}>
              <EmailIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h5" gutterBottom color="success.main">
                Email Sent!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                We've sent a password reset link to <strong>{email}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Please check your inbox and follow the instructions to reset your password.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Didn't receive the email? Check your spam folder or try again.
              </Typography>

              <Box mt={3}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => setEmailSent(false)}
                  sx={{ mr: 1 }}
                >
                  Try Again
                </Button>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Button variant="contained" color="primary">
                    Back to Login
                  </Button>
                </Link>
              </Box>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}

export default ForgotPassword;
