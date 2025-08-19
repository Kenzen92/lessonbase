import React from 'react';
import { Box, IconButton, Tooltip, Popover } from '@mui/material';
import { FaPalette } from 'react-icons/fa';

const colors = [
  '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000',
  '#800000', '#008080', '#000080', '#FFC0CB', '#A52A2A',
  '#808080', '#C0C0C0', '#FFFFFF', '#4B0082', '#FF4500'
];

const ColorPicker = ({ selectedColor, onColorSelect }) => {
  const [anchorPosition, setAnchorPosition] = React.useState(null);

  const handleClick = (event) => {
    setAnchorPosition({ top: 100, left: 100 });
  };

  const handleClose = () => {
    setAnchorPosition(null);
  };

  return (
    <>
      <Tooltip title="Color" placement="right">
        <IconButton 
          onClick={handleClick}
          sx={{
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: selectedColor,
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }
          }}
        >
          <FaPalette size={20} color={'#a7a7a7ff'}/>
        </IconButton>
      </Tooltip>
      <Popover
        open={Boolean(anchorPosition)}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={anchorPosition}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1 }}>
            {colors.map((color) => (
              <Box
                key={color}
                onClick={() => {
                  onColorSelect(color);
                  handleClose();
                }}
                sx={{
                  width: 24,
                  height: 24,
                  backgroundColor: color,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: color === selectedColor ? '2px solid #fff' : '1px solid rgba(0,0,0,0.2)',
                  '&:hover': {
                    transform: 'scale(1.1)',
                  }
                }}
              />
            ))}
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export default ColorPicker;
