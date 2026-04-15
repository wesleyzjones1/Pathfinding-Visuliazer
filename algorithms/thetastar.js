// Theta* Algorithm
// Any-angle pathfinding algorithm that creates more natural paths
// Unlike A*, allows movement along any angle, not just grid directions
// Produces smoother, more realistic paths by "cutting corners"

export async function runThetaStar(cells, start, end, getNeighbors, stepCallback, isAborted, passCallback) {
  const openSet = [start];
  const closedSet = new Set();
  
  start.g = 0;
  start.h = heuristic(start, end);
  start.f = start.g + start.h;
  start.parent = null;
  
  function heuristic(a, b) {
    // Euclidean distance for any-angle pathfinding
    return Math.sqrt((a.r - b.r) ** 2 + (a.c - b.c) ** 2);
  }
  
  function lineOfSight(a, b) {
    // Bresenham's line algorithm to check line of sight
    // Returns true if there's a clear path from a to b
    if (!a || !b) return false;
    
    let x0 = a.c, y0 = a.r;
    let x1 = b.c, y1 = b.r;
    
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    
    while (true) {
      // Check bounds
      if (y0 < 0 || y0 >= cells.length || x0 < 0 || x0 >= cells[0].length) {
        return false;
      }
      const cell = cells[y0][x0];
      // Check for walls
      if (cell.state === 'wall') {
        return false;
      }
      
      // Reached destination
      if (x0 === x1 && y0 === y1) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
    
    return true;
  }
  
  while (openSet.length > 0) {
    if (isAborted()) return false;
    
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift();
    
    if (current === end) {
      console.debug('[Theta*] Reached end. g:', current.g, 'parent:', current.parent && {r: current.parent.r, c: current.parent.c});
      return true;
    }
    
    closedSet.add(current);
  const neighbors = getNeighbors(current);
    const updated = [];
    
    for (const neighbor of neighbors) {
      if (closedSet.has(neighbor)) continue;
      
      // Theta* key innovation: check line of sight to grandparent
      let tentativeG;
      let newParent;
      
      if (current.parent && lineOfSight(current.parent, neighbor)) {
        // Can skip current node - use straight line from grandparent
        tentativeG = current.parent.g + heuristic(current.parent, neighbor);
        newParent = current.parent;
      } else {
        // Standard A* path through current node
        tentativeG = current.g + heuristic(current, neighbor);
        newParent = current;
      }
      
      // Only update if this is a new node or we found a better path
      const isInOpen = openSet.includes(neighbor);
      if (!isInOpen) {
        openSet.push(neighbor);
      } else if (tentativeG >= neighbor.g) {
        continue; // This path is not better
      }
      
      // Update neighbor with new path information
      neighbor.parent = newParent;
      neighbor.g = tentativeG;
      neighbor.h = heuristic(neighbor, end);
      neighbor.f = neighbor.g + neighbor.h;
      updated.push(neighbor);
    }
    
    await stepCallback(current, updated, (n) => n.f);
  }
  
  return false;
}
