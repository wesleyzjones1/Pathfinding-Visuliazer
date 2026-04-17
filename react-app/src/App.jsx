import { useState, useRef, useCallback, useEffect } from 'react';
import { CELL_SIZE, MODES, ALGO_DESCRIPTIONS } from './constants';
import { generateMaze, generateSpiral, generateFortress, generateScatter } from './presets';
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
import Grid from './components/Grid';
import Controls from './components/Controls';
import './App.css';

const algoRunners = { astar: runAStar, dijkstra: runDijkstra, bfs: runBFS, dfs: runDFS, greedy: runGreedy, bidirectional: runBidirectional, jps: runJPS, iddfs: runIDDFS, bestfirst: runBestFirst, thetastar: runThetaStar };

const SPEED_DEFAULT = 50;
const GRID_TOTAL_HORIZONTAL_MARGIN = 16;
const GRID_BOTTOM_MARGIN = 12;

function getCellSizeForWidth(width) {
  // Breakpoints here are intentionally aligned with App.css media queries (430px and 768px).
  if (width <= 430) return 24;
  if (width <= 768) return 30;
  return CELL_SIZE;
}

function buildGrid(rows, cols) {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      r, c, state: 'empty', g: Infinity, h: Infinity, f: Infinity, parent: null,
      visual: '', label: '',
    }))
  );
}

