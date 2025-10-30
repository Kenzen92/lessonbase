import React from "react";
import { Stage, Layer, Line, Circle, Rect, Ellipse } from "react-konva";

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
  }) => {
    const renderShape = (shape, i) => {
      // Use shape.id as key for better React reconciliation
      const key = shape.id || i;

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
          />
        );
      }

      // Render lines (pen and eraser)
      return (
        <Line
          key={key}
          points={shape.points}
          stroke={shape.tool === "eraser" ? "#fff" : shape.color || "#000"}
          strokeWidth={shape.width}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
          globalCompositeOperation={
            shape.tool === "eraser" ? "destination-out" : "source-over"
          }
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
        <Layer>{lines.map((shape, i) => renderShape(shape, i))}</Layer>
      </Stage>
    );
  }
);

Canvas.displayName = "Canvas";

export default Canvas;
