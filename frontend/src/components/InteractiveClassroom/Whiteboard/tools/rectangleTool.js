/**
 * Rectangle Tool Handler
 * Provides rectangle drawing functionality
 */

export const rectangleTool = {
  name: 'rectangle',
  
  onMouseDown: (pos, { toolSizes, selectedToolSize, selectedColor }) => {
    const newShape = {
      tool: 'rectangle',
      startX: pos.x,
      startY: pos.y,
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      id: Date.now(),
      strokeWidth: toolSizes[selectedToolSize] || toolSizes['md'],
      color: selectedColor,
    };
    return newShape;
  },

  onMouseMove: (pos, currentShape) => {
    if (!currentShape) return null;

    const width = pos.x - currentShape.startX;
    const height = pos.y - currentShape.startY;

    return {
      ...currentShape,
      x: width < 0 ? pos.x : currentShape.startX,
      y: height < 0 ? pos.y : currentShape.startY,
      width: Math.abs(width),
      height: Math.abs(height),
    };
  },

  onMouseUp: (currentShape) => {
    if (!currentShape) return null;

    return {
      ...currentShape,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  },

  getCursor: () => 'crosshair',
};
