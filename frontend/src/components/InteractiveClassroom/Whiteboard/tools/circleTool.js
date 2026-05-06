/**
 * Circle Tool Handler
 * Provides circle/ellipse drawing functionality
 */

export const circleTool = {
  name: 'circle',
  
  onMouseDown: (pos, { toolSizes, selectedToolSize, selectedColor }) => {
    const newShape = {
      tool: 'circle',
      startX: pos.x,
      startY: pos.y,
      x: pos.x,
      y: pos.y,
      radiusX: 0,
      radiusY: 0,
      id: Date.now(),
      strokeWidth: toolSizes[selectedToolSize] || toolSizes['md'],
      color: selectedColor,
    };
    return newShape;
  },

  onMouseMove: (pos, currentShape) => {
    if (!currentShape) return null;

    const dx = pos.x - currentShape.startX;
    const dy = pos.y - currentShape.startY;

    return {
      ...currentShape,
      x: currentShape.startX + dx / 2,
      y: currentShape.startY + dy / 2,
      radiusX: Math.abs(dx) / 2,
      radiusY: Math.abs(dy) / 2,
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
