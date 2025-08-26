import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Box, Paper } from '@mui/material';
import WhiteboardSocketService from '../../services/whiteboardSocket';
import Toolbar from './Whiteboard/Toolbar';
import Canvas from './Whiteboard/Canvas';

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
  const [selectedColor, setSelectedColor] = useState('#000000');
  const currentLine = useRef(null);
  const rawPoints = useRef([]);

  // Function to create a smooth curve using Catmull-Rom splines
  const smoothLine = (points) => {
    if (points.length < 2) return points;

    // Helper function to interpolate between four points
    const interpolate = (p0, p1, p2, p3, t, alpha = 0.5) => {
      const t2 = t * t;
      const t3 = t2 * t;
      
      // Catmull-Rom matrix
      const v0 = (-alpha * t3 + 2 * alpha * t2 - alpha * t) * p0;
      const v1 = ((2 - alpha) * t3 + (alpha - 3) * t2 + 1) * p1;
      const v2 = ((alpha - 2) * t3 + (3 - 2 * alpha) * t2 + alpha * t) * p2;
      const v3 = (alpha * t3 - alpha * t2) * p3;
      
      return v0 + v1 + v2 + v3;
    };

    // First, do basic distance-based simplification
    const simplified = [];
    let lastX = points[0];
    let lastY = points[1];
    simplified.push(lastX, lastY);

    for (let i = 2; i < points.length; i += 2) {
      const dx = points[i] - lastX;
      const dy = points[i + 1] - lastY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 2) { // Smaller threshold to maintain more detail
        simplified.push(points[i], points[i + 1]);
        lastX = points[i];
        lastY = points[i + 1];
      }
    }

    // Always include the last point
    if (simplified[simplified.length - 2] !== points[points.length - 2] ||
        simplified[simplified.length - 1] !== points[points.length - 1]) {
      simplified.push(points[points.length - 2], points[points.length - 1]);
    }

    // If we don't have enough points for interpolation
    if (simplified.length < 6) return simplified;

    const result = [];
    result.push(simplified[0], simplified[1]); // Start with the first point

    // Generate smooth curve points
    for (let i = 0; i < simplified.length - 2; i += 2) {
      // Get four points for interpolation
      const p0x = i === 0 ? simplified[0] : simplified[i - 2];
      const p0y = i === 0 ? simplified[1] : simplified[i - 1];
      const p1x = simplified[i];
      const p1y = simplified[i + 1];
      const p2x = simplified[i + 2];
      const p2y = simplified[i + 3];
      const p3x = i >= simplified.length - 4 ? p2x : simplified[i + 4];
      const p3y = i >= simplified.length - 4 ? p2y : simplified[i + 5];

      // Generate points along the curve
      const segments = 5; // Adjust this for smoothness
      for (let t = 1; t <= segments; t++) {
        const x = interpolate(p0x, p1x, p2x, p3x, t / segments, 0.5);
        const y = interpolate(p0y, p1y, p2y, p3y, t / segments, 0.5);
        if (t < segments || i === simplified.length - 4) {
          result.push(x, y);
        }
      }
    }

    return result;
  };

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
      width: toolSizes[selectedToolSize] || toolSizes['md'],
      color: selectedColor,
      color: selectedColor
    };
    currentLine.current = newLine;
    rawPoints.current = [pos.x, pos.y];
    setLines([...lines, newLine]);
    emitDrawingEvent('draw_start', { 
      line: newLine
    });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current || !currentLine.current) return;

    try {
      const stage = e.target.getStage();
      const point = stage.getPointerPosition();
      
      // Capture current line information to avoid race conditions
      const currentLineId = currentLine.current.id;
      const currentPoints = currentLine.current.points;
      
      if (!currentLineId) return;
      
      // Add the raw point to our collection
      rawPoints.current.push(point.x, point.y);
      
      // Create updated line with new points
      const updatedLine = {
        ...currentLine.current,
        points: [...currentPoints, point.x, point.y]
      };
      
      // Update the current line reference
      currentLine.current = updatedLine;
      
      // Update the lines state with extra safety checks
      setLines(prevLines => {
        // Ensure we have a valid array
        const validLines = Array.isArray(prevLines) ? prevLines : [];
        
        // Filter with the captured ID instead of accessing currentLine.current
        const withoutPreview = validLines.filter(line => 
          line && line.id && line.id !== currentLineId
        );
        
        return [...withoutPreview, updatedLine];
      });
      
      // Emit the update event with the captured ID
      emitDrawingEvent('draw_update', {
        lineId: currentLineId,
        newPoints: [point.x, point.y]
      });
    } catch (error) {
      console.warn('Error during line update:', error);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing.current || !currentLine.current) return;
    
    // Capture current line information immediately to avoid race conditions
    const originalLine = { ...currentLine.current };
    const originalId = originalLine.id;
    let newLine = null;
    
    try {
      // Special handling for dots (single clicks)
      if (rawPoints.current.length === 2) {
        const x = rawPoints.current[0];
        const y = rawPoints.current[1];
        newLine = {
          ...originalLine,
          points: [x, y],
          isDot: true, // Mark this as a dot for special rendering
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
      } else {
        // Normal line handling
        const smoothedPoints = smoothLine(rawPoints.current);
        if (!smoothedPoints || smoothedPoints.length < 2) return;
        
        newLine = {
          ...originalLine,
          points: smoothedPoints,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
      }
      
      // Update lines state, being extra careful about null checks
      setLines(prevLines => {
        // Ensure we have valid arrays
        const validLines = Array.isArray(prevLines) ? prevLines : [];
        
        // Filter out the preview line using captured ID and add the smooth line
        return [
          ...validLines.filter(line => line && line.id && line.id !== originalId),
          newLine
        ];
      });

      // Create new history entry using captured ID
      const validLines = Array.isArray(lines) ? lines : [];
      const linesWithoutPreview = validLines.filter(line => line && line.id && line.id !== originalId);
      
      const newHistoryEntry = [...linesWithoutPreview, newLine];
      const newHistory = [...history.slice(0, historyStep + 1), newHistoryEntry];
      const newHistoryStep = historyStep + 1;

      // Update history state
      setHistory(newHistory);
      setHistoryStep(newHistoryStep);

      // Only emit if we successfully created the new line
      if (newLine) {
        emitDrawingEvent('draw_end', {
          lineId: newLine.id,
          historyStep: newHistoryStep
        });
      }
    } catch (error) {
      console.warn('Error during line completion:', error);
    } finally {
      // Always clean up the drawing state
      isDrawing.current = false;
      currentLine.current = null;
      rawPoints.current = [];
    }
    
    // Reset the drawing state
    currentLine.current = null;
    rawPoints.current = [];
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
      <Toolbar
        selectedTool={selectedTool}
        onToolSelect={(tool) => {
          setSelectedTool(tool);
          setToolSizeMenuOpen(true);
        }}
        selectedSize={selectedToolSize}
        onSizeSelect={setSelectedToolSize}
        selectedColor={selectedColor}
        onColorSelect={setSelectedColor}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        canUndo={historyStep > 0}
        canRedo={historyStep < history.length - 1}
        showSizeSelector={toolSizeMenuOpen}
        onSizeSelectorClose={() => setToolSizeMenuOpen(false)}
      />

      <Canvas
        width={window.innerWidth * 0.65}
        height={window.innerHeight - 32}
        lines={lines}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        stageRef={stageRef}
        cursor={getCustomCursor()}
      />
    </Box>
  );
};

export default Whiteboard;
