/**
 * Pen Tool Handler
 * Provides smooth pen drawing using Konva's tension parameter
 */

export const penTool = {
  name: 'pen',
  
  onMouseDown: (pos, { toolSizes, selectedToolSize, selectedColor }) => {
    const newLine = {
      tool: 'pen',
      points: [pos.x, pos.y],
      id: Date.now(),
      width: toolSizes[selectedToolSize] || toolSizes['md'],
      color: selectedColor,
    };
    return newLine;
  },

  onMouseMove: (pos, currentLine) => {
    if (!currentLine) return null;
    
    // Simply add the new point to the line
    return {
      ...currentLine,
      points: [...currentLine.points, pos.x, pos.y],
    };
  },

  onMouseUp: (currentLine) => {
    if (!currentLine) return null;

    // Handle dots (single clicks)
    if (currentLine.points.length === 2) {
      return {
        ...currentLine,
        isDot: true,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
    }

    // Just return the line with a new ID for finalization
    return {
      ...currentLine,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  },

  getCursor: () => 'crosshair',
};
