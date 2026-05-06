import React from 'react';
import { Box, IconButton, Paper, Tooltip } from '@mui/material';
import { FaUndo, FaRedo, FaTrash } from 'react-icons/fa';
import ToolSelector from './ToolSelector';
import SizeSelector from './SizeSelector';
import ColorPicker from './ColorPicker';

const Toolbar = ({
  selectedTool,
  onToolSelect,
  selectedSize,
  onSizeSelect,
  selectedColor,
  onColorSelect,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  canRedo,
  showSizeSelector,
  onSizeSelectorClose,
}) => {
  return (
    <Paper
      sx={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        zIndex: 1,
        backgroundColor: 'rgba(38, 38, 38, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <ToolSelector selectedTool={selectedTool} onToolSelect={onToolSelect} />
      
      {showSizeSelector && (
        <SizeSelector 
          selectedSize={selectedSize} 
          onSizeSelect={(size) => {
            onSizeSelect(size);
            onSizeSelectorClose();
          }} 
        />
      )}

      <Box sx={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />
      
      <Tooltip title="Undo" placement="right">
        <IconButton onClick={onUndo} disabled={!canUndo}>
          <FaUndo size={20} color={'#a7a7a7ff'}/>
        </IconButton>
      </Tooltip>
      
      <Tooltip title="Redo" placement="right">
        <IconButton onClick={onRedo} disabled={!canRedo}>
          <FaRedo size={20} color={'#a7a7a7ff'}/>
        </IconButton>
      </Tooltip>
      
      <Tooltip title="Clear" placement="right">
        <IconButton onClick={onClear}>
          <FaTrash size={20} color={'#a7a7a7ff'}/>
        </IconButton>
      </Tooltip>
      
      <Box sx={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />
      
      <ColorPicker selectedColor={selectedColor} onColorSelect={onColorSelect} />
    </Paper>
  );
};

export default Toolbar;
