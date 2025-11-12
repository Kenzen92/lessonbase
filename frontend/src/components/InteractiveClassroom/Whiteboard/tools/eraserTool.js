/**
 * Eraser Tool Handler
 * Highlights and deletes shapes on click (no drawing)
 */

export const eraserTool = {
  name: 'eraser',

  onMouseDown: (pos, context, clickedShape) => {
    // If a shape was clicked, mark it for deletion
    if (clickedShape) {
      return {
        type: 'delete',
        shapeId: clickedShape.id,
      };
    }
    // Don't create any drawing if clicking empty space
    return null;
  },

  onMouseMove: (pos, currentAction) => {
    // Eraser doesn't need mouse move handling
    return currentAction;
  },

  onMouseUp: (currentAction) => {
    // Return the action to be processed
    return currentAction;
  },

  getCursor: () => {
    // Use a red circle cursor to indicate deletion mode
    const size = 24;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Draw red circle with X
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2 - 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw X inside
    ctx.beginPath();
    ctx.moveTo(size/2 - 4, size/2 - 4);
    ctx.lineTo(size/2 + 4, size/2 + 4);
    ctx.moveTo(size/2 + 4, size/2 - 4);
    ctx.lineTo(size/2 - 4, size/2 + 4);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.stroke();

    const dataUrl = canvas.toDataURL();
    return `url(${dataUrl}) ${size/2} ${size/2}, auto`;
  },
};
