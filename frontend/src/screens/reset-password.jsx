import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Box, Typography, TextField, Button, Paper, CircularProgress } from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { confirmPasswordReset } from '../services/authService';
import { toast } from 'react-toastify';

function ResetPassword() {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Client-side validation
    if (newPassword !== newPasswordConfirm) {
      setErrors({ password: "Passwords don't match" });
      setIsLoading(false);
      toast.error("Passwords don't match");
      return;
    }

    if (newPassword.length < 8) {
      setErrors({ password: 'Password must be at least 8 characters' });
      setIsLoading(false);
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      await confirmPasswordReset({
        uid,
        token,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      });

      setResetSuccess(true);
      toast.success('Password reset successful! You can now log in with your new password.');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to reset password. The link may have expired.');
      
      if (error.message.includes('password')) {
        setErrors({ password: error.message });
      }
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
        {!resetSuccess ? (
          <>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <LockResetIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Reset Your Password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter your new password below.
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="New Password"
                variant="outlined"
                type="password"
                margin="normal"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrors({ ...errors, password: null });
                }}
                error={!!errors.password}
                helperText={errors.password || 'Must be at least 8 characters'}
                required
                disabled={isLoading}
                autoFocus
              />

              <TextField
                fullWidth
                label="Confirm New Password"
                variant="outlined"
                type="password"
                margin="normal"
                value={newPasswordConfirm}
                onChange={(e) => {
                  setNewPasswordConfirm(e.target.value);
                  setErrors({ ...errors, password: null });
                }}
                error={!!errors.password}
                required
                disabled={isLoading}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                color="primary"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Reset Password'}
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
              <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
              <Typography variant="h5" gutterBottom color="success.main">
                Password Reset Successful!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Your password has been successfully reset.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Redirecting to login...
              </Typography>

              <Box mt={3}>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Button variant="contained" color="primary">
                    Go to Login
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

export default ResetPassword;
