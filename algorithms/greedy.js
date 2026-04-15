// Greedy Best-First Search Algorithm
// Uses only the heuristic (estimated distance to goal) to guide the search
// Faster than A* but does not guarantee the shortest path
// Always moves toward the goal without considering path cost

export async function runGreedy(cells, start, end, getNeighbors, stepCallback, isAborted, passCallback) {
  // Priority queue (sorted by heuristic value only)
  const openSet = [start];
  const closedSet = new Set();
  
  // Initialize costs
  start.h = heuristic(start, end);
  start.g = 0;
  
  function heuristic(a, b) {
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
  }
  
  while (openSet.length > 0) {
    if (isAborted()) return false;
    
    // Sort by heuristic only (greedy approach)
    openSet.sort((a, b) => a.h - b.h);
    const current = openSet.shift();
    
    if (current === end) {
      return true; // Path found
    }
    
    closedSet.add(current);
    const neighbors = getNeighbors(current);
    const updated = [];
    
    for (const neighbor of neighbors) {
      if (closedSet.has(neighbor)) continue;
      
      const tentativeG = current.g + 1;
      const isInOpen = openSet.includes(neighbor);
      
      if (isInOpen && tentativeG >= neighbor.g) {
        continue; // Not a better path
      }
      
      if (!isInOpen) {
        openSet.push(neighbor);
      }
      
      // Update neighbor
      neighbor.parent = current;
      neighbor.g = tentativeG;
      neighbor.h = heuristic(neighbor, end);
      updated.push(neighbor);
    }
    
    // Visualize step (using h as the metric)
    await stepCallback(current, updated, (n) => n.h);
  }
  
  return false; // No path found
}
