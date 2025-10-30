/**
 * Eraser Tool Handler
 * Provides eraser functionality with custom cursor
 */

const interpolatePoints = (lastPoint, currentPoint, maxDistance = 5) => {
  const interpolated = [];
  
  if (!lastPoint || lastPoint.length < 2) {
    return [currentPoint.x, currentPoint.y];
  }
  
  const lastX = lastPoint[lastPoint.length - 2];
  const lastY = lastPoint[lastPoint.length - 1];
  const dx = currentPoint.x - lastX;
  const dy = currentPoint.y - lastY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // If the distance is large, interpolate intermediate points
  if (distance > maxDistance) {
    const steps = Math.ceil(distance / maxDistance);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      interpolated.push(
        lastX + dx * t,
        lastY + dy * t
      );
    }
  } else {
    interpolated.push(currentPoint.x, currentPoint.y);
  }
  
  return interpolated;
};

export const eraserTool = {
  name: 'eraser',
  
  onMouseDown: (pos, { toolSizes, selectedToolSize }) => {
    const newLine = {
      tool: 'eraser',
      points: [pos.x, pos.y],
      id: Date.now(),
      width: toolSizes[selectedToolSize] || toolSizes['md'],
      color: '#fff',
    };
    return newLine;
  },

  onMouseMove: (pos, currentLine) => {
    if (!currentLine) return null;

    const lastPoint = currentLine.points.length >= 2 
      ? currentLine.points 
      : null;
    
    // Interpolate points to handle fast mouse movements
    const interpolated = interpolatePoints(lastPoint, pos, 5);
    
    return {
      ...currentLine,
      points: [...currentLine.points, ...interpolated],
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

    return {
      ...currentLine,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  },

  getCursor: (toolSizes, selectedToolSize) => {
    const size = toolSizes[selectedToolSize] || toolSizes['md'];
    const cursorSize = size + 2; // Add 2px for border
    
    // Create a temporary canvas to draw the cursor
    const canvas = document.createElement('canvas');
    canvas.width = cursorSize;
    canvas.height = cursorSize;
    const ctx = canvas.getContext('2d');
    
    // Draw black border circle
    ctx.beginPath();
    ctx.arc(cursorSize/2, cursorSize/2, size/2, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Convert to data URL
    const dataUrl = canvas.toDataURL();
    
    return `url(${dataUrl}) ${cursorSize/2} ${cursorSize/2}, auto`;
  },
};
