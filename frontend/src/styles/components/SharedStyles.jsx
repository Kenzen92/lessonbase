import { keyframes } from '@mui/system';

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const sharedStyles = {
  // Modal overlay animations
  modalOverlay: {
    animation: `${fadeIn} 0.3s ease-out`,
  },

  // Form field styles
  field: {
    marginBottom: 3,
    '& .MuiInputBase-root': {
      backgroundColor: '#2A2A2A',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        backgroundColor: '#333',
      },
      '&.Mui-focused': {
        backgroundColor: '#333',
      },
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.7)',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    '& .MuiInputBase-input': {
      color: '#fff',
    },
  },

  // Chip styles for selected items
  chip: {
    margin: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    '& .MuiChip-deleteIcon': {
      color: 'rgba(255, 255, 255, 0.5)',
      '&:hover': {
        color: '#fff',
      },
    },
  },

  // Section headers
  sectionHeader: {
    color: '#fff',
    marginBottom: 2,
    fontWeight: 500,
  },

  // Step indicators
  stepIndicator: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 3,
    '& .step': {
      width: 10,
      height: 10,
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      margin: '0 4px',
      transition: 'all 0.2s ease-in-out',
      '&.active': {
        backgroundColor: '#2196F3',
        transform: 'scale(1.2)',
      },
    },
  },

  // Date picker overrides
  datePicker: {
    '& .MuiPickersDay-root': {
      color: '#fff',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
      '&.Mui-selected': {
        backgroundColor: '#2196F3',
      },
    },
    '& .MuiPickersDay-today': {
      borderColor: '#2196F3',
    },
  },

  // Dropzone styles
  dropzone: {
    border: '2px dashed rgba(255, 255, 255, 0.2)',
    borderRadius: 1,
    padding: 3,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    transition: 'all 0.2s ease-in-out',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
  },
};