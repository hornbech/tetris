class Game {
    constructor() {
        this.canvas = document.getElementById("game-board");
        this.ctx = this.canvas.getContext("2d");
        this.nextCanvas = document.getElementById("next-piece");
        this.nextCtx = this.nextCanvas.getContext("2d");

        this.board = new Board();
        this.piece = randomPiece();
        this.nextPiece = randomPiece();

        this.score = 0;
        this.level = 1;
        this.lines = 0;

        this.gameOver = false;
        this.paused = false;
        this.started = false;

        this.dropCounter = 0;
        this.lastTime = 0;

        this._boundUpdate = this.update.bind(this);

        document.addEventListener("keydown", (e) => this._handleKey(e));
    }

    _handleKey(e) {
        if (e.code === "Enter" && !this.started) {
            this.start();
            return;
        }

        if (!this.started || this.gameOver) return;

        if (e.code === "KeyP") {
            this.togglePause();
            return;
        }

        if (this.paused) return;

        switch (e.code) {
            case "ArrowLeft":
                this.moveLeft();
                break;
            case "ArrowRight":
                this.moveRight();
                break;
            case "ArrowDown":
                this.moveDown();
                break;
            case "ArrowUp":
                this.rotate();
                break;
            case "Space":
                e.preventDefault();
                this.hardDrop();
                break;
        }
    }

    start() {
        this.started = true;
        const msg = document.getElementById("start-message");
        if (msg) msg.style.display = "none";
        this.lastTime = performance.now();
        requestAnimationFrame(this._boundUpdate);
    }

    update(time) {
        if (this.gameOver || this.paused) return;

        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        this.dropCounter += deltaTime;

        const speed = this._getSpeed();
        if (this.dropCounter > speed) {
            this.moveDown();
            this.dropCounter = 0;
        }

        this.draw();
        requestAnimationFrame(this._boundUpdate);
    }

    _getSpeed() {
        const idx = Math.min(this.level - 1, LEVEL_SPEEDS.length - 1);
        return LEVEL_SPEEDS[idx];
    }

    draw() {
        // Clear game canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw locked pieces on the board
        this.board.draw(this.ctx);

        // Draw ghost piece
        const ghostY = this.board.getGhostY(this.piece);
        if (ghostY !== this.piece.y) {
            const ghost = this.piece.clone();
            ghost.y = ghostY;
            this.board.drawPiece(this.ctx, ghost, 0.3);
        }

        // Draw active piece
        this.board.drawPiece(this.ctx, this.piece, 1.0);

        // Draw next piece preview
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        const np = this.nextPiece;
        const shapeW = np.shape[0].length * BLOCK_SIZE;
        const shapeH = np.shape.length * BLOCK_SIZE;
        const offsetX = (this.nextCanvas.width - shapeW) / 2;
        const offsetY = (this.nextCanvas.height - shapeH) / 2;
        for (let r = 0; r < np.shape.length; r++) {
            for (let c = 0; c < np.shape[r].length; c++) {
                if (np.shape[r][c] === 1) {
                    const x = offsetX + c * BLOCK_SIZE;
                    const y = offsetY + r * BLOCK_SIZE;
                    drawRoundedBlock(this.nextCtx, x, y, BLOCK_SIZE, np.color, 1.0);
                }
            }
        }

        // Update DOM stats
        this._updateDisplay();
    }

    _updateDisplay() {
        const scoreEl = document.getElementById("score-display");
        const levelEl = document.getElementById("level-display");
        const linesEl = document.getElementById("lines-display");
        if (scoreEl) scoreEl.textContent = this.score;
        if (levelEl) levelEl.textContent = this.level;
        if (linesEl) linesEl.textContent = this.lines;
    }

    moveLeft() {
        const p = this.piece.clone();
        p.x--;
        if (this.board.isValid(p)) {
            this.piece = p;
        }
    }

    moveRight() {
        const p = this.piece.clone();
        p.x++;
        if (this.board.isValid(p)) {
            this.piece = p;
        }
    }

    moveDown() {
        const p = this.piece.clone();
        p.y++;
        if (this.board.isValid(p)) {
            this.piece = p;
        } else {
            this.lockPiece();
        }
    }

    rotate() {
        let rotated = this.piece.rotate();
        if (this.board.isValid(rotated)) {
            this.piece = rotated;
            return;
        }
        // Wall kicks
        const offsets = [1, -1, 2, -2];
        for (const offset of offsets) {
            const kicked = rotated.clone();
            kicked.x += offset;
            if (this.board.isValid(kicked)) {
                this.piece = kicked;
                return;
            }
        }
    }

    hardDrop() {
        this.piece.y = this.board.getGhostY(this.piece);
        this.lockPiece();
    }

    lockPiece() {
        this.board.lock(this.piece);
        const cleared = this.board.clearLines();
        if (cleared > 0) {
            this.score += (POINTS[cleared] || 0) * this.level;
            this.lines += cleared;
            this.level = Math.floor(this.lines / LINES_PER_LEVEL) + 1;
        }

        this.piece = this.nextPiece;
        this.nextPiece = randomPiece();

        if (!this.board.isValid(this.piece)) {
            this.gameOver = true;
            this.draw(); // final render
            if (typeof this.onGameOver === "function") {
                this.onGameOver();
            }
        }
    }

    togglePause() {
        this.paused = !this.paused;
        if (!this.paused) {
            this.lastTime = performance.now();
            requestAnimationFrame(this._boundUpdate);
        }
    }

    reset() {
        this.board = new Board();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.piece = randomPiece();
        this.nextPiece = randomPiece();
        this.gameOver = false;
        this.paused = false;
        this.dropCounter = 0;
        this.lastTime = 0;
    }
}
