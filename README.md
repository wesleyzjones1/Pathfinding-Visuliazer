# Pathfinding Visualizer

An interactive pathfinding visualizer built with React and Vite.
Design mazes, place start/end nodes, and compare multiple search algorithms step-by-step with live statistics.

## Demo

Add your deployed URL here:

`https://your-demo-url-here`

## Screenshots

Replace the paths below with your own images.

![Main UI](docs/images/main-ui.png)
![Algorithm In Progress](docs/images/algorithm-running.png)
![Path Result](docs/images/path-result.png)

## Features

- Interactive grid editing for walls, start node, and end node.
- Click-and-drag draw/erase behavior for fast map setup.
- Multiple algorithms with visual exploration and final path animation.
- Adjustable visualization speed and algorithm-specific descriptions.
- Preset generators (maze, spiral, fortress, scatter).
- Light/dark theme support.
- Live run statistics: iterations, path length, and elapsed time.

## Algorithms Included

- A*
- Dijkstra
- Breadth-First Search (BFS)
- Depth-First Search (DFS)
- Greedy Best-First Search
- Bidirectional Search
- Jump Point Search (JPS)
- Iterative Deepening DFS (IDDFS)
- Best-First Search
- Theta*

## Tech Stack

- React
- Vite
- JavaScript (ESM)
- CSS
- Node.js test scripts

## Project Structure

```text
Astar/
├─ react-app/
│  ├─ src/
│  │  ├─ algorithms/
│  │  ├─ components/
│  │  ├─ App.jsx
│  │  ├─ App.css
│  │  ├─ constants.js
│  │  └─ presets.js
│  ├─ package.json
│  └─ vite.config.js
├─ tests/
│  ├─ test_all_algos.mjs
│  └─ test_iddfs_node.mjs
└─ README.md
```

## Getting Started

### 1. Install Dependencies

```bash
cd react-app
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open the local URL shown in the terminal (usually `http://localhost:5173` or next available port).

### 3. Build for Production

```bash
npm run build
```

### 4. Preview Production Build

```bash
npm run preview
```

## Test Commands

Run from repository root:

```bash
node tests/test_all_algos.mjs
node tests/test_iddfs_node.mjs
```
