/**
 * Tool Registry
 * Exports all available drawing tools
 */

import { penTool } from './penTool';
import { eraserTool } from './eraserTool';
import { rectangleTool } from './rectangleTool';
import { circleTool } from './circleTool';

export const tools = {
  pen: penTool,
  eraser: eraserTool,
  rectangle: rectangleTool,
  circle: circleTool,
};

export const getTool = (toolName) => {
  return tools[toolName] || tools.pen;
};
