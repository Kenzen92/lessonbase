import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import {
  FaPen,
  FaEraser,
  FaSquare,
  FaCircle,
  FaArrowRight,
  FaICursor,
  FaMousePointer
} from 'react-icons/fa';

const tools = [
  { name: 'select', icon: FaMousePointer, tooltip: 'Select' },
  { name: 'pen', icon: FaPen, tooltip: 'Pen' },
  { name: 'eraser', icon: FaEraser, tooltip: 'Eraser' },
  { name: 'rectangle', icon: FaSquare, tooltip: 'Rectangle' },
  { name: 'circle', icon: FaCircle, tooltip: 'Circle' },
  { name: 'arrow', icon: FaArrowRight, tooltip: 'Arrow' },
  { name: 'text', icon: FaICursor, tooltip: 'Text' },
];

const ToolSelector = ({ selectedTool, onToolSelect }) => {
  return (
    <>
      {tools.map((tool) => (
        <Tooltip key={tool.name} title={tool.tooltip} placement="right">
          <IconButton
            onClick={() => onToolSelect(tool.name)}
            sx={{
              color: selectedTool === tool.name ? '#fff' : 'rgba(255, 255, 255, 0.6)',
              backgroundColor: selectedTool === tool.name ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
            }}
          >
            <tool.icon size={20} color={'#a7a7a7ff'} />
          </IconButton>
        </Tooltip>
      ))}
    </>
  );
};

export default ToolSelector;
