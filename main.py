import pygame
import sys
from grid import Grid
from pathfinder import AStar

# Initialize pygame
pygame.init()

# Constants
WIDTH, HEIGHT = 800, 600
GRID_SIZE = 40
CELL_SIZE = 20

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
GREEN = (0, 255, 0)
RED = (255, 0, 0)
BLUE = (0, 0, 255)
YELLOW = (255, 255, 0)
PURPLE = (128, 0, 128)
GRAY = (128, 128, 128)

# Setup display
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("A* Pathfinding Visualization")

# Create grid and pathfinder
grid = Grid(GRID_SIZE, GRID_SIZE, CELL_SIZE)
pathfinder = AStar(grid)

# Initial positions
start_pos = (5, 5)
end_pos = (35, 35)
grid.set_start(start_pos)
grid.set_end(end_pos)

# Main loop
running = True
algorithm_started = False
algorithm_paused = False
path_found = False

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        
        # Mouse handling
        if event.type == pygame.MOUSEBUTTONDOWN:
            pos = pygame.mouse.get_pos()
            grid_pos = grid.pixel_to_grid(pos)
            
            if event.button == 1:  # Left click
                if pygame.key.get_mods() & pygame.KMOD_SHIFT:
                    grid.set_start(grid_pos)
                elif pygame.key.get_mods() & pygame.KMOD_CTRL:
                    grid.set_end(grid_pos)
                else:
                    grid.toggle_wall(grid_pos)
            
        # Key handling
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE:
                if not algorithm_started:
                    algorithm_started = True
                    pathfinder.initialize(grid.start, grid.end)
                else:
                    algorithm_paused = not algorithm_paused
            elif event.key == pygame.K_r:  # Reset
                grid.reset()
                algorithm_started = False
                algorithm_paused = False
                path_found = False
    
    # Update algorithm state
    if algorithm_started and not algorithm_paused and not path_found:
        result = pathfinder.step()
        if result == "found":
            path_found = True
        elif result == "no_path":
            path_found = True  # No path possible
    
    # Draw everything
    screen.fill(WHITE)
    grid.draw(screen)
    
    # Display instructions
    font = pygame.font.SysFont(None, 24)
    instructions = [
        "Left click: Add/remove wall",
        "Shift + click: Set start",
        "Ctrl + click: Set end",
        "Space: Start/pause algorithm",
        "R: Reset grid"
    ]
    
    for i, text in enumerate(instructions):
        text_surface = font.render(text, True, BLACK)
        screen.blit(text_surface, (10, HEIGHT - 120 + i * 20))
    
    pygame.display.flip()

pygame.quit()
sys.exit()