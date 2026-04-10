document.addEventListener("DOMContentLoaded", () => {
    const game = new Game();

    // Debug: log canvas dimensions
    console.log("Canvas internal:", game.canvas.width, "x", game.canvas.height);
    console.log("Canvas CSS:", game.canvas.offsetWidth, "x", game.canvas.offsetHeight);
    console.log("ROWS:", ROWS, "COLS:", COLS, "BLOCK_SIZE:", BLOCK_SIZE);

    // Draw initial board grid so it's visible before game starts
    game.draw();

    // Element references (exact IDs from the HTML template)
    const nicknameModal = document.getElementById("nickname-modal");
    const modalNicknameInput = document.getElementById("modal-nickname-input");
    const startBtn = document.getElementById("start-btn");
    const gameOverOverlay = document.getElementById("game-over-overlay");
    const nicknameInput = document.getElementById("nickname-input");
    const submitScoreBtn = document.getElementById("submit-score-btn");
    const finalScore = document.getElementById("final-score");
    const finalLines = document.getElementById("final-lines");
    const finalLevel = document.getElementById("final-level");
    const startMessage = document.getElementById("start-message");

    // Check if nickname exists
    const savedNickname = getNickname();
    if (savedNickname) {
        // Returning player — skip modal
        nicknameModal.classList.add("hidden");
        startMessage.style.display = "block";
    } else {
        // New player — show modal
        nicknameModal.classList.remove("hidden");
        startMessage.style.display = "none";
        modalNicknameInput.focus();
    }

    // Modal start button
    startBtn.addEventListener("click", () => {
        const name = modalNicknameInput.value.trim();
        if (!name) {
            modalNicknameInput.focus();
            return;
        }
        setNickname(name);
        nicknameModal.classList.add("hidden");
        startMessage.style.display = "block";
    });

    // Also allow Enter in the modal input
    modalNicknameInput.addEventListener("keydown", (e) => {
        if (e.code === "Enter") {
            startBtn.click();
        }
    });

    // Game over callback
    game.onGameOver = () => {
        // Show overlay with final stats
        finalScore.textContent = game.score.toLocaleString();
        finalLines.textContent = game.lines;
        finalLevel.textContent = game.level;

        // Pre-fill nickname
        nicknameInput.value = getNickname();

        gameOverOverlay.classList.remove("hidden");
    };

    // Submit score button
    submitScoreBtn.addEventListener("click", async () => {
        const name = nicknameInput.value.trim();
        if (!name) {
            nicknameInput.focus();
            return;
        }

        // Save nickname for next time
        setNickname(name);

        // Submit to global leaderboard
        await submitScore(name, game.score, game.lines, game.level);

        // Save to local history
        addLocalScore({
            player_name: name,
            score: game.score,
            lines: game.lines,
            level: game.level,
        });

        // Hide overlay
        gameOverOverlay.classList.add("hidden");

        // Refresh global leaderboard
        const scores = await fetchGlobalScores();
        renderLeaderboard(scores, "global-scores");

        // Reset game for next round
        game.reset();
        startMessage.style.display = "block";
    });

    // Also allow Enter in the score input
    nicknameInput.addEventListener("keydown", (e) => {
        if (e.code === "Enter") {
            submitScoreBtn.click();
        }
    });

    // Set up leaderboard tabs
    setupLeaderboardTabs();

    // Load global leaderboard on startup
    fetchGlobalScores().then(scores => {
        renderLeaderboard(scores, "global-scores");
    });
});
