# MatthiBastian — Design Document

## Overview
Browser-based Tetris game with kawaii-style cute bricks, global + local highscore system, served from a single Docker container.

## Architecture
- **Single-container monolith**: Flask (Python 3.11) serves static game files and REST API
- **Frontend**: Vanilla HTML/CSS/JS, HTML5 Canvas rendering
- **Backend**: Flask + flask-sqlalchemy + SQLite
- **Server**: Gunicorn on port 5000
- **Container**: `python:3.11-slim` base, single Dockerfile
- **Data persistence**: Docker volume mount for `scores.db`

## Game Mechanics

### Board
- 10 columns x 20 rows (standard Tetris)
- Stored as a 2D integer array

### Pieces (Tetrominoes)
All 7 standard pieces with kawaii faces (eyes + smile) and pastel colors:

| Piece | Color Name | Hex |
|-------|-----------|-----|
| I | Mint | #A8E6CF |
| O | Peach | #FFD3B6 |
| T | Lavender | #D4A5FF |
| S | Sage | #B5EAD7 |
| Z | Rose | #FFB7B2 |
| J | Sky | #A0C4FF |
| L | Apricot | #FFDAC1 |

### Controls
- Arrow Left/Right: Move piece
- Arrow Up: Rotate
- Arrow Down: Soft drop
- Space: Hard drop
- P: Pause

### Scoring (NES-style)
- 1 line = 100 x level
- 2 lines = 300 x level
- 3 lines = 500 x level
- 4 lines (Tetris) = 800 x level

### Progression
- Level increases every 10 lines cleared
- Drop speed increases with level

### Kawaii Details
- Each block cell has small drawn eyes + smile on Canvas
- Subtle bounce animation when a piece locks
- Line clear sparkle effect

## API & Data Model

### Database Table: `scores`

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment |
| player_name | TEXT NOT NULL | Max 20 chars |
| score | INTEGER NOT NULL | Final score |
| lines | INTEGER NOT NULL | Total lines cleared |
| level | INTEGER NOT NULL | Final level reached |
| created_at | TIMESTAMP | Default now() |

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/scores?limit=10 | Top scores, ordered by score DESC |
| POST | /api/scores | Submit { player_name, score, lines, level } |

### Frontend Storage (localStorage)
- `matthibastian_nickname` — persistent player name
- `matthibastian_history` — personal score history array

### Game Flow
1. Player opens game -> prompted for nickname (pre-filled if returning)
2. Plays game -> game over -> score auto-submitted to API + saved locally
3. Leaderboard shows global top-10 and personal best scores

## UI Layout
- Game board (center-left), info sidebar (right): next piece, score, level, lines, controls
- Leaderboard below with Global/Personal tabs
- Pastel background, rounded containers, soft shadows
- Title in playful font (Fredoka One via Google Fonts)
- Responsive: sidebar stacks below board on narrow screens
- Game over overlay with score summary + name input (pre-filled)

## Docker
- Single Dockerfile: python:3.11-slim, pip install deps, gunicorn CMD
- Volume mount for scores.db persistence
- Expose port 5000
