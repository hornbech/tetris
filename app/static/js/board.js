class Board {
    constructor() {
        this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        this.lockedColors = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    }

    isValid(piece) {
        for (let r = 0; r < piece.shape.length; r++) {
            for (let c = 0; c < piece.shape[r].length; c++) {
                if (piece.shape[r][c] === 1) {
                    const newX = piece.x + c;
                    const newY = piece.y + r;
                    if (newX < 0 || newX >= COLS || newY >= ROWS) {
                        return false;
                    }
                    // Cells above the board are allowed
                    if (newY >= 0 && this.grid[newY][newX] !== 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    lock(piece) {
        for (let r = 0; r < piece.shape.length; r++) {
            for (let c = 0; c < piece.shape[r].length; c++) {
                if (piece.shape[r][c] === 1) {
                    const y = piece.y + r;
                    const x = piece.x + c;
                    if (y >= 0) {
                        this.grid[y][x] = 1;
                        this.lockedColors[y][x] = piece.color;
                    }
                }
            }
        }
    }

    clearLines() {
        let cleared = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (this.grid[r].every(cell => cell === 1)) {
                this.grid.splice(r, 1);
                this.grid.unshift(Array(COLS).fill(0));
                this.lockedColors.splice(r, 1);
                this.lockedColors.unshift(Array(COLS).fill(null));
                cleared++;
                r++; // re-check this row index since rows shifted down
            }
        }
        return cleared;
    }

    draw(ctx) {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (this.grid[r][c] === 1) {
                    const x = c * BLOCK_SIZE;
                    const y = r * BLOCK_SIZE;
                    const color = this.lockedColors[r][c];
                    drawRoundedBlock(ctx, x, y, BLOCK_SIZE, color, 1.0);
                }
            }
        }
    }

    drawPiece(ctx, piece, alpha) {
        if (alpha === undefined) alpha = 1.0;
        for (let r = 0; r < piece.shape.length; r++) {
            for (let c = 0; c < piece.shape[r].length; c++) {
                if (piece.shape[r][c] === 1) {
                    const x = (piece.x + c) * BLOCK_SIZE;
                    const y = (piece.y + r) * BLOCK_SIZE;
                    drawRoundedBlock(ctx, x, y, BLOCK_SIZE, piece.color, alpha);
                }
            }
        }
    }

    getGhostY(piece) {
        const ghost = piece.clone();
        while (this.isValid(ghost)) {
            ghost.y++;
        }
        return ghost.y - 1;
    }
}

function drawRoundedBlock(ctx, x, y, size, color, alpha) {
    const radius = 4;
    const padding = 1;
    const bx = x + padding;
    const by = y + padding;
    const bs = size - padding * 2;

    ctx.globalAlpha = alpha;

    // Fill
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(bx + radius, by);
    ctx.lineTo(bx + bs - radius, by);
    ctx.quadraticCurveTo(bx + bs, by, bx + bs, by + radius);
    ctx.lineTo(bx + bs, by + bs - radius);
    ctx.quadraticCurveTo(bx + bs, by + bs, bx + bs - radius, by + bs);
    ctx.lineTo(bx + radius, by + bs);
    ctx.quadraticCurveTo(bx, by + bs, bx, by + bs - radius);
    ctx.lineTo(bx, by + radius);
    ctx.quadraticCurveTo(bx, by, bx + radius, by);
    ctx.closePath();
    ctx.fill();

    // Border (slightly darker)
    ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.globalAlpha = 1.0;
}
