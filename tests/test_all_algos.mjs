// Comprehensive test for all pathfinding algorithms
import { runAStar } from '../react-app/src/algorithms/astar.js';
import { runDijkstra } from '../react-app/src/algorithms/dijkstra.js';
import { runBFS } from '../react-app/src/algorithms/bfs.js';
import { runDFS } from '../react-app/src/algorithms/dfs.js';
import { runGreedy } from '../react-app/src/algorithms/greedy.js';
import { runBidirectional } from '../react-app/src/algorithms/bidirectional.js';
import { runJPS } from '../react-app/src/algorithms/jumppointsearch.js';
import { runIDDFS } from '../react-app/src/algorithms/iddfs.js';
import { runBestFirst } from '../react-app/src/algorithms/bestfirst.js';
import { runThetaStar } from '../react-app/src/algorithms/thetastar.js';

// Build a simple grid
function makeGrid(rows, cols, walls) {
  const cells = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({ r, c, state: 'empty', g: Infinity, h: Infinity, f: Infinity, parent: null, el: { classList: { add(){}, remove(){}, contains(){ return false; } }, style: {}, querySelector(){ return null; }, textContent: '' } });
    }
    cells.push(row);
  }
  for (const [r, c] of walls) {
    cells[r][c].state = 'wall';
  }
  return cells;
}

function neighbors(cells, rows, cols) {
  return function(cell) {
    const list = [];
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dr, dc] of dirs) {
      const nr = cell.r + dr, nc = cell.c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        const n = cells[nr][nc];
        if (n.state !== 'wall') list.push(n);
      }
    }
    return list;
  };
}

function resetGrid(cells) {
  for (const row of cells) {
    for (const n of row) {
      n.g = Infinity; n.h = Infinity; n.f = Infinity; n.parent = null;
    }
  }
}

function pathLength(end) {
  let cur = end, len = 0, safety = 0;
  while (cur && safety < 10000) { len++; cur = cur.parent; safety++; }
  return len - 1; // exclude start
}

function hasValidPath(start, end) {
  // Check parent chain leads from end back to start
  let cur = end, safety = 0;
  while (cur && safety < 10000) {
    if (cur === start) return true;
    cur = cur.parent;
    safety++;
  }
  return false;
}

const noopStep = async () => {};
const noAbort = () => false;
const noopPass = async () => {};

let passed = 0, failed = 0;

async function testAlgo(name, fn, cells, start, end, getNeighbors, expectPath, optimalLength) {
  resetGrid(cells);
  try {
    const result = await fn(cells, start, end, getNeighbors, noopStep, noAbort, noopPass);
    if (expectPath) {
      if (!result) { console.log(`  FAIL [${name}]: expected path, got no path`); failed++; return; }
      if (!hasValidPath(start, end)) { console.log(`  FAIL [${name}]: path doesn't lead from end to start`); failed++; return; }
      const len = pathLength(end);
      if (optimalLength !== undefined && len !== optimalLength) {
        // Some algorithms don't guarantee shortest path
        if (['dfs', 'greedy', 'bestfirst', 'iddfs', 'thetastar', 'jps'].includes(name.toLowerCase())) {
          console.log(`  PASS [${name}]: found path of length ${len} (optimal=${optimalLength}, any-angle/non-optimal OK)`);
        } else {
          console.log(`  FAIL [${name}]: path length ${len}, expected optimal ${optimalLength}`);
          failed++; return;
        }
      } else {
        console.log(`  PASS [${name}]: path found, length=${len}`);
      }
      passed++;
    } else {
      if (result) { console.log(`  FAIL [${name}]: expected no path, but path found`); failed++; return; }
      console.log(`  PASS [${name}]: correctly found no path`);
      passed++;
    }
  } catch (e) {
    console.log(`  FAIL [${name}]: threw error: ${e.message}`);
    failed++;
  }
}

