// Iterative Deepening DFS (IDDFS) Algorithm
// Combines benefits of BFS (completeness, optimal) with DFS (low memory)
// Repeatedly performs depth-limited DFS with increasing depth limits
// Guarantees shortest path while using minimal memory

const DEBUG = false; // set true for verbose logging when debugging

export async function runIDDFS(cells, start, end, getNeighbors, stepCallback, isAborted, passCallback) {
  const minDepth = Math.abs(start.r - end.r) + Math.abs(start.c - end.c);
  let maxDepth = minDepth; // start at the Manhattan lower-bound to reduce needless shallower iterations
  const maxIterations = cells.length * cells[0].length; // Prevent infinite loop
  
  start.g = 0;
  
  // Try increasing depth limits
  while (maxDepth < maxIterations) {
  if (isAborted()) return false;
  if (DEBUG) console.debug('[IDDFS] depth iteration:', maxDepth);
    
    // Reset parent/g values for a fresh depth iteration to avoid stale
    // values persisting across depth-limited searches which can create
    // confusing labels and incorrect path reconstruction.
    for (const row of cells) {
      for (const n of row) { n.g = Infinity; n.parent = null; }
    }
    start.g = 0;

    // IMPORTANT: Create fresh 'path' set for each depth iteration.  Depth-limited DFS
    // must only prevent revisiting nodes on the current recursion path to avoid
    // incorrectly pruning nodes reached via different branches.
    const path = new Set();
    const result = await depthLimitedSearch(start, end, maxDepth, path, getNeighbors, stepCallback, isAborted);
    // Let the UI reflect the end of this depth iteration before continuing
    if (passCallback && typeof passCallback === 'function') {
      try { await passCallback({ algo: 'iddfs', pass: maxDepth }); } catch (e) { /* ignore */ }
    }
    
  if (result === true) { if (DEBUG) console.debug('[IDDFS] found at depth', maxDepth); return true; }
    if (result === 'cutoff') {
      maxDepth++; // Increase depth and try again
    } else {
      return false; // No path exists
    }
  }
  
  return false;
}

async function depthLimitedSearch(node, goal, limit, pathSet, getNeighbors, stepCallback, isAborted) {
  if (isAborted()) return false;
  
  if (node === goal) return true;
  if (DEBUG) console.debug('[IDDFS] visiting', {r: node.r, c: node.c}, 'limit:', limit, 'g:', node.g);
  
  if (limit === 0) return 'cutoff'; // Reached depth limit
  
  pathSet.add(node);
  let cutoffOccurred = false;
  const neighbors = getNeighbors(node);
  
  // Collect valid neighbors for visualization
  const validNeighbors = [];
  for (const neighbor of neighbors) {
    if (pathSet.has(neighbor)) continue;
    validNeighbors.push(neighbor);
  }
  
  // Show visualization step with preview of neighbors
  const previewUpdated = [];
  for (const neighbor of validNeighbors) {
    neighbor.parent = node;
    neighbor.g = (Number.isFinite(node.g) ? node.g : 0) + 1;
    previewUpdated.push(neighbor);
  }
  await stepCallback(node, previewUpdated, (n) => n.g);
  
  // Recurse on each neighbor, properly saving/restoring state
  for (const neighbor of validNeighbors) {
    const oldParent = neighbor.parent;
    const oldG = neighbor.g;
    
    // Set parent chain for this branch
    neighbor.parent = node;
    neighbor.g = (Number.isFinite(node.g) ? node.g : 0) + 1;
    
    const result = await depthLimitedSearch(neighbor, goal, limit - 1, pathSet, getNeighbors, stepCallback, isAborted);
    
    if (result === true) {
      return true; // Keep parent chain intact
    }
    if (result === 'cutoff') {
      cutoffOccurred = true;
    }
    
    // Restore neighbor state for other branches
    neighbor.parent = null;
    neighbor.g = Infinity;
  }
  
  pathSet.delete(node);
  
  return cutoffOccurred ? 'cutoff' : false;
}
