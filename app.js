// A* Visualizer
// Maintainable modular design with pluggable algorithms
import { runAStar } from './algorithms/astar.js';
import { runDijkstra } from './algorithms/dijkstra.js';
import { runBFS } from './algorithms/bfs.js';
import { runDFS } from './algorithms/dfs.js';
import { runGreedy } from './algorithms/greedy.js';
import { runBidirectional } from './algorithms/bidirectional.js';
import { runJPS } from './algorithms/jumppointsearch.js';
import { runIDDFS } from './algorithms/iddfs.js';
import { runBestFirst } from './algorithms/bestfirst.js';
import { runThetaStar } from './algorithms/thetastar.js';

const gridEl = document.getElementById('grid');
const speedRange = document.getElementById('speed');
const algoSelect = document.getElementById('algo-select');
const statusEl = document.createElement('div');
statusEl.id = 'status';
document.body.appendChild(statusEl);

const algoDescriptions = {
  astar: { 
    title: 'A* (A-Star)', 
    text: 'Uses both distance traveled and estimated distance to goal. Finds the shortest path efficiently by prioritizing promising routes.' 
  },
  dijkstra: { 
    title: "Dijkstra's Algorithm", 
    text: 'Explores all directions equally, guaranteeing the shortest path. More thorough but slower than A* when a clear goal exists.' 
  },
  bfs: { 
    title: 'Breadth-First Search', 
    text: 'Explores layer by layer outward from the start. Finds the shortest path in unweighted grids, checking all neighbors before moving further.' 
  },
  dfs: { 
    title: 'Depth-First Search', 
    text: 'Explores as far as possible along each branch before backtracking. Fast but does not guarantee the shortest path.' 
  },
  greedy: {
    title: 'Greedy Best-First Search',
    text: 'Only considers distance to goal, ignoring path cost. Faster than A* but may not find the shortest path.'
  },
  bidirectional: {
    title: 'Bidirectional BFS',
    text: 'Searches from both start and end simultaneously, meeting in the middle. More efficient than regular BFS.'
  },
  jps: {
    title: 'Jump Point Search',
    text: 'Optimized A* that skips unnecessary nodes. Much faster on uniform grids while guaranteeing shortest path.'
  },
  iddfs: {
    title: 'Iterative Deepening DFS',
    text: 'Combines DFS memory efficiency with BFS completeness. Repeatedly deepens search until path found.'
  },
  bestfirst: {
    title: 'Best-First Search',
    text: 'Prioritizes nodes by heuristic estimate only. Fast exploration but no path optimality guarantee.'
  },
  thetastar: {
    title: 'Theta* Algorithm',
    text: 'Any-angle pathfinding that creates smooth, natural paths. Allows diagonal shortcuts unlike grid-based A*.'
  }
};

function updateAlgoDescription(){
  const algo = algoSelect.value;
  const desc = algoDescriptions[algo] || algoDescriptions.astar;
  document.getElementById('algo-desc-title').textContent = desc.title;
  document.getElementById('algo-desc-text').textContent = desc.text;
}

// Update description when algorithm changes
algoSelect.addEventListener('change', updateAlgoDescription);
updateAlgoDescription(); // set initial description

function displayStats(stats){
  if(!stats){
    document.getElementById('stat-iterations').textContent = '0';
    document.getElementById('stat-path').textContent = '0';
    document.getElementById('stat-time').textContent = '0ms';
  } else {
    document.getElementById('stat-iterations').textContent = stats.iterations;
    document.getElementById('stat-path').textContent = stats.pathLength;
    document.getElementById('stat-time').textContent = stats.duration + 's';
  }
}

const modes = { START:'start', END:'end', WALL:'wall', NONE:'none' };
let currentMode = modes.NONE;
let isRunning = false;
let mouseDown = false;
let mouseButton = 0; // 0 left, 2 right
let startCell = null;
let endCell = null;
let cells = []; // 2D array
let cols = 0, rows = 0;
let runAbort = false;

