# Pathfinding Algorithm Visualizer

An interactive web-based educational tool for visualizing and comparing 10 different pathfinding algorithms. Draw obstacles, set start and end points, and watch algorithms explore the grid in real-time with animated visualizations and live performance statistics.

![Pathfinding Visualizer](https://img.shields.io/badge/algorithms-10-blue) ![No Dependencies](https://img.shields.io/badge/dependencies-none-green) ![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

### 🎯 10 Pathfinding Algorithms
- **A\*** - Optimal pathfinding with heuristic guidance (f = g + h)
- **Dijkstra** - Guaranteed shortest path using uniform cost search
- **Breadth-First Search (BFS)** - Unweighted shortest path exploration
- **Depth-First Search (DFS)** - Deep recursive exploration
- **Greedy Best-First** - Fast heuristic-only search
- **Bidirectional BFS** - Dual-direction search that meets in the middle
- **Jump Point Search (JPS)** - Optimized A\* for uniform grids
- **Iterative Deepening DFS (IDDFS)** - Memory-efficient complete search
- **Best-First Search** - Flexible heuristic-based framework
- **Theta\*** - Any-angle pathfinding for smooth, natural paths

### 🎨 Visual Design
- Dynamic grid that fills viewport (40x40px cells)
- Algorithm-specific color schemes (10 distinct color palettes)
- Smooth circle expansion animations (150% scale)
- Real-time cost display (g, h, f values)
- Clean three-column layout: controls | title | statistics & description

### 📊 Real-Time Statistics
- **Iterations** - Number of nodes explored
- **Path Length** - Distance from start to end
- **Execution Time** - Algorithm runtime in milliseconds
- **Dynamic Updates** - Stats update during search, not just at completion

### 🎮 Interactive Controls
- **Start/End Modes** - Single-click to place or reposition nodes
- **Wall Mode** - Left-click to build, right-click to erase walls
- **Speed Slider** - Adjust animation speed (0.001s - 0.5s per step)
- **Algorithm Selector** - Dropdown to choose from 10 algorithms
- **Dynamic Description** - Algorithm explanation updates on selection
- **Reset Button** - Clear grid and start fresh

### 🏗️ Technical Architecture
- Modular ES6 design - each algorithm in separate file
- No external dependencies - pure vanilla JavaScript
- Comprehensive code comments for educational clarity
- Responsive design with CSS Grid layout
- Performance-optimized animations using `requestAnimationFrame`

## 🚀 Quick Start

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/pathfinding-visualizer.git

# Navigate to directory
cd pathfinding-visualizer

# Open in browser (no build step required!)
start index.html  # Windows
# or
open index.html   # macOS/Linux
```

### Usage
1. **Select Algorithm** - Choose from dropdown (default: A*)
2. **Place Start** - Click "Start" button, then click any cell (green)
3. **Place End** - Click "End" button, then click any cell (red)
4. **Draw Walls** - Click "Wall" button, then:
   - Left-click/drag to build walls (gray)
   - Right-click/drag to erase walls
5. **Adjust Speed** - Use slider to control animation speed
6. **Run** - Click "Run" to start visualization
7. **Watch** - Observe algorithm explore (colored cells) and find path (dark path)
8. **Compare** - Try different algorithms to see performance differences
9. **Reset** - Clear everything and experiment again

## 📁 Project Structure

```
pathfinding-visualizer/
├── index.html              # Main HTML structure
├── styles.css              # Styling and layout
├── app.js                  # Main application logic
├── algorithms/
│   ├── astar.js           # A* implementation
│   ├── dijkstra.js        # Dijkstra's algorithm
│   ├── bfs.js             # Breadth-First Search
│   ├── dfs.js             # Depth-First Search
│   ├── greedy.js          # Greedy Best-First
│   ├── bidirectional.js   # Bidirectional BFS
│   ├── jumppointsearch.js # Jump Point Search
│   ├── iddfs.js           # Iterative Deepening DFS
│   ├── bestfirst.js       # Best-First Search
│   └── thetastar.js       # Theta* (any-angle)
└── README.md              # Documentation
```

## 🧠 Algorithm Comparison

| Algorithm | Optimal? | Weighted? | Complete? | Space Complexity | Best Use Case |
|-----------|----------|-----------|-----------|------------------|---------------|
| A* | ✅ Yes | ✅ Yes | ✅ Yes | O(b^d) | General pathfinding |
| Dijkstra | ✅ Yes | ✅ Yes | ✅ Yes | O(b^d) | Weighted graphs |
| BFS | ✅ Yes* | ❌ No | ✅ Yes | O(b^d) | Unweighted shortest path |
| DFS | ❌ No | ❌ No | ✅ Yes | O(d) | Memory-constrained |
| Greedy | ❌ No | ✅ Yes | ❌ No | O(b^d) | Fast approximation |
| Bidirectional | ✅ Yes* | ❌ No | ✅ Yes | O(b^(d/2)) | Large search spaces |
| JPS | ✅ Yes | ❌ No | ✅ Yes | O(b^d) | Uniform grid optimization |
| IDDFS | ✅ Yes* | ❌ No | ✅ Yes | O(d) | Unknown depth |
| Best-First | ❌ No | ✅ Yes | ❌ No | O(b^d) | Heuristic exploration |
| Theta* | ✅ Yes** | ✅ Yes | ✅ Yes | O(b^d) | Smooth, realistic paths |

*Optimal for unweighted graphs  
**Optimal for any-angle pathfinding

## 🎓 Educational Value

This visualizer is designed as a learning tool to understand:
- How different algorithms explore search spaces
- Trade-offs between optimality, completeness, and performance
- Impact of heuristics on search efficiency
- Real-time performance metrics comparison
- Grid-based pathfinding concepts

Each algorithm file includes detailed comments explaining:
- Core algorithm logic
- Data structures used
- Time/space complexity
- When to use this algorithm

## 🔧 Implementation Details

### Grid System
- Dynamic viewport calculation accounting for header height
- 40x40px cells with responsive sizing
- 4-directional movement (Manhattan distance)

### Cell State Management
Each cell stores:
- `g` - Cost from start to current node
- `h` - Heuristic estimate to goal
- `f` - Total cost (g + h)
- `parent` - Reference for path reconstruction
- `state` - Current visualization state

### Animation System
- CSS transitions for smooth color changes
- `requestAnimationFrame` for circle expansion
- Overflow hidden for clean 150% scale effect
- Algorithm-specific HSL color palettes

### Performance Optimization
- Real-time stats using `performance.now()`
- Callback-based architecture for non-blocking updates
- Debounced resize handler
- Efficient priority queue implementations

## 🎨 Customization

### Adding New Algorithms
1. Create `algorithms/newalgorithm.js`
2. Export async function: `export async function runNewAlgorithm(grid, start, end, stepCb)`
3. Import in `app.js`
4. Add to `runSelectedAlgorithm()` switch statement
5. Add description to `algoDescriptions` object
6. Add option to HTML dropdown
7. Add color variables to CSS

### Customizing Colors
Edit CSS variables in `styles.css`:
```css
--algorithm-path: #yourcolor;
--algorithm-open: #yourlightcolor;
```

### Adjusting Speed Range
Modify slider attributes in `index.html`:
```html
<input type="range" min="0.001" max="0.5" step="0.001" value="0.05">
```

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Diagonal movement support
- Weighted terrain cells
- Maze generation algorithms
- Additional pathfinding variants (D*, LPA*, etc.)
- Export/import grid configurations
- Step-through debugging mode
- Mobile touch optimization
- Performance benchmarking suite

## 📝 License

MIT License - feel free to use this project for learning, teaching, or commercial purposes.

## 🙏 Acknowledgments

Built with vanilla JavaScript, inspired by pathfinding visualization tools and educational algorithm demonstrations.

## Developer Notes: IDDFS Fix & Tests

The `iddfs.js` algorithm was updated to use a path-based visited set (only nodes on the current recursion path are prevented from revisiting) rather than a global visited set; this prevents incorrect pruning during depth-limited DFS and aligns with standard IDDFS semantics.

To run local Node-based tests (requires Node.js v14+):
```
# From project root
node --input-type=module tests/test_iddfs_node.mjs
```
You may also open `index.html` in a browser and select "Iterative Deepening DFS" to visually verify behavior using the UI.

---
