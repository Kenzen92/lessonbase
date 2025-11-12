/**
 * Text Tool Handler
 * Provides text placement and editing functionality
 */

export const textTool = {
  name: 'text',

  onMouseDown: (pos, { toolSizes, selectedToolSize, selectedColor }) => {
    // Create new text object at click position with string ID
    const newText = {
      tool: 'text',
      x: pos.x,
      y: pos.y,
      text: '',
      fontSize: toolSizes[selectedToolSize] * 2 || toolSizes['md'] * 2, // Scale up for readability
      color: selectedColor,
      id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isEditing: true, // Start in editing mode
    };
    return newText;
  },

  onMouseMove: (pos, currentShape) => {
    // Text tool doesn't need mouse move handling
    return currentShape;
  },

  onMouseUp: (currentShape) => {
    if (!currentShape) return null;

    // Keep the same ID and return the text object
    return currentShape;
  },

  getCursor: () => 'text',
};
