import { Button, styled } from '@mui/material';

export const ModalButton = styled(Button)(({ theme, variant }) => ({
  padding: '8px 24px',
  borderRadius: theme.shape.borderRadius,
  textTransform: 'none',
  fontWeight: 600,
  minWidth: '120px',
  transition: 'all 0.2s ease-in-out',
  ...(variant === 'contained' && {
    backgroundColor: theme.palette.primary.main,
    color: '#fff',
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      transform: 'translateY(-1px)',
    },
  }),
  ...(variant === 'outlined' && {
    borderColor: 'rgba(255, 255, 255, 0.2)',
    color: '#fff',
    '&:hover': {
      borderColor: 'rgba(255, 255, 255, 0.4)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
  }),
}));

export const CancelButton = styled(ModalButton)({
  color: 'rgba(255, 255, 255, 0.7)',
  '&:hover': {
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

export const NextButton = styled(ModalButton)({
  backgroundColor: '#2196F3',
  '&:hover': {
    backgroundColor: '#1976D2',
  },
});

export const SubmitButton = styled(ModalButton)({
  backgroundColor: '#4CAF50',
  '&:hover': {
    backgroundColor: '#388E3C',
  },
});