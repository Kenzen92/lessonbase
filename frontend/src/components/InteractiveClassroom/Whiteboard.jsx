import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Box, IconButton, Paper, Tooltip, Typography } from '@mui/material';
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
import WhiteboardSocketService from '../../services/whiteboardSocket';
import { get } from 'react-hook-form';

const Whiteboard = ({ selectedTool, setSelectedTool, selectedToolSize, setSelectedToolSize, roomId }) => {
  const stageRef = useRef(null);
  const [lines, setLines] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(0);
  const isDrawing = useRef(false);
  const [socketService, setSocketService] = useState(null);
  const lastEmitTime = useRef(0);
  const EMIT_THROTTLE = 30; // ms between emissions
  const [toolSizeMenuOpen, setToolSizeMenuOpen] = useState(false);

  useEffect(() => {
    const service = new WhiteboardSocketService(roomId);
    setSocketService(service);

    service.subscribeToDrawingEvents((event) => {
      handleRemoteDrawingEvent(event);
    });

    return () => {
      service.disconnect();
    };
  }, [roomId]);
  
  const tools = [
    { name: 'pen', icon: FaPen, tooltip: 'Pen' },
    { name: 'eraser', icon: FaEraser, tooltip: 'Eraser' },
    { name: 'rectangle', icon: FaSquare, tooltip: 'Rectangle' },
    { name: 'circle', icon: FaCircle, tooltip: 'Circle' },
    { name: 'arrow', icon: FaArrowRight, tooltip: 'Arrow' },
  ];

  const toolSizes = {
    'xs': 2,
    'sm': 5,
    'md': 10,
    'lg': 20,
    'xl': 32
  };

  const handleRemoteDrawingEvent = useCallback((event) => {
    switch (event.type) {
      case 'draw_start':
        setLines(prevLines => [...prevLines, event.payload.line]);
        break;
      case 'draw_update':
        setLines(prevLines => {
          const lineToUpdate = prevLines.find(line => line.id === event.payload.lineId);
          if (!lineToUpdate) return prevLines;
          
          lineToUpdate.points = lineToUpdate.points.concat(event.payload.newPoints);
          return [...prevLines.slice(0, -1), lineToUpdate];
        });
        break;
      case 'draw_end':
        if (event.payload.historyStep > historyStep) {
          setHistory(prevHistory => [...prevHistory, lines]);
          setHistoryStep(event.payload.historyStep);
        }
        break;
      case 'undo':
        if (historyStep > 0) {
          setHistoryStep(historyStep - 1);
          setLines(history[historyStep - 1]);
        }
        break;
      case 'redo':
        if (historyStep < history.length - 1) {
          setHistoryStep(historyStep + 1);
          setLines(history[historyStep + 1]);
        }
        break;
      case 'clear':
        setLines([]);
        setHistory([[]]);
        setHistoryStep(0);
        break;
      case 'sync_response':
        setLines(event.payload.lines);
        setHistory(event.payload.history);
        setHistoryStep(event.payload.historyStep);
        break;
      default:
        console.warn('Unknown event type:', event.type);
    }
  }, [history, historyStep]);

  // Add this new function just before the return statement
const getCustomCursor = useCallback(() => {
  if (selectedTool !== 'eraser') return 'default';
  
  const size = toolSizes[selectedToolSize] || toolSizes['md'];
  const cursorSize = size + 2; // Add 2px for border
  
  // Create a temporary canvas to draw the cursor
  const canvas = document.createElement('canvas');
  canvas.width = cursorSize;
  canvas.height = cursorSize;
  const ctx = canvas.getContext('2d');
  
  // Draw black border circle
  ctx.beginPath();
  ctx.arc(cursorSize/2, cursorSize/2, size/2, 0, Math.PI * 2);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Convert to data URL
  const dataUrl = canvas.toDataURL();
  
  return `url(${dataUrl}) ${cursorSize/2} ${cursorSize/2}, auto`;
}, [selectedTool, selectedToolSize, toolSizes]);


  const emitDrawingEvent = useCallback((type, payload = {}) => {
    const now = Date.now();
    if (now - lastEmitTime.current >= EMIT_THROTTLE) {
      socketService?.emitDrawingEvent(type, payload);
      lastEmitTime.current = now;
    }
  }, [socketService]);

  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    const newLine = { 
      tool: selectedTool, 
      points: [pos.x, pos.y], 
      id: Date.now(),
      width: toolSizes[selectedToolSize] || toolSizes['md']
    };
    const newLines = [...lines, newLine];
    setLines(newLines);
    emitDrawingEvent('draw_start', { 
      line: newLine
    });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const lastLine = lines[lines.length - 1];
    const newPoints = [point.x, point.y];
    lastLine.points = lastLine.points.concat(newPoints);

    const newLines = [...lines.slice(0, -1), lastLine];
    setLines(newLines);
    emitDrawingEvent('draw_update', {
      lineId: lastLine.id,
      newPoints: newPoints
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing.current) return;
    
    isDrawing.current = false;
    const lastLine = lines[lines.length - 1];
    const newHistory = history.slice(0, historyStep + 1).concat([lines]);
    const newHistoryStep = historyStep + 1;
    
    setHistory(newHistory);
    setHistoryStep(newHistoryStep);
    
    emitDrawingEvent('draw_end', {
      lineId: lastLine.id,
      historyStep: newHistoryStep
    });
  };

  const handleUndo = () => {
    if (historyStep === 0) return;
    const newHistoryStep = historyStep - 1;
    setHistoryStep(newHistoryStep);
    setLines(history[newHistoryStep]);
    emitDrawingEvent('undo', {
      historyStep: newHistoryStep
    });
  };

  const handleRedo = () => {
    if (historyStep === history.length - 1) return;
    const newHistoryStep = historyStep + 1;
    setHistoryStep(newHistoryStep);
    setLines(history[newHistoryStep]);
    emitDrawingEvent('redo', {
      historyStep: newHistoryStep
    });
  };

  const handleClear = () => {
    setLines([]);
    setHistory([[]]);
    setHistoryStep(0);
    emitDrawingEvent('clear');
  };


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
              onClick={() => {
                setSelectedTool(tool.name);
                setToolSizeMenuOpen(true);
              }}
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
        {toolSizeMenuOpen && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {Object.entries(toolSizes).map(([size, value]) => (
              <IconButton
                key={size}
                onClick={() => {
                  setSelectedToolSize(size);
                  setToolSizeMenuOpen(false);
                }}
                sx={{
                  height: '40px',
                  width: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: selectedToolSize === size ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
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
        )}
        <Box sx={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />
        <Tooltip title="Undo" placement="right">
          <IconButton onClick={handleUndo} disabled={historyStep === 0}>
            <FaUndo size={20} color={'#a7a7a7ff'}/>
          </IconButton>
        </Tooltip>
        <Tooltip title="Redo" placement="right">
          <IconButton onClick={handleRedo} disabled={historyStep === history.length - 1}>
            <FaRedo size={20} color={'#a7a7a7ff'}/>
          </IconButton>
        </Tooltip>
        <Tooltip title="Clear" placement="right">
          <IconButton onClick={handleClear}>
            <FaTrash size={20} color={'#a7a7a7ff'}/>
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
        style={{ backgroundColor: '#fff', cursor: getCustomCursor() }}
      >
        <Layer>
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.tool === 'eraser' ? '#fff' : '#000'}
              strokeWidth={line.width}
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