function setStatus(msg, timeout=2000){
  statusEl.textContent = msg;
  statusEl.classList.add('show');
  if(timeout){
    clearTimeout(setStatus._t);
    setStatus._t = setTimeout(()=>statusEl.classList.remove('show'), timeout);
  }
}

function debounce(fn, wait=150){
  let t; return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn(...args), wait); };
}

function getSpeedMs(){
  // Slider 1..500: 1 = slowest (499ms), 500 = fastest (0ms / turbo)
  return Math.max(0, 500 - parseInt(speedRange.value));
}

function createGrid(){
  // compute rows/cols based on viewport
  const controlsH = document.getElementById('controls-section').offsetHeight;
  const availW = window.innerWidth - 24; // padding approximate
  const availH = window.innerHeight - controlsH - 24;
  cols = Math.floor(availW / 40);
  rows = Math.floor(availH / 40);
  gridEl.style.gridTemplateColumns = `repeat(${cols}, 40px)`;
  gridEl.style.gridTemplateRows = `repeat(${rows}, 40px)`;
  gridEl.innerHTML='';
  cells = [];
  for(let r=0;r<rows;r++){
    const row=[];
    for(let c=0;c<cols;c++){
      const cell=document.createElement('div');
      cell.className='cell';
      cell.dataset.r=r; cell.dataset.c=c;
  const circle=document.createElement('div');
  circle.className='circle';
  const label=document.createElement('span');
  label.className='label';
  cell.appendChild(circle);
  cell.appendChild(label);
      attachCellEvents(cell);
      gridEl.appendChild(cell);
      row.push({ el:cell, r, c, state:'empty', g:Infinity, h:Infinity, f:Infinity, parent:null });
    }
    cells.push(row);
  }
  startCell = null; endCell = null;
}

function attachCellEvents(cell){
  cell.addEventListener('mousedown', e=>{ mouseDown=true; mouseButton=e.button; if(currentMode===modes.WALL) handleCellInteraction(cell, e); });
  cell.addEventListener('mouseenter', e=>{ if(mouseDown && currentMode===modes.WALL) handleCellInteraction(cell,e,true); });
  cell.addEventListener('mouseup', ()=>{ mouseDown=false; });
  // Avoid double-toggle when in wall mode (mousedown already handled)
  cell.addEventListener('click', e=>{ if(currentMode!==modes.WALL) handleCellInteraction(cell,e); });
}
window.addEventListener('mouseup', ()=>{ mouseDown=false; });
// enable right-click erase on walls
gridEl.addEventListener('contextmenu', e=> e.preventDefault());

function handleCellInteraction(cellDiv, e, drag=false){
  if(isRunning) return;
  const r = parseInt(cellDiv.dataset.r), c = parseInt(cellDiv.dataset.c);
  const cell = cells[r][c];
  if(currentMode===modes.START){
    if(cell===startCell){ clearCellState(startCell); startCell=null; return; }
    if(startCell && startCell!==cell){ clearCellState(startCell); }
    if(cell===endCell) clearCellState(endCell);
    setCellState(cell,'start'); startCell = cell; // keep mode active for repositioning
  } else if(currentMode===modes.END){
    if(cell===endCell){ clearCellState(endCell); endCell=null; return; }
    if(endCell && endCell!==cell){ clearCellState(endCell); }
    if(cell===startCell) clearCellState(startCell);
    setCellState(cell,'end'); endCell = cell; // keep mode active for repositioning
  } else if(currentMode===modes.WALL){
    const btn = drag ? mouseButton : (e && typeof e.button==='number' ? e.button : 0);
    if(btn===2){
      if(cell.state==='wall') clearCellState(cell);
    } else {
      if(cell!==startCell && cell!==endCell) setCellState(cell,'wall');
    }
  }
}

