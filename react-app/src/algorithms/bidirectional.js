// Bidirectional BFS Algorithm
// Searches from both start and end simultaneously
// More efficient than regular BFS for finding paths
// Guarantees shortest path in unweighted grids

export async function runBidirectional(cells, start, end, getNeighbors, stepCallback, isAborted, passCallback) {
  // Two queues: one from start, one from end
  const queueStart = [start];
  const queueEnd = [end];
  
  const visitedStart = new Map();
  const visitedEnd = new Map();
  
  visitedStart.set(start, null);
  visitedEnd.set(end, null);
  
  start.g = 0;
  end.g = 0;
  
  let direction = 'start'; // Alternate between searching from start and end
  
  while (queueStart.length > 0 && queueEnd.length > 0) {
    if (isAborted()) return false;
    
    // Alternate between expanding from start and end
    if (direction === 'start') {
      const current = queueStart.shift();
      const neighbors = getNeighbors(current);
      const updated = [];
      
      for (const neighbor of neighbors) {
        // Check if we've met the other search
        if (visitedEnd.has(neighbor)) {
          // Reconstruct path by connecting both halves
          reconstructBidirectionalPath(neighbor, visitedStart, visitedEnd, current);
          await stepCallback(current, updated, (n) => n.g);
          return true;
        }
        
        if (!visitedStart.has(neighbor)) {
          visitedStart.set(neighbor, current);
          neighbor.parent = current;
          neighbor.g = current.g + 1;
          queueStart.push(neighbor);
          updated.push(neighbor);
        }
      }
      
  await stepCallback(current, updated, (n) => n.g);
  if (typeof passCallback === 'function') await passCallback({ algo: 'bidirectional', pass: direction });
      direction = 'end';
    } else {
      const current = queueEnd.shift();
      const neighbors = getNeighbors(current);
      const updated = [];
      
      for (const neighbor of neighbors) {
        // Check if we've met the other search
        if (visitedStart.has(neighbor)) {
          // Reconstruct path by connecting both halves
          reconstructBidirectionalPath(neighbor, visitedStart, visitedEnd, null, current);
          await stepCallback(current, updated, (n) => n.g);
          return true;
        }
        
        if (!visitedEnd.has(neighbor)) {
          visitedEnd.set(neighbor, current);
          neighbor.g = current.g + 1;
          queueEnd.push(neighbor);
          updated.push(neighbor);
        }
      }
      
  await stepCallback(current, updated, (n) => n.g);
  if (typeof passCallback === 'function') await passCallback({ algo: 'bidirectional', pass: direction });
      direction = 'start';
    }
  }
  
  return false; // No path found
}

function reconstructBidirectionalPath(meetingPoint, visitedStart, visitedEnd, lastStart, lastEnd) {
  // Build path from start to meeting point
  let pathStart = [];
  let current = lastStart || meetingPoint;
  while (current) {
    pathStart.unshift(current);
    current = visitedStart.get(current);
  }
  
  // Build path from meeting point to end (reversed)
  let pathEnd = [];
  current = lastEnd || visitedEnd.get(meetingPoint);
  while (current) {
    pathEnd.push(current);
    current = visitedEnd.get(current);
  }
  
  // Connect the paths by setting parent pointers
  for (let i = 1; i < pathStart.length; i++) {
    pathStart[i].parent = pathStart[i - 1];
  }
  
  if (lastStart) {
    meetingPoint.parent = lastStart;
  }
  
  for (let i = 0; i < pathEnd.length; i++) {
    if (i === 0) {
      pathEnd[i].parent = meetingPoint;
    } else {
      pathEnd[i].parent = pathEnd[i - 1];
    }
  }
}