function cellsOnLine(a, b, cells, rows, cols) {
  const pts = [];
  let x0 = a.c, y0 = a.r;
  const x1 = b.c, y1 = b.r;
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  while (!(x0 === x1 && y0 === y1)) {
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
    if (x0 === x1 && y0 === y1) break;
    if (y0 >= 0 && y0 < rows && x0 >= 0 && x0 < cols) {
      const c = cells[y0][x0];
      if (c.state !== 'wall') pts.push(c);
    }
  }
  return pts;
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [algo, setAlgo] = useState('astar');
  const [mode, setMode] = useState(MODES.NONE);
  const [speed, setSpeed] = useState(SPEED_DEFAULT);
  const [stats, setStats] = useState({ iterations: 0, pathLength: 0, duration: '0.00' });
  const [isRunActive, setIsRunActive] = useState(false);
  const [_renderTick, setRenderTick] = useState(0);
  const [cellSize, setCellSize] = useState(() => {
    if (typeof window === 'undefined') return CELL_SIZE;
    return getCellSizeForWidth(window.innerWidth);
  });

  const cellsRef = useRef([]);
  const rowsRef = useRef(0);
  const colsRef = useRef(0);
  const startRef = useRef(null);
  const endRef = useRef(null);
  const isRunningRef = useRef(false);
  const hasRunSessionRef = useRef(false);
  const isPausedRef = useRef(false);
  const abortRef = useRef(false);
  const speedRef = useRef(speed);
  const algoRef = useRef(algo);
  const mouseRef = useRef({ down: false, button: 0 });

  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { algoRef.current = algo; }, [algo]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const getSpeedMs = useCallback(() => {
    return Math.max(0, 101 - speedRef.current);
  }, []);
  
  const delayStep = useCallback(async () => {
    const wait = ms => new Promise(res => setTimeout(res, ms));
    while (isPausedRef.current && !abortRef.current) {
      await wait(30);
    }
    let remaining = getSpeedMs();
    // Yield to browser for rendering every frame
    await new Promise(resolve => requestAnimationFrame(resolve));
    while (remaining > 0 && !abortRef.current) {
      if (isPausedRef.current) {
        while (isPausedRef.current && !abortRef.current) {
          await wait(30);
        }
      }
      const step = Math.min(30, remaining);
      await wait(step);
      remaining -= step;
    }
  }, [getSpeedMs]);

  const showStatus = useCallback(() => {}, []);

  const getResponsiveCellSize = useCallback(() => getCellSizeForWidth(window.innerWidth), []);

  const computeGridSize = useCallback(() => {
    const size = getResponsiveCellSize();
    const controlsH = document.getElementById('controls-section')?.offsetHeight || 180;
    // 16px horizontal margin prevents the grid from touching viewport edges.
    const availW = window.innerWidth - GRID_TOTAL_HORIZONTAL_MARGIN;
    // 12px vertical margin keeps visual breathing room under the controls.
    const availH = window.innerHeight - controlsH - GRID_BOTTOM_MARGIN;
    const toOddAtLeast3 = (value) => {
      const base = Math.max(3, Math.floor(value));
      return base % 2 === 0 ? base - 1 : base;
    };
    return {
      cols: toOddAtLeast3(availW / size),
      rows: toOddAtLeast3(availH / size),
      cellSize: size,
    };
  }, [getResponsiveCellSize]);

  const forceRender = useCallback(() => setRenderTick(k => k + 1), []);

  const initGrid = useCallback(() => {
    const { rows, cols, cellSize: nextCellSize } = computeGridSize();
    rowsRef.current = rows;
    colsRef.current = cols;
    cellsRef.current = buildGrid(rows, cols);
    setCellSize(nextCellSize);
    startRef.current = null;
    endRef.current = null;
    setStats({ iterations: 0, pathLength: 0, duration: '0.00' });
    forceRender();
  }, [computeGridSize, forceRender]);

  const resetRunState = useCallback(() => {
    abortRef.current = true;
    isRunningRef.current = false;
    hasRunSessionRef.current = false;
    isPausedRef.current = false;
    setIsRunActive(false);
  }, []);

  useEffect(() => { initGrid(); }, [initGrid]);

  useEffect(() => {
    let timer;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { if (!isRunningRef.current) initGrid(); }, 200);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [initGrid]);

  const getNeighbors = useCallback((cell) => {
    const list = [];
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const cells = cellsRef.current;
    const rows = rowsRef.current, cols = colsRef.current;
    for (const [dr, dc] of dirs) {
      const nr = cell.r + dr, nc = cell.c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        const n = cells[nr][nc];
        if (n.state !== 'wall') list.push(n);
      }
    }
    return list;
  }, []);

  const handleCellInteraction = useCallback((r, c, isDrag = false, button = 0) => {
    if (hasRunSessionRef.current) return;
    const cell = cellsRef.current[r][c];
    if (mode === MODES.START) {
      if (cell === startRef.current) { cell.state = 'empty'; cell.visual = ''; startRef.current = null; forceRender(); return; }
      if (startRef.current) { startRef.current.state = 'empty'; startRef.current.visual = ''; }
      if (cell === endRef.current) { endRef.current = null; }
      cell.state = 'start'; cell.visual = 'start'; startRef.current = cell;
    } else if (mode === MODES.END) {
      if (cell === endRef.current) { cell.state = 'empty'; cell.visual = ''; endRef.current = null; forceRender(); return; }
      if (endRef.current) { endRef.current.state = 'empty'; endRef.current.visual = ''; }
      if (cell === startRef.current) { startRef.current = null; }
      cell.state = 'end'; cell.visual = 'end'; endRef.current = cell;
    } else if (mode === MODES.WALL) {
      if (isDrag) {
        const dragMode = mouseRef.current.dragMode;
        if (dragMode === 'erase') {
          if (cell.state === 'wall') { cell.state = 'empty'; cell.visual = ''; }
        } else {
          if (cell !== startRef.current && cell !== endRef.current) { cell.state = 'wall'; cell.visual = 'wall'; }
        }
      } else {
        if (button === 2) {
          if (cell.state === 'wall') { cell.state = 'empty'; cell.visual = ''; }
        } else {
          if (cell !== startRef.current && cell !== endRef.current) { cell.state = 'wall'; cell.visual = 'wall'; }
        }
      }
    }
    forceRender();
  }, [mode, forceRender]);

  const runAlgorithm = useCallback(async () => {
    if (hasRunSessionRef.current) return;
    if (!startRef.current || !endRef.current) { showStatus('Select start and end first.'); return; }
    isRunningRef.current = true;
    hasRunSessionRef.current = true;
    isPausedRef.current = false;
    setIsRunActive(true);
    abortRef.current = false;
    showStatus('Running...', 0);

    const cells = cellsRef.current;
    const rows = rowsRef.current, cols = colsRef.current;
    for (const row of cells) for (const c of row) {
      if (c.state !== 'wall' && c.state !== 'start' && c.state !== 'end') {
        c.label = ''; c.visual = '';
        if (c.state === 'path') c.state = 'empty';
      }
      c.g = Infinity; c.h = Infinity; c.f = Infinity; c.parent = null;
    }
    setStats({ iterations: 0, pathLength: 0, duration: '0.00' });
    forceRender();

    let iterationCount = 0;
    const startTime = performance.now();
    const isAborted = () => abortRef.current;
    const currentAlgo = algoRef.current;

    const stepCb = async (current, updated, metric) => {
      iterationCount++;
      const dur = ((performance.now() - startTime) / 1000).toFixed(2);
      setStats({ iterations: iterationCount, pathLength: 0, duration: dur });
      for (const n of updated) {
        if (n !== startRef.current && n !== endRef.current) {
          const val = metric ? metric(n) : n.g;
          if (isFinite(val)) n.label = String(Math.round(val));
          n.visual = 'open';
        }
      }
      if (current !== startRef.current && current !== endRef.current) current.visual = 'open';
      forceRender();
      await delayStep();
    };

    const passCb = async (info) => {
      const dur = ((performance.now() - startTime) / 1000).toFixed(2);
      setStats(s => ({ ...s, duration: dur }));
      if (info?.algo && typeof info.pass !== 'undefined') {
        showStatus(`${info.algo.toUpperCase()} pass: ${info.pass}`, 1000);
      }
      await delayStep();
    };

    const runner = algoRunners[currentAlgo];
    const ok = runner ? await runner(cells, startRef.current, endRef.current, getNeighbors, stepCb, isAborted, passCb) : false;
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    let pathLength = 0;
    if (ok) {
      let cur = endRef.current; let safety = 0;
      while (cur && safety < rows * cols) { pathLength++; cur = cur.parent; safety++; }
      pathLength--; if (pathLength < 0) pathLength = 0;
    }

    if (abortRef.current) {
      showStatus('Run aborted.', 2000);
      setStats({ iterations: 0, pathLength: 0, duration: '0.00' });
    } else if (ok) {
      for (const row of cells) for (const c of row) {
        if (c.visual === 'open') { c.visual = ''; c.label = ''; }
      }
      let cur = endRef.current; const chain = []; let safety = 0;
      while (cur && safety < rows * cols) { chain.push(cur); cur = cur.parent; safety++; }
      chain.reverse();
      let path = chain;
      if ((currentAlgo === 'thetastar' || currentAlgo === 'jps') && chain.length > 1) {
        const expanded = [chain[0]];
        for (let i = 1; i < chain.length; i++) {
          expanded.push(...cellsOnLine(chain[i - 1], chain[i], cells, rows, cols), chain[i]);
        }
        path = expanded.filter((cell, idx, arr) => idx === 0 || cell !== arr[idx - 1]);
      }
      let drawnCount = 0;
      for (const node of path) {
        if (node.state === 'start' || node.state === 'end') continue;
        drawnCount++;
        node.state = 'path'; node.visual = 'path';
        setStats({ iterations: iterationCount, pathLength: drawnCount, duration });
        forceRender();
        await delayStep();
      }
      showStatus('Path found!', 2000);
      setStats({ iterations: iterationCount, pathLength: drawnCount || pathLength, duration });
    } else {
      showStatus('No path found.', 3000);
      setStats({ iterations: iterationCount, pathLength: 0, duration });
    }
    isRunningRef.current = false;
    hasRunSessionRef.current = false;
    isPausedRef.current = false;
    setIsRunActive(false);
    forceRender();
  }, [getNeighbors, delayStep, showStatus, forceRender]);

  const handleRunToggle = useCallback(() => {
    if (!hasRunSessionRef.current) {
      runAlgorithm();
      return;
    }
    isPausedRef.current = !isPausedRef.current;
    setIsRunActive(!isPausedRef.current);
    showStatus(isPausedRef.current ? 'Paused' : 'Running...', 0);
  }, [runAlgorithm, showStatus]);

  const handleReset = useCallback(() => {
    resetRunState();
    initGrid();
  }, [resetRunState, initGrid]);

  const applyPreset = useCallback((name) => {
    if (hasRunSessionRef.current) return;
    const cells = cellsRef.current;
    const rows = rowsRef.current, cols = colsRef.current;
    for (const row of cells) for (const c of row) {
      c.state = 'empty'; c.g = Infinity; c.h = Infinity; c.f = Infinity; c.parent = null;
      c.visual = ''; c.label = '';
    }
    startRef.current = null; endRef.current = null;
    setMode(MODES.NONE);
    setStats({ iterations: 0, pathLength: 0, duration: '0.00' });

    let sr = 1, sc = 1, er = rows - 2, ec = cols - 2;
    let walls;
    if (name === 'maze') walls = generateMaze(rows, cols);
    else if (name === 'spiral') walls = generateSpiral(rows, cols);
    else if (name === 'fortress') { er = Math.floor(rows / 2); ec = Math.floor(cols / 2); walls = generateFortress(rows, cols); }
    else if (name === 'scatter') walls = generateScatter(rows, cols, sr, sc, er, ec);
    else walls = [];

    for (const [r, c] of walls) {
      if (r >= 0 && r < rows && c >= 0 && c < cols && !(r === sr && c === sc) && !(r === er && c === ec)) {
        cells[r][c].state = 'wall'; cells[r][c].visual = 'wall';
      }
    }
    cells[sr][sc].state = 'start'; cells[sr][sc].visual = 'start'; startRef.current = cells[sr][sc];
    cells[er][ec].state = 'end'; cells[er][ec].visual = 'end'; endRef.current = cells[er][ec];
    forceRender();
  }, [forceRender]);

  const desc = ALGO_DESCRIPTIONS[algo] || ALGO_DESCRIPTIONS.astar;

  return (
    <>
      <section id="controls-section">
        <div className="header-grid">
          <div className="header-left">
            <Controls
              algo={algo} onAlgoChange={setAlgo}
              mode={mode} onModeChange={setMode}
              speed={speed} onSpeedChange={setSpeed}
              displaySpeed={speed}
              theme={theme} onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              onRun={handleRunToggle} onReset={handleReset}
              onPreset={applyPreset}
              isRunning={isRunActive}
            />
          </div>
          <div className="header-center">
            <h1 id="title"><span className="title-icon">&#9671;</span> Pathfinding Visualizer</h1>
          </div>
          <div className="header-right">
            <div id="algo-desc">
              <h3>{desc.title}</h3>
              <p>{desc.text}</p>
            </div>
            <div id="stats">
              <h3>Statistics</h3>
              <div id="stats-content">
                <div className="stat-row"><span className="stat-label">Iterations</span><span className="stat-value">{stats.iterations}</span></div>
                <div className="stat-row"><span className="stat-label">Path Length</span><span className="stat-value">{stats.pathLength}</span></div>
                <div className="stat-row"><span className="stat-label">Time</span><span className="stat-value">{stats.duration}s</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <main id="app">
        <Grid
          cells={cellsRef.current}
          rows={rowsRef.current}
          cols={colsRef.current}
          cellSize={cellSize}
          algo={algo}
          onCellInteraction={handleCellInteraction}
          mouseRef={mouseRef}
          mode={mode}
        />
      </main>
    </>
  );
}
