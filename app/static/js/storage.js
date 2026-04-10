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
