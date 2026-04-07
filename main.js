const grid = document.getElementById('games-grid');
const overlay = document.getElementById('game-overlay');
let container = document.getElementById('game-container');
const closeBtn = document.getElementById('close-overlay');
const title = document.getElementById('game-title');
const info = document.getElementById('game-info');
const tabs = document.querySelectorAll('.tab-btn');
const soundToggle = document.getElementById('sound-toggle');
const fullscreenBtn = document.getElementById('fullscreen-toggle');

// Build marker: helps verify the deployed files are actually updated (cache/CDN issues).
window.__OYUN_DUNYASI_BUILD__ = '2026-04-07-v6';
try { console.log('OYUN DÜNYASI build =', window.__OYUN_DUNYASI_BUILD__); } catch (_) {}

// One global royalty-free background track (loops for all games)
const BGM = (() => {
    const a = new Audio('./assets/bgm.mp3');
    a.loop = true;
    a.preload = 'auto';
    a.volume = 0.35;
    let enabled = true;
    async function play() {
        if (!enabled) return;
        try { await a.play(); } catch (_) {}
    }
    function stop() { try { a.pause(); } catch (_) {} }
    function setEnabled(v) { enabled = !!v; if (!enabled) stop(); }
    function isEnabled() { return enabled; }
    return { play, stop, setEnabled, isEnabled };
})();

let currentDestroy = null;
let keyTrapActive = false;

function shouldTrapKey(e) {
    // Trap only while game overlay is active to avoid page scrolling / UI shortcuts.
    if (!overlay.classList.contains('active')) return false;
    const target = e.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target.isContentEditable) {
        return false;
    }
    const k = e.key;
    // Common game keys + arrows + space + numbers + enter
    if (k === ' ' || k === 'Spacebar') return true;
    if (k === 'Enter') return true;
    if (k.startsWith('Arrow')) return true;
    if (k.length === 1) {
        const c = k.toLowerCase();
        if ('wasdqijkl'.includes(c)) return true;
        if (c === '/' || (c >= '0' && c <= '9')) return true;
    }
    return false;
}

function trapKeyHandler(e) {
    if (!shouldTrapKey(e)) return;
    // Prevent page from scrolling / triggering buttons while in-game.
    e.preventDefault();
}

window.addEventListener('touchmove', (e) => {
    if (overlay.classList.contains('active')) {
        e.preventDefault();
    }
}, { passive: false });

window.addEventListener('gesturestart', (e) => {
    if (overlay.classList.contains('active')) {
        e.preventDefault();
    }
});

window.addEventListener('contextmenu', (e) => {
    if (overlay.classList.contains('active')) {
        e.preventDefault();
    }
});

// Capture phase to beat the page default behavior
window.addEventListener('keydown', trapKeyHandler, { capture: true });
window.addEventListener('keyup', trapKeyHandler, { capture: true });

