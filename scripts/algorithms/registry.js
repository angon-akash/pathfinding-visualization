import { AStarAlgorithm } from './astar.js';
import { DijkstraAlgorithm } from './dijkstra.js';
import { BFSAlgorithm } from './bfs.js';
import { DFSAlgorithm } from './dfs.js';
import { GreedyAlgorithm } from './greedy.js';
import { RandomWalkAlgorithm } from './randomwalk.js';
import { BidirectionalBFSAlgorithm } from './bidirectionalbfs.js';

export const ALGORITHMS = [
  {
    id: 'astar',
    name: 'A* (Shortest Path)',
    class: AStarAlgorithm,
    description: 'A* balances actual cost with a heuristic to find optimal routes quickly on grids.',
  },
  {
    id: 'greedy',
    name: 'Greedy Best-First',
    class: GreedyAlgorithm,
    description: 'Greedy Best-First expands nodes closest to the goal. Fast but not guaranteed to be optimal.',
  },
  {
    id: 'dijkstra',
    name: 'Dijkstra’s',
    class: DijkstraAlgorithm,
    description: 'Dijkstra’s algorithm explores the lowest-cost frontier first and always finds the shortest path.',
  },
  {
    id: 'bfs',
    name: 'Breadth-First Search',
    class: BFSAlgorithm,
    description: 'BFS explores all nodes at the current depth before moving deeper. Optimal on unweighted grids.',
  },
  {
    id: 'bidirectionalbfs',
    name: 'Bidirectional BFS',
    class: BidirectionalBFSAlgorithm,
    description: 'Bidirectional BFS searches simultaneously from start and goal, meeting in the middle for speed.',
  },
  {
    id: 'dfs',
    name: 'Depth-First Search',
    class: DFSAlgorithm,
    description: 'DFS dives deep along one branch before backtracking. Fast but does not guarantee shortest paths.',
  },
  {
    id: 'random',
    name: 'Random Walk',
    class: RandomWalkAlgorithm,
    description: 'Random Walk moves randomly until it reaches the goal or gets stuck. Mostly for demonstration.',
  },
];

export const getAlgorithmMeta = (id) => ALGORITHMS.find((algo) => algo.id === id);
