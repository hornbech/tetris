# MatthiBastian Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use godmode:task-runner to implement this plan task-by-task.

**Goal:** Build a browser-based Tetris game called MatthiBastian with kawaii-style bricks, global + local highscores, served from a single Docker container.

**Architecture:** Single-container Flask monolith. Flask serves static HTML/CSS/JS game files and a REST API for the global leaderboard. SQLite stores scores. Gunicorn serves in production. Docker packages everything.

**Tech Stack:** Python 3.11, Flask, flask-sqlalchemy, SQLite, Gunicorn, vanilla JS, HTML5 Canvas, Docker

---

### Task 1: Project scaffold and git init

**Files:**
- Create: `requirements.txt`
- Create: `app/__init__.py`
- Create: `app/models.py`
- Create: `app/routes.py`
- Create: `app/static/` (directory)
- Create: `app/templates/` (directory)
- Create: `.gitignore`

**Step 1: Initialize git**

```bash
cd /c/Users/jhh/projects/tetris
git init
```

**Step 2: Create .gitignore**

```
__pycache__/
*.pyc
*.pyo
.env
venv/
*.db
instance/
.pytest_cache/
```

**Step 3: Create requirements.txt**

```
flask==3.1.1
flask-sqlalchemy==3.1.1
gunicorn==23.0.0
pytest==8.3.5
```

**Step 4: Create app/__init__.py**

```python
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def create_app():
    app = Flask(__name__)
    db_path = os.environ.get("DATABASE_URL", "sqlite:///scores.db")
    app.config["SQLALCHEMY_DATABASE_URI"] = db_path
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    from app.routes import main
    app.register_blueprint(main)

    with app.app_context():
        db.create_all()

    return app
```

**Step 5: Create app/models.py**

```python
from datetime import datetime, timezone
from app import db


class Score(db.Model):
    __tablename__ = "scores"

    id = db.Column(db.Integer, primary_key=True)
    player_name = db.Column(db.String(20), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    lines = db.Column(db.Integer, nullable=False)
    level = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "player_name": self.player_name,
            "score": self.score,
            "lines": self.lines,
            "level": self.level,
            "created_at": self.created_at.isoformat(),
        }
```

**Step 6: Create app/routes.py**

```python
from flask import Blueprint, request, jsonify, render_template
from app import db
from app.models import Score

main = Blueprint("main", __name__)


@main.route("/")
def index():
    return render_template("index.html")


@main.route("/api/scores", methods=["GET"])
def get_scores():
    limit = request.args.get("limit", 10, type=int)
    limit = min(limit, 100)
    scores = Score.query.order_by(Score.score.desc()).limit(limit).all()
    return jsonify([s.to_dict() for s in scores])


@main.route("/api/scores", methods=["POST"])
def post_score():
    data = request.get_json()
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    player_name = data.get("player_name", "").strip()
    if not player_name or len(player_name) > 20:
        return jsonify({"error": "player_name required (max 20 chars)"}), 400

    score_val = data.get("score")
    lines_val = data.get("lines")
    level_val = data.get("level")

    if not all(isinstance(v, int) and v >= 0 for v in [score_val, lines_val, level_val]):
        return jsonify({"error": "score, lines, level must be non-negative integers"}), 400

    entry = Score(
        player_name=player_name,
        score=score_val,
        lines=lines_val,
        level=level_val,
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify(entry.to_dict()), 201
```

**Step 7: Create empty directories**

```bash
mkdir -p app/static app/templates
```

**Step 8: Commit**

```bash
git add .gitignore requirements.txt app/__init__.py app/models.py app/routes.py
git commit -m "feat: project scaffold with Flask app, models, and API routes"
```

---

### Task 2: Backend tests

**Files:**
- Create: `tests/__init__.py`
- Create: `tests/test_api.py`

**Step 1: Create tests/__init__.py**

Empty file.

**Step 2: Create tests/test_api.py**

