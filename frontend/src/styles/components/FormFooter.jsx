import React from 'react';
import { Box } from '@mui/material';
import { CancelButton, NextButton, SubmitButton } from './ModalButtons';

const FormFooter = ({ 
  onBack, 
  onNext, 
  onSubmit, 
  onCancel,
  step,
  finalStep
}) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: 2, 
        mt: 4 
      }}
    >
      {onBack && (
        <CancelButton onClick={onBack}>
          Back
        </CancelButton>
      )}
      {onCancel && (
        <CancelButton onClick={onCancel}>
          Cancel
        </CancelButton>
      )}
      {onNext && (
        <NextButton onClick={onNext} variant="contained">
          Next
        </NextButton>
      )}
      {onSubmit && (
        <SubmitButton onClick={onSubmit} variant="contained">
          Submit
        </SubmitButton>
      )}
    </Box>
  );
};

export default FormFooter;