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
    [history, historyStep]
  );

  // Add this new function just before the return statement
  const getCustomCursor = useCallback(() => {
    const tool = getTool(selectedTool);

    if (typeof tool.getCursor === "function") {
      // Some tools need additional parameters (like eraser)
      if (selectedTool === "eraser") {
        return tool.getCursor(toolSizes, selectedToolSize);
      }
      return tool.getCursor();
    }

    return "default";
  }, [selectedTool, selectedToolSize, toolSizes]);

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

  const handleMouseDown = useCallback(
    (e) => {
      isDrawing.current = true;
      const pos = e.target.getStage().getPointerPosition();

      const tool = getTool(selectedTool);
      const newLine = tool.onMouseDown(pos, {
        toolSizes,
        selectedToolSize,
        selectedColor,
      });

      if (newLine) {
        currentLine.current = newLine;
        setLines((prevLines) => [...prevLines, newLine]);
        emitDrawingEvent("draw_start", {
          line: newLine,
        });
      }
    },
    [selectedTool, selectedToolSize, selectedColor, emitDrawingEvent]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDrawing.current || !currentLine.current) return;

      try {
        const stage = e.target.getStage();
        const point = stage.getPointerPosition();

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

    const originalLine = { ...currentLine.current };
    const originalId = originalLine.id;
    let newLine = null;

    try {
      const tool = getTool(selectedTool);
      newLine = tool.onMouseUp(originalLine);

      if (!newLine) return;

      // Single update to lines state
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
  }, [selectedTool, historyStep, emitDrawingEvent]);

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
    <Box sx={{ height: "100%", position: "relative" }}>
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
