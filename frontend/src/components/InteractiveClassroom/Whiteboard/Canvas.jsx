import React from "react";
import { Stage, Layer, Line, Circle, Rect, Ellipse, Text } from "react-konva";

const Canvas = React.memo(
  ({
    width,
    height,
    lines,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    stageRef,
    cursor,
    editingTextId,
    onTextChange,
    onTextDblClick,
    onTextDragEnd,
    selectedShapeId,
    onShapeClick,
    hoveredShapeId,
    onShapeHover,
    selectedTool,
  }) => {
    const renderShape = (shape, i) => {
      // Use shape.id as key for better React reconciliation
      const key = shape.id || i;
      const isSelected = shape.id === selectedShapeId;
      const isHovered = shape.id === hoveredShapeId;
      const isEraserActive = selectedTool === 'eraser';

      // Common shape props for selection and hover
      const shapeProps = {
        onClick: (e) => {
          e.cancelBubble = true; // Stop propagation to stage
          if (onShapeClick) {
            onShapeClick(shape);
          }
        },
        onTap: (e) => {
          e.cancelBubble = true; // For touch devices
          if (onShapeClick) {
            onShapeClick(shape);
          }
        },
        onMouseEnter: () => {
          if (onShapeHover && isEraserActive) {
            onShapeHover(shape);
          }
        },
        onMouseLeave: () => {
          if (onShapeHover && isEraserActive) {
            onShapeHover(null);
          }
        },
      };

      // Determine shadow color based on state
      const getShadowProps = () => {
        if (isHovered && isEraserActive) {
          return {
            shadowBlur: 15,
            shadowColor: '#ff0000',
            shadowOpacity: 1,
          };
        }
        if (isSelected) {
          return {
            shadowBlur: 10,
            shadowColor: '#2196F3',
            shadowOpacity: 0.8,
          };
        }
        return {
          shadowBlur: 0,
          shadowColor: 'transparent',
          shadowOpacity: 0,
        };
      };

      // Render dots (single clicks)
      if (shape.isDot) {
        return (
          <Circle
            key={key}
            x={shape.points[0]}
            y={shape.points[1]}
            radius={shape.width / 2}
            fill={shape.tool === "eraser" ? "#fff" : shape.color || "#000"}
            globalCompositeOperation={
              shape.tool === "eraser" ? "destination-out" : "source-over"
            }
          />
        );
      }

      // Render rectangles
      if (shape.tool === "rectangle") {
        return (
          <Rect
            key={key}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            stroke={shape.color || "#000"}
            strokeWidth={shape.strokeWidth}
            globalCompositeOperation="source-over"
            {...shapeProps}
            {...getShadowProps()}
          />
        );
      }

      // Render circles/ellipses
      if (shape.tool === "circle") {
        return (
          <Ellipse
            key={key}
            x={shape.x}
            y={shape.y}
            radiusX={shape.radiusX}
            radiusY={shape.radiusY}
            stroke={shape.color || "#000"}
            strokeWidth={shape.strokeWidth}
            globalCompositeOperation="source-over"
            {...shapeProps}
            {...getShadowProps()}
          />
        );
      }

      // Render text
      if (shape.tool === "text") {
        return (
          <Text
            key={key}
            id={shape.id}
            x={shape.x}
            y={shape.y}
            text={shape.text || ""}
            fontSize={shape.fontSize}
            fill={shape.color || "#000"}
            fontFamily="Arial, sans-serif"
            lineHeight={1.2}
            draggable={false} // Dragging handled by selection tool
            visible={!shape.isEditing}
            onDblClick={() => onTextDblClick && onTextDblClick(shape.id)}
            onClick={(e) => {
              // Stop event from propagating to stage
              e.cancelBubble = true;
              if (onShapeClick) {
                onShapeClick(shape);
              }
            }}
            onMouseEnter={() => {
              if (onShapeHover && isEraserActive) {
                onShapeHover(shape);
              }
            }}
            onMouseLeave={() => {
              if (onShapeHover && isEraserActive) {
                onShapeHover(null);
              }
            }}
            {...getShadowProps()}
          />
        );
      }

      // Render lines (pen strokes - eraser lines are no longer drawn)
      if (shape.tool === "eraser") {
        // Skip rendering old eraser strokes (legacy data)
        return null;
      }

      return (
        <Line
          key={key}
          points={shape.points}
          stroke={shape.color || "#000"}
          strokeWidth={shape.width}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
          globalCompositeOperation="source-over"
          {...shapeProps}
          {...getShadowProps()}
        />
      );
    };

    return (
      <Stage
        width={width}
        height={height}
        onMouseDown={onMouseDown}
        onMousemove={onMouseMove}
        onMouseup={onMouseUp}
        ref={stageRef}
        style={{ backgroundColor: "#fff", cursor }}
      >
        <Layer>
          {lines.map((shape, i) => renderShape(shape, i))}
        </Layer>
      </Stage>
    );
  }
);

Canvas.displayName = "Canvas";

export default Canvas;
