import React from 'react';
import { Box, Typography } from '@mui/material';

const VideoChat = () => {
  return (
    <Box sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
        Video Chat
      </Typography>
      {/* Placeholder for video chat implementation */}
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
          Video chat will be implemented here
        </Typography>
      </Box>
    </Box>
  );
};

export default VideoChat;