function setCellState(cell, state){
  if(cell.state===state) return;
  const prev = cell.state;
  cell.state = state;
  applyCellClasses(cell);
  animateCellChange(cell, prev, state);
}
function clearCellState(cell){
  const prev = cell.state; cell.state='empty'; applyCellClasses(cell); animateCellChange(cell, prev, 'empty');
  if(cell===startCell) startCell=null; if(cell===endCell) endCell=null;
}
function applyCellClasses(cell){
  const el=cell.el; el.classList.remove('start','end','wall','open','path');
  if(cell.state!=='empty') el.classList.add(cell.state);
}
function animateCellChange(cell, from, to){
  const circle = ensureCircle(cell.el);
  if(to==='empty'){
    // animate shrink
    circle.style.backgroundColor = colorForState(from);
    cell.el.classList.add('fill'); // ensure we can shrink from full
    requestAnimationFrame(()=>{
      cell.el.classList.remove('fill');
      circle.style.backgroundColor='transparent';
    });
  } else {
    circle.style.backgroundColor = colorForState(to);
    requestAnimationFrame(()=>{ cell.el.classList.add('fill'); });
  }
}
function colorForState(state){
  const algo = algoSelect.value;
  switch(state){
    case 'start': return getComputedStyle(document.documentElement).getPropertyValue('--start');
    case 'end': return getComputedStyle(document.documentElement).getPropertyValue('--end');
    case 'wall': return getComputedStyle(document.documentElement).getPropertyValue('--wall');
    case 'path': return getComputedStyle(document.documentElement).getPropertyValue(`--${algo}-path`).trim() || '#69b3ff';
    default: return 'transparent';
  }
}

// Mode buttons
const modeButtons = [document.getElementById('mode-start'), document.getElementById('mode-end'), document.getElementById('mode-wall')];
modeButtons.forEach(btn=>btn.addEventListener('click',()=>{ if(isRunning) return; selectMode(btn.dataset.mode); }));
function selectMode(mode){ currentMode = modes[mode.toUpperCase()]; deactivateModeButtons(); const btn = document.querySelector(`[data-mode="${mode}"]`); btn.classList.add('active'); }
function deactivateModeButtons(){ modeButtons.forEach(b=>b.classList.remove('active')); }

// Actions
const runBtn = document.getElementById('run-btn');
const resetBtn = document.getElementById('reset-btn');
runBtn.addEventListener('click', async ()=>{ if(isRunning) return; if(!startCell || !endCell){ setStatus('Select start and end first.'); return; } runAbort=false; await runSelectedAlgorithm(); });
resetBtn.addEventListener('click', ()=>{ location.reload(); });

function resetAll(){
  cells.flat().forEach(cell=>{
    // Hard clear without animations for full reset
    cell.state='empty';
    cell.g=cell.h=cell.f=Infinity; cell.parent=null;
    cell.el.className='cell';
    cell.el.textContent='';
    cell.el.style.backgroundColor='';
    const circle=cell.el.querySelector('.circle');
    if(circle){ circle.style.backgroundColor='transparent'; }
  });
  startCell=null; endCell=null; isRunning=false; runBtn.disabled=false; currentMode=modes.NONE; deactivateModeButtons(); setStatus('Grid reset.');
}

function heuristic(a,b){ // Manhattan
  return Math.abs(a.r-b.r) + Math.abs(a.c-b.c);
}

function neighbors(cell){
  const list=[]; const dirs=[[1,0],[-1,0],[0,1],[0,-1]]; // 4-way
  for(const [dr,dc] of dirs){
    const nr=cell.r+dr, nc=cell.c+dc;
    if(nr>=0 && nr<rows && nc>=0 && nc<cols){
      const n = cells[nr][nc];
      if(n.state!=='wall') list.push(n);
    }
  }
  return list;
}

function shadeForCost(baseRatio){
  // Ratio 0..1 produce light to darker blue
  const l = 90 - (baseRatio*35); // lightness
  return `hsl(205,80%,${l}%)`;
}

