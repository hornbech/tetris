class Piece {
    constructor(type) {
        this.type = type;
        this.shape = SHAPES[type].map(row => [...row]);
        this.color = COLORS[type];
        this.x = Math.floor((COLS - this.shape[0].length) / 2);
        this.y = type === "I" ? -1 : 0;
    }

    rotate() {
        if (this.type === "O") {
            return this.clone();
        }
        const n = this.shape.length;
        const rotated = [];
        for (let r = 0; r < n; r++) {
            rotated[r] = [];
            for (let c = 0; c < n; c++) {
                rotated[r][c] = this.shape[n - 1 - c][r];
            }
        }
        const p = this.clone();
        p.shape = rotated;
        return p;
    }

    clone() {
        const p = new Piece(this.type);
        p.x = this.x;
        p.y = this.y;
        p.shape = this.shape.map(row => [...row]);
        return p;
    }
}

function randomPiece() {
    const types = Object.keys(SHAPES);
    const type = types[Math.floor(Math.random() * types.length)];
    return new Piece(type);
}
