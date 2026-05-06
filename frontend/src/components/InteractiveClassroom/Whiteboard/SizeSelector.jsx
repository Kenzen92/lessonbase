import React from 'react';
import { Box, IconButton } from '@mui/material';

const toolSizes = {
  'xs': 2,
  'sm': 5,
  'md': 10,
  'lg': 20,
  'xl': 32
};

const SizeSelector = ({ selectedSize, onSizeSelect }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {Object.entries(toolSizes).map(([size, value]) => (
        <IconButton
          key={size}
          onClick={() => onSizeSelect(size)}
          sx={{
            height: '40px',
            width: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 0,
            backgroundColor: selectedSize === size ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
          }}
        >
          <Box
            sx={{
              width: value,
              height: value,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
            }}
          />
        </IconButton>
      ))}
    </Box>
  );
};

export { toolSizes };
export default SizeSelector;
