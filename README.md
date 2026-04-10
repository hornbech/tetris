# MatthiBastian

A browser-based Tetris game with adorable kawaii-style bricks, global and local highscores, served from a single Docker container.

Every block has its own cute face — complete with shiny eyes and a little smile.

## Features

- **Classic Tetris gameplay** — all 7 tetrominoes, wall kicks, ghost piece, hard drop, NES-style scoring
- **Kawaii bricks** — every block cell has eyes, eye shine, and a curved smile drawn on Canvas
- **Animations** — bounce effect when pieces lock, gold sparkle particles on line clears
- **Global leaderboard** — top 10 scores stored server-side via REST API
- **Personal history** — your scores saved locally in the browser (up to 50)
- **Persistent nickname** — set once, remembered across sessions
- **Responsive design** — plays on desktop and mobile
- **Dockerized** — one command to build and run

## Quick Start

### Docker (recommended)

```bash
docker compose up --build
```

Open [http://localhost:5000](http://localhost:5000)

### Without Docker

```bash
pip install -r requirements.txt
python run.py
```

Open [http://localhost:5000](http://localhost:5000)

## Controls

| Key | Action |
|-----|--------|
| `Arrow Left` / `Arrow Right` | Move piece |
| `Arrow Up` | Rotate |
| `Arrow Down` | Soft drop |
| `Space` | Hard drop |
| `P` | Pause / Resume |
| `Enter` | Start game |

## Scoring

Uses NES-style scoring with level multiplier:

| Lines Cleared | Points |
|---------------|--------|
| 1 | 100 x level |
| 2 | 300 x level |
| 3 | 500 x level |
| 4 (Tetris) | 800 x level |

Level increases every 10 lines. Drop speed increases from 800ms (level 1) down to 30ms (level 20).

## Architecture

```
Single Docker Container
+------------------------------------------+
|  Flask (Python 3.11) + Gunicorn          |
|                                          |
|  /              -> index.html (game)     |
|  /static/       -> JS, CSS assets        |
|  /api/scores    -> GET (leaderboard)     |
|  /api/scores    -> POST (submit score)   |
|                                          |
|  SQLite (scores.db in Docker volume)     |
+------------------------------------------+
```

## API

### `GET /api/scores?limit=10`

Returns top scores ordered by score descending.

```json
[
  {
    "id": 1,
    "player_name": "Alice",
    "score": 52300,
    "lines": 84,
    "level": 9,
    "created_at": "2026-04-10T14:30:00"
  }
]
```

### `POST /api/scores`

Submit a new score.

```json
{
  "player_name": "Alice",
  "score": 52300,
  "lines": 84,
  "level": 9
}
```

Returns `201` with the created score object. Validates:
- `player_name`: required, max 20 characters
- `score`, `lines`, `level`: required, non-negative integers

## Project Structure

```
tetris/
  app/
    __init__.py          # Flask app factory
    models.py            # Score SQLAlchemy model
    routes.py            # API endpoints + index route
    static/
      css/style.css      # Pastel kawaii styling
      js/
        constants.js     # Board dimensions, colors, shapes, scoring
        piece.js         # Tetromino class with rotation
        board.js         # Board grid, collision, rendering, kawaii faces
        game.js          # Game loop, controls, animations
        storage.js       # localStorage helpers for nickname + history
        leaderboard.js   # API calls + leaderboard rendering
        main.js          # Entry point, wires everything together
    templates/
      index.html         # Single-page game template
  tests/
    test_api.py          # 7 pytest tests for API endpoints
  run.py                 # App entry point
  requirements.txt       # Python dependencies
  Dockerfile             # python:3.11-slim + gunicorn
  docker-compose.yml     # Single service + volume for DB
  CHANGELOG.md           # Version history
```

## Color Palette

| Piece | Color | Hex |
|-------|-------|-----|
| I | Mint | `#A8E6CF` |
| O | Peach | `#FFD3B6` |
| T | Lavender | `#D4A5FF` |
| S | Sage | `#B5EAD7` |
| Z | Rose | `#FFB7B2` |
| J | Sky | `#A0C4FF` |
| L | Apricot | `#FFDAC1` |
| Background | Blush | `#FFF5F5` |

## Running Tests

```bash
pip install -r requirements.txt
python -m pytest tests/ -v
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS, HTML5 Canvas |
| Backend | Python 3.11, Flask 3.1.1 |
| Database | SQLite via Flask-SQLAlchemy |
| Server | Gunicorn 23.0.0 |
| Container | Docker + Docker Compose |
| Fonts | Fredoka One, Nunito (Google Fonts) |
| Testing | pytest 8.3.5 |

## License

MIT
