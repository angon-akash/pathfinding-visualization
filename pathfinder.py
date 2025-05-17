import heapq
import math

class AStar:
    def __init__(self, grid):
        self.grid = grid
        self.open_set = []
        self.closed_set = set()
        self.came_from = {}
        self.g_score = {}
        self.f_score = {}
        self.current = None
        self.path = []
    
    def initialize(self, start, end):
        """Initialize the A* algorithm with start and end positions"""
        self.open_set = []
        self.closed_set = set()
        self.came_from = {}
        self.g_score = {}
        self.f_score = {}
        self.current = None
        self.path = []
        
        # Reset grid states
        for y in range(self.grid.height):
            for x in range(self.grid.width):
                if self.grid.grid[y][x] != self.grid.WALL:
                    self.grid.grid[y][x] = self.grid.EMPTY
        
        # Initialize start node
        self.start = start
        self.end = end
        self.g_score[start] = 0
        self.f_score[start] = self.heuristic(start, end)
        heapq.heappush(self.open_set, (self.f_score[start], start))
        
    def heuristic(self, a, b):
        """Calculate Manhattan distance heuristic"""
        return abs(a[0] - b[0]) + abs(a[1] - b[1])
    
    def get_neighbors(self, node):
        """Get valid neighboring cells"""
        x, y = node
        neighbors = []
        
        # Check all 4 adjacent cells
        for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
            nx, ny = x + dx, y + dy
            if (0 <= nx < self.grid.width and 
                0 <= ny < self.grid.height and 
                self.grid.grid[ny][nx] != self.grid.WALL):
                neighbors.append((nx, ny))
                
        return neighbors
    
    def reconstruct_path(self):
        """Reconstruct the path from end to start"""
        self.path = []
        current = self.end
        while current in self.came_from:
            self.path.append(current)
            current = self.came_from[current]
        
        # Mark path cells
        for pos in self.path:
            self.grid.set_cell_state(pos, self.grid.PATH)
    
    def step(self):
        """Perform one step of the A* algorithm"""
        if not self.open_set:
            return "no_path"  # No path exists
        
        # Get node with lowest f_score
        _, current = heapq.heappop(self.open_set)
        self.current = current
        
        # Mark current node as visited
        if current != self.start and current != self.end:
            self.grid.set_cell_state(current, self.grid.CURRENT)
        
        # Check if we reached the end
        if current == self.end:
            self.reconstruct_path()
            return "found"
        
        # Add current to closed set
        self.closed_set.add(current)
        
        # Check all neighbors
        for neighbor in self.get_neighbors(current):
            if neighbor in self.closed_set:
                continue
            
            # Calculate tentative g_score
            tentative_g = self.g_score.get(current, float('inf')) + 1
            
            if neighbor not in [item[1] for item in self.open_set]:
                heapq.heappush(self.open_set, (self.f_score.get(neighbor, float('inf')), neighbor))
                if neighbor != self.end:
                    self.grid.set_cell_state(neighbor, self.grid.OPEN)
            elif tentative_g >= self.g_score.get(neighbor, float('inf')):
                continue
            
            # This path is better, record it
            self.came_from[neighbor] = current
            self.g_score[neighbor] = tentative_g
            self.f_score[neighbor] = self.g_score[neighbor] + self.heuristic(neighbor, self.end)
        
        # Mark previous current node as visited
        if self.current != self.start and self.current != self.end:
            self.grid.set_cell_state(self.current, self.grid.VISITED)
        
        return "in_progress"