function renderGames(filter = 'all') {
    grid.innerHTML = '';
    const filtered = GAMES.filter(g => filter === 'all' || g.type === filter);
    
    filtered.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
            <span class="game-icon">${game.icon}</span>
            <h3>${game.name}</h3>
            <p>${game.desc}</p>
            <button class="play-btn">Oyna</button>
        `;
        card.onclick = () => launchGame(game);
        grid.appendChild(card);
    });
}

function launchGame(game) {
    overlay.classList.add('active');
    title.innerText = game.name;
    info.innerText = `Kontroller: ${game.controls}`;
    // Replace container node to prevent old game timers (setTimeout/showReplay) from leaking into new games.
    // Any pending callbacks from the previous game keep referencing the old (detached) node.
    const fresh = container.cloneNode(false);
    fresh.id = 'game-container';
    container.replaceWith(fresh);
    container = fresh;
    
    if (currentDestroy) currentDestroy();
    try {
        SFX?.unlock?.();
        // keep SFX (effects) but use a single real music track
        SFX?.setMusicProfile?.(game.id);
        SFX?.stopMusic?.();
        BGM.play();
    } catch (_) {}

    if (game.type === 'single') {
        showDifficultySelector(game);
    } else if (game.type === 'multi') {
        showNameInput(game);
    } else {
        startGame(game);
    }
}

function showDifficultySelector(game) {
    container.innerHTML = `
        <div class="difficulty-overlay">
            <h2 style="color:white; margin-bottom:20px; text-transform:uppercase; letter-spacing:2px;">Zorluk Seçin</h2>
            <div class="difficulty-options">
                <button class="diff-btn diff-easy" data-level="easy">KOLAY</button>
                <button class="diff-btn diff-medium" data-level="medium">ORTA</button>
                <button class="diff-btn diff-hard" data-level="hard">ZOR</button>
            </div>
        </div>
    `;
    
    container.querySelectorAll('.diff-btn').forEach(btn => {
        btn.onclick = () => {
            const level = btn.dataset.level;
            startGame(game, level);
        };
    });
}

function showNameInput(game) {
    container.innerHTML = `
        <div class="name-input-overlay">
            <h2 style="color:white; margin-bottom:10px; text-transform:uppercase; letter-spacing:2px;">Oyuncu İsimleri</h2>
            <div class="name-input-group">
                <div class="player-input">
                    <label>OYUNCU 1</label>
                    <input type="text" id="p1-name" placeholder="İsim Girin..." value="Oyuncu 1">
                </div>
                <div class="player-input">
                    <label>OYUNCU 2</label>
                    <input type="text" id="p2-name" placeholder="İsim Girin..." value="Oyuncu 2">
                </div>
            </div>
            <button class="play-btn" id="start-multi-btn" style="padding:15px 40px; font-size:1.1rem; border-width:2px;">OYUNA BAŞLA</button>
        </div>
    `;

    const p1Input = document.getElementById('p1-name');
    const p2Input = document.getElementById('p2-name');
    p1Input?.focus();

    document.getElementById('start-multi-btn').onclick = () => {
        const p1 = p1Input?.value || 'Oyuncu 1';
        const p2 = p2Input?.value || 'Oyuncu 2';
        startGame(game, 'medium', { p1, p2 });
    };
}

function startGame(game, difficulty = 'medium', players = { p1: 'Oyuncu 1', p2: 'Oyuncu 2' }) {
    container.innerHTML = '';
    const initFn = GAME_INITIALIZERS[game.id];
    if (initFn) {
        currentDestroy = initFn(container, difficulty, players);
    } else {
        container.innerHTML = `<div style="color:white; font-size:1.5rem;">${game.name} Yakında Gelecek!</div>`;
    }
}

function closeGame() {
    overlay.classList.remove('active');
    if (currentDestroy) currentDestroy();
    currentDestroy = null;
    // drop any lingering UI by replacing container
    const fresh = container.cloneNode(false);
    fresh.id = 'game-container';
    container.replaceWith(fresh);
    container = fresh;
    try { SFX?.stopMusic?.(); } catch (_) {}
    try { BGM.stop(); } catch (_) {}
}

closeBtn.onclick = closeGame;

// Fullscreen toggle
function toggleFullscreen() {
    if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement) {
        // Enter fullscreen
        const elem = overlay;
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => console.log(`Error: ${err.message}`));
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
        fullscreenBtn.textContent = '⛶✕';
        fullscreenBtn.title = 'Tam Ekrandan Çık';
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        fullscreenBtn.textContent = '⛶';
        fullscreenBtn.title = 'Tam Ekran';
    }
}

if (fullscreenBtn) {
    fullscreenBtn.onclick = toggleFullscreen;
}

// Listen for fullscreen changes to update button
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement) {
        fullscreenBtn.textContent = '⛶';
        fullscreenBtn.title = 'Tam Ekran';
    }
});

// Handle orientation changes for mobile
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        // Force layout recalculation
        window.dispatchEvent(new Event('resize'));
        
        // Adjust container height on orientation change
        if (overlay.classList.contains('active')) {
            const gameContainer = document.getElementById('game-container');
            if (gameContainer && gameContainer.querySelector('canvas')) {
                // Game is running - let CSS handle it via media queries
                gameContainer.style.height = 'auto';
                setTimeout(() => {
                    gameContainer.style.height = '';
                }, 100);
            }
        }
    }, 100);
});

// Also listen to screen orientation API (newer standard)
if (window.screen?.orientation) {
    window.screen.orientation.addEventListener('change', () => {
        window.dispatchEvent(new Event('orientationchange'));
    });
}

// Handle ESC key to close
window.onkeydown = (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
        closeGame();
    }
};

// Tabs filtering
tabs.forEach(tab => {
    tab.onclick = () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderGames(tab.dataset.filter);
    };
});

// Initial render
renderGames();

function syncSoundUI() {
    const muted = !!SFX?.isMuted?.();
    soundToggle.classList.toggle('muted', muted);
    soundToggle.textContent = muted ? '🔇' : '🔊';
}

soundToggle.onclick = () => {
    try {
        const nowMuted = SFX.setMuted(!SFX.isMuted());
        BGM.setEnabled(!nowMuted);
        if (!nowMuted && overlay.classList.contains('active')) BGM.play();
        if (nowMuted) BGM.stop();
        syncSoundUI();
    } catch (_) {}
};

syncSoundUI();