```python
import pytest
from app import create_app, db


@pytest.fixture
def client():
    app = create_app()
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    app.config["TESTING"] = True

    with app.app_context():
        db.create_all()
        with app.test_client() as client:
            yield client
        db.drop_all()


def test_get_scores_empty(client):
    resp = client.get("/api/scores")
    assert resp.status_code == 200
    assert resp.get_json() == []


def test_post_score(client):
    resp = client.post("/api/scores", json={
        "player_name": "Alice",
        "score": 12400,
        "lines": 24,
        "level": 3,
    })
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["player_name"] == "Alice"
    assert data["score"] == 12400


def test_get_scores_ordered(client):
    for name, score in [("Low", 100), ("High", 9999), ("Mid", 5000)]:
        client.post("/api/scores", json={
            "player_name": name, "score": score, "lines": 1, "level": 1,
        })
    resp = client.get("/api/scores")
    data = resp.get_json()
    assert [d["player_name"] for d in data] == ["High", "Mid", "Low"]


def test_get_scores_limit(client):
    for i in range(5):
        client.post("/api/scores", json={
            "player_name": f"P{i}", "score": i * 100, "lines": 1, "level": 1,
        })
    resp = client.get("/api/scores?limit=2")
    assert len(resp.get_json()) == 2


def test_post_score_missing_fields(client):
    resp = client.post("/api/scores", json={"player_name": "X"})
    assert resp.status_code == 400


def test_post_score_empty_name(client):
    resp = client.post("/api/scores", json={
        "player_name": "", "score": 100, "lines": 1, "level": 1,
    })
    assert resp.status_code == 400


def test_post_score_name_too_long(client):
    resp = client.post("/api/scores", json={
        "player_name": "A" * 21, "score": 100, "lines": 1, "level": 1,
    })
    assert resp.status_code == 400


def test_index_returns_html(client):
    # This will fail until template exists, that's expected
    pass
```

**Step 3: Run tests**

Run: `cd /c/Users/jhh/projects/tetris && python -m pytest tests/ -v`
Expected: All tests PASS (except test_index_returns_html which is a placeholder)

**Step 4: Commit**

```bash
git add tests/
git commit -m "test: add API endpoint tests for scores"
```

---

### Task 3: Game HTML template and CSS

**Files:**
- Create: `app/templates/index.html`
- Create: `app/static/css/style.css`

**Step 1: Create app/static/css/style.css**

