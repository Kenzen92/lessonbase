import React, { useRef, useState, useEffect, useCallback } from "react";
import { Box, Paper } from "@mui/material";
import WhiteboardSocketService from "../../services/whiteboardSocket";
import Toolbar from "./Whiteboard/Toolbar";
import Canvas from "./Whiteboard/Canvas";
import { getTool } from "./Whiteboard/tools";

const Whiteboard = ({
  selectedTool,
  setSelectedTool,
  selectedToolSize,
  setSelectedToolSize,
  roomId,
}) => {
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [lines, setLines] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(0);
  const isDrawing = useRef(false);
  const [socketService, setSocketService] = useState(null);
  const lastEmitTime = useRef(0);
  const EMIT_THROTTLE = 30; // ms between emissions
  const [toolSizeMenuOpen, setToolSizeMenuOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const currentLine = useRef(null);
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: window.innerWidth * 0.65,
    height: window.innerHeight - 32,
  });
  const [editingTextId, setEditingTextId] = useState(null);
  const textareaRef = useRef(null);
  const textEditStartTime = useRef(null);
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  const [hoveredShapeId, setHoveredShapeId] = useState(null);

  const toolSizes = {
    xs: 2,
    sm: 5,
    md: 10,
    lg: 20,
    xl: 32,
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
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setCanvasDimensions({ width, height });
      }
    };

    updateCanvasSize();

    const resizeObserver = new ResizeObserver(updateCanvasSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handleRemoteDrawingEvent = useCallback(
    (event) => {
      switch (event.type) {
        case "draw_start":
          setLines((prevLines) => [...prevLines, event.payload.line]);
          break;
        case "draw_update":
          setLines((prevLines) => {
            const lineToUpdate = prevLines.find(
              (line) => line.id === event.payload.lineId
            );
            if (!lineToUpdate) return prevLines;

            lineToUpdate.points = lineToUpdate.points.concat(
              event.payload.newPoints
            );
            return [...prevLines.slice(0, -1), lineToUpdate];
          });
          break;
        case "draw_end":
          if (event.payload.historyStep > historyStep) {
            setHistory((prevHistory) => [...prevHistory, lines]);
            setHistoryStep(event.payload.historyStep);
          }
          break;
        case "text_update":
          setLines((prevLines) => {
            return prevLines.map((line) =>
              line.id === event.payload.textId
                ? { ...line, text: event.payload.text }
                : line
            );
          });
          break;
        case "text_move":
          setLines((prevLines) => {
            return prevLines.map((line) =>
              line.id === event.payload.textId
                ? { ...line, x: event.payload.x, y: event.payload.y }
                : line
            );
          });
          break;
        case "shape_delete":
          setLines((prevLines) => {
            return prevLines.filter(line => line.id !== event.payload.shapeId);
          });
          break;
        case "shape_move":
          setLines((prevLines) => {
            return prevLines.map((line) =>
              line.id === event.payload.shapeId
                ? event.payload.shape
                : line
            );
          });
          break;
        case "undo":
          if (historyStep > 0) {
            setHistoryStep(historyStep - 1);
            setLines(history[historyStep - 1]);
          }
          break;
        case "redo":
          if (historyStep < history.length - 1) {
            setHistoryStep(historyStep + 1);
            setLines(history[historyStep + 1]);
          }
          break;
        case "clear":
          setLines([]);
          setHistory([[]]);
          setHistoryStep(0);
          break;
        case "sync_response":
          setLines(event.payload.lines);
          setHistory(event.payload.history);
          setHistoryStep(event.payload.historyStep);
          break;
        default:
          console.warn("Unknown event type:", event.type);
      }
    },
    [history, historyStep, lines]
  );

  const getCustomCursor = useCallback(() => {
    const tool = getTool(selectedTool);

    if (typeof tool.getCursor === "function") {
      return tool.getCursor();
    }

    return "default";
  }, [selectedTool]);

  const emitDrawingEvent = useCallback(
    (type, payload = {}) => {
      const now = Date.now();
      if (now - lastEmitTime.current >= EMIT_THROTTLE) {
        socketService?.emitDrawingEvent(type, payload);
        lastEmitTime.current = now;
      }
    },
    [socketService]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Delete or Backspace to delete selected shape
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShapeId && !editingTextId) {
        e.preventDefault();

        setLines((prevLines) => {
          const updatedLines = prevLines.filter(line => line.id !== selectedShapeId);

          // Update history
          setHistory((prevHistory) => [
            ...prevHistory.slice(0, historyStep + 1),
            updatedLines,
          ]);
          setHistoryStep((prevStep) => prevStep + 1);

          return updatedLines;
        });

        // Emit delete event
        emitDrawingEvent("shape_delete", {
          shapeId: selectedShapeId,
        });

        setSelectedShapeId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedShapeId, editingTextId, historyStep, emitDrawingEvent]);

  // Text handling functions - defined before handleMouseDown to avoid forward reference
  const finishTextEditing = useCallback((force = false) => {
    // Normalize force to boolean (in case an event object is passed)
    const shouldForce = force === true;
    if (editingTextId) {
      // Prevent immediate closure - require at least 200ms to have passed
      const timeSinceStart = Date.now() - (textEditStartTime.current || 0);
      if (!shouldForce && timeSinceStart < 200) {
        // Re-focus the textarea if it lost focus too quickly
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
        return;
      }
      setLines((prevLines) => {
        const updatedLines = prevLines.map((line) =>
          line.id === editingTextId ? { ...line, isEditing: false } : line
        );

        // Update history
        setHistory((prevHistory) => [
          ...prevHistory.slice(0, historyStep + 1),
          updatedLines,
        ]);
        setHistoryStep((prevStep) => prevStep + 1);

        return updatedLines;
      });

      setEditingTextId(null);
      textEditStartTime.current = null;
    }
  }, [editingTextId, historyStep]);

  const handleTextDblClick = useCallback((textId) => {
    setEditingTextId(textId);
    textEditStartTime.current = Date.now();

    // Focus textarea after state update and set initial height
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        // Set initial height based on content
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      }
    }, 0);
  }, []);

  const handleTextChange = useCallback((textId, newText) => {
    setLines((prevLines) => {
      const updatedLines = prevLines.map((line) =>
        line.id === textId ? { ...line, text: newText } : line
      );
      return updatedLines;
    });

    // Emit text update event
    emitDrawingEvent("text_update", {
      textId,
      text: newText,
    });
  }, [emitDrawingEvent]);

  const handleTextDragEnd = useCallback((textId, x, y) => {
    setLines((prevLines) => {
      const updatedLines = prevLines.map((line) =>
        line.id === textId ? { ...line, x, y } : line
      );
      return updatedLines;
    });

    // Emit position update event
    emitDrawingEvent("text_move", {
      textId,
      x,
      y,
    });
  }, [emitDrawingEvent]);

  // Handle shape selection
  const handleShapeClick = useCallback((shape) => {
    if (selectedTool === 'select') {
      setSelectedShapeId(shape.id);
    }
  }, [selectedTool]);

  // Handle shape hover (for eraser tool highlighting)
  const handleShapeHover = useCallback((shape) => {
    if (selectedTool === 'eraser') {
      setHoveredShapeId(shape ? shape.id : null);
    }
  }, [selectedTool]);

  const handleMouseDown = useCallback(
    (e) => {
      // If clicking on stage (not on a shape), finish editing and deselect
      if (e.target === e.target.getStage()) {
        finishTextEditing(true); // Force finish when explicitly clicking away

        // Deselect when clicking empty space with select tool
        if (selectedTool === 'select') {
          setSelectedShapeId(null);
          return; // Don't start drawing with select tool
        }

        // Clear hover when clicking empty space with eraser
        if (selectedTool === 'eraser') {
          setHoveredShapeId(null);
          return;
        }
      }

      // Don't start drawing if we're editing text
      if (editingTextId) return;

      // Get the clicked shape (if any) for tools that need it
      const clickedShape = hoveredShapeId ? lines.find(line => line.id === hoveredShapeId) : null;

      // For eraser tool, delete the clicked shape immediately
      if (selectedTool === 'eraser' && clickedShape) {
        setLines((prevLines) => {
          const updatedLines = prevLines.filter(line => line.id !== clickedShape.id);

          // Update history
          setHistory((prevHistory) => [
            ...prevHistory.slice(0, historyStep + 1),
            updatedLines,
          ]);
          setHistoryStep((prevStep) => prevStep + 1);

          return updatedLines;
        });

        // Emit delete event
        emitDrawingEvent("shape_delete", {
          shapeId: clickedShape.id,
        });

        setHoveredShapeId(null);
        return;
      }

      // For select tool, prepare for dragging selected shape
      if (selectedTool === 'select' && selectedShapeId && e.target !== e.target.getStage()) {
        isDrawing.current = true;
        const pos = e.target.getStage().getPointerPosition();

        // Find the selected shape
        const selectedShape = lines.find(line => line.id === selectedShapeId);
        if (selectedShape) {
          currentLine.current = {
            type: 'drag',
            shapeId: selectedShapeId,
            startPos: pos,
            originalShape: { ...selectedShape },
          };
        }
        return;
      }

      // Don't draw with select tool
      if (selectedTool === 'select') return;

      isDrawing.current = true;
      const pos = e.target.getStage().getPointerPosition();

      const tool = getTool(selectedTool);
      const newLine = tool.onMouseDown(pos, {
        toolSizes,
        selectedToolSize,
        selectedColor,
      }, clickedShape);

      if (newLine) {
        currentLine.current = newLine;
        setLines((prevLines) => [...prevLines, newLine]);

        // If it's a text tool, set it as editing
        if (selectedTool === 'text') {
          setEditingTextId(newLine.id);
          textEditStartTime.current = Date.now();
        }

        emitDrawingEvent("draw_start", {
          line: newLine,
        });
      }
    },
    [selectedTool, selectedToolSize, selectedColor, emitDrawingEvent, editingTextId, finishTextEditing, selectedShapeId, hoveredShapeId, lines, historyStep]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDrawing.current || !currentLine.current) return;

      try {
        const stage = e.target.getStage();
        const point = stage.getPointerPosition();

        // Handle dragging selected shape
        if (currentLine.current.type === 'drag') {
          const dx = point.x - currentLine.current.startPos.x;
          const dy = point.y - currentLine.current.startPos.y;

          setLines((prevLines) => {
            return prevLines.map((line) => {
              if (line.id === currentLine.current.shapeId) {
                const original = currentLine.current.originalShape;

                // Update position based on shape type
                if (line.tool === 'text' || line.tool === 'rectangle' || line.tool === 'circle') {
                  return { ...line, x: original.x + dx, y: original.y + dy };
                } else if (line.points) {
                  // For lines (pen/eraser), offset all points
                  const newPoints = original.points.map((coord, idx) => {
                    return idx % 2 === 0 ? coord + dx : coord + dy;
                  });
                  return { ...line, points: newPoints };
                }
              }
              return line;
            });
          });
          return;
        }

        const tool = getTool(selectedTool);
        const updatedLine = tool.onMouseMove(point, currentLine.current);

        if (!updatedLine) return;

        currentLine.current = updatedLine;

        // Efficient update: directly modify the last line in the array
        setLines((prevLines) => {
          const newLines = prevLines.slice(); // Shallow copy
          newLines[newLines.length - 1] = updatedLine; // Replace last line
          return newLines;
        });

        // Emit update for line-based tools
        if (selectedTool === "pen" || selectedTool === "eraser") {
          emitDrawingEvent("draw_update", {
            lineId: updatedLine.id,
            newPoints: [point.x, point.y],
          });
        }
      } catch (error) {
        console.warn("Error during shape update:", error);
      }
    },
    [selectedTool, emitDrawingEvent]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawing.current || !currentLine.current) return;

    // Handle end of drag operation
    if (currentLine.current.type === 'drag') {
      // Update history with the final dragged position
      setLines((prevLines) => {
        setHistory((prevHistory) => [
          ...prevHistory.slice(0, historyStep + 1),
          prevLines,
        ]);
        setHistoryStep((prevStep) => prevStep + 1);
        return prevLines;
      });

      // Emit shape move event
      const draggedShape = lines.find(line => line.id === currentLine.current.shapeId);
      if (draggedShape) {
        emitDrawingEvent("shape_move", {
          shapeId: draggedShape.id,
          shape: draggedShape,
        });
      }

      isDrawing.current = false;
      currentLine.current = null;
      return;
    }

    const originalLine = { ...currentLine.current };
    const originalId = originalLine.id;
    let newLine = null;

    try {
      const tool = getTool(selectedTool);
      newLine = tool.onMouseUp(originalLine);

      if (!newLine) return;

      // For text tool, don't update history yet - wait until editing is done
      if (selectedTool === 'text') {
        // Text is already in the lines array and in editing mode
        // Just emit the draw_end event but don't update history
        emitDrawingEvent("draw_end", {
          lineId: newLine.id,
          historyStep: historyStep,
        });
        return;
      }

      // Single update to lines state for other tools
      setLines((prevLines) => {
        const validLines = Array.isArray(prevLines) ? prevLines : [];
        const updatedLines = [
          ...validLines.filter(
            (line) => line && line.id && line.id !== originalId
          ),
          newLine,
        ];

        // Update history with the new lines
        setHistory((prevHistory) => [
          ...prevHistory.slice(0, historyStep + 1),
          updatedLines,
        ]);
        setHistoryStep((prevStep) => prevStep + 1);

        return updatedLines;
      });

      if (newLine) {
        emitDrawingEvent("draw_end", {
          lineId: newLine.id,
          historyStep: historyStep + 1,
        });
      }
    } catch (error) {
      console.warn("Error during shape completion:", error);
    } finally {
      isDrawing.current = false;
      currentLine.current = null;
    }
  }, [selectedTool, historyStep, emitDrawingEvent, lines]);

  const handleUndo = () => {
    if (historyStep === 0) return;
    const newHistoryStep = historyStep - 1;
    setHistoryStep(newHistoryStep);
    setLines(history[newHistoryStep]);
    emitDrawingEvent("undo", {
      historyStep: newHistoryStep,
    });
  };

  const handleRedo = () => {
    if (historyStep === history.length - 1) return;
    const newHistoryStep = historyStep + 1;
    setHistoryStep(newHistoryStep);
    setLines(history[newHistoryStep]);
    emitDrawingEvent("redo", {
      historyStep: newHistoryStep,
    });
  };

  const handleClear = () => {
    setLines([]);
    setHistory([[]]);
    setHistoryStep(0);
    emitDrawingEvent("clear");
  };

  return (
    <Box ref={containerRef} sx={{ height: "100%", position: "relative" }}>
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
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        lines={lines}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        stageRef={stageRef}
        cursor={getCustomCursor()}
        editingTextId={editingTextId}
        onTextChange={handleTextChange}
        onTextDblClick={handleTextDblClick}
        onTextDragEnd={handleTextDragEnd}
        selectedShapeId={selectedShapeId}
        onShapeClick={handleShapeClick}
        hoveredShapeId={hoveredShapeId}
        onShapeHover={handleShapeHover}
        selectedTool={selectedTool}
      />

      {/* Textarea overlay for text editing */}
      {editingTextId && (() => {
        const editingText = lines.find((line) => line.id === editingTextId);
        if (!editingText) return null;

        const stage = stageRef.current;
        if (!stage) return null;

        // Get the position of the stage container on the page
        const stageBox = stage.container().getBoundingClientRect();

        // Calculate absolute position: stage position + text position in canvas
        const absoluteX = stageBox.left + editingText.x;
        const absoluteY = stageBox.top + editingText.y;

        return (
          <textarea
            ref={(node) => {
              textareaRef.current = node;
              if (node) {
                // Set initial height
                node.style.height = 'auto';
                node.style.height = node.scrollHeight + 3 + 'px';
              }
            }}
            value={editingText.text}
            onChange={(e) => handleTextChange(editingTextId, e.target.value)}
            onBlur={finishTextEditing}
            onMouseDown={(e) => {
              // Stop propagation to prevent stage click handler from interfering
              e.stopPropagation();
            }}
            onKeyDown={(e) => {
              // Enter without shift to finish editing
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                finishTextEditing(true); // Force finish
              }
              // Escape to cancel editing
              if (e.key === 'Escape') {
                finishTextEditing(true); // Force finish
              }
            }}
            onInput={(e) => {
              // Auto-resize height
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + editingText.fontSize + 'px';
            }}
            style={{
              position: 'absolute',
              top: `${absoluteY}px`,
              left: `${absoluteX}px`,
              fontSize: `${editingText.fontSize}px`,
              color: editingText.color,
              border: 'none',
              padding: '0px',
              margin: '0px',
              background: 'none',
              outline: 'none',
              resize: 'none',
              overflow: 'hidden',
              lineHeight: '1.2',
              fontFamily: 'Arial, sans-serif',
              minWidth: '100px',
              minHeight: `${editingText.fontSize}px`,
              zIndex: 1000,
              whiteSpace: 'pre-wrap',
              verticalAlign: 'top',
              boxSizing: 'border-box',
              transform: 'translateY(-2px)', // Fine-tune alignment with Konva Text
            }}
            autoFocus
          />
        );
      })()}
    </Box>
  );
};

export default Whiteboard;