// Test scenarios
console.log('\n=== Test 1: Simple open grid (10x10) ===');
{
  const R = 10, C = 10;
  const cells = makeGrid(R, C, []);
  const start = cells[0][0], end = cells[9][9];
  const getN = neighbors(cells, R, C);
  // Manhattan distance = 18, optimal path = 18
  
  await testAlgo('A*', runAStar, cells, start, end, getN, true, 18);
  await testAlgo('Dijkstra', runDijkstra, cells, start, end, getN, true, 18);
  await testAlgo('BFS', runBFS, cells, start, end, getN, true, 18);
  await testAlgo('DFS', runDFS, cells, start, end, getN, true, 18);
  await testAlgo('Greedy', runGreedy, cells, start, end, getN, true, 18);
  await testAlgo('Bidirectional', runBidirectional, cells, start, end, getN, true, 18);
  await testAlgo('JPS', runJPS, cells, start, end, getN, true, 18);
  await testAlgo('IDDFS', runIDDFS, cells, start, end, getN, true, 18);
  await testAlgo('BestFirst', runBestFirst, cells, start, end, getN, true, 18);
  await testAlgo('ThetaStar', runThetaStar, cells, start, end, getN, true, 18);
}

console.log('\n=== Test 2: Grid with wall barrier ===');
{
  const R = 10, C = 10;
  // Wall from row 0-8 at col 5
  const walls = [];
  for (let r = 0; r <= 8; r++) walls.push([r, 5]);
  const cells = makeGrid(R, C, walls);
  const start = cells[2][2], end = cells[2][8];
  const getN = neighbors(cells, R, C);
  // Must go around the wall: optimal path goes down to row 9, around col 5, back up
  
  await testAlgo('A*', runAStar, cells, start, end, getN, true);
  await testAlgo('Dijkstra', runDijkstra, cells, start, end, getN, true);
  await testAlgo('BFS', runBFS, cells, start, end, getN, true);
  await testAlgo('DFS', runDFS, cells, start, end, getN, true);
  await testAlgo('Greedy', runGreedy, cells, start, end, getN, true);
  await testAlgo('Bidirectional', runBidirectional, cells, start, end, getN, true);
  await testAlgo('JPS', runJPS, cells, start, end, getN, true);
  await testAlgo('IDDFS', runIDDFS, cells, start, end, getN, true);
  await testAlgo('BestFirst', runBestFirst, cells, start, end, getN, true);
  await testAlgo('ThetaStar', runThetaStar, cells, start, end, getN, true);
}

console.log('\n=== Test 3: No path (fully blocked) ===');
{
  const R = 5, C = 5;
  // Wall completely surrounding end
  const walls = [[1,2],[2,2],[3,2],[1,3],[1,4],[3,3],[3,4],[2,4]];
  const cells = makeGrid(R, C, walls);
  const start = cells[0][0], end = cells[2][3];
  const getN = neighbors(cells, R, C);
  
  await testAlgo('A*', runAStar, cells, start, end, getN, false);
  await testAlgo('Dijkstra', runDijkstra, cells, start, end, getN, false);
  await testAlgo('BFS', runBFS, cells, start, end, getN, false);
  await testAlgo('DFS', runDFS, cells, start, end, getN, false);
  await testAlgo('Greedy', runGreedy, cells, start, end, getN, false);
  await testAlgo('Bidirectional', runBidirectional, cells, start, end, getN, false);
  await testAlgo('JPS', runJPS, cells, start, end, getN, false);
  await testAlgo('IDDFS', runIDDFS, cells, start, end, getN, false);
  await testAlgo('BestFirst', runBestFirst, cells, start, end, getN, false);
  await testAlgo('ThetaStar', runThetaStar, cells, start, end, getN, false);
}

console.log('\n=== Test 4: Adjacent start/end ===');
{
  const R = 5, C = 5;
  const cells = makeGrid(R, C, []);
  const start = cells[2][2], end = cells[2][3];
  const getN = neighbors(cells, R, C);
  
  await testAlgo('A*', runAStar, cells, start, end, getN, true, 1);
  await testAlgo('Dijkstra', runDijkstra, cells, start, end, getN, true, 1);
  await testAlgo('BFS', runBFS, cells, start, end, getN, true, 1);
  await testAlgo('DFS', runDFS, cells, start, end, getN, true, 1);
  await testAlgo('Greedy', runGreedy, cells, start, end, getN, true, 1);
  await testAlgo('Bidirectional', runBidirectional, cells, start, end, getN, true, 1);
  await testAlgo('JPS', runJPS, cells, start, end, getN, true, 1);
  await testAlgo('IDDFS', runIDDFS, cells, start, end, getN, true, 1);
  await testAlgo('BestFirst', runBestFirst, cells, start, end, getN, true, 1);
  await testAlgo('ThetaStar', runThetaStar, cells, start, end, getN, true, 1);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
