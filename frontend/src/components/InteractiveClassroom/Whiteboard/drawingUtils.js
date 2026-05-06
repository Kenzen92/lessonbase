// Helper function to interpolate between four points using Catmull-Rom splines
const interpolate = (p0, p1, p2, p3, t, alpha = 0.5) => {
  const t2 = t * t;
  const t3 = t2 * t;
  
  // Catmull-Rom matrix
  const v0 = (-alpha * t3 + 2 * alpha * t2 - alpha * t) * p0;
  const v1 = ((2 - alpha) * t3 + (alpha - 3) * t2 + 1) * p1;
  const v2 = ((alpha - 2) * t3 + (3 - 2 * alpha) * t2 + alpha * t) * p2;
  const v3 = (alpha * t3 - alpha * t2) * p3;
  
  return v0 + v1 + v2 + v3;
};

// Function to create a smooth curve using Catmull-Rom splines
export const smoothLine = (points) => {
  if (points.length < 4) return points;

  // First, do basic distance-based simplification
  const simplified = [];
  let lastX = points[0];
  let lastY = points[1];
  simplified.push(lastX, lastY);

  for (let i = 2; i < points.length; i += 2) {
    const dx = points[i] - lastX;
    const dy = points[i + 1] - lastY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 2) { // Smaller threshold to maintain more detail
      simplified.push(points[i], points[i + 1]);
      lastX = points[i];
      lastY = points[i + 1];
    }
  }

  // Always include the last point
  if (simplified[simplified.length - 2] !== points[points.length - 2] ||
      simplified[simplified.length - 1] !== points[points.length - 1]) {
    simplified.push(points[points.length - 2], points[points.length - 1]);
  }

  // If we don't have enough points for interpolation
  if (simplified.length < 6) return simplified;

  const result = [];
  result.push(simplified[0], simplified[1]); // Start with the first point

  // Generate smooth curve points
  for (let i = 0; i < simplified.length - 2; i += 2) {
    // Get four points for interpolation
    const p0x = i === 0 ? simplified[0] : simplified[i - 2];
    const p0y = i === 0 ? simplified[1] : simplified[i - 1];
    const p1x = simplified[i];
    const p1y = simplified[i + 1];
    const p2x = simplified[i + 2];
    const p2y = simplified[i + 3];
    const p3x = i >= simplified.length - 4 ? p2x : simplified[i + 4];
    const p3y = i >= simplified.length - 4 ? p2y : simplified[i + 5];

    // Generate points along the curve
    const segments = 5; // Adjust this for smoothness
    for (let t = 1; t <= segments; t++) {
      const x = interpolate(p0x, p1x, p2x, p3x, t / segments, 0.5);
      const y = interpolate(p0y, p1y, p2y, p3y, t / segments, 0.5);
      if (t < segments || i === simplified.length - 4) {
        result.push(x, y);
      }
    }
  }

  return result;
};
