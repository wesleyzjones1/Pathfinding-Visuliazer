// Jump Point Search (JPS) Algorithm
// Optimized A* variant that "jumps" over unnecessary nodes
// Much faster than A* on uniform-cost grids with no diagonal movement
// Guarantees shortest path like A* but with fewer node expansions

export async function runJPS(cells, start, end, getNeighbors, stepCallback, isAborted, passCallback) {
  const openSet = [start];
  const closedSet = new Set();
  
  start.g = 0;
  start.h = heuristic(start, end);
  start.f = start.g + start.h;
  
  function heuristic(a, b) {
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
  }
  
  function isWalkable(r, c){
    return r>=0 && r<rows && c>=0 && c<cols && cells[r][c].state !== 'wall';
  }
  
  // Component jump: only checks forced neighbors and goal (no perpendicular recursion)
  function jumpStraight(current, direction) {
    const [dr, dc] = direction;
    const nr = current.r + dr;
    const nc = current.c + dc;
    if (!isWalkable(nr, nc)) return null;
    const next = cells[nr][nc];
    if (next === end) return next;
    if (checkForcedNeighbors(next, direction)) return next;
    return jumpStraight(next, direction);
  }
  
  // Primary jump: also checks perpendicular component jumps (4-way JPS requirement)
  function jump(current, direction) {
    const [dr, dc] = direction;
    const nr = current.r + dr;
    const nc = current.c + dc;
    if (!isWalkable(nr, nc)) return null;
    const next = cells[nr][nc];
    if (next === end) return next;
    if (checkForcedNeighbors(next, direction)) return next;
    
    // For 4-way JPS: check perpendicular directions for jump points
    if (dc !== 0) { // moving horizontally → check vertical components
      if (jumpStraight(next, [1, 0]) !== null) return next;
      if (jumpStraight(next, [-1, 0]) !== null) return next;
    }
    if (dr !== 0) { // moving vertically → check horizontal components
      if (jumpStraight(next, [0, 1]) !== null) return next;
      if (jumpStraight(next, [0, -1]) !== null) return next;
    }
    
    return jump(next, direction);
  }
  
  function checkForcedNeighbors(node, direction) {
    const [dr, dc] = direction;
    // 4-way JPS forced neighbor rules
    if (dc !== 0) { // moving horizontally
      if (!isWalkable(node.r - 1, node.c) && isWalkable(node.r - 1, node.c + dc)) return true;
      if (!isWalkable(node.r + 1, node.c) && isWalkable(node.r + 1, node.c + dc)) return true;
    }
    if (dr !== 0) { // moving vertically
      if (!isWalkable(node.r, node.c - 1) && isWalkable(node.r + dr, node.c - 1)) return true;
      if (!isWalkable(node.r, node.c + 1) && isWalkable(node.r + dr, node.c + 1)) return true;
    }
    return false;
  }
  
  const rows = cells.length;
  const cols = cells[0].length;
  const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]]; // right, down, left, up
  
  while (openSet.length > 0) {
    if (isAborted()) return false;
    
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift();
    
    if (current === end) return true;
    
    closedSet.add(current);
    const updated = [];
    
    // Try jumping in each direction
    for (const dir of directions) {
      const jumpPoint = jump(current, dir);
      if (!jumpPoint || closedSet.has(jumpPoint)) continue;
      
      const tentativeG = current.g + heuristic(current, jumpPoint);
      
      if (!openSet.includes(jumpPoint)) {
        openSet.push(jumpPoint);
      } else if (tentativeG >= jumpPoint.g) {
        continue;
      }
      
      jumpPoint.parent = current;
      jumpPoint.g = tentativeG;
      jumpPoint.h = heuristic(jumpPoint, end);
      jumpPoint.f = jumpPoint.g + jumpPoint.h;
      updated.push(jumpPoint);
    }
    
    await stepCallback(current, updated, (n) => n.f);
  }
  
  return false;
}
