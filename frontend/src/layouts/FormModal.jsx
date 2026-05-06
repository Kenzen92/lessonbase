import React from 'react';
import { Modal, Box, Typography } from '@mui/material';
import { ModalContainer, ModalHeader, modalStyles } from '../styles/components/ModalStyles';

const FormModal = ({ 
  open, 
  onClose, 
  title, 
  children,
  maxWidth = 'md'
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="form-modal"
      slotProps={{ 
        backdrop: { style: modalStyles.backdrop } 
      }}
    >
      <ModalContainer
        maxWidth={maxWidth}
        sx={{
          width: {
            xs: '95%',
            sm: '80%',
            md: maxWidth === 'sm' ? '40%' : '60%',
            lg: maxWidth === 'sm' ? '30%' : '50%',
          }
        }}
      >
        <ModalHeader>
          <Typography variant="h5" sx={modalStyles.title}>
            {title}
          </Typography>
        </ModalHeader>
        {children}
      </ModalContainer>
    </Modal>
  );
};

export default FormModal;