async function runSelectedAlgorithm(){
  isRunning=true; runBtn.disabled=true; setStatus('Running...',0);
  // reset visuals and costs - clear all open/path cells immediately without animation
  cells.flat().forEach(c=>{ 
    if(c.state!=='wall' && c.state!=='start' && c.state!=='end') { 
      getLabel(c.el).textContent=''; 
      c.el.style.backgroundColor=''; 
      c.el.classList.remove('open','path','fill');
      // clear cell state if it was path
      if(c.state==='path') { 
        c.state='empty';
        const circle = ensureCircle(c.el);
        circle.style.backgroundColor = 'transparent';
      }
    } 
    c.g=Infinity; c.h=Infinity; c.f=Infinity; c.parent=null;
  });
  
  // Initialize stats
  displayStats({ iterations: 0, pathLength: 0, duration: '0.00' });
  
  const isAborted = ()=> runAbort;
  let iterationCount = 0;
  const startTime = performance.now();
  
  const stepCb = async (current, updated, metric)=>{
    iterationCount++;
    // Update iteration count dynamically
    const currentDuration = ((performance.now() - startTime) / 1000).toFixed(2);
    displayStats({ iterations: iterationCount, pathLength: 0, duration: currentDuration });
    
    for(const n of updated){ if(n!==startCell && n!==endCell){ const val = metric? metric(n): n.g; if(isFinite(val)) getLabel(n.el).textContent = Math.round(val); visualizeOpen(n,true);} }
    if(current!==startCell && current!==endCell) visualizeOpen(current);
    await delayStep();
  };
  
  let ok=false;
  const algo = (algoSelect && algoSelect.value) || 'astar';
  // Create a pass callback that algorithms may call after each pass/iteration
  const passCb = async (info)=>{
    // keep stats updated and allow a small pause so the UI can reflect the entire pass
    const currentDuration = ((performance.now() - startTime) / 1000).toFixed(2);
    displayStats({ iterations: iterationCount, pathLength: 0, duration: currentDuration });
    // optionally set status to indicate pass information
    if(info && info.algo && typeof info.pass !== 'undefined'){
      setStatus(`${info.algo.toUpperCase()} pass: ${info.pass}`, 1000);
    }
    await delayStep();
  };

  if(algo==='astar') ok = await runAStar(cells, startCell, endCell, neighbors, stepCb, isAborted, passCb);
  else if(algo==='dijkstra') ok = await runDijkstra(cells, startCell, endCell, neighbors, stepCb, isAborted, passCb);
  else if(algo==='bfs') ok = await runBFS(cells, startCell, endCell, neighbors, stepCb, isAborted, passCb);
  else if(algo==='dfs') ok = await runDFS(cells, startCell, endCell, neighbors, stepCb, isAborted, passCb);
  else if(algo==='greedy') ok = await runGreedy(cells, startCell, endCell, neighbors, stepCb, isAborted, passCb);
  else if(algo==='bidirectional') ok = await runBidirectional(cells, startCell, endCell, neighbors, stepCb, isAborted, passCb);
  else if(algo==='jps') ok = await runJPS(cells, startCell, endCell, neighbors, stepCb, isAborted, passCb);
  else if(algo==='iddfs') ok = await runIDDFS(cells, startCell, endCell, neighbors, stepCb, isAborted, passCb);
  else if(algo==='bestfirst') ok = await runBestFirst(cells, startCell, endCell, neighbors, stepCb, isAborted, passCb);
  else if(algo==='thetastar') ok = await runThetaStar(cells, startCell, endCell, neighbors, stepCb, isAborted, passCb);
  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  let pathLength = 0;
  if(ok){
    let cur = endCell;
    let safety = 0;
    const maxSafety = rows * cols; // Prevent infinite loops
    while(cur && safety < maxSafety){ 
      pathLength++; 
      cur = cur.parent; 
      safety++;
    }
    pathLength--; // don't count start
    if(pathLength < 0) pathLength = 0; // Safety check
  }

  if(runAbort){ setStatus('Run aborted.',2000); displayStats(null); }
  else if(ok){ 
    await visualizePath(endCell, algo); 
    setStatus('Path found!',2000); 
    displayStats({ iterations: iterationCount, pathLength, duration });
  }
  else { setStatus('No path found.',3000); displayStats({ iterations: iterationCount, pathLength: 0, duration }); }
  isRunning=false; runBtn.disabled=false; statusEl.classList.remove('show');
}

