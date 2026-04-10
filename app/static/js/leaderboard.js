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
    if (!container) return;
    if (scores.length === 0) {
        container.innerHTML = '<div class="lb-empty">No scores yet!</div>';
        return;
    }
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

function setupLeaderboardTabs() {
    const globalTab = document.querySelector('.lb-tab[data-tab="global"]');
    const personalTab = document.querySelector('.lb-tab[data-tab="personal"]');
    const globalContainer = document.getElementById("global-scores");
    const personalContainer = document.getElementById("personal-scores");

    if (!globalTab || !personalTab) return;

    globalTab.addEventListener("click", async () => {
        globalTab.classList.add("active");
        personalTab.classList.remove("active");
        globalContainer.classList.remove("hidden");
        personalContainer.classList.add("hidden");
        const scores = await fetchGlobalScores();
        renderLeaderboard(scores, "global-scores");
    });

    personalTab.addEventListener("click", () => {
        personalTab.classList.add("active");
        globalTab.classList.remove("active");
        personalContainer.classList.remove("hidden");
        globalContainer.classList.add("hidden");
        const scores = getLocalHistory();
        renderLeaderboard(scores, "personal-scores");
    });
}