Full CSS for the game layout:
- Pastel background (#FFF5F5)
- Fredoka One font from Google Fonts
- Game container with board left, sidebar right
- Rounded containers with soft shadows
- Responsive: sidebar stacks below on screens < 768px
- Leaderboard section with tab toggle (Global/Personal)
- Game over overlay with dark backdrop
- Nickname modal

**Step 2: Create app/templates/index.html**

Single-page HTML with:
- Google Fonts link (Fredoka One + Nunito)
- `<canvas id="game-board">` sized to 300x600 (30px per cell)
- Sidebar: next piece canvas, score/level/lines display, controls legend
- Leaderboard section with Global/Personal tabs
- Game over overlay (hidden by default)
- Nickname modal (shown on first visit)
- Script tags for game JS files

**Step 3: Verify**

Run Flask dev server and open in browser:
```bash
cd /c/Users/jhh/projects/tetris && FLASK_APP=app flask run
```
Open http://localhost:5000 — should show the layout (no game logic yet).

**Step 4: Commit**

```bash
git add app/templates/index.html app/static/css/style.css
git commit -m "feat: add game HTML template and CSS layout"
```

---

### Task 4: Tetris game engine (JavaScript)

**Files:**
- Create: `app/static/js/constants.js`
- Create: `app/static/js/board.js`
- Create: `app/static/js/piece.js`
- Create: `app/static/js/game.js`

**Step 1: Create app/static/js/constants.js**

```javascript
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = {
    I: "#A8E6CF",
    O: "#FFD3B6",
    T: "#D4A5FF",
    S: "#B5EAD7",
    Z: "#FFB7B2",
    J: "#A0C4FF",
    L: "#FFDAC1",
};

const SHAPES = {
    I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    O: [[1,1],[1,1]],
    T: [[0,1,0],[1,1,1],[0,0,0]],
    S: [[0,1,1],[1,1,0],[0,0,0]],
    Z: [[1,1,0],[0,1,1],[0,0,0]],
    J: [[1,0,0],[1,1,1],[0,0,0]],
    L: [[0,0,1],[1,1,1],[0,0,0]],
};

const POINTS = { 1: 100, 2: 300, 3: 500, 4: 800 };
const LINES_PER_LEVEL = 10;

// Drop speed in ms per level (index = level, gets faster)
const LEVEL_SPEEDS = [
    800, 720, 630, 550, 470, 380, 300, 220, 150, 100,
    80, 80, 80, 70, 70, 70, 50, 50, 50, 30,
];
```

**Step 2: Create app/static/js/piece.js**

Piece class:
- Constructor takes type (I/O/T/S/Z/J/L), initializes shape matrix, color, x/y position
- `rotate()` — returns new Piece with shape rotated 90deg clockwise (transpose + reverse rows)
- `clone()` — deep copy for collision testing

**Step 3: Create app/static/js/board.js**

Board class:
- Constructor creates ROWS x COLS grid filled with 0
- `isValid(piece)` — check if piece position is within bounds and not overlapping locked cells
- `lock(piece)` — write piece cells into grid with color value
- `clearLines()` — scan for full rows, remove them, shift above rows down, return count of cleared lines
- `drawKawaiiFace(ctx, x, y, size)` — draw small eyes + smile on a cell
- `draw(ctx)` — render grid to canvas, draw kawaii face on each filled cell
- `drawPiece(ctx, piece)` — render active piece with kawaii faces

**Step 4: Create app/static/js/game.js**

Game class (main game loop):
- Constructor: get canvas context, init board, create first piece + next piece, set score/level/lines to 0
- `start()` — begin requestAnimationFrame loop with drop timer
- `update(deltaTime)` — accumulate time, auto-drop piece when timer exceeds level speed
- `draw()` — clear canvas, draw board, draw active piece, draw ghost piece (translucent), update sidebar display
- `moveLeft() / moveRight() / moveDown()` — move piece if valid
- `rotate()` — rotate piece if valid (try wall kicks: 0, +1, -1, +2, -2 offsets)
- `hardDrop()` — drop piece to lowest valid position instantly, lock
- `lockPiece()` — lock piece to board, clear lines, update score, check game over, spawn next piece with bounce animation
- `spawnPiece()` — set active = next, generate new random next, check if spawn position is valid (game over if not)
- `gameOver()` — stop loop, show game over overlay, submit score
- `togglePause()` — pause/resume
- Keyboard event listeners for controls

**Step 5: Verify**

Run Flask dev server, open browser, verify:
- Pieces fall and stack
- Arrow keys move/rotate
- Space hard drops
- Lines clear
- Score increments
- Game over triggers when board fills

**Step 6: Commit**

```bash
git add app/static/js/
git commit -m "feat: implement Tetris game engine with all core mechanics"
```

---

### Task 5: Kawaii rendering and animations

**Files:**
- Modify: `app/static/js/board.js` (enhance draw methods)
- Modify: `app/static/css/style.css` (animation keyframes if needed)

**Step 1: Enhance block rendering in board.js**

Each filled cell draws:
1. Rounded rectangle with pastel fill + slightly darker border
2. Two small oval eyes (black, positioned at ~30% and ~70% horizontal, ~35% vertical)
3. Small curved smile (arc at ~65% vertical)
4. Subtle highlight gradient (lighter top-left corner for 3D look)

```javascript
drawKawaiiFace(ctx, x, y, size, color) {
    const px = x * size;
    const py = y * size;
    const pad = 2;

    // Rounded block
    ctx.fillStyle = color;
    roundRect(ctx, px + pad, py + pad, size - pad*2, size - pad*2, 4);
    ctx.fill();

    // Darker border
    ctx.strokeStyle = darken(color, 20);
    ctx.lineWidth = 1;
    roundRect(ctx, px + pad, py + pad, size - pad*2, size - pad*2, 4);
    ctx.stroke();

    // Eyes
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.ellipse(px + size*0.35, py + size*0.38, 2, 2.5, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(px + size*0.65, py + size*0.38, 2, 2.5, 0, 0, Math.PI*2);
    ctx.fill();

    // Eye shine
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(px + size*0.36, py + size*0.35, 1, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + size*0.66, py + size*0.35, 1, 0, Math.PI*2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px + size*0.5, py + size*0.55, size*0.15, 0.1*Math.PI, 0.9*Math.PI);
    ctx.stroke();
}
```

**Step 2: Add lock bounce animation**

When a piece locks, briefly scale the locked cells up by 10% then back to normal over 150ms using a simple animation frame counter.

**Step 3: Add line clear sparkle effect**

When lines clear, draw small star/sparkle particles that fade out over 300ms at random positions along the cleared rows.

**Step 4: Draw next piece preview with kawaii faces**

Render the next piece in the sidebar canvas with the same kawaii face style.

**Step 5: Verify**

Open browser — blocks should have visible cute faces, bounce on lock, sparkle on line clear.

**Step 6: Commit**

```bash
git add app/static/js/ app/static/css/
git commit -m "feat: add kawaii faces, bounce animation, and sparkle effects"
```

---

### Task 6: Leaderboard UI and score submission

**Files:**
- Create: `app/static/js/leaderboard.js`
- Create: `app/static/js/storage.js`
- Modify: `app/static/js/game.js` (wire up score submission on game over)

**Step 1: Create app/static/js/storage.js**

```javascript
const STORAGE_KEYS = {
    NICKNAME: "matthibastian_nickname",
    HISTORY: "matthibastian_history",
};

function getNickname() {
    return localStorage.getItem(STORAGE_KEYS.NICKNAME) || "";
}

function setNickname(name) {
    localStorage.setItem(STORAGE_KEYS.NICKNAME, name);
}

function getLocalHistory() {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
}

function addLocalScore(entry) {
    const history = getLocalHistory();
    history.push(entry);
    history.sort((a, b) => b.score - a.score);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history.slice(0, 50)));
}
```

**Step 2: Create app/static/js/leaderboard.js**

```javascript
async function fetchGlobalScores(limit = 10) {
    const resp = await fetch(`/api/scores?limit=${limit}`);
    return resp.json();
}

async function submitScore(playerName, score, lines, level) {
    const resp = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_name: playerName, score, lines, level }),
    });
    return resp.json();
}

function renderLeaderboard(scores, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = scores.map((s, i) =>
        `<div class="lb-row">
            <span class="lb-rank">${i + 1}.</span>
            <span class="lb-name">${escapeHtml(s.player_name)}</span>
            <span class="lb-score">${s.score.toLocaleString()}</span>
        </div>`
    ).join("");
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}
```

**Step 3: Wire up game over flow in game.js**

On game over:
1. Show game over overlay with final score, lines, level
2. Pre-fill nickname from localStorage
3. On submit: call `submitScore()`, call `addLocalScore()`, refresh leaderboard display
4. Save nickname to localStorage

**Step 4: Add tab toggle for Global/Personal in the leaderboard section**

- Global tab: calls `fetchGlobalScores()` and renders
- Personal tab: calls `getLocalHistory()` and renders
- Load global scores on page load

**Step 5: Verify**

Play a game to completion. Verify:
- Game over overlay shows with score
- Nickname field pre-fills on second game
- Score appears in global leaderboard
- Score appears in personal history tab

**Step 6: Commit**

```bash
git add app/static/js/
git commit -m "feat: add leaderboard UI, score submission, and local storage"
```

---

### Task 7: Nickname modal and polish

**Files:**
- Create: `app/static/js/main.js` (entry point that wires everything together)
- Modify: `app/templates/index.html` (add modal markup, wire script tags)
- Modify: `app/static/css/style.css` (modal styles)

**Step 1: Create app/static/js/main.js**

Entry point:
1. On DOM load, check if nickname exists in localStorage
2. If not: show nickname modal, wait for input, save
3. Initialize game instance
4. Load global leaderboard
5. Set up keyboard listeners
6. Show "Press ENTER to start" message on canvas

**Step 2: Ensure index.html has all required elements**

- Nickname modal with input + start button
- Game over overlay with score summary + name input + submit button
- Leaderboard tabs (Global / Personal)
- All script tags in correct order: constants.js, piece.js, board.js, game.js, storage.js, leaderboard.js, main.js

**Step 3: Polish CSS**

- Modal backdrop with blur
- Smooth transitions on tab toggle
- Hover effects on buttons
- Pulse animation on "Press ENTER to start"

**Step 4: Verify**

Full play-through:
1. Open page → nickname modal appears
2. Enter name → modal closes, "Press ENTER to start" shown
3. Press ENTER → game starts
4. Play to game over → overlay shows, score submitted
5. Leaderboard updates
6. Refresh page → nickname remembered, no modal

**Step 5: Commit**

```bash
git add app/static/ app/templates/
git commit -m "feat: add nickname modal, entry point, and UI polish"
```

---

### Task 8: Dockerfile and Docker setup

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `run.py`
- Create: `.dockerignore`

**Step 1: Create run.py**

```python
from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
```

**Step 2: Create Dockerfile**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "run:app"]
```

**Step 3: Create .dockerignore**

```
__pycache__
*.pyc
.git
.gitignore
venv
tests
docs
*.db
.pytest_cache
```

**Step 4: Create docker-compose.yml**

```yaml
services:
  matthibastian:
    build: .
    ports:
      - "5000:5000"
    volumes:
      - score_data:/app/instance
    restart: unless-stopped