function visualizeOpen(cell, update=false){
  const algo = algoSelect.value;
  const openColor = getComputedStyle(document.documentElement).getPropertyValue(`--${algo}-open`).trim();
  const ratio = cell.f===Infinity?1: Math.min(cell.f / (rows+cols), 1);
  // Interpolate from open color to darker shade based on cost
  cell.el.style.backgroundColor = openColor || shadeForCost(ratio);
  cell.el.classList.add('open');
}

// Collect intermediate cells between two grid cells using Bresenham (excluding endpoints)
function cellsOnLine(a, b){
  const pts = [];
  let x0 = a.c, y0 = a.r;
  const x1 = b.c, y1 = b.r;
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  while(!(x0 === x1 && y0 === y1)){
    const e2 = 2 * err;
    if(e2 > -dy){ err -= dy; x0 += sx; }
    if(e2 < dx){ err += dx; y0 += sy; }
    if(x0 === x1 && y0 === y1) break;
    if(y0>=0 && y0<rows && x0>=0 && x0<cols){
      const c = cells[y0][x0];
      if(c.state !== 'wall') pts.push(c);
    }
  }
  return pts;
}

async function visualizePath(end, algo){
  setStatus('Drawing path...',0);
  // Clear all open cells first
  cells.flat().forEach(c=>{
    if(c.el.classList.contains('open')){
      c.el.classList.remove('open');
      c.el.style.backgroundColor='';
      getLabel(c.el).textContent='';
    }
  });
  console.debug('[viz] Algorithm:', algo);
  // Build parent chain with safety check
  let cur=end; 
  const chain=[]; 
  let safety = 0;
  const maxSafety = rows * cols;
  while(cur && safety < maxSafety){ 
    chain.push(cur); 
    cur=cur.parent; 
    safety++;
  }
  chain.reverse();
  console.debug('[viz] Parent chain length:', chain.length);

  // For Theta* and JPS, densify segments to include intermediate cells
  let path = chain;
  if((algo === 'thetastar' || algo === 'jps') && chain.length > 1){
    const expanded = [chain[0]];
    for(let i=1;i<chain.length;i++){
      const a = chain[i-1];
      const b = chain[i];
      const between = cellsOnLine(a,b);
      // include intermediates then endpoint b
      expanded.push(...between, b);
    }
    // Remove potential duplicates
    path = expanded.filter((cell, idx, arr)=> idx===0 || cell!==arr[idx-1]);
    console.debug('[viz] Densified path length:', path.length);
  }
  
  // Get current stats to update dynamically
  const currentIterations = parseInt(document.getElementById('stat-iterations').textContent) || 0;
  const currentDuration = document.getElementById('stat-time').textContent;
  
  let drawnCount = 0;
  for(const node of path){
    if(node.state==='start' || node.state==='end') continue;
    drawnCount++;
    // Update path length as we draw
    displayStats({ iterations: currentIterations, pathLength: drawnCount, duration: currentDuration });
    
    node.state='path';
    node.el.classList.remove('open');
    node.el.style.backgroundColor='';
    node.el.classList.add('path');
    animatePath(node);
    await delayStep();
  }
}
function animatePath(cell){
  const circle = ensureCircle(cell.el);
  circle.style.backgroundColor = colorForState('path');
  cell.el.classList.add('fill');
}

function delayStep(){
  return new Promise(res=>setTimeout(res, getSpeedMs()));
}

// Resize handling
window.addEventListener('resize', debounce(()=>{ if(isRunning) return; createGrid(); }, 200));

