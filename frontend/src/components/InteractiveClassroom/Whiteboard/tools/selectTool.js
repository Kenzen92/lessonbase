/**
 * Selection Tool Handler
 * Allows selecting, moving, and editing existing shapes
 */

export const selectTool = {
  name: 'select',

  onMouseDown: (pos, context, clickedShape) => {
    // If a shape was clicked, return it for selection
    // clickedShape will be provided by the Canvas component
    if (clickedShape) {
      return {
        type: 'select',
        shapeId: clickedShape.id,
        shape: clickedShape,
        dragStart: pos,
      };
    }
    // If clicking empty space, deselect
    return { type: 'deselect' };
  },

  onMouseMove: (pos, currentAction) => {
    // If dragging a selected shape, calculate new position
    if (currentAction && currentAction.type === 'select' && currentAction.dragStart) {
      const dx = pos.x - currentAction.dragStart.x;
      const dy = pos.y - currentAction.dragStart.y;
      return {
        ...currentAction,
        dragOffset: { dx, dy },
      };
    }
    return currentAction;
  },

  onMouseUp: (currentAction) => {
    // Return the final action to apply
    return currentAction;
  },

  getCursor: () => 'default',
};
