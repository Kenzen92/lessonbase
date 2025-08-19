import React from 'react';
import { Stage, Layer, Line, Circle } from 'react-konva';

const Canvas = ({
  width,
  height,
  lines,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  stageRef,
  cursor
}) => {
  return (
    <Stage
      width={width}
      height={height}
      onMouseDown={onMouseDown}
      onMousemove={onMouseMove}
      onMouseup={onMouseUp}
      ref={stageRef}
      style={{ backgroundColor: '#fff', cursor }}
    >
      <Layer>
        {lines.map((line, i) => (
          line.isDot ? (
            <Circle
              key={i}
              x={line.points[0]}
              y={line.points[1]}
              radius={line.width / 2}
              fill={line.tool === 'eraser' ? '#fff' : (line.color || '#000')}
              globalCompositeOperation={
                line.tool === 'eraser' ? 'destination-out' : 'source-over'
              }
            />
          ) : (
            <Line
              key={i}
              points={line.points}
              stroke={line.tool === 'eraser' ? '#fff' : (line.color || '#000')}
              strokeWidth={line.width}
              tension={0}
              bezier={true}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={
                line.tool === 'eraser' ? 'destination-out' : 'source-over'
              }
            />
          )
        ))}
      </Layer>
    </Stage>
  );
};

export default Canvas;