// Helpers to ensure sub-elements exist
function ensureCircle(el){
  let circle = el.querySelector('.circle');
  if(!circle){ circle = document.createElement('div'); circle.className='circle'; el.insertBefore(circle, el.firstChild || null); }
  return circle;
}
function getLabel(el){
  let label = el.querySelector('.label');
  if(!label){ label = document.createElement('span'); label.className='label'; el.appendChild(label); }
  return label;
}

// ── Preset maps ──
function applyPreset(name){
  if(isRunning) return;
  // Reset grid first
  cells.flat().forEach(cell=>{
    cell.state='empty'; cell.g=cell.h=cell.f=Infinity; cell.parent=null;
    cell.el.className='cell';
    const circle=cell.el.querySelector('.circle');
    if(circle) circle.style.backgroundColor='transparent';
    getLabel(cell.el).textContent='';
    cell.el.style.backgroundColor='';
  });
  startCell=null; endCell=null; currentMode=modes.NONE; deactivateModeButtons();
  displayStats(null);

  const walls = [];
  let sr=1, sc=1; // start position
  let er=rows-2, ec=cols-2; // end position

  if(name==='maze') generateMaze(walls);
  else if(name==='spiral') generateSpiral(walls);
  else if(name==='fortress'){ er=Math.floor(rows/2); ec=Math.floor(cols/2); generateFortress(walls); }
  else if(name==='scatter') generateScatter(walls, sr, sc, er, ec);

  // Apply walls (protect start & end cells)
  for(const [r,c] of walls){
    if(r>=0 && r<rows && c>=0 && c<cols && !(r===sr&&c===sc) && !(r===er&&c===ec)){
      setCellState(cells[r][c],'wall');
    }
  }
  // Set start & end
  setCellState(cells[sr][sc],'start'); startCell=cells[sr][sc];
  setCellState(cells[er][ec],'end');   endCell=cells[er][ec];
}

function generateMaze(walls){
  // Recursive division maze
  // Fill all, then carve passages
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) walls.push([r,c]);
  const carved = Array.from({length:rows},()=>Array(cols).fill(false));
  function carve(r,c){
    carved[r][c]=true;
    const dirs=[[0,2],[0,-2],[2,0],[-2,0]];
    shuffle(dirs);
    for(const [dr,dc] of dirs){
      const nr=r+dr, nc=c+dc;
      if(nr>=0 && nr<rows && nc>=0 && nc<cols && !carved[nr][nc]){
        carved[r+dr/2][c+dc/2]=true;
        carve(nr,nc);
      }
    }
  }
  // Start carving from an odd cell
  const startR = 1, startC = 1;
  carve(startR,startC);
  // Remove carved cells from walls
  const wallSet = new Set();
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
    if(!carved[r][c]) wallSet.add(r+','+c);
  }
  walls.length=0;
  for(const key of wallSet){ const [r,c]=key.split(',').map(Number); walls.push([r,c]); }
}

function generateSpiral(walls){
  // Build a clockwise spiral wall with a single-cell gap at the end of each arm
  const grid = Array.from({length:rows},()=>Array(cols).fill(false));
  let top=1, bottom=rows-2, left=1, right=cols-2;
  let dir=0; // 0=right,1=down,2=left,3=up
  while(top<=bottom && left<=right){
    if(dir===0){
      for(let c=left;c<=right;c++) grid[top][c]=true;
      grid[top][right]=false; // gap at end to enter next layer
      top+=2;
    } else if(dir===1){
      for(let r=top;r<=bottom;r++) grid[r][right]=true;
      grid[bottom][right]=false;
      right-=2;
    } else if(dir===2){
      for(let c=right;c>=left;c--) grid[bottom][c]=true;
      grid[bottom][left]=false;
      bottom-=2;
    } else {
      for(let r=bottom;r>=top;r--) grid[r][left]=true;
      grid[top][left]=false;
      left+=2;
    }
    dir=(dir+1)%4;
  }
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) if(grid[r][c]) walls.push([r,c]);
}

