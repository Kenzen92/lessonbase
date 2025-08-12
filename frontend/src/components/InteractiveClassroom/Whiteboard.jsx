import React, { useRef, useState, useEffect } from 'react';
import { Box, IconButton, Paper, Tooltip } from '@mui/material';
import { Stage, Layer, Line } from 'react-konva';
import { 
  FaPen, 
  FaEraser, 
  FaSquare, 
  FaCircle, 
  FaArrowRight,
  FaUndo,
  FaRedo,
  FaTrash
} from 'react-icons/fa';

const Whiteboard = ({ selectedTool, setSelectedTool }) => {
  const stageRef = useRef(null);
  const [lines, setLines] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(0);
  const isDrawing = useRef(false);
  
  const tools = [
    { name: 'pen', icon: FaPen, tooltip: 'Pen' },
    { name: 'eraser', icon: FaEraser, tooltip: 'Eraser' },
    { name: 'rectangle', icon: FaSquare, tooltip: 'Rectangle' },
    { name: 'circle', icon: FaCircle, tooltip: 'Circle' },
    { name: 'arrow', icon: FaArrowRight, tooltip: 'Arrow' },
  ];

  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { tool: selectedTool, points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);

    lines.splice(lines.length - 1, 1, lastLine);
    setLines([...lines]);
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    setHistory(history.slice(0, historyStep + 1).concat([lines]));
    setHistoryStep(historyStep + 1);
  };

  const handleUndo = () => {
    if (historyStep === 0) return;
    setHistoryStep(historyStep - 1);
    setLines(history[historyStep - 1]);
  };

  const handleRedo = () => {
    if (historyStep === history.length - 1) return;
    setHistoryStep(historyStep + 1);
    setLines(history[historyStep + 1]);
  };

  const handleClear = () => {
    setLines([]);
    setHistory([[]]);
    setHistoryStep(0);
  };

  const logLines = useEffect(() => {
    console.log(lines);
  }, [lines]);

  return (
    <Box sx={{ height: '100%', position: 'relative' }}>
      {/* Toolbar */}
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
        {tools.map((tool) => (
          <Tooltip key={tool.name} title={tool.tooltip} placement="right">
            <IconButton
              onClick={() => setSelectedTool(tool.name)}
              sx={{
                color: selectedTool === tool.name ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                backgroundColor: selectedTool === tool.name ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              <tool.icon size={20} />
            </IconButton>
          </Tooltip>
        ))}
        <Box sx={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />
        <Tooltip title="Undo" placement="right">
          <IconButton onClick={handleUndo} disabled={historyStep === 0}>
            <FaUndo size={20} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Redo" placement="right">
          <IconButton onClick={handleRedo} disabled={historyStep === history.length - 1}>
            <FaRedo size={20} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Clear" placement="right">
          <IconButton onClick={handleClear}>
            <FaTrash size={20} />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* Canvas */}
      <Stage
        width={window.innerWidth * 0.65}
        height={window.innerHeight - 32}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        ref={stageRef}
        style={{ backgroundColor: '#fff' }}
      >
        <Layer>
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.tool === 'eraser' ? '#fff' : '#000'}
              strokeWidth={line.tool === 'eraser' ? 20 : 2}
              tension={0.5}
              lineCap="round"
              globalCompositeOperation={
                line.tool === 'eraser' ? 'destination-out' : 'source-over'
              }
            />
          ))}
        </Layer>
      </Stage>
    </Box>
  );
};

export default Whiteboard;
