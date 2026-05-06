/**
 * Tool Registry
 * Exports all available drawing tools
 */

import { penTool } from './penTool';
import { eraserTool } from './eraserTool';
import { rectangleTool } from './rectangleTool';
import { circleTool } from './circleTool';
import { textTool } from './textTool';
import { selectTool } from './selectTool';

export const tools = {
  pen: penTool,
  eraser: eraserTool,
  rectangle: rectangleTool,
  circle: circleTool,
  text: textTool,
  select: selectTool,
};

export const getTool = (toolName) => {
  return tools[toolName] || tools.pen;
};