function generateFortress(walls){
  // Concentric rectangles with one gap each
  const cx=Math.floor(rows/2), cy=Math.floor(cols/2);
  for(let ring=2; ring<Math.min(cx,cy); ring+=3){
    const t=cx-ring, b=cx+ring, l=cy-ring, r=cy+ring;
    if(t<0||l<0||b>=rows||r>=cols) continue;
    // Pick a gap side and position
    const side=Math.floor(Math.random()*4);
    const gapSize=2;
    for(let c=l;c<=r;c++){ // top
      if(side===0 && Math.abs(c-cy)<=gapSize) continue;
      walls.push([t,c]);
    }
    for(let c=l;c<=r;c++){ // bottom
      if(side===2 && Math.abs(c-cy)<=gapSize) continue;
      walls.push([b,c]);
    }
    for(let rr=t+1;rr<b;rr++){ // left
      if(side===3 && Math.abs(rr-cx)<=gapSize) continue;
      walls.push([rr,l]);
    }
    for(let rr=t+1;rr<b;rr++){ // right
      if(side===1 && Math.abs(rr-cx)<=gapSize) continue;
      walls.push([rr,r]);
    }
  }
}

function generateScatter(walls, sr, sc, er, ec){
  // Random ~25% walls, then guarantee a path exists
  const density=0.25;
  const isWall = Array.from({length:rows},()=>Array(cols).fill(false));
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
    if((r===sr&&c===sc)||(r===er&&c===ec)) continue;
    if(Math.random()<density) isWall[r][c]=true;
  }
  // BFS to check reachability; if blocked, carve a path
  const visited = Array.from({length:rows},()=>Array(cols).fill(false));
  const parent = Array.from({length:rows},()=>Array(cols).fill(null));
  const queue=[[sr,sc]]; visited[sr][sc]=true;
  let found=false;
  while(queue.length){
    const [r,c]=queue.shift();
    if(r===er&&c===ec){ found=true; break; }
    for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nr=r+dr, nc=c+dc;
      if(nr>=0&&nr<rows&&nc>=0&&nc<cols&&!visited[nr][nc]&&!isWall[nr][nc]){
        visited[nr][nc]=true; parent[nr][nc]=[r,c]; queue.push([nr,nc]);
      }
    }
  }
  if(!found){
    // Carve a path: BFS ignoring walls to find shortest, then remove walls along it
    const v2 = Array.from({length:rows},()=>Array(cols).fill(false));
    const p2 = Array.from({length:rows},()=>Array(cols).fill(null));
    const q2=[[sr,sc]]; v2[sr][sc]=true;
    while(q2.length){
      const [r,c]=q2.shift();
      if(r===er&&c===ec) break;
      for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nr=r+dr, nc=c+dc;
        if(nr>=0&&nr<rows&&nc>=0&&nc<cols&&!v2[nr][nc]){
          v2[nr][nc]=true; p2[nr][nc]=[r,c]; q2.push([nr,nc]);
        }
      }
    }
    // Trace back and clear walls
    let cur=[er,ec];
    while(cur){
      isWall[cur[0]][cur[1]]=false;
      cur=p2[cur[0]][cur[1]];
    }
  }
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) if(isWall[r][c]) walls.push([r,c]);
}

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
}

document.querySelectorAll('.preset-btn').forEach(btn=>{
  btn.addEventListener('click',()=> applyPreset(btn.dataset.preset));
});

// Initialize
createGrid();

// ── Theme toggle ──
const themeToggle = document.getElementById('theme-toggle');
function applyTheme(mode){
  document.documentElement.setAttribute('data-theme', mode);
  themeToggle.checked = mode === 'dark';
  localStorage.setItem('theme', mode);
}
// Default dark; respect saved preference
applyTheme(localStorage.getItem('theme') || 'dark');
themeToggle.addEventListener('change', ()=>{
  applyTheme(themeToggle.checked ? 'dark' : 'light');
});

// Expose for debugging
window._astar = { cells, runAStar };
