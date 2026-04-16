export const CELL_SIZE = 40;

export const MODES = { START: 'start', END: 'end', WALL: 'wall', NONE: 'none' };

export const ALGORITHMS = [
  { value: 'astar', label: 'A*' },
  { value: 'dijkstra', label: 'Dijkstra' },
  { value: 'bfs', label: 'BFS' },
  { value: 'dfs', label: 'DFS' },
  { value: 'greedy', label: 'Greedy' },
  { value: 'bidirectional', label: 'Bidirectional' },
  { value: 'jps', label: 'Jump Point Search' },
  { value: 'iddfs', label: 'IDDFS' },
  { value: 'bestfirst', label: 'Best-First' },
  { value: 'thetastar', label: 'Theta*' },
];

export const ALGO_DESCRIPTIONS = {
  astar: { title: 'A* (A-Star)', text: 'Uses both distance traveled and estimated distance to goal. Finds the shortest path efficiently by prioritizing promising routes.' },
  dijkstra: { title: "Dijkstra's Algorithm", text: 'Explores all directions equally, guaranteeing the shortest path. More thorough but slower than A* when a clear goal exists.' },
  bfs: { title: 'Breadth-First Search', text: 'Explores layer by layer outward from the start. Finds the shortest path in unweighted grids, checking all neighbors before moving further.' },
  dfs: { title: 'Depth-First Search', text: 'Explores as far as possible along each branch before backtracking. Fast but does not guarantee the shortest path.' },
  greedy: { title: 'Greedy Best-First Search', text: 'Only considers distance to goal, ignoring path cost. Faster than A* but may not find the shortest path.' },
  bidirectional: { title: 'Bidirectional BFS', text: 'Searches from both start and end simultaneously, meeting in the middle. More efficient than regular BFS.' },
  jps: { title: 'Jump Point Search', text: 'Optimized A* that skips unnecessary nodes. Much faster on uniform grids while guaranteeing shortest path.' },
  iddfs: { title: 'Iterative Deepening DFS', text: 'Combines DFS memory efficiency with BFS completeness. Repeatedly deepens search until path found.' },
  bestfirst: { title: 'Best-First Search', text: 'Prioritizes nodes by heuristic estimate only. Fast exploration but no path optimality guarantee.' },
  thetastar: { title: 'Theta* Algorithm', text: 'Any-angle pathfinding that creates smooth, natural paths. Allows diagonal shortcuts unlike grid-based A*.' },
};

export const PRESETS = [
  { value: 'maze', label: '▦ Maze' },
  { value: 'scatter', label: '⦿ Scatter' },
  { value: 'fortress', label: '◻ Fortress' },
  { value: 'spiral', label: '↺ Spiral' },
];
