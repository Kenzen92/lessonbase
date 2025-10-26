import React from 'react';
import { Box } from '@mui/material';
import { sharedStyles } from '../styles/components/SharedStyles';

const WizardLayout = ({ 
  currentStep, 
  totalSteps, 
  children 
}) => {
  return (
    <Box>
      <Box sx={sharedStyles.stepIndicator}>
        {[...Array(totalSteps)].map((_, index) => (
          <Box
            key={index}
            className={`step ${index + 1 <= currentStep ? 'active' : ''}`}
          />
        ))}
      </Box>
      {children}
    </Box>
  );
};

export default WizardLayout;