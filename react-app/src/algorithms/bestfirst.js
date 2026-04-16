// Best-First Search Algorithm
// Uses only the heuristic to prioritize nodes (similar to Greedy)
// General framework that can be configured with different evaluation functions
// Does not guarantee shortest path but explores intelligently

export async function runBestFirst(cells, start, end, getNeighbors, stepCallback, isAborted, passCallback) {
  const openSet = [start];
  const closedSet = new Set();
  
  start.g = 0;
  start.h = heuristic(start, end);
  start.f = start.h; // Best-first uses only heuristic for priority
  
  function heuristic(a, b) {
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
  }
  
  while (openSet.length > 0) {
    if (isAborted()) return false;
    
    // Sort by heuristic value (f = h)
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift();
    
    if (current === end) return true;
    
    closedSet.add(current);
    const neighbors = getNeighbors(current);
    const updated = [];
    
    for (const neighbor of neighbors) {
      if (closedSet.has(neighbor)) continue;
      
      const tentativeG = current.g + 1;
      const isInOpen = openSet.includes(neighbor);
      
      if (isInOpen && tentativeG >= neighbor.g) {
        continue;
      }
      
      if (!isInOpen) {
        openSet.push(neighbor);
      }
      
      neighbor.parent = current;
      neighbor.g = tentativeG;
      neighbor.h = heuristic(neighbor, end);
      neighbor.f = neighbor.h; // Only heuristic matters
      updated.push(neighbor);
    }
    
    await stepCallback(current, updated, (n) => n.h);
  }
  
  return false;
}
