# Changelog

All notable changes to MatthiBastian will be documented in this file.

## [1.0.0] - 2026-04-10

Initial release of MatthiBastian, a browser-based Tetris game with kawaii-style bricks, global and local highscores, served from a single Docker container.

### Added

#### Backend
- Flask application with app factory pattern (`create_app()`)
- SQLAlchemy `Score` model with fields: player_name, score, lines, level, created_at
- `GET /api/scores?limit=N` endpoint returning top scores ordered by score descending
- `POST /api/scores` endpoint with input validation (name length, non-negative integers)
- 7 pytest tests covering all API endpoints, ordering, pagination, and validation

#### Game Engine
- Full Tetris implementation with HTML5 Canvas rendering
- All 7 standard tetrominoes (I, O, T, S, Z, J, L) with pastel color palette
- Game loop using `requestAnimationFrame` with delta-time accumulator
- Piece movement (left, right, soft drop), rotation with wall kicks (offsets: 1, -1, 2, -2)
- Hard drop with ghost piece preview (translucent at 30% opacity)
- Line clearing with row collapse
- NES-style scoring: 1 line = 100 x level, 2 = 300, 3 = 500, 4 (Tetris) = 800
- Level progression every 10 lines cleared, with increasing drop speed (800ms down to 30ms)
- Game over detection when new piece spawn position is blocked
- Pause/resume with P key
- Next piece preview in sidebar canvas

#### Kawaii Rendering
- Every block cell draws a kawaii face: oval eyes, white eye shine dots, curved smile
- Faces skipped on ghost pieces (alpha < 0.5) for visual clarity
- Lock bounce animation: blocks scale up 10% and decay over 150ms when a piece locks
- Line clear sparkle effect: gold particles drift and fade over cleared rows

#### Leaderboard
- Global leaderboard fetched from `/api/scores` API, showing top 10
- Personal score history stored in localStorage (up to 50 entries)
- Tab toggle between Global and Personal views
- Scores display with rank, player name, and formatted score

#### User Experience
- Nickname modal on first visit with persistent localStorage storage
- Returning players skip the modal, nickname pre-filled on game over
- Game over overlay showing final score, lines, and level
- Score auto-submitted to both global API and local history on game over
- "Press ENTER to start" prompt with pulsing animation
- Responsive layout: sidebar stacks below game board on screens under 768px

#### Styling
- Pastel pink background (#FFF5F5)
- Fredoka One font for headings, Nunito for body text (Google Fonts)
- Rounded containers with soft box-shadows
- Dark game board background (#2A2A2A) for contrast with pastel blocks
- Consistent pastel color scheme across UI elements

#### Controls
- Arrow Left/Right: Move piece
- Arrow Up: Rotate
- Arrow Down: Soft drop
- Space: Hard drop
- P: Pause/Resume
- Enter: Start game

#### Infrastructure
- Single-container Docker setup with `python:3.11-slim` base
- Gunicorn WSGI server (2 workers) on port 5000
- Docker Compose with named volume for SQLite database persistence
- `.dockerignore` excluding tests, docs, caches, and dev files

### Tech Stack
- **Frontend:** Vanilla HTML/CSS/JavaScript, HTML5 Canvas
- **Backend:** Python 3.11, Flask 3.1.1, Flask-SQLAlchemy 3.1.1
- **Database:** SQLite
- **Server:** Gunicorn 23.0.0
- **Container:** Docker with Docker Compose
- **Testing:** pytest 8.3.5
