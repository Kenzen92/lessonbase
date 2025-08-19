import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import Whiteboard from './Whiteboard';
import VideoChat from './VideoChat';
import TextChat from './TextChat';

const InteractiveClassroom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedTool, setSelectedTool] = useState('pen');
  const [selectedToolSize, setSelectedToolSize] = useState(2);
  

  useEffect(() => {
  if (!id) {
    navigate('/dashboard');
    return;
  }
  
  // Load class event details or set up WebSocket connection
}, [id, navigate]);

  return (
    <Box sx={{ height: '100vh', backgroundColor: '#1a1a1a', p: 2 }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        {/* Main Content Area - Whiteboard */}
        <Grid item xs={12} md={8}>
          <Paper 
            sx={{ 
              height: '100%', 
              backgroundColor: 'rgba(38, 38, 38, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
            }}
          >
            <Whiteboard 
              selectedTool={selectedTool} 
              setSelectedTool={setSelectedTool} 
              selectedToolSize={selectedToolSize} 
              setSelectedToolSize={setSelectedToolSize} 
              roomId={id} 
            />
          </Paper>
        </Grid>

        {/* Sidebar - Video and Text Chat */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Paper 
                sx={{ 
                  height: '400px',
                  backgroundColor: 'rgba(38, 38, 38, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                }}
              >
                <VideoChat />
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper 
                sx={{ 
                  height: 'calc(100vh - 448px)', // 400px video + 32px spacing + 16px padding
                  backgroundColor: 'rgba(38, 38, 38, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                }}
              >
                <TextChat />
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InteractiveClassroom;
