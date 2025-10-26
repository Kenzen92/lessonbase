import { Box, styled } from '@mui/material';

// Common modal container with consistent styling
export const ModalContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: '#1E1E1E', // Darker background for better dark mode
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  maxHeight: '90vh',
  overflowY: 'auto',
  width: {
    xs: '90%',
    sm: '70%',
    md: '50%',
    lg: '40%'
  },
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.3)',
    },
  },
}));

// Form section with consistent spacing
export const FormSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

// Header section with consistent styling
export const ModalHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  textAlign: 'center',
}));

// Footer section for buttons
export const ModalFooter = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
  display: 'flex',
  justifyContent: 'flex-end',
  gap: theme.spacing(2),
}));

// Constants for common styling
export const modalStyles = {
  backdrop: {
    backdropFilter: 'blur(8px)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  title: {
    color: '#fff',
    fontSize: '1.5rem',
    fontWeight: 600,
    marginBottom: 2,
  },
  inputField: {
    backgroundColor: '#2A2A2A',
    borderRadius: 1,
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.2)',
      },
      '&.Mui-focused fieldset': {
        borderColor: 'primary.main',
      },
    },
    '& .MuiInputBase-input': {
      color: '#fff',
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.7)',
    },
  },
  select: {
    backgroundColor: '#2A2A2A',
    borderRadius: 1,
    '& .MuiSelect-icon': {
      color: 'rgba(255, 255, 255, 0.5)',
    },
  },
};