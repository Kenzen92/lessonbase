import React from 'react';
import { Box, Typography } from '@mui/material';

const TextChat = () => {
  return (
    <Box sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
        Text Chat
      </Typography>
      {/* Placeholder for text chat implementation */}
      <Box 
        sx={{ 
          height: 'calc(100% - 40px)', 
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          Text chat will be implemented here
        </Typography>
      </Box>
    </Box>
  );
};

export default TextChat;