volumes:
  score_data:
```

**Step 5: Build and test**

```bash
cd /c/Users/jhh/projects/tetris
docker compose build
docker compose up -d
```

Open http://localhost:5000 — full game should work.

Test API:
```bash
curl http://localhost:5000/api/scores
```
Expected: `[]` or existing scores

```bash
docker compose down
```

**Step 6: Run pytest one final time**

```bash
cd /c/Users/jhh/projects/tetris && python -m pytest tests/ -v
```
Expected: All tests PASS

**Step 7: Commit**

```bash
git add Dockerfile docker-compose.yml run.py .dockerignore
git commit -m "feat: add Dockerfile and docker-compose for containerized deployment"
```

---

### Task 9: Final integration test and cleanup

**Files:**
- Modify: any files needing fixes found during integration test

**Step 1: Full integration test**

1. `docker compose up --build -d`
2. Open http://localhost:5000
3. Verify: nickname modal → game start → gameplay → game over → score submission → leaderboard
4. Verify: refresh → nickname persisted → play again
5. Verify: mobile responsive (resize browser to ~375px width)
6. `docker compose down`

**Step 2: Fix any issues found**

Address any bugs from the integration test.

**Step 3: Final commit**

```bash
git add -A
git commit -m "fix: integration test fixes and final polish"
```

(Only if changes were needed)

---

## Summary

| Task | Description | Estimated Steps |
|------|-------------|----------------|
| 1 | Project scaffold and git init | 8 |
| 2 | Backend tests | 4 |
| 3 | Game HTML template and CSS | 4 |
| 4 | Tetris game engine (JS) | 6 |
| 5 | Kawaii rendering and animations | 6 |
| 6 | Leaderboard UI and score submission | 6 |
| 7 | Nickname modal and polish | 5 |
| 8 | Dockerfile and Docker setup | 7 |
| 9 | Final integration test | 3 |

**Total: 9 tasks, ~49 steps**
