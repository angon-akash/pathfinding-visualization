# Pathfinding Visualizer

A modern, interactive web application to visualize pathfinding algorithms (A*, Dijkstra, BFS) on a grid.  
Easily place start/end points, draw walls, generate mazes, and watch how different algorithms find the shortest path!

## Features

- Visualize **A***, **Dijkstra**, and **Breadth-First Search (BFS)**
- Click and drag to place walls, start, end, or erase
- Adjust **grid density** (size)
- Control animation **speed**
- Generate random **mazes** (end point is always reachable)
- Responsive, easy-to-use interface

## Getting Started

1. **Clone or Download this repository:**
    ```sh
    git clone https://github.com/your-username/pathfinding-visualizer.git
    cd pathfinding-visualizer
    ```
    Or [download as ZIP](https://github.com/your-username/pathfinding-visualizer/archive/refs/heads/main.zip) and extract.

2. **Open `index.html` in your browser.**
    - No build step or installation needed!
    - Works offline.

## Usage

- Select a **tool** (wall, start, end, erase) and click/drag on the grid.
- Click **Maze** to generate a random maze (guaranteed solvable).
- Change **Algorithm**, **Speed**, or **Grid Density** with the dropdowns.
- Press **▶** to start, **↻** to reset.

## Project Structure

.
├── index.html
├── styles/
│ └── theme.css
├── scripts/
│ ├── main.js
│ └── algorithms/
│ ├── astar.js
│ ├── dijkstra.js
│ └── bfs.js

yaml
Copy
Edit

## Customization

- Add more algorithms in `/scripts/algorithms` and register them in `main.js`.
- Edit `theme.css` for color and layout tweaks.

## License

MIT License.  
Feel free to use, modify, or share!

---

Enjoy exploring pathfinding!
