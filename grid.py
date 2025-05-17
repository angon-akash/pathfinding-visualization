import pygame

class Grid:
    def __init__(self, width, height, cell_size):
        self.width = width
        self.height = height
        self.cell_size = cell_size
        self.grid = [[0 for _ in range(width)] for _ in range(height)]
        self.start = (5, 5)
        self.end = (width - 5, height - 5)
        
        # Cell states
        self.EMPTY = 0
        self.WALL = 1
        self.VISITED = 2
        self.PATH = 3
        self.CURRENT = 4
        self.OPEN = 5
        
        # Colors
        self.colors = {
            self.EMPTY: (255, 255, 255),  # White
            self.WALL: (0, 0, 0),         # Black
            self.VISITED: (150, 150, 255), # Light blue
            self.PATH: (255, 255, 0),      # Yellow
            self.CURRENT: (255, 0, 0),     # Red
            self.OPEN: (0, 255, 0)         # Green
        }
    
    def is_valid_position(self, pos):
        x, y = pos
        return 0 <= x < self.width and 0 <= y < self.height
    
    def set_start(self, pos):
        if self.is_valid_position(pos) and self.grid[pos[1]][pos[0]] != self.WALL:
            self.start = pos
    
    def set_end(self, pos):
        if self.is_valid_position(pos) and self.grid[pos[1]][pos[0]] != self.WALL:
            self.end = pos
    
    def toggle_wall(self, pos):
        if self.is_valid_position(pos) and pos != self.start and pos != self.end:
            x, y = pos
            self.grid[y][x] = self.WALL if self.grid[y][x] == self.EMPTY else self.EMPTY
    
    def set_cell_state(self, pos, state):
        if self.is_valid_position(pos):
            x, y = pos
            if pos != self.start and pos != self.end and self.grid[y][x] != self.WALL:
                self.grid[y][x] = state
    
    def reset(self):
        self.grid = [[0 for _ in range(self.width)] for _ in range(self.height)]
    
    def pixel_to_grid(self, pixel_pos):
        x, y = pixel_pos
        return (x // self.cell_size, y // self.cell_size)
    
    def draw(self, screen):
        # Draw grid cells
        for y in range(self.height):
            for x in range(self.width):
                rect = pygame.Rect(
                    x * self.cell_size, 
                    y * self.cell_size, 
                    self.cell_size, 
                    self.cell_size
                )
                
                # Draw cell based on state
                pygame.draw.rect(screen, self.colors[self.grid[y][x]], rect)
                pygame.draw.rect(screen, (100, 100, 100), rect, 1)  # Grid lines
        
        # Draw start and end positions
        start_rect = pygame.Rect(
            self.start[0] * self.cell_size,
            self.start[1] * self.cell_size,
            self.cell_size,
            self.cell_size
        )
        pygame.draw.rect(screen, (0, 0, 255), start_rect)  # Blue
        
        end_rect = pygame.Rect(
            self.end[0] * self.cell_size,
            self.end[1] * self.cell_size,
            self.cell_size,
            self.cell_size
        )
        pygame.draw.rect(screen, (255, 0, 255), end_rect)  # Purple