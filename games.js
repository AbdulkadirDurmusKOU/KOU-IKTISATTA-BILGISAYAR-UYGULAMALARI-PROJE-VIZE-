const GAMES = [
    { id: 'reflex', name: 'Refleks Testi', icon: '⚡', type: 'single', desc: 'Ekran yeşil olduğunda hızla tıkla!', controls: 'Mouse/Tık' },
    { id: 'snake', name: 'Solucan Oyunu', icon: '🪱', type: 'single', desc: 'Yemleri topla, kendine çarpma!', controls: 'Ok Tuşları' },
    { id: 'memory', name: 'Hafıza', icon: '🧠', type: 'single', desc: 'Kartları eşleştir, hafızanı test et.', controls: 'Mouse' },
    { id: 'space', name: 'Uzay Savunması', icon: '🚀', type: 'single', desc: 'Gezegenini meteorlardan koru.', controls: 'AD / Sol-Sağ + Boşluk' },
    { id: 'flappy', name: 'Flappy Clone', icon: '🐦', type: 'single', desc: 'Engellerin arasından süzül.', controls: 'Boşluk (Space)' },
    { id: 'breakout', name: 'Neon Breakout', icon: '🧱', type: 'single', desc: 'Tuğlaları kır, topu düşürme!', controls: '←/→ veya D-Pad' },
    { id: 'dodger', name: 'Gölge Kaçışı', icon: '🕶️', type: 'single', desc: 'Yağmur gibi düşen bloklardan kaç.', controls: '←/→ veya D-Pad' },
    { id: 'invaders', name: 'Pixel Invaders', icon: '👾', type: 'single', desc: 'Dalgaları temizle, dünyayı koru.', controls: '←/→ + ATEŞ' },
    { id: 'maze', name: 'Karanlık Labirent', icon: '🧭', type: 'single', desc: 'Labirentten çıkış kapısını bul.', controls: 'Oklar / D-Pad' },
    { id: 'lockpick', name: 'Kilit Ustası', icon: '🗝️', type: 'single', desc: 'Zamanlamayı yakala, kilidi aç.', controls: 'Boşluk / TAP' },
    { id: 'tictactoe', name: 'XOX Duellosu', icon: '❌', type: 'multi', desc: 'Üçünü yan yana getir ve kazan.', controls: '1-9 Tuşları (Hücre Seçimi)' },
    { id: 'pong', name: 'Retro Pong', icon: '🏓', type: 'multi', desc: 'Topu rakibine geçirme!', controls: 'W/S (P1) - ↑/↓ (P2)' },
    { id: 'sumo', name: 'Sumo Savaşı', icon: '🤼', type: 'multi', desc: 'Rakibini dairenin dışına it!', controls: 'WASD (P1) - Ok Tuşları (P2)' },
    { id: 'tank', name: 'Tank Savaşı', icon: '🚜', type: 'multi', desc: 'Rakip tankı vur ve yok et.', controls: 'WASD+Q (P1) - Oklar+/ (P2)' },
    { id: 'race', name: 'Hız Yarışı', icon: '🏎️', type: 'multi', desc: 'Bitiş çizgisine ilk kim varacak?', controls: 'D (P1) - → (P2) Tuşlama' },
    { id: 'duel', name: 'Neon Düello', icon: '🔫', type: 'multi', desc: 'Arena’da rakibini indir!', controls: 'WASD+Q (P1) - Oklar+Enter (P2)' },
    { id: 'tag', name: 'Yakalamaca', icon: '🏃', type: 'multi', desc: 'Hırsız kaçsın, polis yakalasın!', controls: 'Oklar (Hırsız/P1) - WASD (Polis/P2)' },
    { id: 'bump', name: 'Çarpışma Arenası', icon: '💥', type: 'multi', desc: 'Rakibini duvara vur, puan topla.', controls: 'WASD (P1) - Oklar (P2)' },
    { id: 'volley', name: 'Pixel Voleybol', icon: '🏐', type: 'multi', desc: 'Topu düşürme, sayı kazan.', controls: 'A/D+W (P1) - ←/→+↑ (P2)' },
    { id: 'artillery', name: 'Mini Topçu', icon: '🎯', type: 'multi', desc: 'Botlarla denizde düello yap.', controls: 'A/D+W/S+BOŞLUK (P1) - J/L+I/K+Enter (P2)' }
];

// ============== CORE HELPERS (Pixel + Touch + SFX) ==============
function pixelCtx(ctx) {
    if (!ctx) return ctx;
    ctx.imageSmoothingEnabled = false;
    return ctx;
}

function isTouchDevice() {
    return !!(navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
}

function mountTouch(container, keys, opts) {
    if (!isTouchDevice() || typeof TouchControls === 'undefined') return { destroy: () => {} };
    return TouchControls.mount(container, keys, opts);
}

function sfx(name) {
    try { if (typeof SFX !== 'undefined') SFX.play(name); } catch (_) {}
}

function speakText(text) {
    try {
        if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance !== 'function') return;
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'tr-TR';
        utterance.rate = 0.92;
        utterance.pitch = 1.0;
        utterance.volume = 0.95;
        speechSynthesis.speak(utterance);
    } catch (_) {}
}

function getWinnerNameFromMsg(msg) {
    const text = String(msg || '');
    const match = text.match(/^(.+?)\s+kazand[ıi]!?/i);
    return match ? match[1].trim() : null;
}

function playResultAudio(type) {
    try {
        const clip = new Audio('./assets/bgm.mp3');
        clip.volume = 0.24;
        clip.playbackRate = type === 'lose' ? 0.9 : type === 'win' ? 1.05 : 1.0;
        clip.currentTime = 0;
        clip.play().catch(() => {});
        setTimeout(() => { try { clip.pause(); clip.currentTime = 0; } catch (_) {} }, 1400);
    } catch (_) {}
}

function colorfulBg(ctx, w, h, t = 0, variant = 0) {
    // Bright, kid-friendly pixel background with subtle motion
    const g = ctx.createLinearGradient(0, 0, w, h);
    if (variant % 3 === 0) { g.addColorStop(0, '#1b1464'); g.addColorStop(0.5, '#12cbc4'); g.addColorStop(1, '#f368e0'); }
    if (variant % 3 === 1) { g.addColorStop(0, '#0f2027'); g.addColorStop(0.5, '#2c5364'); g.addColorStop(1, '#ff9ff3'); }
    if (variant % 3 === 2) { g.addColorStop(0, '#222f3e'); g.addColorStop(0.5, '#54a0ff'); g.addColorStop(1, '#feca57'); }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // confetti pixels
    const step = 28;
    for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
            const n = (x * 17 + y * 31 + Math.floor(t / 8) * 13 + variant * 97) % 9;
            if (n < 2) {
                ctx.fillStyle = n === 0 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';
                ctx.fillRect(x + (variant % 5), y + ((variant * 3) % 5), 3, 3);
            }
        }
    }
    // vignette
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.fillRect(0, 0, w, 10);
    ctx.fillRect(0, h - 10, w, 10);
}

// ============== REPLAY HELPER ==============
function showReplay(container, msg, replayFn) {
    try {
        const text = String(msg || '').toLowerCase();
        const winnerName = getWinnerNameFromMsg(msg);
        if (/berabere|berabere!|draw/.test(text)) {
            sfx('draw');
            playResultAudio('draw');
            speakText('Oyun berabere bitti, kazanan yok.');
        } else if (/kazandı|kazandi|kazandın|kazandin|tebrik|🎉|kazand|won/.test(text)) {
            sfx('win');
            sfx('confetti');
            playResultAudio('win');
            if (winnerName) {
                speakText(`${winnerName}, kazandı, tebrikler!`);
            } else {
                speakText('Tebrikler, kazandın!');
            }
        } else if (/süre doldu|kaybettin|öldün|oldu[nm]|çakıldın|cakildin|hakkın bitti|game over|skor:|kaybett|lost|öl(d|m)/.test(text)) {
            sfx('lose');
            playResultAudio('lose');
            speakText('Maalesef kaybettin, tekrar dene.');
        }
    } catch (_) {}

    const div = document.createElement('div');
    div.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.9);z-index:10;gap:25px;animation:fadeInReplay 0.4s ease;';
    div.innerHTML = `
        <style>@keyframes fadeInReplay{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}} @keyframes glow{0%,100%{text-shadow:0 0 10px #ffd32a,0 0 30px #ffd32a;}50%{text-shadow:0 0 20px #ff6b6b,0 0 50px #ff6b6b;}}</style>
        <div style="font-size:4rem;">🏆</div>
        <h2 style="color:#ffd32a;font-size:2rem;text-align:center;animation:glow 2s infinite;letter-spacing:2px;">${msg}</h2>
        <button id="replay-btn" style="padding:18px 50px;font-size:1.3rem;background:linear-gradient(135deg,rgba(0,242,255,0.1),rgba(112,0,255,0.1));border:2px solid #00f2ff;color:#00f2ff;border-radius:15px;cursor:pointer;font-weight:bold;transition:0.3s;letter-spacing:1px;">🔄 TEKRAR OYNA</button>
    `;
    container.style.position = 'relative';
    container.appendChild(div);
    const btn = div.querySelector('#replay-btn');
    btn.onclick = replayFn;
    btn.onmouseover = function() { this.style.background='linear-gradient(135deg,#00f2ff,#7000ff)'; this.style.color='white'; this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 25px rgba(0,242,255,0.5)'; };
    btn.onmouseout = function() { this.style.background='linear-gradient(135deg,rgba(0,242,255,0.1),rgba(112,0,255,0.1))'; this.style.color='#00f2ff'; this.style.transform='scale(1)'; this.style.boxShadow='none'; };
}

// ============== REFLEX TEST ==============
function initReflex(container, difficulty = 'medium') {
    container.innerHTML = `<div id="reflex-game" class="reflex-intro">
        <div class="reflex-text">Başlamak için tıkla!<br><small>Yeşil olduğunda tıkla.</small></div>
    </div>`;
    const config = { 'easy': { min: 2000, max: 5000, fake: false }, 'medium': { min: 1000, max: 3000, fake: false }, 'hard': { min: 500, max: 2000, fake: true } }[difficulty] || { min: 1000, max: 3000, fake: false };
    const game = container.querySelector('#reflex-game');
    let state = 'intro', startTime, timeout;

    function handleClick() {
        if (state === 'intro' || state === 'result') {
            sfx('start');
            state = 'waiting'; game.className = 'reflex-wait';
            game.querySelector('.reflex-text').innerHTML = 'Bekle...';
            const waitTime = Math.random() * (config.max - config.min) + config.min;
            if (config.fake && Math.random() > 0.7) { setTimeout(() => { if (state === 'waiting') { game.style.backgroundColor = '#fbc531'; game.querySelector('.reflex-text').innerHTML = 'BEKLE... (Tuzak!)'; } }, waitTime / 2); }
            timeout = setTimeout(() => { state = 'ready'; game.className = 'reflex-ready'; game.style.backgroundColor = ''; game.querySelector('.reflex-text').innerHTML = 'TIKLA!'; startTime = Date.now(); }, waitTime);
        } else if (state === 'waiting') { clearTimeout(timeout); state = 'result'; game.className = 'reflex-intro'; game.querySelector('.reflex-text').innerHTML = 'Çok Erken! <br> Tekrar dene.';
            sfx('lose');
        } else if (state === 'ready') { const reaction = Date.now() - startTime; state = 'result'; game.className = 'reflex-intro'; game.querySelector('.reflex-text').innerHTML = `Sonuç: ${reaction} ms! <br> Tekrar dene.`; }
        if (state === 'result') sfx('click');
    }
    game.addEventListener('click', handleClick);
    return () => { clearTimeout(timeout); game.removeEventListener('click', handleClick); };
}

// ============== SUMO — Canvas, Skin Color, Shrinking Circle ==============
function initSumo(container, difficulty, players) {
    container.innerHTML = `<canvas id="sumoCanvas" width="400" height="450"></canvas>`;
    const canvas = container.querySelector('#sumoCanvas');
    const ctx = pixelCtx(canvas.getContext('2d'));
    const cx = 200, cy = 200, arenaR = 150;
    let p1 = { x: cx - 50, y: cy }, p2 = { x: cx + 50, y: cy };
    let finished = false, winner = '';
    const keys = {};
    const totalTime = 75; // seconds
    let elapsed = 0;
    let shrinkR = arenaR;
    let lastHit = 0;

    const touchLeft = mountTouch(container, keys, { dpad: true, buttons: [] });
    const touchRight = mountTouch(container, keys, { dpad: false, buttons: [
        { key: 'w', label: 'P1 ↑', className: 'primary' },
        { key: 'a', label: 'P1 ←', className: 'primary' },
        { key: 's', label: 'P1 ↓', className: 'primary' },
        { key: 'd', label: 'P1 →', className: 'primary' }
    ]});

    function drawSumoWrestler(x, y, shortsColor, name, accent) {
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath(); ctx.ellipse(x, y + 22, 18, 7, 0, 0, Math.PI * 2); ctx.fill();

        // Legs + outline
        ctx.fillStyle = '#1f1a12'; ctx.fillRect(x - 12, y + 14, 10, 12); ctx.fillRect(x + 2, y + 14, 10, 12);
        ctx.fillStyle = '#d4a574';
        ctx.fillRect(x - 11, y + 15, 8, 10);
        ctx.fillRect(x + 3, y + 15, 8, 10);
        ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x - 11, y + 20, 8, 5); ctx.fillRect(x + 3, y + 20, 8, 5);

        // Body + belly shading
        ctx.fillStyle = '#1f1a12'; ctx.fillRect(x - 16, y - 12, 32, 28);
        ctx.fillStyle = '#d4a574'; ctx.fillRect(x - 15, y - 11, 30, 26);
        ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(x - 12, y - 9, 10, 4);
        ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x + 4, y + 2, 10, 10);

        // Mawashi (shorts) with knot detail
        ctx.fillStyle = shortsColor; ctx.fillRect(x - 15, y + 6, 30, 10);
        ctx.fillStyle = accent; ctx.fillRect(x - 4, y + 8, 8, 6);
        ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(x - 13, y + 7, 10, 2);

        // Arms
        ctx.fillStyle = '#1f1a12'; ctx.fillRect(x - 22, y - 6, 10, 8); ctx.fillRect(x + 12, y - 6, 10, 8);
        ctx.fillStyle = '#d4a574';
        ctx.fillRect(x - 21, y - 5, 8, 6);
        ctx.fillRect(x + 13, y - 5, 8, 6);

        // Head
        ctx.fillStyle = '#1f1a12'; ctx.fillRect(x - 10, y - 24, 20, 16);
        ctx.fillStyle = '#d4a574'; ctx.fillRect(x - 9, y - 23, 18, 14);
        // Hair top-knot + band
        ctx.fillStyle = '#111'; ctx.fillRect(x - 5, y - 30, 10, 8);
        ctx.fillStyle = accent; ctx.fillRect(x - 6, y - 24, 12, 2);
        // Eyes + brows
        ctx.fillStyle = 'white';
        ctx.fillRect(x - 6, y - 19, 5, 5);
        ctx.fillRect(x + 1, y - 19, 5, 5);
        ctx.fillStyle = '#000';
        ctx.fillRect(x - 5, y - 18, 2, 2);
        ctx.fillRect(x + 2, y - 18, 2, 2);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x - 7, y - 21, 6, 2); ctx.fillRect(x + 1, y - 21, 6, 2);
        // Mouth
        ctx.fillStyle = '#7d2d2d'; ctx.fillRect(x - 2, y - 13, 4, 2);

        // Name tag
        ctx.fillStyle = 'white'; ctx.font = 'bold 10px Inter'; ctx.textAlign = 'center';
        ctx.fillText(name.substring(0, 8), x, y + 38);
    }

    function update() {
        if (finished) return;
        // shrink a bit slower (less aggressive)
        elapsed += 0.016;
        shrinkR = arenaR * Math.max(0.15, 1 - (elapsed / totalTime));

        if (keys['a']) p1.x -= 3; if (keys['d']) p1.x += 3;
        if (keys['w']) p1.y -= 3; if (keys['s']) p1.y += 3;
        if (keys['ArrowLeft']) p2.x -= 3; if (keys['ArrowRight']) p2.x += 3;
        if (keys['ArrowUp']) p2.y -= 3; if (keys['ArrowDown']) p2.y += 3;

        // Push mechanic
        const dx = p2.x - p1.x, dy = p2.y - p1.y, dist = Math.hypot(dx, dy);
        if (dist < 32) {
            const nx = dx / dist, ny = dy / dist;
            p2.x += nx * 4; p2.y += ny * 4; p1.x -= nx * 2; p1.y -= ny * 2;
            const now = Date.now();
            if (now - lastHit > 120) { lastHit = now; sfx('hit'); }
        }

        // Check: out of blue arena (into red) OR touched shrinking black circle
        const p1Dist = Math.hypot(p1.x - cx, p1.y - cy);
        const p2Dist = Math.hypot(p2.x - cx, p2.y - cy);
        if (p1Dist > arenaR || p1Dist > shrinkR) { winner = players.p2; finished = true; }
        if (p2Dist > arenaR || p2Dist > shrinkR) { winner = players.p1; finished = true; }

        // Time up -> decide winner by who is closer to center (tie possible)
        const remaining = totalTime - elapsed;
        if (!finished && remaining <= 0) {
            const a = Math.round(p1Dist);
            const b = Math.round(p2Dist);
            if (a === b) winner = 'BERABERE';
            else winner = a < b ? players.p1 : players.p2;
            finished = true;
        }
    }

    function draw() {
        colorfulBg(ctx, 400, 450, Date.now() / 14, 2);

        // Red danger zone (full area behind arena)
        ctx.fillStyle = '#b71c1c';
        ctx.beginPath(); ctx.arc(cx, cy, arenaR + 30, 0, Math.PI * 2); ctx.fill();

        // Blue arena
        ctx.beginPath(); ctx.arc(cx, cy, arenaR, 0, Math.PI * 2);
        ctx.fillStyle = '#1565c0'; ctx.fill();
        ctx.strokeStyle = '#0d47a1'; ctx.lineWidth = 4; ctx.stroke();

        // Shrinking black circle
        ctx.beginPath(); ctx.arc(cx, cy, shrinkR, 0, Math.PI * 2);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.stroke();

        // Inner line
        ctx.beginPath(); ctx.arc(cx, cy, shrinkR * 0.8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.stroke();

        drawSumoWrestler(p1.x, p1.y, '#222', players.p1, '#00f2ff');
        drawSumoWrestler(p2.x, p2.y, '#ffd32a', players.p2, '#ff5e57');

        // Timer
        const remaining = Math.max(0, totalTime - elapsed);
        ctx.fillStyle = 'white'; ctx.font = 'bold 16px Inter'; ctx.textAlign = 'center';
        ctx.fillText(`⏱ ${Math.ceil(remaining)}s`, 200, 395);
        ctx.fillStyle = '#9494b8'; ctx.font = '12px Inter';
        ctx.fillText(`${players.p1}: WASD | ${players.p2}: Ok Tuşları`, 200, 420);

        if (finished) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 140, 400, 80);
            ctx.fillStyle = '#ffd32a'; ctx.font = 'bold 28px Inter';
            ctx.fillText(winner === 'BERABERE' ? 'BERABERE!' : (winner + ' KAZANDI!'), 200, 190);
        }
    }

    const interval = setInterval(() => {
        update(); draw();
        if (finished) {
            clearInterval(interval);
            if (winner === 'BERABERE') sfx('draw'); else sfx('win');
            const msg = winner === 'BERABERE' ? 'Berabere!' : (winner + ' Kazandı!');
            setTimeout(() => showReplay(container, msg, () => initSumo(container, difficulty, players)), 500);
        }
    }, 20);
    const kd = (e) => { keys[e.key.startsWith('Arrow') ? e.key : e.key.toLowerCase()] = true; e.preventDefault(); };
    const ku = (e) => { keys[e.key.startsWith('Arrow') ? e.key : e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    return () => {
        clearInterval(interval);
        window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
        touchLeft.destroy?.(); touchRight.destroy?.();
    };
}

// ============== XOX — Keyboard, Random X/O ==============
function initXOX(container, difficulty, players) {
    const p1IsX = Math.random() > 0.5;
    const p1Symbol = p1IsX ? 'X' : 'O', p2Symbol = p1IsX ? 'O' : 'X';
    container.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:20px;padding:25px;background:radial-gradient(circle at 30% 20%, rgba(0,242,255,0.10), transparent 45%),radial-gradient(circle at 70% 70%, rgba(255,94,87,0.10), transparent 50%),linear-gradient(135deg, rgba(0,0,0,0.35), rgba(0,0,0,0.15));border-radius:18px;">
            <div style="display:flex;gap:30px;align-items:center;">
                <div style="text-align:center;padding:10px 20px;border:2px solid #00f2ff;border-radius:12px;background:rgba(0,242,255,0.05);">
                    <div style="color:#9494b8;font-size:0.8rem;">${players.p1}</div>
                    <div style="color:#00f2ff;font-size:2rem;font-weight:bold;">${p1Symbol}</div>
                </div>
                <span style="color:#555;font-size:1.5rem;">VS</span>
                <div style="text-align:center;padding:10px 20px;border:2px solid #ff5e57;border-radius:12px;background:rgba(255,94,87,0.05);">
                    <div style="color:#9494b8;font-size:0.8rem;">${players.p2}</div>
                    <div style="color:#ff5e57;font-size:2rem;font-weight:bold;">${p2Symbol}</div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,110px);gap:8px;padding:15px;background:rgba(11,16,32,0.65);border-radius:16px;border:1px solid rgba(255,255,255,0.07);box-shadow: inset 0 0 0 2px rgba(0,0,0,0.25);">
                ${Array(9).fill(0).map((_, i) => `<div class="xox-cell" data-idx="${i}" style="width:110px;height:110px;background:linear-gradient(135deg,#2f3542,#1e272e);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:3.5rem;cursor:pointer;position:relative;border:1px solid rgba(255,255,255,0.08);transition:0.2s;"><span style="position:absolute;top:6px;left:10px;font-size:0.75rem;color:rgba(255,255,255,0.15);font-weight:bold;">${i+1}</span></div>`).join('')}
            </div>
            <p style="color:#555;font-size:0.85rem;">⌨️ P1: 1-9 tuşları | P2: Q-E/A-D/Z-C | Tıkla da çalışır</p>
            <p id="xox-turn" style="color:white;font-weight:bold;font-size:1.3rem;">Sıra: ${players.p1} (${p1Symbol})</p>
        </div>`;
    let board = Array(9).fill(null), p1Turn = true, gameEnded = false;
    const cells = container.querySelectorAll('.xox-cell'), turnTxt = container.querySelector('#xox-turn');

    // make symbols look "brick-like"
    const markHTML = (sym) => {
        const col = sym === 'X' ? '#00f2ff' : '#ff5e57';
        const edge = sym === 'X' ? '#008b8b' : '#b33939';
        const txt = sym;
        return `<span style="
          display:inline-block;
          padding:10px 18px;
          border-radius:10px;
          background:linear-gradient(180deg, ${col}, ${edge});
          border:2px solid rgba(0,0,0,0.35);
          box-shadow: inset 0 3px 0 rgba(255,255,255,0.18), inset 0 -3px 0 rgba(0,0,0,0.18);
          color:#0b1020;
          font-weight:900;
          letter-spacing:2px;
          text-shadow: 0 2px 0 rgba(255,255,255,0.15);
        ">${txt}</span>`;
    };

    function checkWinner() { const L=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]; for(let l of L){if(board[l[0]]&&board[l[0]]===board[l[1]]&&board[l[0]]===board[l[2]])return board[l[0]];} return null; }

    function placeAt(idx) {
        if (board[idx] || gameEnded) return;
        sfx('click');
        const sym = p1Turn ? p1Symbol : p2Symbol;
        board[idx] = sym;
        cells[idx].innerHTML = markHTML(sym);
        cells[idx].style.color = 'white';
        p1Turn = !p1Turn;
        const win = checkWinner();
        if (win) { const w = (win===p1Symbol)?players.p1:players.p2; sfx('win'); turnTxt.innerText = w+' KAZANDI!'; turnTxt.style.color='#ffd32a'; gameEnded=true; setTimeout(()=>showReplay(container,w+' Kazandı!',()=>initXOX(container,difficulty,players)),800); }
        else if (!board.includes(null)) { sfx('draw'); turnTxt.innerText='BERABERE!'; turnTxt.style.color='#ffd32a'; gameEnded=true; setTimeout(()=>showReplay(container,'Berabere!',()=>initXOX(container,difficulty,players)),800); }
        else { turnTxt.innerText = `Sıra: ${p1Turn?players.p1:players.p2} (${p1Turn?p1Symbol:p2Symbol})`; }
    }
    function handleKey(e) { 
        // P1: 1-9 tuşları
        const m={'1':0,'2':1,'3':2,'4':3,'5':4,'6':5,'7':6,'8':7,'9':8}; 
        if(m[e.key]!==undefined) placeAt(m[e.key]);
        
        // P2: Q-C layout (QWERTY) veya numpad
        // Row 1: Q(0), W(1), E(2)
        // Row 2: A(3), S(4), D(5)
        // Row 3: Z(6), X(7), C(8)
        const p2m={'q':0,'w':1,'e':2,'a':3,'s':4,'d':5,'z':6,'x':7,'c':8};
        const key = e.key.toLowerCase();
        if(p2m[key]!==undefined) placeAt(p2m[key]);
    }
    const handleTap = (e) => {
        const el = e.target.closest?.('.xox-cell');
        if (!el) return;
        placeAt(Number(el.dataset.idx));
    };
    window.addEventListener('keydown', handleKey);
    container.addEventListener('pointerdown', handleTap);
    return () => { window.removeEventListener('keydown', handleKey); container.removeEventListener('pointerdown', handleTap); };
}

// ============== SNAKE ==============
function initSnake(container, difficulty = 'medium') {
    container.innerHTML = `<canvas id="snakeCanvas" width="400" height="400"></canvas>`;
    const canvas = container.querySelector('#snakeCanvas'), ctx = pixelCtx(canvas.getContext('2d'));
    const keys = {};
    const touch = mountTouch(container, keys, { dpad: true, buttons: [] });
    let snake = [{x:10,y:10}], food = {x:15,y:15}, bonus = null, dx = 0, dy = 0, score = 0, dead = false;
    const baseMs = {'easy':180,'medium':120,'hard':80}[difficulty] ?? 120;
    let stepMs = baseMs;
    let moves = 0;
    let bonusTick = 0;
    let lastDir = 'right';

    function setDir(nx, ny, dirName) {
        if (dead) return;
        if (dx === -nx && dy === -ny) return; // prevent reverse
        dx = nx; dy = ny; lastDir = dirName;
    }

    function spawnBonus() {
        // bonus apple spawns more often as score rises
        if (bonus) return;
        const chance = Math.min(0.22, 0.05 + score * 0.008);
        if (Math.random() < chance) {
            bonus = { x: Math.floor(Math.random()*20), y: Math.floor(Math.random()*20), ttl: 120 }; // ~ few seconds
        }
    }

    function gameLoop() {
        // Touch dpad support (continuous)
        if (keys['arrowup']) setDir(0, -1, 'up');
        else if (keys['arrowdown']) setDir(0, 1, 'down');
        else if (keys['arrowleft']) setDir(-1, 0, 'left');
        else if (keys['arrowright']) setDir(1, 0, 'right');

        if (dead || (dx===0 && dy===0)) return;
        moves++;
        let head = {x:snake[0].x+dx, y:snake[0].y+dy};
        if (head.x<0||head.x>=20||head.y<0||head.y>=20||snake.find(s=>s.x===head.x&&s.y===head.y)) {
            dead = true; clearInterval(interval);
            sfx('lose');
            setTimeout(() => showReplay(container, 'Game Over! Skor: '+score, () => initSnake(container, difficulty)), 300);
            return;
        }
        snake.unshift(head);
        if (bonus && head.x===bonus.x && head.y===bonus.y) {
            score += 2; sfx('coin');
            bonus = null;
            // faster ramp reward
            stepMs = Math.max(55, Math.floor(stepMs * 0.94));
            restartInterval();
        }
        if (head.x===food.x&&head.y===food.y) {
            score++; sfx('coin');
            food={x:Math.floor(Math.random()*20),y:Math.floor(Math.random()*20)};
            // speed ramps over time
            if (score % 4 === 0) {
                stepMs = Math.max(55, Math.floor(stepMs * 0.95));
                restartInterval();
            }
        } else snake.pop();

        // bonus spawn / decay
        bonusTick++;
        if (bonusTick % 3 === 0) spawnBonus();
        if (bonus) { bonus.ttl--; if (bonus.ttl <= 0) bonus = null; }
    }
    function draw() {
        // Soil background (static)
        ctx.fillStyle='#3a2a1a'; ctx.fillRect(0,0,400,400);
        for(let y=0;y<400;y+=20){
            for(let x=0;x<400;x+=20){
                const n1 = ((x*19 + y*23) % 11);
                const n2 = ((x*7 + y*13) % 9);
                // darker clods
                ctx.fillStyle = n1 < 3 ? 'rgba(0,0,0,0.14)' : 'rgba(0,0,0,0.06)';
                ctx.fillRect(x+2,y+4,7,4);
                ctx.fillRect(x+11,y+13,6,3);
                // lighter grains
                ctx.fillStyle = n2 < 2 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)';
                ctx.fillRect(x+6,y+10,3,2);
                // tiny root lines (static)
                const ox = (n1 % 6);
                ctx.fillStyle = 'rgba(0,0,0,0.10)';
                ctx.fillRect(x+14-ox,y+6,6,1);
            }
        }
        // pebbles (static)
        for(let i=0;i<26;i++){
            const px = (i*37) % 400;
            const py = (i*59) % 400;
            ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.fillRect(px,py,2,2);
            ctx.fillStyle='rgba(0,0,0,0.10)'; ctx.fillRect(px+2,py+2,2,2);
        }

        // Food (pixel apple)
        const fx = food.x*20, fy = food.y*20;
        ctx.fillStyle='#ff4757'; ctx.fillRect(fx+4,fy+5,12,11);
        ctx.fillStyle='#c44569'; ctx.fillRect(fx+6,fy+7,6,7);
        ctx.fillStyle='#2ed573'; ctx.fillRect(fx+10,fy+2,3,4);
        ctx.fillStyle='#1dd1a1'; ctx.fillRect(fx+9,fy+3,1,2);
        // Bonus apple (gold)
        if (bonus) {
            const bx = bonus.x*20, by = bonus.y*20;
            ctx.fillStyle='#111827'; ctx.fillRect(bx+3,by+4,14,12);
            ctx.fillStyle='#ffd32a'; ctx.fillRect(bx+4,by+5,12,10);
            ctx.fillStyle='rgba(255,255,255,0.22)'; ctx.fillRect(bx+6,by+6,5,3);
        }

        snake.forEach((s,i)=>{
            const x = s.x*20, y = s.y*20;
            const isHead = i===0;
            const isTail = i===snake.length-1;
            // Worm body (segmented + warmer tones)
            const base = '#8e3b2f';
            const mid = '#b5533d';
            const hi = 'rgba(255,255,255,0.10)';
            ctx.fillStyle = '#0b1020'; ctx.fillRect(x+1,y+1,18,18);
            ctx.fillStyle = base; ctx.fillRect(x+2,y+2,16,16);
            ctx.fillStyle = mid; ctx.fillRect(x+3,y+4,14,12);
            // segment rings
            ctx.fillStyle = 'rgba(0,0,0,0.14)';
            ctx.fillRect(x+3,y+6,14,1);
            ctx.fillRect(x+3,y+10,14,1);
            ctx.fillStyle = hi; ctx.fillRect(x+4,y+5,6,3);
            // tail taper
            if (isTail) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x+12,y+12,5,5); }

            if(isHead){
                // Face (directional)
                ctx.fillStyle='white';
                if(lastDir==='left'||lastDir==='right'){
                    ctx.fillRect(x+5,y+6,4,4); ctx.fillRect(x+11,y+6,4,4);
                    ctx.fillStyle='black'; ctx.fillRect(x+6,y+7,2,2); ctx.fillRect(x+12,y+7,2,2);
                } else {
                    ctx.fillRect(x+6,y+5,4,4); ctx.fillRect(x+6,y+11,4,4);
                    ctx.fillStyle='black'; ctx.fillRect(x+7,y+6,2,2); ctx.fillRect(x+7,y+12,2,2);
                }
                // Tiny tongue flash
                if(score>0 && (Date.now()%600)<120){ ctx.fillStyle='#ff6b6b'; ctx.fillRect(x+9,y+15,2,3); }
            }
        });
        ctx.fillStyle='white';ctx.font='bold 14px Inter';ctx.fillText('Skor: '+score,10,20);
        ctx.fillStyle='rgba(255,255,255,0.25)';ctx.font='12px Inter';
        ctx.fillText(`Hız: ${Math.round(1000/stepMs)} /sn`,10,38);
    }
    let interval = null;
    function restartInterval() {
        try { if (interval) clearInterval(interval); } catch (_) {}
        interval = setInterval(()=>{gameLoop();draw();}, stepMs);
    }
    restartInterval();
    const handleKey=(e)=>{
        if(e.key==='ArrowUp') setDir(0,-1,'up');
        if(e.key==='ArrowDown') setDir(0,1,'down');
        if(e.key==='ArrowLeft') setDir(-1,0,'left');
        if(e.key==='ArrowRight') setDir(1,0,'right');
    };
    window.addEventListener('keydown',handleKey);
    return ()=>{clearInterval(interval);window.removeEventListener('keydown',handleKey);touch.destroy?.();};
}

// ============== MEMORY — with flip animation + timer ==============
function initMemory(container, difficulty = 'medium') {
    const config = {'easy':{pairs:6,cols:4,time:180},'medium':{pairs:8,cols:4,time:180},'hard':{pairs:12,cols:6,time:180}}[difficulty] ?? {pairs:8,cols:4,time:180};
    const symbols = ['🍎','🍌','🍉','🍇','🍓','🍒','🥝','🍍','🍋','🍊','🍐','🍏','🍕','🍔','🍟','🌭','🍿','🍩'];
    const sel = symbols.slice(0,config.pairs);
    const cards = [...sel,...sel].sort(()=>Math.random()-0.5);
    let timeLeft = config.time, timerDone = false;
    container.innerHTML = `
        <style>
            .mem-card{width:60px;height:60px;perspective:400px;cursor:pointer;}
            .mem-inner{position:relative;width:100%;height:100%;transition:transform 0.4s;transform-style:preserve-3d;}
            .mem-card.flipped .mem-inner{transform:rotateY(180deg);}
            .mem-card.matched .mem-inner{transform:rotateY(180deg);}
            .mem-front,.mem-back{position:absolute;width:100%;height:100%;backface-visibility:hidden;border-radius:8px;display:flex;align-items:center;justify-content:center;}
            .mem-front{background:#2f3542;}
            .mem-back{background:#00f2ff;transform:rotateY(180deg);font-size:1.8rem;}
        </style>
        <div style="text-align:center;margin-bottom:10px;">
            <span id="mem-timer" style="color:white;font-size:1.3rem;font-weight:bold;">⏱ ${Math.floor(timeLeft/60)}:${String(timeLeft%60).padStart(2,'0')}</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(${config.cols},60px);gap:10px;padding:10px 20px;">
            ${cards.map((s,i)=>`<div class="mem-card" data-idx="${i}" data-val="${s}"><div class="mem-inner"><div class="mem-front">❓</div><div class="mem-back">${s}</div></div></div>`).join('')}
        </div>`;
    let flipped=[], matched=0, locked=false;
    const items = container.querySelectorAll('.mem-card');
    const timerEl = container.querySelector('#mem-timer');

    const timerInterval = setInterval(()=>{
        if(timerDone) return;
        timeLeft--;
        const m = Math.floor(timeLeft/60), s = String(timeLeft%60).padStart(2,'0');
        timerEl.textContent = `⏱ ${m}:${s}`;
        if(timeLeft <= 30) timerEl.style.color = '#ff4757';
        if(timeLeft <= 0){
            timerDone = true; clearInterval(timerInterval);
            sfx('lose');
            showReplay(container, '⌛ Süre Doldu! '+matched+'/'+config.pairs+' Eşleşme', ()=>initMemory(container,difficulty));
        }
    }, 1000);

    items.forEach(item=>{
        item.onclick=()=>{
            if(locked||timerDone||item.classList.contains('flipped')||item.classList.contains('matched')) return;
            sfx('click');
            item.classList.add('flipped');
            flipped.push(item);
            if(flipped.length===2){
                locked=true;
                if(flipped[0].dataset.val===flipped[1].dataset.val){
                    sfx('coin');
                    flipped.forEach(f=>f.classList.add('matched'));
                    matched++; flipped=[]; locked=false;
                    if(matched===config.pairs){
                        sfx('win');
                        timerDone=true; clearInterval(timerInterval);
                        setTimeout(()=>showReplay(container,'🎉 Tebrikler! Süre: '+(config.time-timeLeft)+'s',()=>initMemory(container,difficulty)),600);
                    }
                } else {
                    sfx('hit');
                    setTimeout(()=>{flipped.forEach(f=>f.classList.remove('flipped'));flipped=[];locked=false;},800);
                }
            }
        };
    });
    return ()=>{ clearInterval(timerInterval); };
}

// ============== PONG — with countdown ==============
function initPong(container, difficulty, players) {
    container.innerHTML = `<canvas id="pongCanvas" width="600" height="400"></canvas>`;
    const canvas = container.querySelector('#pongCanvas'), ctx = pixelCtx(canvas.getContext('2d'));
    let p1Y=150,p2Y=150,ball={x:300,y:200,dx:0,dy:0},p1Score=0,p2Score=0;
    const keys={}, winScore=5;
    let countdown = 3, started = false, gameEnded = false;
    let timeLeft = 75; // seconds
    const touchP1 = mountTouch(container, keys, { dpad: false, buttons: [
        { key: 'w', label: 'P1 ↑', className: 'primary' },
        { key: 's', label: 'P1 ↓', className: 'primary' }
    ]});
    const touchP2 = mountTouch(container, keys, { dpad: false, buttons: [
        { key: 'ArrowUp', label: 'P2 ↑', className: 'primary' },
        { key: 'ArrowDown', label: 'P2 ↓', className: 'primary' }
    ]});

    // Countdown
    let countInterval = setInterval(()=>{
        countdown--;
        if(countdown<=0){ clearInterval(countInterval); started=true; ball.dx=4; ball.dy=3; }
    },1000);

    function update(){
        if(!started||gameEnded) return;
        if(keys['w']&&p1Y>0)p1Y-=6;if(keys['s']&&p1Y<320)p1Y+=6;
        if((keys['ArrowUp']||keys['arrowup'])&&p2Y>0)p2Y-=6;if((keys['ArrowDown']||keys['arrowdown'])&&p2Y<320)p2Y+=6;
        ball.x+=ball.dx;ball.y+=ball.dy;if(ball.y<0||ball.y>400)ball.dy*=-1;
        // Paddle hit (classic)
        if(ball.x<20&&ball.y>p1Y&&ball.y<p1Y+80){ ball.dx*=-1.05; sfx('hit'); }
        if(ball.x>580&&ball.y>p2Y&&ball.y<p2Y+80){ ball.dx*=-1.05; sfx('hit'); }
        if(ball.x<0){p2Score++; sfx('point'); resetBall();}
        if(ball.x>600){p1Score++; sfx('point'); resetBall();}
        if(p1Score>=winScore&&!gameEnded){
            gameEnded=true; sfx('win'); clearInterval(interval); clearInterval(timer);
            setTimeout(()=>showReplay(container,players.p1+' Kazandı! ('+p1Score+'-'+p2Score+')',()=>initPong(container,difficulty,players)),500);
        }
        if(p2Score>=winScore&&!gameEnded){
            gameEnded=true; sfx('win'); clearInterval(interval); clearInterval(timer);
            setTimeout(()=>showReplay(container,players.p2+' Kazandı! ('+p1Score+'-'+p2Score+')',()=>initPong(container,difficulty,players)),500);
        }
    }
    function resetBall(){ball={x:300,y:200,dx:0,dy:0};started=false;countdown=2;countInterval=setInterval(()=>{countdown--;if(countdown<=0){clearInterval(countInterval);started=true;ball.dx=Math.random()>0.5?4:-4;ball.dy=3;}},1000);}
    function draw(){
        colorfulBg(ctx, 600, 400, Date.now() / 18, 4);
        // Court overlay
        ctx.fillStyle='rgba(0,0,0,0.55)';ctx.fillRect(0,0,600,400);
        ctx.strokeStyle='rgba(255,255,255,0.20)';ctx.setLineDash([10,10]);ctx.beginPath();ctx.moveTo(300,0);ctx.lineTo(300,400);ctx.stroke();ctx.setLineDash([]);

        // Paddles (classic)
        ctx.fillStyle='#0b1020'; ctx.fillRect(8,p1Y-2,14,84);
        ctx.fillStyle='#00f2ff';ctx.fillRect(10,p1Y,10,80);
        ctx.fillStyle='rgba(255,255,255,0.16)'; ctx.fillRect(12,p1Y+6,6,4);

        ctx.fillStyle='#0b1020'; ctx.fillRect(578,p2Y-2,14,84);
        ctx.fillStyle='#ff5e57';ctx.fillRect(580,p2Y,10,80);
        ctx.fillStyle='rgba(255,255,255,0.16)'; ctx.fillRect(582,p2Y+6,6,4);

        // Ball (pixel tennis ball)
        const bx = ball.x, by = ball.y;
        ctx.fillStyle = '#111827';
        ctx.fillRect(bx - 9, by - 9, 18, 18);
        ctx.fillStyle = '#b9ff3b';
        ctx.fillRect(bx - 7, by - 8, 14, 16);
        ctx.fillRect(bx - 8, by - 7, 16, 14);
        // cut corners for roundness
        ctx.fillStyle = '#111827';
        ctx.fillRect(bx - 8, by - 8, 2, 2);
        ctx.fillRect(bx + 6, by - 8, 2, 2);
        ctx.fillRect(bx - 8, by + 6, 2, 2);
        ctx.fillRect(bx + 6, by + 6, 2, 2);
        // seam
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.fillRect(bx - 2, by - 7, 2, 4);
        ctx.fillRect(bx, by - 3, 2, 4);
        ctx.fillRect(bx - 2, by + 1, 2, 4);
        // highlight
        ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(bx - 4, by - 6, 4, 3);

        ctx.font='bold 20px Inter';ctx.textAlign='center';
        ctx.fillStyle='#00f2ff';ctx.fillText(`${players.p1}: ${p1Score}`,150,40);
        ctx.fillStyle='#ff5e57';ctx.fillText(`${players.p2}: ${p2Score}`,450,40);
        ctx.fillStyle='#ffd32a';ctx.font='bold 14px Inter';ctx.fillText(`Süre: ${Math.max(0, Math.ceil(timeLeft))}s`,300,40);
        ctx.fillStyle='rgba(255,255,255,0.35)';ctx.font='12px Inter';ctx.fillText(`${winScore} sayıya ilk ulaşan kazanır`,300,395);
        if(!started){ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(220,150,160,100);ctx.fillStyle='#ffd32a';ctx.font='bold 48px Inter';ctx.fillText(countdown>0?countdown:'BAŞLA!',300,215);}
    }
    const timer = setInterval(() => {
        if (gameEnded) return;
        timeLeft -= 1;
        if (timeLeft <= 0) {
            gameEnded = true;
            clearInterval(interval);
            clearInterval(timer);
            if (p1Score === p2Score) {
                sfx('draw');
                setTimeout(() => showReplay(container, 'BERABERE!', () => initPong(container, difficulty, players)), 450);
            } else {
                sfx('win');
                const w = p1Score > p2Score ? players.p1 : players.p2;
                setTimeout(() => showReplay(container, `${w} Kazandı! (${p1Score}-${p2Score})`, () => initPong(container, difficulty, players)), 450);
            }
        }
    }, 1000);
    const interval=setInterval(()=>{update();draw();},16);
    const kd=(e)=>keys[e.key]=true,ku=(e)=>keys[e.key]=false;
    window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);
    return()=>{clearInterval(interval); clearInterval(timer); window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);touchP1.destroy?.();touchP2.destroy?.();};
}

// ============== RACE — Cars face finish line (right side) ==============
function initRace(container, difficulty, players) {
    container.innerHTML = `<canvas id="raceCanvas" width="550" height="300"></canvas>`;
    const canvas = container.querySelector('#raceCanvas'), ctx = pixelCtx(canvas.getContext('2d'));
    let p1x = 30, p2x = 30, done = false, winner = '';
    let timeLeft = 25;
    const finishX = 500;

    function drawCar(x, y, color, name) {
        // Race car body (low + detailed, facing right)
        const dark = '#0b1020';
        const shade = color === '#00f2ff' ? '#008b8b' : '#b33939';
        const stripe = color === '#00f2ff' ? '#7000ff' : '#ffd32a';

        // Outline / shadow
        ctx.fillStyle = dark; ctx.fillRect(x - 3, y - 10, 52, 30);

        // Chassis
        ctx.fillStyle = color; ctx.fillRect(x + 2, y + 2, 44, 12);
        ctx.fillStyle = shade; ctx.fillRect(x + 6, y + 4, 36, 8);
        ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(x + 8, y + 5, 12, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.20)'; ctx.fillRect(x + 32, y + 9, 10, 3);

        // Nose cone
        ctx.fillStyle = color; ctx.fillRect(x + 44, y + 4, 8, 8);
        ctx.fillStyle = stripe; ctx.fillRect(x + 46, y + 6, 4, 4);

        // Stripe + number plate
        ctx.fillStyle = stripe; ctx.fillRect(x + 16, y + 3, 14, 2);
        ctx.fillRect(x + 16, y + 11, 14, 2);
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(x + 22, y + 6, 8, 6);
        ctx.fillStyle = dark; ctx.fillRect(x + 24, y + 8, 4, 2);

        // Cabin / helmet bubble
        ctx.fillStyle = dark; ctx.fillRect(x + 18, y - 6, 18, 10);
        ctx.fillStyle = '#aee'; ctx.fillRect(x + 20, y - 4, 14, 6);
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x + 22, y - 3, 6, 2);

        // Rear wing (spoiler)
        ctx.fillStyle = dark; ctx.fillRect(x + 4, y - 8, 12, 4);
        ctx.fillStyle = stripe; ctx.fillRect(x + 5, y - 7, 10, 2);

        // Wheels + rims
        const wheel = (wx, wy) => {
            ctx.fillStyle = dark; ctx.fillRect(wx - 2, wy - 2, 12, 10);
            ctx.fillStyle = '#111827'; ctx.fillRect(wx, wy, 8, 6);
            ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(wx + 2, wy + 2, 4, 2);
        };
        wheel(x + 10, y + 12);
        wheel(x + 34, y + 12);

        // Exhaust glow
        ctx.fillStyle = 'rgba(255,211,42,0.55)'; ctx.fillRect(x + 0, y + 8, 3, 2);
        ctx.fillStyle = 'rgba(255,94,87,0.35)'; ctx.fillRect(x + 0, y + 10, 2, 2);

        // Name
        ctx.fillStyle = 'white'; ctx.font = 'bold 10px Inter'; ctx.textAlign = 'center';
        ctx.fillText(name.substring(0, 8), x + 24, y - 14);
    }

    function draw() {
        colorfulBg(ctx, 550, 300, Date.now() / 18, 5);
        // Road overlay
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, 550, 300);
        // Lanes
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.setLineDash([20, 15]);
        ctx.beginPath(); ctx.moveTo(0, 150); ctx.lineTo(550, 150); ctx.stroke(); ctx.setLineDash([]);
        // Lane backgrounds
        ctx.fillStyle = 'rgba(0,242,255,0.03)'; ctx.fillRect(0, 20, 550, 120);
        ctx.fillStyle = 'rgba(255,94,87,0.03)'; ctx.fillRect(0, 160, 550, 120);
        // Finish line
        for (let i = 0; i < 300; i += 20) {
            ctx.fillStyle = (Math.floor(i / 20) % 2 === 0) ? 'white' : 'black';
            ctx.fillRect(finishX, i, 15, 20);
        }
        // Cars
        drawCar(p1x, 65, '#00f2ff', players.p1);
        drawCar(p2x, 205, '#ff5e57', players.p2);
        // HUD
        ctx.fillStyle = '#9494b8'; ctx.font = '12px Inter'; ctx.textAlign = 'center';
        ctx.fillText(`${players.p1}: D tuşla | ${players.p2}: → tuşla`, 275, 295);
        ctx.fillStyle = '#ffd32a'; ctx.font = 'bold 13px Inter';
        ctx.fillText(`Süre: ${Math.max(0, Math.ceil(timeLeft))}s`, 275, 18);
        if (winner) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 110, 550, 80);
            ctx.fillStyle = '#ffd32a'; ctx.font = 'bold 30px Inter';
            ctx.fillText(winner === 'BERABERE' ? 'BERABERE!' : (winner + ' KAZANDI!'), 275, 160);
        }
    }
    draw();
    function handle(e) {
        if (done) return;
        if (e.key.toLowerCase() === 'd') { p1x += 14; sfx('click'); }
        if (e.key === 'ArrowRight') { p2x += 14; sfx('click'); }
        draw();
        if (p1x >= finishX - 40) { winner = players.p1; done = true; sfx('win'); draw(); clearInterval(timer); setTimeout(() => showReplay(container, players.p1 + ' Kazandı!', () => initRace(container, difficulty, players)), 600); }
        if (p2x >= finishX - 40) { winner = players.p2; done = true; sfx('win'); draw(); clearInterval(timer); setTimeout(() => showReplay(container, players.p2 + ' Kazandı!', () => initRace(container, difficulty, players)), 600); }
    }
    const keys = {};
    const touchP1 = mountTouch(container, keys, { dpad: false, buttons: [{ key: 'd', label: 'P1 TAP', className: 'primary' }] });
    const touchP2 = mountTouch(container, keys, { dpad: false, buttons: [{ key: 'ArrowRight', label: 'P2 TAP', className: 'primary' }] });
    const t = setInterval(()=>{
        if(done) return;
        if(keys['d']) { p1x += 14; keys['d']=false; sfx('click'); }
        if(keys['arrowright']||keys['ArrowRight']) { p2x += 14; keys['arrowright']=false; keys['ArrowRight']=false; sfx('click'); }
        if(p1x || p2x) draw();
        if (p1x >= finishX - 40 && !done) { winner = players.p1; done = true; sfx('win'); draw(); clearInterval(timer); setTimeout(() => showReplay(container, players.p1 + ' Kazandı!', () => initRace(container, difficulty, players)), 600); }
        if (p2x >= finishX - 40 && !done) { winner = players.p2; done = true; sfx('win'); draw(); clearInterval(timer); setTimeout(() => showReplay(container, players.p2 + ' Kazandı!', () => initRace(container, difficulty, players)), 600); }
    }, 60);
    const timer = setInterval(() => {
        if (done) return;
        timeLeft -= 1;
        if (timeLeft <= 0) {
            done = true;
            clearInterval(t);
            window.removeEventListener('keydown', handle);
            if (p1x === p2x) { winner = 'BERABERE'; sfx('draw'); }
            else { winner = p1x > p2x ? players.p1 : players.p2; sfx('win'); }
            draw();
            const msg = winner === 'BERABERE' ? 'Berabere!' : (winner + ' Kazandı!');
            setTimeout(() => showReplay(container, msg, () => initRace(container, difficulty, players)), 600);
        }
    }, 1000);
    window.addEventListener('keydown', handle);
    return () => { window.removeEventListener('keydown', handle); clearInterval(t); clearInterval(timer); touchP1.destroy?.(); touchP2.destroy?.(); };
}

// ============== SPACE SHOOTER — Pixel Art ==============
function initSpace(container, difficulty = 'medium') {
    container.innerHTML = `<canvas id="spaceCanvas" width="400" height="400"></canvas>`;
    const canvas=container.querySelector('#spaceCanvas'),ctx=pixelCtx(canvas.getContext('2d'));
    let shipX=180,bullets=[],enemies=[],score=0,dead=false,stars=[];
    const keys={};
    const touch = mountTouch(container, keys, { dpad: true, buttons: [{ key: ' ', label: 'ATEŞ', className: 'primary' }] });
    const config={'easy':{spawn:0.02,speed:1.2},'medium':{spawn:0.03,speed:1.8},'hard':{spawn:0.05,speed:2.5}}[difficulty] ?? {spawn:0.03,speed:1.8};
    // Generate stars
    for(let i=0;i<60;i++) stars.push({x:Math.random()*400,y:Math.random()*400,s:Math.random()*2+0.5});

    function drawShip(x) {
        // Pixel spaceship
        ctx.fillStyle='#aaa';var shipY=360;ctx.fillRect(x+16,shipY,8,6);
        ctx.fillStyle='#00f2ff';ctx.fillRect(x+8,shipY+6,24,14);
        ctx.fillStyle='#0088aa';ctx.fillRect(x+12,shipY+8,16,8);
        ctx.fillStyle='#00f2ff';ctx.fillRect(x,shipY+14,8,10);
        ctx.fillRect(x+32,shipY+14,8,10);
        ctx.fillStyle='#ff5e57';ctx.fillRect(x+4,shipY+24,4,6);
        ctx.fillRect(x+32,shipY+24,4,6);
        ctx.fillStyle='#ffd32a';ctx.fillRect(x+5,shipY+28,2,4);
        ctx.fillRect(x+33,shipY+28,2,4);
    }
    function drawMeteor(ex,ey) {
        // Pixel meteor
        ctx.fillStyle='#8b4513';ctx.fillRect(ex+4,ey,22,26);
        ctx.fillStyle='#a0522d';ctx.fillRect(ex,ey+4,30,18);
        // Craters
        ctx.fillStyle='#654321';ctx.fillRect(ex+6,ey+6,6,6);
        ctx.fillRect(ex+18,ey+12,8,6);
        ctx.fillStyle='#5a3a1a';ctx.fillRect(ex+10,ey+16,4,4);
        // Fire trail
        ctx.fillStyle='#ff6b6b';ctx.fillRect(ex+8,ey-4,4,4);
        ctx.fillRect(ex+16,ey-6,6,6);
        ctx.fillStyle='#ffd32a';ctx.fillRect(ex+12,ey-4,4,4);
    }

    function update(){
        if(dead)return;
        if(keys['a']&&shipX>0)shipX-=7;if(keys['d']&&shipX<360)shipX+=7;
        if(keys['arrowleft']&&shipX>0)shipX-=7;if(keys['arrowright']&&shipX<360)shipX+=7;
        if(keys[' ']&&bullets.length<8){bullets.push({x:shipX+18,y:360});keys[' ']=false; sfx('shoot');}
        bullets.forEach((b,i)=>{b.y-=9;if(b.y<0)bullets.splice(i,1);});
        if(Math.random()<config.spawn)enemies.push({x:Math.random()*370,y:-30});
        // Move stars
        stars.forEach(s=>{s.y+=s.s;if(s.y>400){s.y=0;s.x=Math.random()*400;}});
        for(let i=enemies.length-1;i>=0;i--){
            enemies[i].y+=config.speed;
            if(enemies[i].y>400){dead=true; sfx('lose'); clearInterval(interval);setTimeout(()=>showReplay(container,'Kaybettin! Skor: '+score,()=>initSpace(container,difficulty)),300);break;}
            for(let bi=bullets.length-1;bi>=0;bi--){
                if(bullets[bi]&&bullets[bi].x>enemies[i].x&&bullets[bi].x<enemies[i].x+30&&bullets[bi].y>enemies[i].y&&bullets[bi].y<enemies[i].y+30){
                    enemies.splice(i,1);bullets.splice(bi,1);score++; sfx('hit'); break;}
            }
        }
    }
    function draw(){
        // Bright space nebula background + starfield
        colorfulBg(ctx, 400, 400, Date.now() / 16, 17);
        ctx.fillStyle='rgba(0,0,0,0.55)';ctx.fillRect(0,0,400,400);
        ctx.fillStyle='white';stars.forEach(s=>{ctx.globalAlpha=0.35+s.s*0.25;ctx.fillRect(s.x,s.y,s.s>1.2?2:1,s.s>1.2?2:1);});ctx.globalAlpha=1;
        // Ship
        drawShip(shipX);
        // Bullets (pixel laser)
        bullets.forEach(b=>{ctx.fillStyle='#00f2ff';ctx.fillRect(b.x-1,b.y,2,10);ctx.fillStyle='#7000ff';ctx.fillRect(b.x,b.y,1,10);});
        // Enemies (pixel meteors)
        enemies.forEach(e=>drawMeteor(e.x,e.y));
        // HUD
        ctx.fillStyle='white';ctx.font='bold 16px Inter';ctx.fillText('⭐ Skor: '+score,10,25);
    }
    const interval=setInterval(()=>{update();draw();},30);
    const kd=(e)=>{keys[e.key.toLowerCase()]=true;};const ku=(e)=>{keys[e.key.toLowerCase()]=false;};
    window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);
    return()=>{clearInterval(interval);window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);touch.destroy?.();};
}

// ============== FLAPPY BIRD ==============
function initFlappy(container, difficulty = 'medium') {
    container.innerHTML = `<canvas id="flapCanvas" width="400" height="500"></canvas>`;
    const canvas=container.querySelector('#flapCanvas'),ctx=pixelCtx(canvas.getContext('2d'));
    let birdY=250,birdV=0,pipes=[],score=0,dead=false;
    const config={'easy':{gap:90,speed:2,freq:250},'medium':{gap:70,speed:4,freq:200},'hard':{gap:50,speed:6,freq:150}}[difficulty] ?? {gap:70,speed:4,freq:200};
    const keys = {};
    const touch = mountTouch(container, keys, { dpad: false, buttons: [{ key: ' ', label: 'ZIPLA', className: 'primary' }] });

    function update(){
        if(dead)return;
        birdV+=0.5;birdY+=birdV;
        if(pipes.length===0||pipes[pipes.length-1].x<config.freq)pipes.push({x:400,y:Math.random()*200+150,passed:false});
        pipes.forEach((p,i)=>{
            p.x-=config.speed;
            // score once when pipe passes bird
            if(!p.passed && p.x + 50 < 40){ p.passed=true; score++; sfx('point'); }
            if(p.x<-70){pipes.splice(i,1);}

            // robust AABB collision (prevents "ghost pass" or "late hit")
            const bx = 40, bw = 20, bh = 20;
            const birdTop = birdY - 10, birdBottom = birdY + 10;
            const pipeLeft = p.x, pipeRight = p.x + 50;
            const overlapX = (bx + bw) > pipeLeft && bx < pipeRight;
            if(overlapX){
                const gapTop = p.y - config.gap;
                const gapBottom = p.y + config.gap;
                const hit = birdTop < gapTop || birdBottom > gapBottom;
                if(hit){
                    dead=true; sfx('lose'); clearInterval(interval);
                    setTimeout(()=>showReplay(container,'Çakıldın! Skor: '+score,()=>initFlappy(container,difficulty)),300);
                }
            }
        });
        if(birdY>500||birdY<0){dead=true; sfx('lose'); clearInterval(interval);setTimeout(()=>showReplay(container,'Öldün! Skor: '+score,()=>initFlappy(container,difficulty)),300);}
    }
    function draw(){
        // cloud sky background
        const sky = ctx.createLinearGradient(0, 0, 0, 500);
        sky.addColorStop(0, '#87ceeb');
        sky.addColorStop(0.65, '#cfefff');
        sky.addColorStop(1, '#f7d794');
        ctx.fillStyle = sky; ctx.fillRect(0,0,400,500);
        for(let i=0;i<6;i++){
            const cx = (i*90 + (Date.now()/35)) % 520 - 60;
            const cy = 60 + (i%3)*30;
            ctx.fillStyle='rgba(255,255,255,0.70)';
            ctx.fillRect(cx,cy,44,14);
            ctx.fillRect(cx+16,cy-8,34,12);
            ctx.fillRect(cx+10,cy+10,38,10);
        }
        // Bird (pixel detailed)
        const bx = 40, by = birdY;
        ctx.fillStyle='#111827'; ctx.fillRect(bx-1,by-11,22,22);
        ctx.fillStyle='#fbc531'; ctx.fillRect(bx,by-10,20,20);
        ctx.fillStyle='#f9ca24'; ctx.fillRect(bx+2,by-8,16,16);
        ctx.fillStyle='white'; ctx.fillRect(bx+12,by-6,5,5);
        ctx.fillStyle='#000'; ctx.fillRect(bx+14,by-4,2,2);
        ctx.fillStyle='#e84118'; ctx.fillRect(bx+16,by,7,4);
        ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.fillRect(bx+3,by-7,6,4);
        // Wing
        ctx.fillStyle='#f5f6fa'; ctx.fillRect(bx+1,by+2,10,6);
        pipes.forEach(p=>{
            // pipes with realistic "holes" (mouths) + shading
            const topH = p.y - config.gap;
            const botY = p.y + config.gap;
            const botH = 500 - botY;
            // body
            ctx.fillStyle='#0b1020'; ctx.fillRect(p.x-2,0,54,topH+2);
            ctx.fillRect(p.x-2,botY-2,54,botH+4);
            ctx.fillStyle='#2f3542'; ctx.fillRect(p.x,0,50,topH);
            ctx.fillRect(p.x,botY,50,botH);
            ctx.fillStyle='rgba(255,255,255,0.10)';
            ctx.fillRect(p.x+6,0,6,topH);
            ctx.fillRect(p.x+6,botY,6,botH);
            // mouth rim (top)
            ctx.fillStyle='#111827'; ctx.fillRect(p.x-4,topH-18,58,18);
            ctx.fillStyle='#00f2ff'; ctx.fillRect(p.x-2,topH-16,54,14);
            ctx.fillStyle='#0b1020'; ctx.fillRect(p.x+4,topH-12,42,10); // hole
            ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(p.x+6,topH-15,18,3);
            // mouth rim (bottom)
            ctx.fillStyle='#111827'; ctx.fillRect(p.x-4,botY,58,18);
            ctx.fillStyle='#00f2ff'; ctx.fillRect(p.x-2,botY+2,54,14);
            ctx.fillStyle='#0b1020'; ctx.fillRect(p.x+4,botY+4,42,10); // hole
            ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(p.x+6,botY+3,18,3);
        });
        ctx.fillStyle='white';ctx.font='bold 24px Inter';ctx.fillText('Skor: '+score,10,35);
    }
    const interval=setInterval(()=>{update();draw();},30);
    const jump=()=>{if(!dead){birdV=-8;sfx('jump');}};
    const kHandler=(e)=>{if(e.key===' ')jump();};
    window.addEventListener('keydown',kHandler);
    const tap=()=>jump();
    canvas.onclick=tap;
    const touchLoop=setInterval(()=>{ if(keys[' ']){ keys[' ']=false; jump(); } }, 50);
    return()=>{clearInterval(interval);clearInterval(touchLoop);window.removeEventListener('keydown',kHandler);touch.destroy?.();};
}

// ============== TANK BATTLE ==============
function initTank(container, difficulty, players) {
    const W = 720, H = 480;
    container.innerHTML = `<canvas id="tankCanvas" width="${W}" height="${H}"></canvas>`;
    const canvas=container.querySelector('#tankCanvas'),ctx=pixelCtx(canvas.getContext('2d'));
    let t1={x:90,y:240,r:0,hp:3},t2={x:W-90,y:240,r:Math.PI,hp:3};
    let b1=[],b2=[],keys={},gameOver=false,winnerText='';
    let timeLeft = 90;
    // 5 random maps (walls layout). Pick one per game start.
    const MAPS = [
        // Map 1: Classic cross + side cover (more walls, not huge)
        [
            { x: 340, y: 80, w: 20, h: 120 },
            { x: 360, y: 280, w: 20, h: 120 },
            { x: 300, y: 220, w: 120, h: 20 },
            { x: 120, y: 120, w: 120, h: 18 },
            { x: 120, y: 340, w: 120, h: 18 },
            { x: 480, y: 120, w: 120, h: 18 },
            { x: 480, y: 340, w: 120, h: 18 },
            { x: 220, y: 200, w: 18, h: 90 },
            { x: 500, y: 200, w: 18, h: 90 }
        ],
        // Map 2: Three lanes with pillars
        [
            { x: 160, y: 110, w: 400, h: 18 },
            { x: 160, y: 230, w: 400, h: 18 },
            { x: 160, y: 350, w: 400, h: 18 },
            { x: 110, y: 170, w: 18, h: 140 },
            { x: 592, y: 170, w: 18, h: 140 },
            { x: 340, y: 150, w: 18, h: 80 },
            { x: 340, y: 250, w: 18, h: 80 },
            { x: 260, y: 190, w: 60, h: 18 },
            { x: 400, y: 290, w: 60, h: 18 }
        ],
        // Map 3: Box rooms (more cover)
        [
            { x: 140, y: 90, w: 18, h: 140 },
            { x: 140, y: 90, w: 160, h: 18 },
            { x: 140, y: 212, w: 160, h: 18 },
            { x: 560, y: 250, w: 18, h: 140 },
            { x: 420, y: 250, w: 160, h: 18 },
            { x: 420, y: 372, w: 160, h: 18 },
            { x: 320, y: 150, w: 80, h: 18 },
            { x: 320, y: 312, w: 80, h: 18 }
        ],
        // Map 4: Center fortress + side bumps
        [
            { x: 330, y: 110, w: 60, h: 18 },
            { x: 330, y: 352, w: 60, h: 18 },
            { x: 330, y: 128, w: 18, h: 224 },
            { x: 372, y: 128, w: 18, h: 224 },
            { x: 200, y: 240, w: 80, h: 18 },
            { x: 440, y: 240, w: 80, h: 18 },
            { x: 120, y: 160, w: 90, h: 18 },
            { x: 510, y: 300, w: 90, h: 18 }
        ],
        // Map 5: More open but with scattered small cover
        [
            { x: 352, y: 70, w: 16, h: 110 },
            { x: 352, y: 300, w: 16, h: 110 },
            { x: 160, y: 240, w: 120, h: 16 },
            { x: 440, y: 240, w: 120, h: 16 },
            { x: 260, y: 160, w: 70, h: 16 },
            { x: 390, y: 320, w: 70, h: 16 },
            { x: 90, y: 120, w: 60, h: 16 },
            { x: 570, y: 360, w: 60, h: 16 }
        ]
    ];
    const walls = MAPS[Math.floor(Math.random() * MAPS.length)];
    const touchP1 = mountTouch(container, keys, { dpad: false, buttons: [
        { key: 'w', label: 'P1 İLERİ', className: 'primary' },
        { key: 'a', label: 'P1 SOL', className: 'primary' },
        { key: 'd', label: 'P1 SAĞ', className: 'primary' },
        { key: 'q', label: 'P1 ATEŞ', className: 'danger' },
        { key: 's', label: 'P1 GERİ', className: 'primary' }
    ]});
    const touchP2 = mountTouch(container, keys, { dpad: true, buttons: [
        { key: 'Enter', label: 'P2 ATEŞ', className: 'danger' }
    ]});

    function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
    function collidesWall(x,y,r){for(let w of walls){if(x+r>w.x&&x-r<w.x+w.w&&y+r>w.y&&y-r<w.y+w.h)return true;}return false;}
    function bulletHitsWall(bx,by){for(let w of walls){if(bx>w.x&&bx<w.x+w.w&&by>w.y&&by<w.y+w.h)return true;}return false;}

    function update(){
        if(gameOver)return;
        let nx1=t1.x,ny1=t1.y;
        if(keys['w']){nx1+=Math.cos(t1.r)*3;ny1+=Math.sin(t1.r)*3;}
        if(keys['s']){nx1-=Math.cos(t1.r)*2;ny1-=Math.sin(t1.r)*2;}
        if(keys['a'])t1.r-=0.08;if(keys['d'])t1.r+=0.08;
        nx1=clamp(nx1,20,W-20);ny1=clamp(ny1,20,H-20);if(!collidesWall(nx1,ny1,15)){t1.x=nx1;t1.y=ny1;}

        let nx2=t2.x,ny2=t2.y;
        if(keys['ArrowUp']){nx2+=Math.cos(t2.r)*3;ny2+=Math.sin(t2.r)*3;}
        if(keys['ArrowDown']){nx2-=Math.cos(t2.r)*2;ny2-=Math.sin(t2.r)*2;}
        if(keys['ArrowLeft'])t2.r-=0.08;if(keys['ArrowRight'])t2.r+=0.08;
        nx2=clamp(nx2,20,W-20);ny2=clamp(ny2,20,H-20);if(!collidesWall(nx2,ny2,15)){t2.x=nx2;t2.y=ny2;}

        if(keys['q']&&b1.length<5){b1.push({x:t1.x+Math.cos(t1.r)*20,y:t1.y+Math.sin(t1.r)*20,r:t1.r});keys['q']=false;sfx('shoot');}
        if(keys['/']&&b2.length<5){b2.push({x:t2.x+Math.cos(t2.r)*20,y:t2.y+Math.sin(t2.r)*20,r:t2.r});keys['/']=false;sfx('shoot');}

        for(let i=b1.length-1;i>=0;i--){b1[i].x+=Math.cos(b1[i].r)*7;b1[i].y+=Math.sin(b1[i].r)*7;if(b1[i].x<0||b1[i].x>W||b1[i].y<0||b1[i].y>H||bulletHitsWall(b1[i].x,b1[i].y)){b1.splice(i,1);continue;}if(Math.hypot(b1[i].x-t2.x,b1[i].y-t2.y)<18){t2.hp--; sfx('hit'); b1.splice(i,1);if(t2.hp<=0){gameOver=true;winnerText=players.p1;}}}
        for(let i=b2.length-1;i>=0;i--){b2[i].x+=Math.cos(b2[i].r)*7;b2[i].y+=Math.sin(b2[i].r)*7;if(b2[i].x<0||b2[i].x>W||b2[i].y<0||b2[i].y>H||bulletHitsWall(b2[i].x,b2[i].y)){b2.splice(i,1);continue;}if(Math.hypot(b2[i].x-t1.x,b2[i].y-t1.y)<18){t1.hp--; sfx('hit'); b2.splice(i,1);if(t1.hp<=0){gameOver=true;winnerText=players.p2;}}}
    }
    function drawTank(t,color,name){
        ctx.save();ctx.translate(t.x,t.y);ctx.rotate(t.r);
        // realistic-ish pixel tank: tracks + hull + turret + barrel
        const outline = '#0b1020';
        const track = '#1e272e';
        const metal = '#2b2f3a';
        const shade = 'rgba(255,255,255,0.12)';
        const shadow = 'rgba(0,0,0,0.22)';

        // tracks (top & bottom)
        ctx.fillStyle = outline; ctx.fillRect(-20,-22,40,10); ctx.fillRect(-20,12,40,10);
        ctx.fillStyle = track; ctx.fillRect(-18,-20,36,6); ctx.fillRect(-18,14,36,6);
        // track wheels
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        for(let i=-14;i<=10;i+=6){ ctx.fillRect(i, -18, 3, 2); ctx.fillRect(i, 16, 3, 2); }

        // hull
        ctx.fillStyle = outline; ctx.fillRect(-18,-14,36,28);
        ctx.fillStyle = color; ctx.fillRect(-16,-12,32,24);
        ctx.fillStyle = shade; ctx.fillRect(-13,-10,12,4);
        ctx.fillStyle = shadow; ctx.fillRect(4,6,10,6);
        // side armor plate
        ctx.fillStyle = metal; ctx.fillRect(-10,4,20,6);
        ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(-8,5,8,2);

        // turret base
        ctx.fillStyle = outline; ctx.fillRect(-10,-10,20,20);
        ctx.fillStyle = color === '#00f2ff' ? '#00c4cc' : '#cc3333';
        ctx.fillRect(-8,-8,16,16);
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(-6,-6,6,3);
        // hatch
        ctx.fillStyle = outline; ctx.fillRect(-3,-3,6,6);
        ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-2,-2,4,2);

        // barrel (with muzzle)
        ctx.fillStyle = outline; ctx.fillRect(6,-3,20,6);
        ctx.fillStyle = '#dfe6e9'; ctx.fillRect(7,-2,18,4);
        ctx.fillStyle = outline; ctx.fillRect(22,-4,6,8);
        ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(10,-1,8,2);

        ctx.restore();
        ctx.fillStyle='white';ctx.font='bold 11px Inter';ctx.textAlign='center';ctx.fillText(name,t.x,t.y-26);
        ctx.fillStyle='rgba(255,255,255,0.10)';ctx.fillRect(t.x-16,t.y-22,32,4);
        ctx.fillStyle=t.hp>1?'#2ed573':'#ff4757';ctx.fillRect(t.x-16,t.y-22,(t.hp/3)*32,4);
    }
    function draw(){
        colorfulBg(ctx, W, H, Date.now() / 18, 10);
        ctx.fillStyle='rgba(0,0,0,0.55)';ctx.fillRect(0,0,W,H);
        for(let i=0;i<W;i+=40){ctx.strokeStyle='rgba(255,255,255,0.03)';ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,H);ctx.stroke();}
        for(let i=0;i<H;i+=40){ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(W,i);ctx.stroke();}
        walls.forEach(w=>{ctx.fillStyle='#4a4a6a';ctx.fillRect(w.x,w.y,w.w,w.h);ctx.strokeStyle='#7000ff';ctx.lineWidth=1;ctx.strokeRect(w.x,w.y,w.w,w.h);});
        drawTank(t1,'#00f2ff',players.p1);drawTank(t2,'#ff5e57',players.p2);
        ctx.shadowBlur=6;ctx.shadowColor='#ffd32a';ctx.fillStyle='#ffd32a';
        b1.forEach(b=>{ctx.beginPath();ctx.arc(b.x,b.y,4,0,Math.PI*2);ctx.fill();});
        b2.forEach(b=>{ctx.beginPath();ctx.arc(b.x,b.y,4,0,Math.PI*2);ctx.fill();});ctx.shadowBlur=0;
        ctx.fillStyle='#9494b8';ctx.font='12px Inter';ctx.textAlign='center';ctx.fillText(`${players.p1}: WASD+Q | ${players.p2}: Oklar+/`,W/2,H-10);
        ctx.fillStyle='#ffd32a';ctx.font='bold 13px Inter';ctx.fillText(`Süre: ${Math.max(0, Math.ceil(timeLeft))}s`,W/2,18);
    }
    const interval=setInterval(()=>{
        update();draw();
        if(gameOver&&!gameHandled){
            gameHandled=true;clearInterval(interval);
            clearInterval(timer);
            sfx('win');
            setTimeout(()=>showReplay(container,winnerText+' Kazandı!',()=>initTank(container,difficulty,players)),400);
        }
    },20);
    let gameHandled=false;
    const timer = setInterval(() => {
        if (gameOver) return;
        timeLeft -= 1;
        if (timeLeft <= 0) {
            gameOver = true;
            clearInterval(interval);
            clearInterval(timer);
            if (t1.hp === t2.hp) {
                sfx('draw');
                setTimeout(() => showReplay(container, 'BERABERE!', () => initTank(container, difficulty, players)), 450);
            } else {
                sfx('win');
                const w = t1.hp > t2.hp ? players.p1 : players.p2;
                setTimeout(() => showReplay(container, `${w} Kazandı!`, () => initTank(container, difficulty, players)), 450);
            }
        }
    }, 1000);
    const kd=(e)=>{e.preventDefault();if(e.key.startsWith('Arrow')||e.key==='/')keys[e.key]=true;else keys[e.key.toLowerCase()]=true;};
    const ku=(e)=>{if(e.key.startsWith('Arrow')||e.key==='/')keys[e.key]=false;else keys[e.key.toLowerCase()]=false;};
    window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);
    return()=>{clearInterval(interval); clearInterval(timer); window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);touchP1.destroy?.();touchP2.destroy?.();};
}

// ============== NEW GAMES (10) ==============
function initBreakout(container, difficulty = 'medium') {
    container.innerHTML = `<canvas id="breakoutCanvas" width="520" height="420"></canvas>`;
    const canvas = container.querySelector('#breakoutCanvas');
    const ctx = pixelCtx(canvas.getContext('2d'));
    const keys = {};
    const touch = mountTouch(container, keys, { dpad: true, buttons: [] });

    let paddle = { x: 220, y: 390, w: 90, h: 10, vx: 0 };
    let ball = { x: 260, y: 300, vx: 3.2, vy: -3.6, r: 5 };
    let score = 0;
    let over = false;
    const drops = [];
    let slowUntil = 0;
    let expandUntil = 0;
    let shield = 0;

    const cfg = {
        easy: { rows: 4, speed: 0.95 },
        medium: { rows: 5, speed: 1.0 },
        hard: { rows: 6, speed: 1.08 }
    }[difficulty] ?? { rows: 5, speed: 1.0 };

    const bricks = [];
    const cols = 10;
    const bw = 44, bh = 14, gap = 6, startX = 18, startY = 40;
    for (let r = 0; r < cfg.rows; r++) {
        for (let c = 0; c < cols; c++) {
            // difficulty-specific brick variants
            let hp = 1;
            let type = 'glass';
            if (difficulty === 'easy') {
                hp = r < 3 ? 1 : 2;
                type = hp === 1 ? 'glass' : 'solid';
            } else if (difficulty === 'hard') {
                hp = r < 2 ? 2 : (r < 4 ? 3 : 2);
                type = hp === 3 ? 'steel' : 'solid';
            } else {
                hp = r < 2 ? 1 : 2;
                type = hp === 1 ? 'glass' : 'solid';
            }
            bricks.push({ x: startX + c * (bw + gap), y: startY + r * (bh + gap), w: bw, h: bh, alive: true, hp, type });
        }
    }

    function drawPaddle() {
        // pixel paddle with "launcher" look
        ctx.fillStyle = '#0b1020'; ctx.fillRect(paddle.x - 2, paddle.y - 3, paddle.w + 4, paddle.h + 6);
        ctx.fillStyle = '#00f2ff'; ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(paddle.x + 6, paddle.y + 2, 18, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.20)'; ctx.fillRect(paddle.x + paddle.w - 22, paddle.y + 5, 14, 3);
        // center cannon / emitter
        ctx.fillStyle = '#111827'; ctx.fillRect(paddle.x + paddle.w / 2 - 10, paddle.y - 6, 20, 6);
        ctx.fillStyle = '#7000ff'; ctx.fillRect(paddle.x + paddle.w / 2 - 6, paddle.y - 5, 12, 4);
        ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(paddle.x + paddle.w / 2 - 4, paddle.y - 4, 6, 2);
        if (shield > 0) {
            ctx.fillStyle = 'rgba(255,211,42,0.25)';
            ctx.fillRect(paddle.x - 6, paddle.y - 16, paddle.w + 12, 4);
        }
    }

    function drawBall() {
        ctx.fillStyle = '#111827'; ctx.fillRect(ball.x - ball.r - 2, ball.y - ball.r - 2, ball.r * 2 + 4, ball.r * 2 + 4);
        ctx.fillStyle = '#ffd32a'; ctx.fillRect(ball.x - ball.r, ball.y - ball.r, ball.r * 2, ball.r * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(ball.x - 2, ball.y - 2, 2, 2);
    }

    function drawBricks() {
        bricks.forEach((b) => {
            if (!b.alive) return;
            ctx.fillStyle = '#0b1020'; ctx.fillRect(b.x - 1, b.y - 1, b.w + 2, b.h + 2);
            if (b.type === 'steel') ctx.fillStyle = '#8395a7';
            else if (b.type === 'solid') ctx.fillStyle = '#7000ff';
            else ctx.fillStyle = '#00f2ff';
            ctx.fillRect(b.x, b.y, b.w, b.h);
            ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(b.x + 4, b.y + 3, b.w - 8, 3);
            if (b.type === 'steel') {
                ctx.fillStyle = 'rgba(0,0,0,0.20)'; ctx.fillRect(b.x + 6, b.y + 7, b.w - 12, 3);
            }
        });
    }

    function collideRectCircle(rx, ry, rw, rh, cx, cy, cr) {
        const px = Math.max(rx, Math.min(cx, rx + rw));
        const py = Math.max(ry, Math.min(cy, ry + rh));
        const dx = cx - px, dy = cy - py;
        return (dx * dx + dy * dy) <= cr * cr;
    }

    function update() {
        if (over) return;
        const now = Date.now();
        paddle.w = (now < expandUntil) ? 130 : 90;
        // input
        const left = keys['ArrowLeft'] || keys['arrowleft'];
        const right = keys['ArrowRight'] || keys['arrowright'];
        paddle.vx = (left ? -1 : 0) + (right ? 1 : 0);
        paddle.x += paddle.vx * 7;
        paddle.x = Math.max(12, Math.min(520 - 12 - paddle.w, paddle.x));

        // ball move
        const sp = (now < slowUntil) ? 0.72 : 1.0;
        ball.x += ball.vx * cfg.speed * sp;
        ball.y += ball.vy * cfg.speed * sp;

        if (ball.x < 10 || ball.x > 510) { ball.vx *= -1; sfx('hit'); }
        if (ball.y < 10) { ball.vy *= -1; sfx('hit'); }
        if (ball.y > 415) {
            if (shield > 0) {
                shield -= 1;
                ball.y = 410;
                ball.vy = -Math.abs(ball.vy) * 0.95;
                sfx('hit');
            } else {
                over = true; sfx('lose');
                clearInterval(loop);
                setTimeout(() => showReplay(container, `Kaybettin! Skor: ${score}`, () => initBreakout(container, difficulty)), 350);
                return;
            }
        }

        // paddle bounce
        if (collideRectCircle(paddle.x, paddle.y, paddle.w, paddle.h, ball.x, ball.y, ball.r) && ball.vy > 0) {
            const hitPos = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
            ball.vx = hitPos * 5.2;
            ball.vy *= -1;
            sfx('hit');
        }

        // bricks
        for (const b of bricks) {
            if (!b.alive) continue;
            if (collideRectCircle(b.x, b.y, b.w, b.h, ball.x, ball.y, ball.r)) {
                ball.vy *= -1;
                b.hp -= 1;
                sfx('hit');
                if (b.hp <= 0) {
                    b.alive = false;
                    score += 10;
                    sfx('point');
                    // random powerups
                    if (Math.random() < 0.18) {
                        const types = ['expand', 'slow', 'shield'];
                        const type = types[Math.floor(Math.random() * types.length)];
                        drops.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, vy: 2.4, type });
                        sfx('coin');
                    }
                }
                break;
            }
        }

        // drops
        for (let i = drops.length - 1; i >= 0; i--) {
            const d = drops[i];
            d.y += d.vy;
            // catch
            if (d.y > paddle.y - 6 && d.y < paddle.y + paddle.h + 8 && d.x > paddle.x && d.x < paddle.x + paddle.w) {
                if (d.type === 'expand') expandUntil = now + 10000;
                if (d.type === 'slow') slowUntil = now + 9000;
                if (d.type === 'shield') shield = Math.min(2, shield + 1);
                sfx('point');
                drops.splice(i, 1);
                continue;
            }
            if (d.y > 440) drops.splice(i, 1);
        }

        if (bricks.every((b) => !b.alive)) {
            over = true; sfx('win');
            clearInterval(loop);
            setTimeout(() => showReplay(container, `Kazandın! Skor: ${score}`, () => initBreakout(container, difficulty)), 350);
        }
    }

    function draw() {
        colorfulBg(ctx, 520, 420, Date.now() / 16, 12);
        // soften with a dark glass overlay for readability
        ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, 520, 420);

        drawBricks();
        // drops
        drops.forEach((d) => {
            ctx.fillStyle = '#0b1020'; ctx.fillRect(d.x - 10, d.y - 10, 20, 20);
            if (d.type === 'expand') ctx.fillStyle = '#00f2ff';
            else if (d.type === 'slow') ctx.fillStyle = '#7000ff';
            else ctx.fillStyle = '#ffd32a';
            ctx.fillRect(d.x - 8, d.y - 8, 16, 16);
            ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(d.x - 5, d.y - 6, 6, 3);
            ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.font = 'bold 10px Inter'; ctx.textAlign = 'center';
            ctx.fillText(d.type === 'expand' ? 'E' : (d.type === 'slow' ? 'S' : 'K'), d.x, d.y + 4);
        });
        drawPaddle();
        drawBall();

        ctx.fillStyle = 'white'; ctx.font = 'bold 14px Inter'; ctx.textAlign = 'left';
        ctx.fillText(`Skor: ${score}`, 14, 22);
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = '12px Inter';
        const now = Date.now();
        ctx.fillText(`Güç: ${(now < expandUntil) ? 'GENİŞ' : (now < slowUntil) ? 'YAVAŞ' : (shield > 0) ? `KALKAN x${shield}` : '-'}`, 14, 40);
    }

    const kd = (e) => { keys[e.key] = true; keys[e.key.toLowerCase()] = true; };
    const ku = (e) => { keys[e.key] = false; keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    const loop = setInterval(() => { update(); draw(); }, 16);
    return () => { clearInterval(loop); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); touch.destroy?.(); };
}

function initDodger(container, difficulty = 'medium') {
    container.innerHTML = `<canvas id="dodgerCanvas" width="420" height="520"></canvas>`;
    const canvas = container.querySelector('#dodgerCanvas');
    const ctx = pixelCtx(canvas.getContext('2d'));
    const keys = {};
    const touch = mountTouch(container, keys, { dpad: true, buttons: [] });

    const cfg = { easy: { spawn: 0.025, spd: 2.0 }, medium: { spawn: 0.035, spd: 2.6 }, hard: { spawn: 0.05, spd: 3.2 } }[difficulty] ?? { spawn: 0.035, spd: 2.6 };

    let px = 200, py = 470, pr = 9;
    let t = 0;
    let score = 0;
    let over = false;
    const blocks = [];

    function spawn() {
        // fall as colorful "meteors / candies" (not plain blocks)
        const w = 16 + Math.floor(Math.random() * 18);
        const palette = ['#ff5e57', '#ffd32a', '#2ed573', '#54a0ff', '#f368e0', '#00f2ff'];
        const hue = palette[Math.floor(Math.random() * palette.length)];
        const kind = Math.random() < 0.5 ? 'meteor' : 'candy';
        blocks.push({ x: Math.random() * (420 - w), y: -40, w, h: w, vy: cfg.spd + Math.random() * 2.2, hue, kind, t: Math.random() * 100 });
    }

    function hit(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function update() {
        if (over) return;
        t += 1;
        if (Math.random() < cfg.spawn) spawn();

        const left = keys['ArrowLeft'] || keys['arrowleft'];
        const right = keys['ArrowRight'] || keys['arrowright'];
        px += (right ? 1 : 0) * 5.8 + (left ? -1 : 0) * 5.8;
        px = Math.max(16, Math.min(420 - 16, px));

        for (let i = blocks.length - 1; i >= 0; i--) {
            blocks[i].y += blocks[i].vy;
            if (blocks[i].y > 560) { blocks.splice(i, 1); score += 1; if (score % 8 === 0) sfx('point'); continue; }
        }

        const player = { x: px - pr, y: py - pr, w: pr * 2, h: pr * 2 };
        for (const b of blocks) {
            const blk = { x: b.x, y: b.y, w: b.w, h: b.h };
            if (hit(player, blk)) {
                over = true; sfx('lose');
                clearInterval(loop);
                setTimeout(() => showReplay(container, `Yakalandın! Skor: ${score}`, () => initDodger(container, difficulty)), 350);
                break;
            }
        }
    }

    function drawPlayer() {
        // little runner character (hoodie) — not just a square
        const x = px, y = py;
        const outline = '#0b1020';
        const hoodie = '#7000ff';
        const hoodie2 = '#2d3436';
        const skin = '#f5d6b4';
        // shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x - 12, y + 14, 24, 4);
        // legs
        ctx.fillStyle = outline; ctx.fillRect(x - 9, y + 2, 7, 12); ctx.fillRect(x + 2, y + 2, 7, 12);
        ctx.fillStyle = hoodie2; ctx.fillRect(x - 8, y + 3, 5, 10); ctx.fillRect(x + 3, y + 3, 5, 10);
        // torso
        ctx.fillStyle = outline; ctx.fillRect(x - 11, y - 10, 22, 16);
        ctx.fillStyle = hoodie; ctx.fillRect(x - 10, y - 9, 20, 14);
        ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(x - 7, y - 8, 8, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x - 10, y - 1, 20, 4);
        // head + hood
        ctx.fillStyle = outline; ctx.fillRect(x - 9, y - 24, 18, 14);
        ctx.fillStyle = hoodie2; ctx.fillRect(x - 8, y - 23, 16, 12);
        ctx.fillStyle = skin; ctx.fillRect(x - 5, y - 20, 10, 8);
        // eyes
        ctx.fillStyle = '#111827'; ctx.fillRect(x - 3, y - 17, 2, 2); ctx.fillRect(x + 1, y - 17, 2, 2);
        // scarf accent
        ctx.fillStyle = '#ffd32a'; ctx.fillRect(x - 10, y - 6, 20, 2);
    }

    function draw() {
        // Static background: sky + ground (no animation)
        const sky = ctx.createLinearGradient(0, 0, 0, 360);
        sky.addColorStop(0, '#87ceeb');
        sky.addColorStop(1, '#cfefff');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, 420, 520);

        // Clouds (static)
        const clouds = [
            { x: 40, y: 70, w: 70 },
            { x: 140, y: 40, w: 90 },
            { x: 270, y: 85, w: 80 },
            { x: 310, y: 45, w: 70 }
        ];
        clouds.forEach((c) => {
            ctx.fillStyle = 'rgba(255,255,255,0.80)';
            ctx.fillRect(c.x, c.y, c.w, 16);
            ctx.fillRect(c.x + 18, c.y - 10, Math.floor(c.w * 0.55), 14);
            ctx.fillRect(c.x + 10, c.y + 10, Math.floor(c.w * 0.65), 12);
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            ctx.fillRect(c.x + 8, c.y + 4, Math.floor(c.w * 0.55), 6);
        });

        // Ground (soil) at the bottom where the player stands
        const groundY = 430;
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(0, groundY, 420, 90);
        // soil texture (static)
        for (let y = groundY; y < 520; y += 18) {
            for (let x = 0; x < 420; x += 18) {
                const n = (x * 13 + y * 17) % 11;
                ctx.fillStyle = n < 3 ? 'rgba(0,0,0,0.14)' : 'rgba(0,0,0,0.07)';
                ctx.fillRect(x + 2, y + 4, 7, 3);
                ctx.fillStyle = n === 4 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)';
                ctx.fillRect(x + 10, y + 10, 3, 2);
            }
        }
        // grass edge line
        ctx.fillStyle = 'rgba(46,213,115,0.20)';
        ctx.fillRect(0, groundY, 420, 3);

        // grass tufts + flowers (static)
        for (let x = 8; x < 420; x += 18) {
            const n = (x * 19) % 7;
            const gx = x + ((n % 3) - 1);
            // grass
            ctx.fillStyle = n % 2 === 0 ? 'rgba(46,213,115,0.40)' : 'rgba(30,180,95,0.35)';
            ctx.fillRect(gx, groundY - 6, 2, 6);
            ctx.fillRect(gx + 3, groundY - 4, 2, 4);
            if (n === 3) { ctx.fillRect(gx + 6, groundY - 5, 2, 5); }
            // flowers
            if (n === 1 || n === 5) {
                const fy = groundY - 8;
                ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(gx + 9, fy + 2, 4, 4);
                ctx.fillStyle = (n === 1) ? '#ff5e57' : '#f368e0';
                ctx.fillRect(gx + 10, fy + 3, 2, 2);
                ctx.fillStyle = '#ffd32a';
                ctx.fillRect(gx + 11, fy + 4, 1, 1);
                // stem
                ctx.fillStyle = 'rgba(46,213,115,0.45)'; ctx.fillRect(gx + 10, fy + 6, 1, 3);
            }
        }

        blocks.forEach((b) => {
            const wob = Math.sin((Date.now() / 140) + b.t) * 1.2;
            if (b.kind === 'meteor') {
                // meteor shard
                ctx.fillStyle = '#0b1020'; ctx.fillRect(b.x - 3, b.y - 3, b.w + 6, b.h + 6);
                ctx.fillStyle = b.hue; ctx.fillRect(b.x, b.y, b.w, b.h);
                ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(b.x + 3, b.y + 2, Math.max(4, b.w - 10), 3);
                ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(b.x + 3, b.y + b.h - 6, Math.max(4, b.w - 10), 3);
                // trail
                ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(b.x + Math.floor(b.w/2) - 1, b.y - 10, 2, 10);
                ctx.fillStyle = 'rgba(255,94,87,0.12)'; ctx.fillRect(b.x + Math.floor(b.w/2) - 2, b.y - 18, 4, 8);
            } else {
                // candy orb (rounded)
                ctx.fillStyle = '#0b1020'; ctx.fillRect(b.x - 3, b.y - 3, b.w + 6, b.h + 6);
                ctx.fillStyle = b.hue; ctx.fillRect(b.x + 2, b.y, b.w - 4, b.h);
                ctx.fillRect(b.x, b.y + 2, b.w, b.h - 4);
                // shine
                ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(b.x + 4, b.y + 3, 6, 3);
                // stripes
                ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.fillRect(b.x + 3, b.y + Math.floor(b.h/2) + wob, b.w - 6, 2);
            }
        });

        drawPlayer();

        ctx.fillStyle = 'white'; ctx.font = 'bold 14px Inter';
        ctx.fillText(`Skor: ${score}`, 14, 22);
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = '12px Inter';
        ctx.fillText(`Süre: ${Math.floor(t / 60)}s`, 14, 40);
    }

    const kd = (e) => { keys[e.key] = true; keys[e.key.toLowerCase()] = true; };
    const ku = (e) => { keys[e.key] = false; keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    const loop = setInterval(() => { update(); draw(); }, 16);
    return () => { clearInterval(loop); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); touch.destroy?.(); };
}

function initInvaders(container, difficulty = 'medium') {
    container.innerHTML = `<canvas id="invCanvas" width="520" height="420"></canvas>`;
    const canvas = container.querySelector('#invCanvas');
    const ctx = pixelCtx(canvas.getContext('2d'));
    const keys = {};
    const touch = mountTouch(container, keys, { dpad: true, buttons: [{ key: ' ', label: 'ATEŞ', className: 'primary' }] });
    // make bosses harder overall; hard mode: bosses take less damage, but drop rewards to compensate
    const cfg = { easy: { spd: 1.6, rate: 0.017, bossHp: 95, bossDmg: 1.0 }, medium: { spd: 2.0, rate: 0.024, bossHp: 135, bossDmg: 1.0 }, hard: { spd: 2.4, rate: 0.034, bossHp: 175, bossDmg: 0.45 } }[difficulty] ?? { spd: 2.0, rate: 0.024, bossHp: 135, bossDmg: 1.0 };

    let shipX = 250;
    let playerBullets = [];
    let enemyBullets = [];
    let enemies = [];
    let score = 0;
    let lives = 3;
    let shield = 0;
    let laserShots = 0; // one-time shots
    let dmgBoostUntil = 0; // temporary extra damage
    let tick = 0;
    let over = false;
    let boss = null;
    let bossStage = 0; // 0..2 => 3 bosses
    let bossesDefeated = 0;
    const rewards = [];

    function spawnWave() {
        enemies = [];
        const rows = 3, cols = 9;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                enemies.push({ x: 60 + c * 44, y: 50 + r * 32, w: 20, h: 14, alive: true, t: Math.random() * 10 });
            }
        }
    }
    spawnWave();

    function spawnBoss() {
        const stages = [
            { kind: 'crab', w: 90, h: 46, hp: cfg.bossHp, rate: cfg.rate * 1.4, spd: 1.4 },
            { kind: 'ufo', w: 110, h: 42, hp: Math.round(cfg.bossHp * 1.25), rate: cfg.rate * 1.7, spd: 1.7 },
            { kind: 'mech', w: 120, h: 56, hp: Math.round(cfg.bossHp * 1.55), rate: cfg.rate * 2.0, spd: 1.25 }
        ];
        const st = stages[Math.min(2, bossStage)];
        // harder: scale boss hp slightly by cycle count
        const extra = Math.floor(bossesDefeated * 18);
        boss = { kind: st.kind, x: 260, y: 70, w: st.w, h: st.h, hp: st.hp, max: st.hp, dir: 1, rate: st.rate, spd: st.spd, phase: 0, dropTick: 0 };
        boss.hp += extra; boss.max += extra;
        bossStage = (bossStage + 1) % 3;
        sfx('start');
    }

    function drawShip() {
        const y = 372;
        // more detailed pixel ship
        ctx.fillStyle = '#0b1020'; ctx.fillRect(shipX - 26, y - 16, 52, 32);
        ctx.fillStyle = '#00f2ff'; ctx.fillRect(shipX - 22, y - 12, 44, 24);
        ctx.fillStyle = '#008b8b'; ctx.fillRect(shipX - 16, y - 8, 32, 16);
        // cockpit
        ctx.fillStyle = '#0b1020'; ctx.fillRect(shipX - 8, y - 20, 16, 10);
        ctx.fillStyle = '#aee'; ctx.fillRect(shipX - 6, y - 18, 12, 6);
        ctx.fillStyle = 'rgba(255,255,255,0.20)'; ctx.fillRect(shipX - 5, y - 17, 5, 2);
        // wings
        ctx.fillStyle = '#7000ff'; ctx.fillRect(shipX - 30, y - 6, 10, 16);
        ctx.fillRect(shipX + 20, y - 6, 10, 16);
        ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(shipX - 28, y - 4, 6, 3);
        // engine glow
        ctx.fillStyle = '#ffd32a'; ctx.fillRect(shipX - 3, y + 10, 6, 8);
        ctx.fillStyle = 'rgba(255,94,87,0.35)'; ctx.fillRect(shipX - 2, y + 16, 4, 3);
    }

    function drawEnemy(e) {
        const wob = Math.sin((tick + e.t) / 14) * 2;
        // more detailed invader sprite
        ctx.fillStyle = '#0b1020'; ctx.fillRect(e.x - 3, e.y - 3, 26, 20);
        ctx.fillStyle = '#ff5e57'; ctx.fillRect(e.x, e.y, 20, 14);
        ctx.fillStyle = '#b33939'; ctx.fillRect(e.x + 2, e.y + 2, 16, 10);
        // eyes
        ctx.fillStyle = '#111827'; ctx.fillRect(e.x + 4, e.y + 4, 4, 4);
        ctx.fillRect(e.x + 12, e.y + 4, 4, 4);
        ctx.fillStyle = 'white'; ctx.fillRect(e.x + 5, e.y + 5, 2, 2); ctx.fillRect(e.x + 13, e.y + 5, 2, 2);
        // teeth
        ctx.fillStyle = '#0b1020'; ctx.fillRect(e.x + 6, e.y + 10, 8, 2);
        // highlight
        ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(e.x + 3, e.y + 2, 7, 2);
        e.x += wob * 0.0; // keep deterministic; wob only visual
    }

    function hitRect(ax, ay, aw, ah, bx, by, bw, bh) {
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    }

    function drawBoss(b) {
        // Detailed pixel boss sprites
        const x = b.x - b.w / 2, y = b.y - b.h / 2;
        ctx.fillStyle = '#0b1020'; ctx.fillRect(x - 4, y - 4, b.w + 8, b.h + 8);
        if (b.kind === 'crab') {
            ctx.fillStyle = '#ff5e57'; ctx.fillRect(x, y + 10, b.w, b.h - 10);
            ctx.fillStyle = '#b33939'; ctx.fillRect(x + 6, y + 16, b.w - 12, b.h - 24);
            ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(x + 8, y + 14, b.w - 16, 4);
            // eyes
            ctx.fillStyle = '#111827'; ctx.fillRect(x + 22, y + 18, 12, 10); ctx.fillRect(x + b.w - 34, y + 18, 12, 10);
            ctx.fillStyle = 'white'; ctx.fillRect(x + 25, y + 20, 6, 6); ctx.fillRect(x + b.w - 31, y + 20, 6, 6);
            // claws
            ctx.fillStyle = '#7000ff'; ctx.fillRect(x + 6, y + 4, 18, 12); ctx.fillRect(x + b.w - 24, y + 4, 18, 12);
        } else if (b.kind === 'ufo') {
            ctx.fillStyle = '#54a0ff'; ctx.fillRect(x + 10, y + 18, b.w - 20, 20);
            ctx.fillStyle = '#00f2ff'; ctx.fillRect(x + 22, y + 10, b.w - 44, 12);
            ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x + 26, y + 12, 20, 4);
            // lights
            for (let i = 0; i < 6; i++) {
                ctx.fillStyle = i % 2 ? '#ffd32a' : '#f368e0';
                ctx.fillRect(x + 18 + i * 14, y + 40, 6, 6);
            }
        } else {
            // mech
            ctx.fillStyle = '#10ac84'; ctx.fillRect(x + 16, y + 14, b.w - 32, b.h - 18);
            ctx.fillStyle = '#00f2ff'; ctx.fillRect(x + 30, y + 6, b.w - 60, 12);
            ctx.fillStyle = '#111827'; ctx.fillRect(x + 26, y + 22, 14, 14); ctx.fillRect(x + b.w - 40, y + 22, 14, 14);
            ctx.fillStyle = '#ffd32a'; ctx.fillRect(x + 10, y + 18, 10, 26); ctx.fillRect(x + b.w - 20, y + 18, 10, 26);
            ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x + 22, y + 34, b.w - 44, 10);
        }
        // HP bar
        ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(14, 34, 492, 8);
        ctx.fillStyle = '#ffd32a'; ctx.fillRect(14, 34, (b.hp / b.max) * 492, 8);
        ctx.fillStyle = 'white'; ctx.font = 'bold 12px Inter'; ctx.textAlign = 'left';
        ctx.fillText(`BOSS`, 14, 28);
    }

    function update() {
        if (over) return;
        tick++;
        const left = keys['ArrowLeft'] || keys['arrowleft'];
        const right = keys['ArrowRight'] || keys['arrowright'];
        shipX += (right ? 1 : 0) * 6 + (left ? -1 : 0) * 6;
        shipX = Math.max(30, Math.min(490, shipX));

        if ((keys[' '] || keys['space']) && playerBullets.length < 5) {
            const isLaser = laserShots > 0;
            if (isLaser) laserShots -= 1;
            playerBullets.push({ x: shipX - (isLaser ? 2 : 1), y: 360, w: isLaser ? 4 : 2, h: isLaser ? 14 : 10, vy: -9, laser: isLaser });
            keys[' '] = keys['space'] = false;
            sfx('shoot');
        }

        playerBullets.forEach((b) => b.y += b.vy);
        playerBullets = playerBullets.filter((b) => b.y > -20);
        enemyBullets.forEach((b) => b.y += b.vy);
        enemyBullets = enemyBullets.filter((b) => b.y < 460);

        // enemy drift down (disabled during boss)
        if (!boss) enemies.forEach((e) => { if (e.alive) e.y += cfg.spd * 0.02; });

        // random enemy shots
        if (!boss && Math.random() < cfg.rate) {
            const alive = enemies.filter((e) => e.alive);
            if (alive.length) {
                const e = alive[Math.floor(Math.random() * alive.length)];
                enemyBullets.push({ x: e.x + 9, y: e.y + 12, w: 2, h: 10, vy: 6 });
            }
        }

        // boss movement + shooting
        if (boss) {
            boss.phase += 1;
            boss.dropTick += 1;
            boss.x += boss.dir * boss.spd;
            if (boss.x < 90) { boss.x = 90; boss.dir = 1; }
            if (boss.x > 430) { boss.x = 430; boss.dir = -1; }
            // attacks
            if (Math.random() < boss.rate) {
                const bx = boss.x;
                const by = boss.y + boss.h / 2;
                if (boss.kind === 'ufo') {
                    enemyBullets.push({ x: bx - 14, y: by, w: 3, h: 12, vy: 7 });
                    enemyBullets.push({ x: bx + 14, y: by, w: 3, h: 12, vy: 7 });
                } else if (boss.kind === 'mech') {
                    enemyBullets.push({ x: bx, y: by, w: 4, h: 14, vy: 8 });
                    if (boss.phase % 30 === 0) enemyBullets.push({ x: bx + (Math.random() * 40 - 20), y: by, w: 2, h: 10, vy: 9 });
                } else {
                    enemyBullets.push({ x: bx, y: by, w: 3, h: 12, vy: 7 });
                }
            }
        }

        // collisions
        for (let i = playerBullets.length - 1; i >= 0; i--) {
            const b = playerBullets[i];
            // hit boss
            if (boss && hitRect(b.x, b.y, b.w, b.h, boss.x - boss.w / 2, boss.y - boss.h / 2, boss.w, boss.h)) {
                playerBullets.splice(i, 1);
                const mult = (Date.now() < dmgBoostUntil) ? 1.8 : 1.0;
                const laserMult = b.laser ? 2.2 : 1.0;
                boss.hp -= cfg.bossDmg * mult * laserMult;
                score += 3;
                sfx('hit');
                // rewards drop sometimes while damaging boss
                if (boss.dropTick % 12 === 0 && Math.random() < 0.32) {
                    const roll = Math.random();
                    const type = roll < 0.38 ? 'shield' : (roll < 0.62 ? 'life' : (roll < 0.82 ? 'laser' : 'boost'));
                    rewards.push({ x: boss.x + (Math.random() * 40 - 20), y: boss.y + boss.h / 2, vy: 2.3, type });
                    sfx('coin');
                }
                if (boss.hp <= 0) {
                    sfx('win');
                    boss = null;
                    bossesDefeated += 1;
                    // after 3 bosses -> win screen (do not restart)
                    if (bossesDefeated >= 3) {
                        over = true;
                        clearInterval(loop);
                        setTimeout(() => showReplay(container, `KAZANDIN! Skor: ${score}`, () => initInvaders(container, difficulty)), 450);
                        return;
                    }
                    // next wave
                    spawnWave();
                }
                continue;
            }
            // hit normal enemies
            for (const e of enemies) {
                if (!e.alive) continue;
                if (hitRect(b.x, b.y, b.w, b.h, e.x, e.y, 20, 14)) {
                    e.alive = false;
                    playerBullets.splice(i, 1);
                    score += 12;
                    sfx('hit');
                    break;
                }
            }
        }

        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const b = enemyBullets[i];
            if (hitRect(b.x, b.y, b.w, b.h, shipX - 18, 362, 36, 20)) {
                enemyBullets.splice(i, 1);
                if (shield > 0) { shield -= 1; sfx('hit'); }
                else { lives -= 1; sfx('hit'); }
                if (lives <= 0) {
                    over = true; sfx('lose');
                    clearInterval(loop);
                    setTimeout(() => showReplay(container, `Kaybettin! Skor: ${score}`, () => initInvaders(container, difficulty)), 350);
                    return;
                }
            }
        }

        // rewards collect
        for (let i = rewards.length - 1; i >= 0; i--) {
            rewards[i].y += rewards[i].vy;
            if (hitRect(rewards[i].x - 8, rewards[i].y - 8, 16, 16, shipX - 22, 352, 44, 30)) {
                const t = rewards[i].type;
                if (t === 'life') lives = Math.min(5, lives + 1);
                if (t === 'shield') shield = Math.min(3, shield + 1);
                if (t === 'laser') { laserShots = Math.min(6, laserShots + 2); }
                if (t === 'boost') { dmgBoostUntil = Date.now() + 8000; }
                rewards.splice(i, 1);
                sfx('point');
                continue;
            }
            if (rewards[i].y > 460) rewards.splice(i, 1);
        }

        if (!boss && enemies.every((e) => !e.alive)) {
            // boss time
            spawnBoss();
        }
    }

    function draw() {
        colorfulBg(ctx, 520, 420, tick, 14);
        ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.fillRect(0, 0, 520, 420);

        enemies.forEach((e) => { if (e.alive) drawEnemy(e); });
        if (boss) drawBoss(boss);

        // rewards
        rewards.forEach((r) => {
            ctx.fillStyle = '#0b1020'; ctx.fillRect(r.x - 10, r.y - 10, 20, 20);
            ctx.fillStyle = r.type === 'life' ? '#2ed573' : (r.type === 'shield' ? '#ffd32a' : (r.type === 'laser' ? '#54a0ff' : '#ff5e57'));
            ctx.fillRect(r.x - 8, r.y - 8, 16, 16);
            ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(r.x - 5, r.y - 6, 6, 3);
            if (r.type === 'life') {
                ctx.fillStyle = '#0b1020'; ctx.fillRect(r.x - 2, r.y - 4, 4, 10); ctx.fillRect(r.x - 5, r.y - 1, 10, 4);
            } else if (r.type === 'shield') {
                ctx.fillStyle = '#0b1020'; ctx.fillRect(r.x - 4, r.y - 2, 8, 8);
                ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(r.x - 2, r.y, 4, 2);
            } else if (r.type === 'laser') {
                ctx.fillStyle = '#0b1020'; ctx.fillRect(r.x - 1, r.y - 6, 2, 12);
                ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(r.x - 4, r.y - 2, 8, 4);
            } else {
                // boost
                ctx.fillStyle = '#0b1020'; ctx.fillRect(r.x - 4, r.y - 4, 8, 8);
                ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(r.x - 2, r.y - 2, 4, 4);
            }
        });

        playerBullets.forEach((b) => {
            ctx.fillStyle = b.laser ? '#ffd32a' : '#00f2ff';
            ctx.fillRect(b.x, b.y, b.w, b.h);
            ctx.fillStyle = b.laser ? 'rgba(255,255,255,0.22)' : 'rgba(112,0,255,0.4)';
            ctx.fillRect(b.x + 1, b.y, Math.max(1, b.w - 2), 2);
        });
        enemyBullets.forEach((b) => {
            ctx.fillStyle = '#ff5e57';
            ctx.fillRect(b.x, b.y, b.w, b.h);
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(b.x + 1, b.y, 1, b.h);
        });

        drawShip();

        ctx.fillStyle = 'white'; ctx.font = 'bold 14px Inter';
        ctx.fillText(`Skor: ${score}`, 14, 22);
        ctx.fillStyle = '#ffd32a';
        ctx.fillText(`Can: ${lives}`, 440, 22);
        if (shield > 0) { ctx.fillStyle = '#ffd32a'; ctx.font = '12px Inter'; ctx.fillText(`Kalkan: ${shield}`, 440, 40); }
        if (laserShots > 0) { ctx.fillStyle = '#ffd32a'; ctx.font = '12px Inter'; ctx.fillText(`Lazer: ${laserShots}`, 440, 58); }
        if (Date.now() < dmgBoostUntil) { ctx.fillStyle = '#2ed573'; ctx.font = '12px Inter'; ctx.fillText(`Güç +`, 440, 76); }
        if (boss) {
            ctx.fillStyle = '#ffd32a';
            ctx.fillText(`Boss: ${boss.kind.toUpperCase()}`, 300, 22);
        }
    }

    const kd = (e) => { keys[e.key] = true; keys[e.key.toLowerCase()] = true; };
    const ku = (e) => { keys[e.key] = false; keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    const loop = setInterval(() => { update(); draw(); }, 16);
    return () => { clearInterval(loop); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); touch.destroy?.(); };
}

function initMaze(container, difficulty = 'medium') {
    // Bigger canvas so penguin + exit can be more detailed
    container.innerHTML = `<canvas id="mazeCanvas" width="640" height="520"></canvas>`;
    const canvas = container.querySelector('#mazeCanvas');
    const ctx = pixelCtx(canvas.getContext('2d'));
    const keys = {};
    const touch = mountTouch(container, keys, { dpad: true, buttons: [] });

    const cfg = { easy: { size: 15 }, medium: { size: 17 }, hard: { size: 19 } }[difficulty] ?? { size: 17 };
    const N = cfg.size;
    const cell = Math.floor(460 / N);
    const ox = 90, oy = 40;

    // Simple randomized maze (DFS)
    const grid = Array.from({ length: N }, () => Array.from({ length: N }, () => ({ v: false, w: [1, 1, 1, 1] }))); // walls: [top,right,bottom,left]
    function carve(x, y) {
        grid[y][x].v = true;
        const dirs = [[0, -1, 0, 2], [1, 0, 1, 3], [0, 1, 2, 0], [-1, 0, 3, 1]].sort(() => Math.random() - 0.5);
        for (const [dx, dy, w1, w2] of dirs) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
            if (grid[ny][nx].v) continue;
            grid[y][x].w[w1] = 0;
            grid[ny][nx].w[w2] = 0;
            carve(nx, ny);
        }
    }
    carve(0, 0);

    let px = 0, py = 0;
    const gx = N - 1, gy = N - 1;
    let over = false;

    function tryMove(dx, dy) {
        if (over) return;
        const nx = px + dx, ny = py + dy;
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) return;
        // walls check
        if (dx === 1 && grid[py][px].w[1]) return;
        if (dx === -1 && grid[py][px].w[3]) return;
        if (dy === 1 && grid[py][px].w[2]) return;
        if (dy === -1 && grid[py][px].w[0]) return;
        px = nx; py = ny; sfx('click');
        if (px === gx && py === gy) {
            over = true; sfx('win');
            clearInterval(loop);
            setTimeout(() => showReplay(container, 'Çıkışı Buldun!', () => initMaze(container, difficulty)), 350);
        }
    }

    function update() {
        if (keys['arrowup'] || keys['ArrowUp']) { keys['arrowup'] = keys['ArrowUp'] = false; tryMove(0, -1); }
        else if (keys['arrowdown'] || keys['ArrowDown']) { keys['arrowdown'] = keys['ArrowDown'] = false; tryMove(0, 1); }
        else if (keys['arrowleft'] || keys['ArrowLeft']) { keys['arrowleft'] = keys['ArrowLeft'] = false; tryMove(-1, 0); }
        else if (keys['arrowright'] || keys['ArrowRight']) { keys['arrowright'] = keys['ArrowRight'] = false; tryMove(1, 0); }
    }

    function draw() {
        colorfulBg(ctx, 640, 520, Date.now() / 14, 15);
        // maze background panel
        ctx.fillStyle = 'rgba(10,10,25,0.7)'; ctx.fillRect(ox - 10, oy - 10, cell * N + 20, cell * N + 20);

        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 2;
        for (let y = 0; y < N; y++) {
            for (let x = 0; x < N; x++) {
                const cx = ox + x * cell, cy = oy + y * cell;
                const w = grid[y][x].w;
                if (w[0]) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + cell, cy); ctx.stroke(); }
                if (w[1]) { ctx.beginPath(); ctx.moveTo(cx + cell, cy); ctx.lineTo(cx + cell, cy + cell); ctx.stroke(); }
                if (w[2]) { ctx.beginPath(); ctx.moveTo(cx, cy + cell); ctx.lineTo(cx + cell, cy + cell); ctx.stroke(); }
                if (w[3]) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + cell); ctx.stroke(); }
            }
        }

        // goal exit (realistic-ish pixel door)
        const ex = ox + gx * cell, ey = oy + gy * cell;
        ctx.fillStyle = '#0b1020'; ctx.fillRect(ex + 2, ey + 2, cell - 4, cell - 4);
        ctx.fillStyle = '#6c5ce7'; ctx.fillRect(ex + 4, ey + 6, cell - 8, cell - 10);
        ctx.fillStyle = '#5f27cd'; ctx.fillRect(ex + 6, ey + 10, cell - 12, cell - 14);
        // arch highlight
        ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(ex + 7, ey + 8, cell - 14, 3);
        // handle
        ctx.fillStyle = '#ffd32a'; ctx.fillRect(ex + cell - 12, ey + Math.floor(cell / 2), 4, 4);

        // player penguin (full-body pixel)
        const sx = ox + px * cell, sy = oy + py * cell;
        const px0 = sx + Math.floor(cell / 2);
        const py0 = sy + Math.floor(cell / 2) + 2;
        // outline
        ctx.fillStyle = '#0b1020'; ctx.fillRect(px0 - 8, py0 - 12, 16, 22);
        // body
        ctx.fillStyle = '#111827'; ctx.fillRect(px0 - 7, py0 - 11, 14, 20);
        // belly
        ctx.fillStyle = '#dfe6e9'; ctx.fillRect(px0 - 5, py0 - 7, 10, 14);
        ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(px0 - 4, py0 - 6, 5, 3);
        // head mask
        ctx.fillStyle = '#111827'; ctx.fillRect(px0 - 7, py0 - 13, 14, 6);
        // eyes
        ctx.fillStyle = 'white'; ctx.fillRect(px0 - 4, py0 - 10, 3, 3); ctx.fillRect(px0 + 1, py0 - 10, 3, 3);
        ctx.fillStyle = '#0b1020'; ctx.fillRect(px0 - 3, py0 - 9, 1, 1); ctx.fillRect(px0 + 2, py0 - 9, 1, 1);
        // beak
        ctx.fillStyle = '#ffd32a'; ctx.fillRect(px0 - 1, py0 - 7, 2, 3);
        ctx.fillStyle = '#f368e0'; ctx.fillRect(px0 - 6, py0 - 4, 2, 2); ctx.fillRect(px0 + 4, py0 - 4, 2, 2);
        // feet
        ctx.fillStyle = '#ff9f43'; ctx.fillRect(px0 - 6, py0 + 9, 5, 3); ctx.fillRect(px0 + 1, py0 + 9, 5, 3);

        ctx.fillStyle = '#9494b8'; ctx.font = '12px Inter';
        ctx.fillText('Çıkış: mor kapı', 14, 22);
    }

    const kd = (e) => { keys[e.key] = true; keys[e.key.toLowerCase()] = true; e.preventDefault(); };
    window.addEventListener('keydown', kd);
    const loop = setInterval(() => { update(); draw(); }, 40);
    return () => { clearInterval(loop); window.removeEventListener('keydown', kd); touch.destroy?.(); };
}

function initLockpick(container, difficulty = 'medium') {
    container.innerHTML = `<canvas id="lockCanvas" width="520" height="420"></canvas>`;
    const canvas = container.querySelector('#lockCanvas');
    const ctx = pixelCtx(canvas.getContext('2d'));
    const keys = {};
    const touch = mountTouch(container, keys, { dpad: false, buttons: [
        { key: ' ', label: 'AÇ', className: 'danger' }
    ]});

    const cfg = {
        easy: { speed: 2.0, win: 5 },
        medium: { speed: 2.8, win: 6 },
        hard: { speed: 3.6, win: 7 }
    }[difficulty] ?? { speed: 2.8, win: 6 };
    // auto-moving key position + player insertion
    let keyX = 260;
    const keyYStart = 350;
    let keyY = keyYStart;
    let inserting = false;
    let hits = 0;
    let tries = 0;
    let fails = 0; // only failed attempts count (2 hakkın var)
    let over = false;
    let target = 260 + (Math.random() * 120 - 60);
    let dir = Math.random() < 0.5 ? -1 : 1;

    function resetTarget() {
        target = 260 + (Math.random() * 180 - 90);
    }

    function attempt(isSuccess) {
        if (over) return;
        tries++;
        if (isSuccess) {
            hits++;
            sfx('coin');
            resetTarget();
        } else {
            fails++;
            sfx('hit');
        }
        // End immediately when remaining rights reach 0 (don't allow -1)
        if (fails >= 2 && hits < cfg.win) {
            over = true; sfx('lose');
            clearInterval(loop);
            setTimeout(() => showReplay(container, `Hakkın Bitti! (${hits}/${cfg.win})`, () => initLockpick(container, difficulty)), 350);
            return;
        }
        if (hits >= cfg.win) {
            over = true; sfx('win');
            clearInterval(loop);
            setTimeout(() => showReplay(container, `Açıldı! Deneme: ${tries}`, () => initLockpick(container, difficulty)), 350);
        }
    }

    function update() {
        if (over) return;
        // auto-move key left/right (player only times the insertion)
        if (!inserting) {
            keyX += dir * cfg.speed * 2.2;
            if (keyX <= 120) { keyX = 120; dir = 1; }
            if (keyX >= 400) { keyX = 400; dir = -1; }
        }

        // start/continue inserting with space
        if ((keys[' '] || keys['space']) && !inserting) {
            inserting = true;
            sfx('click');
        }
        if (inserting) {
            keyY -= 6.5;
            // tip position
            const tipX = keyX;
            const tipY = keyY - 60;
            // keyhole geometry
            const khX = target, khY = 235;
            const slotW = 12, slotH = 18;
            const aligned = Math.abs(tipX - khX) < (slotW / 2 + 4);
            const reached = tipY <= (khY + slotH / 2);
            if (reached) {
                // success only if aligned when reaching the slot
                attempt(aligned);
                inserting = false;
                keyY = keyYStart;
                keys[' '] = keys['space'] = false;
            }
            // stuck if pushed too far while misaligned
            if (!aligned && tipY < (khY - 16)) {
                attempt(false);
                inserting = false;
                keyY = keyYStart;
                keys[' '] = keys['space'] = false;
            }
        }
    }

    function draw() {
        colorfulBg(ctx, 520, 420, Date.now() / 16, 16);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, 520, 420);
        // lock plate (metal + screws + brushed texture)
        ctx.fillStyle = '#0b1020'; ctx.fillRect(66, 86, 388, 258);
        ctx.fillStyle = '#3b3f4a'; ctx.fillRect(70, 90, 380, 250);
        ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(78, 98, 364, 6);
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(78, 330, 364, 6);
        // brushed lines
        for (let y = 92; y < 338; y += 6) {
            const a = 0.06 + ((y / 6) % 2) * 0.02;
            ctx.fillStyle = `rgba(255,255,255,${a})`;
            ctx.fillRect(74, y, 372, 1);
        }
        // screws
        const screw = (sx, sy) => {
            ctx.fillStyle = '#0b1020'; ctx.fillRect(sx - 7, sy - 7, 14, 14);
            ctx.fillStyle = '#8395a7'; ctx.fillRect(sx - 6, sy - 6, 12, 12);
            ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(sx - 4, sy - 1, 8, 2);
            ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(sx - 1, sy - 4, 2, 8);
        };
        screw(92, 112); screw(428, 112); screw(92, 328); screw(428, 328);

        // keyhole (target) — detailed + clearly shows where the TIP goes
        const khX = target, khY = 235;
        ctx.fillStyle = '#0b1020'; ctx.fillRect(khX - 30, khY - 36, 60, 82);
        ctx.fillStyle = '#b2bec3'; ctx.fillRect(khX - 28, khY - 34, 56, 78);
        ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(khX - 22, khY - 30, 18, 4);
        ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(khX + 8, khY + 16, 16, 22);
        // slot outline
        ctx.fillStyle = '#111827';
        ctx.fillRect(khX - 10, khY - 18, 20, 34);
        ctx.fillStyle = '#05050a';
        ctx.fillRect(khX - 7, khY - 15, 14, 28);
        // inner glow
        ctx.fillStyle = 'rgba(0,242,255,0.14)';
        ctx.fillRect(khX - 6, khY - 14, 12, 10);
        // tiny chamfer
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(khX - 28, khY + 34, 56, 6);

        // moving key (player controlled) — TIP goes into slot (more detailed)
        const kx = keyX, ky = keyY;
        // head / ring (bottom, where you hold)
        ctx.fillStyle = '#0b1020'; ctx.fillRect(kx - 20, ky - 8, 40, 26);
        ctx.fillStyle = '#ffd32a'; ctx.fillRect(kx - 18, ky - 6, 36, 22);
        // ring hole
        ctx.fillStyle = '#0b1020'; ctx.fillRect(kx - 7, ky + 1, 14, 12);
        ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(kx - 16, ky - 4, 10, 3);
        // engraved marks
        ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(kx - 14, ky + 6, 6, 2); ctx.fillRect(kx + 8, ky + 6, 6, 2);
        // shaft up
        ctx.fillStyle = '#0b1020'; ctx.fillRect(kx - 8, ky - 62, 16, 58);
        ctx.fillStyle = '#ffd32a'; ctx.fillRect(kx - 6, ky - 60, 12, 54);
        ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(kx - 4, ky - 58, 4, 20);
        ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(kx + 2, ky - 44, 3, 14);
        // tip (top) shaped to match slot
        ctx.fillStyle = '#0b1020'; ctx.fillRect(kx - 7, ky - 70, 14, 10);
        ctx.fillStyle = '#caa21a'; ctx.fillRect(kx - 6, ky - 69, 12, 8);
        // tooth profile (more steps)
        ctx.fillStyle = '#0b1020';
        ctx.fillRect(kx - 5, ky - 69, 10, 2);
        ctx.fillRect(kx - 4, ky - 67, 8, 2);
        ctx.fillRect(kx - 3, ky - 65, 6, 2);
        ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(kx - 4, ky - 68, 6, 1);
        // guide line to slot (helps player)
        ctx.fillStyle = 'rgba(0,242,255,0.08)'; ctx.fillRect(kx - 1, ky - 74, 2, 90);

        // HUD
        ctx.fillStyle = 'white'; ctx.font = 'bold 14px Inter';
        ctx.fillText(`Başarı: ${hits}/${cfg.win}`, 90, 130);
        ctx.fillStyle = '#ff5e57'; ctx.font = 'bold 12px Inter';
        ctx.fillText(`Hata Hakkı: ${Math.max(0, 2 - fails)}`, 90, 150);
        ctx.fillStyle = '#9494b8'; ctx.font = '12px Inter';
        ctx.fillText('Anahtar otomatik hareket eder — Boşluk ile sok', 90, 170);
    }

    const kd = (e) => { keys[e.key] = true; keys[e.key.toLowerCase()] = true; };
    window.addEventListener('keydown', kd);
    canvas.addEventListener('pointerdown', () => { keys[' '] = true; });
    const loop = setInterval(() => { update(); draw(); }, 16);
    return () => { clearInterval(loop); window.removeEventListener('keydown', kd); touch.destroy?.(); };
}

function initDuel(container, difficulty, players) {
    container.innerHTML = `<canvas id="duelCanvas" width="640" height="420"></canvas>`;
    const canvas = container.querySelector('#duelCanvas');
    const ctx = pixelCtx(canvas.getContext('2d'));
    const keys = {};
    const touchP1 = mountTouch(container, keys, { dpad: false, buttons: [
        { key: 'w', label: 'P1 ↑', className: 'primary' },
        { key: 'a', label: 'P1 ←', className: 'primary' },
        { key: 's', label: 'P1 ↓', className: 'primary' },
        { key: 'd', label: 'P1 →', className: 'primary' },
        { key: 'q', label: 'P1 ATEŞ', className: 'danger' }
    ]});
    const touchP2 = mountTouch(container, keys, { dpad: true, buttons: [
        { key: 'Enter', label: 'P2 ATEŞ', className: 'danger' },
        { key: '/', label: 'P2 ALT', className: 'danger' }
    ]});

    let p1 = { x: 120, y: 210, hp: 5 };
    let p2 = { x: 520, y: 210, hp: 5 };
    let bullets = [];
    let over = false;
    let timeLeft = 60;
    let freeze = 0;
    const walls = [
        { x: 294, y: 60, w: 52, h: 70 },
        { x: 294, y: 290, w: 52, h: 70 },
        { x: 160, y: 180, w: 70, h: 26 },
        { x: 410, y: 214, w: 70, h: 26 }
    ];

    function hitRect(ax, ay, aw, ah, bx, by, bw, bh) {
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    }

    function collidesWall(x, y) {
        const box = { x: x - 14, y: y - 14, w: 28, h: 28 };
        for (const w of walls) {
            if (hitRect(box.x, box.y, box.w, box.h, w.x, w.y, w.w, w.h)) return true;
        }
        return false;
    }

    function fire(from, dir, owner) {
        bullets.push({ x: from.x, y: from.y, vx: dir * 7, vy: 0, owner });
        sfx('shoot');
    }

    function update() {
        if (over) return;
        // movement
        const sp1 = 4.1, sp2 = 4.1;
        let nx1 = p1.x, ny1 = p1.y;
        if (keys['w']) ny1 -= sp1;
        if (keys['s']) ny1 += sp1;
        if (keys['a']) nx1 -= sp1;
        if (keys['d']) nx1 += sp1;
        nx1 = Math.max(20, Math.min(620, nx1));
        ny1 = Math.max(30, Math.min(390, ny1));
        if (!collidesWall(nx1, ny1)) { p1.x = nx1; p1.y = ny1; }

        let nx2 = p2.x, ny2 = p2.y;
        if (keys['ArrowUp'] || keys['arrowup']) ny2 -= sp2;
        if (keys['ArrowDown'] || keys['arrowdown']) ny2 += sp2;
        if (keys['ArrowLeft'] || keys['arrowleft']) nx2 -= sp2;
        if (keys['ArrowRight'] || keys['arrowright']) nx2 += sp2;
        nx2 = Math.max(20, Math.min(620, nx2));
        ny2 = Math.max(30, Math.min(390, ny2));
        if (!collidesWall(nx2, ny2)) { p2.x = nx2; p2.y = ny2; }

        // fire
        if (keys['q']) { keys['q'] = false; fire(p1, 1, 1); }
        if (keys['Enter'] || keys['enter'] || keys['']) { keys['Enter'] = keys['enter'] = keys[''] = false; fire(p2, -1, 2); }

        // bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.x += b.vx; b.y += b.vy;
            if (b.x < -20 || b.x > 660) { bullets.splice(i, 1); continue; }
            // wall hits
            let hitWall = false;
            for (const w of walls) {
                if (hitRect(b.x - 2, b.y - 2, 4, 4, w.x, w.y, w.w, w.h)) { hitWall = true; break; }
            }
            if (hitWall) { bullets.splice(i, 1); sfx('hit'); continue; }
            const hitP1 = (b.owner === 2) && Math.abs(b.x - p1.x) < 14 && Math.abs(b.y - p1.y) < 14;
            const hitP2 = (b.owner === 1) && Math.abs(b.x - p2.x) < 14 && Math.abs(b.y - p2.y) < 14;
            if (hitP1) { bullets.splice(i, 1); p1.hp--; sfx('hit'); }
            if (hitP2) { bullets.splice(i, 1); p2.hp--; sfx('hit'); }
        }

        if (p1.hp <= 0 || p2.hp <= 0) {
            over = true;
            clearInterval(loop);
            clearInterval(timer);
            sfx('win');
            const winner = p1.hp > 0 ? players.p1 : players.p2;
            setTimeout(() => showReplay(container, `${winner} Kazandı!`, () => initDuel(container, difficulty, players)), 350);
        }
    }

    function drawSoldier(p, uniform, name, side) {
        // Pixel detailed soldier (white vs black)
        const u = uniform;
        const outline = '#0b1020';
        const skin = '#f5d6b4';
        const vest = side === 1 ? '#b8c6db' : '#2d3436';
        const accent = side === 1 ? '#ffd32a' : '#00f2ff';

        // body box
        ctx.fillStyle = outline; ctx.fillRect(p.x - 18, p.y - 20, 36, 40);
        ctx.fillStyle = u; ctx.fillRect(p.x - 16, p.y - 18, 32, 36);
        // helmet
        ctx.fillStyle = outline; ctx.fillRect(p.x - 14, p.y - 22, 28, 10);
        ctx.fillStyle = side === 1 ? '#f5f6fa' : '#111827'; ctx.fillRect(p.x - 13, p.y - 21, 26, 8);
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(p.x - 10, p.y - 20, 10, 2);
        // face
        ctx.fillStyle = skin; ctx.fillRect(p.x - 8, p.y - 10, 16, 12);
        ctx.fillStyle = outline; ctx.fillRect(p.x - 5, p.y - 7, 3, 3); ctx.fillRect(p.x + 2, p.y - 7, 3, 3);
        // vest / chest
        ctx.fillStyle = vest; ctx.fillRect(p.x - 12, p.y + 2, 24, 14);
        ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(p.x - 10, p.y + 4, 8, 3);
        ctx.fillStyle = accent; ctx.fillRect(p.x - 2, p.y + 6, 4, 4);
        // legs
        ctx.fillStyle = side === 1 ? '#dfe6e9' : '#1e272e';
        ctx.fillRect(p.x - 10, p.y + 16, 8, 8);
        ctx.fillRect(p.x + 2, p.y + 16, 8, 8);
        // rifle
        const dir = side === 1 ? 1 : -1;
        ctx.fillStyle = outline; ctx.fillRect(p.x + dir * 8, p.y + 6, dir * 16, 4);
        ctx.fillStyle = '#dfe6e9'; ctx.fillRect(p.x + dir * 8, p.y + 7, dir * 10, 2);

        ctx.fillStyle = 'white'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center';
        ctx.fillText(name.substring(0, 9), p.x, p.y - 26);
    }

    function draw() {
        colorfulBg(ctx, 640, 420, Date.now() / 18, 6);
        // arena walls
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(12, 24, 616, 384);
        ctx.fillStyle = '#0b1020';
        ctx.fillRect(16, 28, 608, 376);

        // neon center line
        ctx.fillStyle = 'rgba(0,242,255,0.12)'; ctx.fillRect(318, 28, 4, 376);

        // walls (cover)
        walls.forEach((w) => {
            ctx.fillStyle = '#4a4a6a'; ctx.fillRect(w.x, w.y, w.w, w.h);
            ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(w.x + 4, w.y + 6, w.w - 8, 3);
            ctx.strokeStyle = 'rgba(0,242,255,0.22)'; ctx.lineWidth = 2; ctx.strokeRect(w.x, w.y, w.w, w.h);
        });

        bullets.forEach((b) => {
            ctx.fillStyle = b.owner === 1 ? '#ffd32a' : '#00f2ff';
            ctx.fillRect(b.x - 2, b.y - 2, 4, 4);
            ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(b.x - 1, b.y - 4, 2, 2);
        });

        drawSoldier(p1, '#f5f6fa', players.p1, 1);
        drawSoldier(p2, '#111827', players.p2, 2);

        // HP
        ctx.textAlign = 'left';
        ctx.fillStyle = '#f5f6fa'; ctx.font = 'bold 14px Inter';
        ctx.fillText(`${players.p1} HP: ${p1.hp}`, 24, 18);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#111827';
        ctx.fillText(`${players.p2} HP: ${p2.hp}`, 616, 18);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd32a';
        ctx.fillText(`Süre: ${Math.max(0, Math.ceil(timeLeft))}s`, 320, 18);
    }

    // Robust key mapping (fixes cases where e.key differs by layout/browser)
    const setKey = (name, v) => {
        if (!name) return;
        keys[name] = v;
        if (typeof name === 'string') keys[name.toLowerCase()] = v;
    };
    const kd = (e) => {
        setKey(e.key, true);
        setKey(e.code, true);
        // normalize common codes
        if (e.code === 'ArrowUp') setKey('ArrowUp', true);
        if (e.code === 'ArrowDown') setKey('ArrowDown', true);
        if (e.code === 'ArrowLeft') setKey('ArrowLeft', true);
        if (e.code === 'ArrowRight') setKey('ArrowRight', true);
        if (e.code === 'KeyW') setKey('w', true);
        if (e.code === 'KeyA') setKey('a', true);
        if (e.code === 'KeyS') setKey('s', true);
        if (e.code === 'KeyD') setKey('d', true);
        e.preventDefault();
    };
    const ku = (e) => {
        setKey(e.key, false);
        setKey(e.code, false);
        if (e.code === 'ArrowUp') setKey('ArrowUp', false);
        if (e.code === 'ArrowDown') setKey('ArrowDown', false);
        if (e.code === 'ArrowLeft') setKey('ArrowLeft', false);
        if (e.code === 'ArrowRight') setKey('ArrowRight', false);
        if (e.code === 'KeyW') setKey('w', false);
        if (e.code === 'KeyA') setKey('a', false);
        if (e.code === 'KeyS') setKey('s', false);
        if (e.code === 'KeyD') setKey('d', false);
    };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    const timer = setInterval(() => {
        if (over) return;
        timeLeft -= 1;
        if (timeLeft <= 0) {
            over = true;
            clearInterval(loop);
            clearInterval(timer);
            if (p1.hp === p2.hp) {
                sfx('draw');
                setTimeout(() => showReplay(container, 'BERABERE!', () => initDuel(container, difficulty, players)), 350);
            } else {
                sfx('win');
                const winner = p1.hp > p2.hp ? players.p1 : players.p2;
                setTimeout(() => showReplay(container, `${winner} Kazandı!`, () => initDuel(container, difficulty, players)), 350);
            }
        }
    }, 1000);
    const loop = setInterval(() => { update(); draw(); }, 16);
    return () => { clearInterval(loop); clearInterval(timer); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); touchP1.destroy?.(); touchP2.destroy?.(); };
}

function initTag(container, difficulty, players) {
    // 5 random maps (few walls, larger feel). Pick one per game start.
    const MAPS = [
        // Map 1: open street + moderate cover (5 walls)
        { w: 1080, h: 660, runner: { x: 150, y: 150 }, chaser: { x: 930, y: 520 }, obstacles: [
            { x: 420, y: 240, w: 160, h: 18 },
            { x: 620, y: 360, w: 160, h: 18 },
            { x: 540, y: 280, w: 18, h: 120 },
            { x: 220, y: 380, w: 120, h: 18 },
            { x: 760, y: 200, w: 120, h: 18 }
        ]},
        // Map 2: wider with 6 small walls
        { w: 1160, h: 700, runner: { x: 170, y: 170 }, chaser: { x: 980, y: 540 }, obstacles: [
            { x: 360, y: 260, w: 180, h: 18 },
            { x: 620, y: 260, w: 180, h: 18 },
            { x: 490, y: 320, w: 18, h: 140 },
            { x: 720, y: 420, w: 140, h: 18 },
            { x: 260, y: 420, w: 140, h: 18 },
            { x: 520, y: 520, w: 160, h: 18 }
        ]},
        // Map 3: big, 7 compact walls (not huge)
        { w: 1240, h: 740, runner: { x: 190, y: 190 }, chaser: { x: 1040, y: 580 }, obstacles: [
            { x: 300, y: 320, w: 160, h: 18 },
            { x: 520, y: 240, w: 160, h: 18 },
            { x: 740, y: 320, w: 160, h: 18 },
            { x: 600, y: 360, w: 18, h: 160 },
            { x: 420, y: 500, w: 140, h: 18 },
            { x: 680, y: 500, w: 140, h: 18 },
            { x: 560, y: 160, w: 120, h: 18 }
        ]},
        // Map 4: medium-big, 5 thin walls (alleys)
        { w: 1100, h: 680, runner: { x: 160, y: 520 }, chaser: { x: 930, y: 180 }, obstacles: [
            { x: 520, y: 200, w: 18, h: 200 },
            { x: 620, y: 280, w: 18, h: 240 },
            { x: 360, y: 360, w: 140, h: 18 },
            { x: 700, y: 420, w: 140, h: 18 },
            { x: 520, y: 520, w: 180, h: 18 }
        ]},
        // Map 5: largest feel, 6 walls
        { w: 1320, h: 780, runner: { x: 210, y: 210 }, chaser: { x: 1120, y: 620 }, obstacles: [
            { x: 620, y: 300, w: 220, h: 18 },
            { x: 620, y: 460, w: 220, h: 18 },
            { x: 540, y: 340, w: 18, h: 120 },
            { x: 860, y: 340, w: 18, h: 120 },
            { x: 340, y: 520, w: 160, h: 18 },
            { x: 980, y: 240, w: 160, h: 18 }
        ]}
    ];
    const map = MAPS[Math.floor(Math.random() * MAPS.length)];

    container.innerHTML = `<canvas id="tagCanvas" width="${map.w}" height="${map.h}"></canvas>`;
    const canvas = container.querySelector('#tagCanvas');
    const ctx = pixelCtx(canvas.getContext('2d'));
    const keys = {};
    // Ensure keyboard focus on desktop (some browsers keep focus elsewhere)
    try {
        container.tabIndex = 0;
        container.style.outline = 'none';
        container.focus({ preventScroll: true });
        canvas.addEventListener('pointerdown', () => {
            try { container.focus({ preventScroll: true }); } catch (_) {}
        });
    } catch (_) {}
    // Controls (fixed + consistent):
    // - P1 (Hırsız/Runner): Arrow keys + D-pad on mobile
    // - P2 (Polis/Chaser): WASD + buttons on mobile
    const touchP1 = mountTouch(container, keys, { dpad: true, buttons: [] });
    const touchP2 = mountTouch(container, keys, { dpad: false, buttons: [
        { key: 'w', label: 'POLİS ↑', className: 'primary' },
        { key: 'a', label: 'POLİS ←', className: 'primary' },
        { key: 's', label: 'POLİS ↓', className: 'primary' },
        { key: 'd', label: 'POLİS →', className: 'primary' }
    ]});

    // runner = thief (P1), chaser = police (P2)
    let runner = { x: map.runner.x, y: map.runner.y };
    let chaser = { x: map.chaser.x, y: map.chaser.y };
    let time = 45;
    let over = false;
    // Few walls only (2-3) so players can pass between gaps easily
    const obstacles = map.obstacles;

    function hitRect(ax, ay, aw, ah, bx, by, bw, bh) {
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    }

    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    function moveWithCollision(p, dx, dy, speed) {
        const nx = p.x + dx * speed;
        const ny = p.y + dy * speed;
        // player bbox
        const box = { x: nx - 11, y: ny - 11, w: 22, h: 22 }; // smaller character collision
        for (const o of obstacles) {
            if (hitRect(box.x, box.y, box.w, box.h, o.x, o.y, o.w, o.h)) {
                // try axis-separated movement
                const boxX = { x: (p.x + dx * speed) - 11, y: p.y - 11, w: 22, h: 22 };
                const boxY = { x: p.x - 11, y: (p.y + dy * speed) - 11, w: 22, h: 22 };
                let okX = true, okY = true;
                for (const oo of obstacles) {
                    if (hitRect(boxX.x, boxX.y, boxX.w, boxX.h, oo.x, oo.y, oo.w, oo.h)) okX = false;
                    if (hitRect(boxY.x, boxY.y, boxY.w, boxY.h, oo.x, oo.y, oo.w, oo.h)) okY = false;
                }
                if (okX) p.x = p.x + dx * speed;
                if (okY) p.y = p.y + dy * speed;
                p.x = clamp(p.x, 26, map.w - 26);
                p.y = clamp(p.y, 46, map.h - 26);
                return;
            }
        }
        p.x = clamp(nx, 26, map.w - 26);
        p.y = clamp(ny, 46, map.h - 26);
    }

    function update() {
        if (over) return;
        // runner (P1 thief) and chaser (P2 police) speeds
        const baseRunnerSpeed = 4.4;
        const baseChaserSpeed = baseRunnerSpeed + 0.20;
        const rdx = ((keys['ArrowRight'] || keys['arrowright']) ? 1 : 0) + ((keys['ArrowLeft'] || keys['arrowleft']) ? -1 : 0);
        const rdy = ((keys['ArrowDown'] || keys['arrowdown']) ? 1 : 0) + ((keys['ArrowUp'] || keys['arrowup']) ? -1 : 0);
        const cdx = (keys['d'] ? 1 : 0) + (keys['a'] ? -1 : 0);
        const cdy = (keys['s'] ? 1 : 0) + (keys['w'] ? -1 : 0);
        moveWithCollision(runner, rdx, rdy, baseRunnerSpeed);
        moveWithCollision(chaser, cdx, cdy, baseChaserSpeed);

        if (Math.hypot(runner.x - chaser.x, runner.y - chaser.y) < 18) {
            over = true; sfx('hit'); sfx('win');
            clearInterval(loop);
            setTimeout(() => showReplay(container, `${players.p2} (Polis) Yakaladı!`, () => initTag(container, difficulty, players)), 350);
        }
    }

    function drawPoliceThief(p, role, name) {
        const ox = p.x, oy = p.y;
        const outline = '#0b1020';
        const skin = '#f5d6b4';
        const uni = role === 'police' ? '#2e86de' : '#111827';
        const uni2 = role === 'police' ? '#1e5ea0' : '#2d3436';
        const accent = role === 'police' ? '#00f2ff' : '#ffd32a';

        // shadow
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(ox - 10, oy + 16, 20, 4);

        // body outline
        ctx.fillStyle = outline; ctx.fillRect(ox - 14, oy - 20, 28, 40);
        // torso
        ctx.fillStyle = uni; ctx.fillRect(ox - 12, oy - 18, 24, 22);
        ctx.fillStyle = uni2; ctx.fillRect(ox - 12, oy - 2, 24, 12);
        // reflective strip
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(ox - 9, oy - 16, 8, 3);
        ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(ox + 2, oy - 16, 7, 2);

        // head
        ctx.fillStyle = outline; ctx.fillRect(ox - 10, oy - 30, 20, 14);
        ctx.fillStyle = skin; ctx.fillRect(ox - 9, oy - 29, 18, 12);
        // eyes
        ctx.fillStyle = '#111827'; ctx.fillRect(ox - 5, oy - 25, 3, 3); ctx.fillRect(ox + 2, oy - 25, 3, 3);

        // police cap / thief mask
        if (role === 'police') {
            ctx.fillStyle = '#111827'; ctx.fillRect(ox - 11, oy - 34, 22, 6);
            ctx.fillStyle = '#2e86de'; ctx.fillRect(ox - 10, oy - 33, 20, 4);
            ctx.fillStyle = '#ffd32a'; ctx.fillRect(ox - 2, oy - 33, 4, 3); // badge
            // radio/strap
            ctx.fillStyle = accent; ctx.fillRect(ox - 2, oy - 12, 4, 4);
        } else {
            ctx.fillStyle = '#0b1020'; ctx.fillRect(ox - 10, oy - 29, 20, 6);
            ctx.fillStyle = accent; ctx.fillRect(ox - 6, oy - 28, 12, 3);
            // loot detail
            ctx.fillStyle = accent; ctx.fillRect(ox - 2, oy - 10, 4, 4);
        }

        // legs
        ctx.fillStyle = outline; ctx.fillRect(ox - 10, oy + 10, 8, 10); ctx.fillRect(ox + 2, oy + 10, 8, 10);
        ctx.fillStyle = uni2; ctx.fillRect(ox - 9, oy + 11, 6, 8); ctx.fillRect(ox + 3, oy + 11, 6, 8);

        ctx.fillStyle = 'white'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center';
        ctx.fillText(name.substring(0, 9), ox, oy - 40);
    }

    function draw() {
        // Street chase background (static city street)
        const sky = ctx.createLinearGradient(0, 0, 0, map.h);
        sky.addColorStop(0, '#1c2340');
        sky.addColorStop(1, '#070a12');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, map.w, map.h);

        // building silhouettes
        for (let x = 0; x < map.w; x += 80) {
            const h = 120 + ((x * 17) % 80);
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fillRect(x, 130 - (h - 120), 70, h);
            // windows
            for (let yy = 62; yy < 130; yy += 16) {
                ctx.fillStyle = 'rgba(255,211,42,0.10)';
                ctx.fillRect(x + 10, yy, 8, 4);
                ctx.fillRect(x + 28, yy + 6, 8, 4);
            }
        }

        // asphalt road
        ctx.fillStyle = '#2b2f3a';
        ctx.fillRect(10, 50, map.w - 20, map.h - 60);
        // sidewalks
        ctx.fillStyle = '#4a4a6a';
        ctx.fillRect(10, 50, map.w - 20, 22);
        ctx.fillRect(10, map.h - 32, map.w - 20, 22);
        // curb stripes
        for (let x = 10; x < map.w - 10; x += 26) {
            ctx.fillStyle = (Math.floor(x / 26) % 2 === 0) ? 'rgba(255,94,87,0.55)' : 'rgba(255,255,255,0.40)';
            ctx.fillRect(x, 50, 18, 4);
            ctx.fillRect(x, map.h - 14, 18, 4);
        }
        // crosswalk center
        for (let y = 150; y < map.h - 100; y += 26) {
            ctx.fillStyle = 'rgba(255,255,255,0.10)';
            ctx.fillRect((map.w / 2) - 12, y, 24, 14);
        }
        // lane dashes
        for (let y = 92; y < map.h - 40; y += 30) {
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect((map.w / 2), y, 2, 14);
        }
        // subtle vignette
        ctx.fillStyle = 'rgba(0,0,0,0.20)';
        ctx.fillRect(0, 0, map.w, 8);
        ctx.fillRect(0, map.h - 8, map.w, 8);

        // playfield panel (helps readability)
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(16, 36, map.w - 32, map.h - 52);

        // obstacles (static)
        ctx.fillStyle = 'rgba(112,0,255,0.35)';
        obstacles.forEach((o) => {
            // "walls" look like fences / parked vehicles (smaller)
            ctx.fillStyle = '#0b1020'; ctx.fillRect(o.x - 2, o.y - 2, o.w + 4, o.h + 4);
            ctx.fillStyle = '#4a4a6a'; ctx.fillRect(o.x, o.y, o.w, o.h);
            ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(o.x + 4, o.y + 4, Math.max(0, o.w - 8), 3);
            ctx.strokeStyle = 'rgba(0,242,255,0.18)'; ctx.lineWidth = 2; ctx.strokeRect(o.x, o.y, o.w, o.h);
        });

        // P1 = thief (runner), P2 = police (chaser)
        drawPoliceThief(runner, 'thief', players.p1);
        drawPoliceThief(chaser, 'police', players.p2);

        ctx.fillStyle = '#ffd32a'; ctx.font = 'bold 14px Inter'; ctx.textAlign = 'left';
        ctx.fillText(`Süre: ${Math.ceil(time)}s`, 20, 20);
        ctx.fillStyle = '#9494b8'; ctx.font = '12px Inter';
        ctx.fillText(`Hırsız: ${players.p1} kaçıyor • Polis: ${players.p2} kovalıyor`, 120, 20);
    }

    const kd = (e) => { keys[e.key] = true; keys[e.key.toLowerCase()] = true; e.preventDefault(); };
    const ku = (e) => { keys[e.key] = false; keys[e.key.toLowerCase()] = false; };
    // Capture listeners so keys still work even if something stops bubbling
    window.addEventListener('keydown', kd, { capture: true });
    window.addEventListener('keyup', ku, { capture: true });
    const timer = setInterval(() => {
        if (over) return;
        time -= 1;
        if (time <= 0) {
            over = true;
            clearInterval(loop); clearInterval(timer);
            // Draw chance: if very close at timeout -> draw
            const d = Math.hypot(runner.x - chaser.x, runner.y - chaser.y);
            if (d < 48) {
                sfx('draw');
                setTimeout(() => showReplay(container, 'BERABERE!', () => initTag(container, difficulty, players)), 350);
            } else {
                sfx('win');
                setTimeout(() => showReplay(container, `${players.p1} Kurtuldu!`, () => initTag(container, difficulty, players)), 350);
            }
        }
    }, 1000);
    const loop = setInterval(() => { update(); draw(); }, 16);
    return () => {
        clearInterval(loop); clearInterval(timer);
        window.removeEventListener('keydown', kd, { capture: true });
        window.removeEventListener('keyup', ku, { capture: true });
        touchP1.destroy?.(); touchP2.destroy?.();
    };
}

function initBump(container, difficulty, players) {
    const W = 840, H = 560;
    container.innerHTML = `<canvas id="bumpCanvas" width="${W}" height="${H}"></canvas>`;
    const canvas = container.querySelector('#bumpCanvas');
    const ctx = pixelCtx(canvas.getContext('2d'));
    const keys = {};
    const touchP1 = mountTouch(container, keys, { dpad: false, buttons: [
        { key: 'w', label: 'P1 ↑', className: 'primary' },
        { key: 'a', label: 'P1 ←', className: 'primary' },
        { key: 's', label: 'P1 ↓', className: 'primary' },
        { key: 'd', label: 'P1 →', className: 'primary' }
    ]});
    const touchP2 = mountTouch(container, keys, { dpad: true, buttons: [] });

    // 5 random maps (arena + pits + walls). Pick one per game start.
    const MAPS = [
        { arena: { x0: 40, y0: 70, x1: 800, y1: 520 }, p1: { x: 100, y: 300 }, p2: { x: 740, y: 300 },
          pits: [{ x: 360, y: 220, w: 100, h: 80 }, { x: 160, y: 380, w: 90, h: 70 }, { x: 610, y: 380, w: 90, h: 70 }],
          walls: [{ x: 280, y: 160, w: 100, h: 18 }, { x: 560, y: 160, w: 100, h: 18 }, { x: 410, y: 310, w: 20, h: 140 }, { x: 320, y: 450, w: 100, h: 18 }, { x: 520, y: 450, w: 100, h: 18 }]
        },
        { arena: { x0: 50, y0: 70, x1: 790, y1: 520 }, p1: { x: 90, y: 280 }, p2: { x: 750, y: 320 },
          pits: [{ x: 380, y: 260, w: 80, h: 80 }, { x: 540, y: 190, w: 80, h: 70 }],
          walls: [{ x: 300, y: 210, w: 120, h: 18 }, { x: 520, y: 360, w: 140, h: 18 }, { x: 410, y: 140, w: 16, h: 120 }, { x: 410, y: 340, w: 16, h: 140 }, { x: 220, y: 420, w: 100, h: 18 }, { x: 640, y: 420, w: 100, h: 18 }]
        },
        { arena: { x0: 40, y0: 70, x1: 800, y1: 520 }, p1: { x: 90, y: 320 }, p2: { x: 750, y: 280 },
          pits: [{ x: 210, y: 200, w: 80, h: 80 }, { x: 560, y: 300, w: 90, h: 90 }, { x: 390, y: 410, w: 100, h: 70 }],
          walls: [{ x: 370, y: 180, w: 140, h: 16 }, { x: 370, y: 340, w: 140, h: 16 }, { x: 420, y: 210, w: 16, h: 120 }, { x: 250, y: 310, w: 100, h: 16 }, { x: 600, y: 250, w: 100, h: 16 }]
        },
        { arena: { x0: 60, y0: 80, x1: 780, y1: 510 }, p1: { x: 90, y: 320 }, p2: { x: 750, y: 320 },
          pits: [{ x: 380, y: 180, w: 120, h: 70 }],
          walls: [{ x: 300, y: 260, w: 100, h: 16 }, { x: 520, y: 260, w: 100, h: 16 }, { x: 400, y: 330, w: 16, h: 130 }, { x: 200, y: 420, w: 120, h: 16 }, { x: 540, y: 420, w: 120, h: 16 }]
        },
        { arena: { x0: 40, y0: 70, x1: 800, y1: 520 }, p1: { x: 90, y: 260 }, p2: { x: 750, y: 360 },
          pits: [{ x: 420, y: 240, w: 90, h: 90 }, { x: 260, y: 420, w: 80, h: 65 }, { x: 580, y: 140, w: 80, h: 65 }],
          walls: [{ x: 270, y: 180, w: 140, h: 16 }, { x: 520, y: 360, w: 140, h: 16 }, { x: 410, y: 220, w: 16, h: 160 }, { x: 180, y: 320, w: 100, h: 16 }, { x: 660, y: 260, w: 100, h: 16 }]
        }
    ];
    const map = MAPS[Math.floor(Math.random() * MAPS.length)];

    let p1 = { x: map.p1.x, y: map.p1.y, vx: 0, vy: 0, score: 0, falling: 0 };
    let p2 = { x: map.p2.x, y: map.p2.y, vx: 0, vy: 0, score: 0, falling: 0 };
    let over = false;
    let timeLeft = 60;
    let freeze = 0; // countdown frames after each score (prevents black-screen crash if missing)
    const r = 14; // player radius for wall collisions
    const arena = map.arena; // cliff edge (fall if beyond)
    const pits = map.pits;
    const walls = map.walls;

    function circleRectCollide(cx, cy, cr, rx, ry, rw, rh) {
        const px = Math.max(rx, Math.min(cx, rx + rw));
        const py = Math.max(ry, Math.min(cy, ry + rh));
        const dx = cx - px, dy = cy - py;
        return (dx * dx + dy * dy) <= cr * cr;
    }

    function hitsWall(nx, ny) {
        for (const w of walls) {
            if (circleRectCollide(nx, ny, r, w.x, w.y, w.w, w.h)) return true;
        }
        return false;
    }

    function inPit(p) {
        for (const h of pits) {
            if (p.x > h.x && p.x < h.x + h.w && p.y > h.y && p.y < h.y + h.h) return true;
        }
        return false;
    }

    function triggerFall(victim, scorer) {
        if (over) return;
        if (victim.falling > 0) return;
        victim.falling = 42; // ~0.7s
        victim.vx = 0; victim.vy = 0;
        scorer.score += 1;
        sfx('point');
        // after a point: hard reset + 3s cooldown so you can't chain points instantly
        freeze = 3 * 60;
        // reset both players to avoid "tak tak" scoring
        p1.x = map.p1.x; p1.y = map.p1.y; p1.vx = 0; p1.vy = 0; p1.falling = 0;
        p2.x = map.p2.x; p2.y = map.p2.y; p2.vx = 0; p2.vy = 0; p2.falling = 0;
        // respawn after fall anim
        setTimeout(() => {
            victim.x = victim === p1 ? map.p1.x : map.p2.x;
            victim.y = victim === p1 ? map.p1.y : map.p2.y;
            victim.vx = 0; victim.vy = 0;
            victim.falling = 0;
        }, 700);
    }

    function updatePlayer(p, up, down, left, right, accel) {
        if (p.falling > 0) { p.falling--; return; }
        const ax = (right ? 1 : 0) + (left ? -1 : 0);
        const ay = (down ? 1 : 0) + (up ? -1 : 0);
        p.vx = (p.vx + ax * accel) * 0.92;
        p.vy = (p.vy + ay * accel) * 0.92;
        const nx = p.x + p.vx;
        const ny = p.y + p.vy;
        // stop at solid walls
        if (!hitsWall(nx, p.y)) p.x = nx; else p.vx *= -0.35;
        if (!hitsWall(p.x, ny)) p.y = ny; else p.vy *= -0.35;
    }

    function update() {
        if (over) return;
        if (freeze > 0) { freeze--; return; }
        updatePlayer(p1, keys['w'], keys['s'], keys['a'], keys['d'], 0.75);
        updatePlayer(p2, keys['ArrowUp'] || keys['arrowup'], keys['ArrowDown'] || keys['arrowdown'], keys['ArrowLeft'] || keys['arrowleft'], keys['ArrowRight'] || keys['arrowright'], 0.70);

        // cliffs / pits -> fall & score
        if (p1.falling === 0 && (p1.x < arena.x0 || p1.x > arena.x1 || p1.y < arena.y0 || p1.y > arena.y1 || inPit(p1))) triggerFall(p1, p2);
        if (p2.falling === 0 && (p2.x < arena.x0 || p2.x > arena.x1 || p2.y < arena.y0 || p2.y > arena.y1 || inPit(p2))) triggerFall(p2, p1);

        // collision
        const dx = p2.x - p1.x, dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 26 && p1.falling === 0 && p2.falling === 0) {
            const nx = dx / (dist || 1), ny = dy / (dist || 1);
            p1.vx -= nx * 1.6; p1.vy -= ny * 1.6;
            p2.vx += nx * 1.6; p2.vy += ny * 1.6;
            sfx('hit');
        }

        if (p1.score >= 5 || p2.score >= 5) {
            over = true; sfx('win');
            clearInterval(loop);
            const winner = p1.score > p2.score ? players.p1 : players.p2;
            setTimeout(() => showReplay(container, `${winner} Kazandı!`, () => initBump(container, difficulty, players)), 350);
        }
    }

    function drawSuperCar(p, color, name) {
        const x = Math.round(p.x), y = Math.round(p.y);
        const dark = '#0b1020';
        const shade = color === '#ffd32a' ? '#caa21a' : '#0b2b4a';
        const stripe = color === '#ffd32a' ? '#ffffff' : '#ffd32a';
        const neon = color === '#ffd32a' ? 'rgba(0,242,255,0.18)' : 'rgba(0,242,255,0.10)';

        // shadow
        ctx.fillStyle = 'rgba(0,0,0,0.40)';
        ctx.fillRect(x - 20, y + 14, 40, 6);

        // outline
        ctx.fillStyle = dark;
        ctx.fillRect(x - 24, y - 12, 48, 26);

        // chassis
        ctx.fillStyle = color;
        ctx.fillRect(x - 22, y - 6, 44, 14);
        ctx.fillStyle = shade;
        ctx.fillRect(x - 18, y - 4, 36, 10);
        // highlight
        ctx.fillStyle = 'rgba(255,255,255,0.16)';
        ctx.fillRect(x - 16, y - 3, 14, 3);
        // stripe
        ctx.fillStyle = stripe;
        ctx.fillRect(x - 6, y - 5, 12, 2);
        ctx.fillRect(x - 6, y + 5, 12, 2);

        // nose + splitter
        ctx.fillStyle = color;
        ctx.fillRect(x + 20, y - 4, 6, 8);
        ctx.fillStyle = dark;
        ctx.fillRect(x + 18, y + 8, 10, 2);
        // headlights
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(x + 21, y - 2, 2, 2);
        ctx.fillRect(x + 21, y + 2, 2, 2);
        ctx.fillStyle = neon;
        ctx.fillRect(x + 23, y - 2, 2, 2);
        ctx.fillRect(x + 23, y + 2, 2, 2);

        // cabin
        ctx.fillStyle = dark;
        ctx.fillRect(x - 4, y - 14, 18, 10);
        ctx.fillStyle = 'rgba(180,240,255,0.80)';
        ctx.fillRect(x - 2, y - 12, 14, 6);
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(x, y - 11, 6, 2);

        // rear wing
        ctx.fillStyle = dark;
        ctx.fillRect(x - 24, y - 14, 12, 4);
        ctx.fillStyle = stripe;
        ctx.fillRect(x - 23, y - 13, 10, 2);

        // wheels
        const wheel = (wx, wy) => {
            ctx.fillStyle = dark; ctx.fillRect(wx - 1, wy - 1, 10, 8);
            ctx.fillStyle = '#111827'; ctx.fillRect(wx + 1, wy + 1, 6, 4);
            ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(wx + 2, wy + 2, 3, 2);
        };
        wheel(x - 16, y + 8);
        wheel(x + 10, y + 8);

        // name
        ctx.fillStyle = 'white'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center';
        ctx.fillText(name.substring(0, 9), x, y - 22);
    }

    function draw() {
        // Track / circuit background so it's not just dark
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#1b1f2a');
        sky.addColorStop(1, '#0b1020');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

        // track asphalt
        ctx.fillStyle = '#2b2f3a'; ctx.fillRect(10, 24, W - 20, H - 34);
        ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(10, 24, W - 20, 6);
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(10, H - 16, W - 20, 6);
        // curb
        for (let x = 10; x < W - 10; x += 20) {
            ctx.fillStyle = (Math.floor(x / 20) % 2 === 0) ? '#ff4757' : '#f1f2f6';
            ctx.fillRect(x, 24, 20, 6);
            ctx.fillRect(x, H - 16, 20, 6);
        }
        for (let y = 24; y < H - 10; y += 20) {
            ctx.fillStyle = (Math.floor(y / 20) % 2 === 0) ? '#ff4757' : '#f1f2f6';
            ctx.fillRect(10, y, 6, 20);
            ctx.fillRect(W - 16, y, 6, 20);
        }
        // faint lane grid
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        for (let x = 26; x < W - 26; x += 46) ctx.fillRect(x, 36, 1, H - 52);
        for (let y = 44; y < H - 16; y += 46) ctx.fillRect(16, y, W - 32, 1);

        // arena panel (playable area)
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(16, 36, W - 32, H - 52);
        // pits / cliffs
        pits.forEach((h) => {
            ctx.fillStyle = '#05050a'; ctx.fillRect(h.x, h.y, h.w, h.h);
            ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(h.x + 2, h.y + 2, h.w - 4, 2);
            ctx.strokeStyle = 'rgba(255,94,87,0.35)'; ctx.lineWidth = 2; ctx.strokeRect(h.x, h.y, h.w, h.h);
        });
        ctx.strokeStyle = 'rgba(255,211,42,0.35)'; ctx.lineWidth = 3;
        ctx.strokeRect(arena.x0, arena.y0, arena.x1 - arena.x0, arena.y1 - arena.y0);
        // solid walls
        walls.forEach((w) => {
            ctx.fillStyle = '#4a4a6a'; ctx.fillRect(w.x, w.y, w.w, w.h);
            ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(w.x + 4, w.y + 4, Math.max(0, w.w - 8), 3);
            ctx.strokeStyle = 'rgba(0,242,255,0.18)'; ctx.lineWidth = 2; ctx.strokeRect(w.x, w.y, w.w, w.h);
        });

        // Super cars: P1 yellow, P2 navy
        drawSuperCar(p1, '#ffd32a', players.p1);
        drawSuperCar(p2, '#0a2a66', players.p2);

        ctx.fillStyle = '#00f2ff'; ctx.font = 'bold 14px Inter'; ctx.textAlign = 'left';
        ctx.fillText(`${players.p1}: ${p1.score}`, 20, 20);
        ctx.fillStyle = '#ff5e57'; ctx.textAlign = 'right';
        ctx.fillText(`${players.p2}: ${p2.score}`, W - 20, 20);
        ctx.fillStyle = '#ffd32a'; ctx.textAlign = 'center';
        ctx.fillText(`Süre: ${Math.max(0, Math.ceil(timeLeft))}s`, W / 2, 20);
        if (freeze > 0) {
            const sec = Math.ceil(freeze / 60);
            ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect((W / 2) - 80, (H / 2) - 55, 160, 90);
            ctx.fillStyle = '#ffd32a'; ctx.font = 'bold 44px Inter';
            ctx.fillText(`${sec}`, W / 2, (H / 2) + 5);
            ctx.fillStyle = 'rgba(255,255,255,0.80)'; ctx.font = 'bold 12px Inter';
            ctx.fillText('YENİ TUR', W / 2, (H / 2) + 30);
        }
    }

    const kd = (e) => { keys[e.key] = true; keys[e.key.toLowerCase()] = true; e.preventDefault(); };
    const ku = (e) => { keys[e.key] = false; keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    const timer = setInterval(() => {
        if (over) return;
        timeLeft -= 1;
        if (timeLeft <= 0) {
            over = true;
            clearInterval(loop);
            clearInterval(timer);
            if (p1.score === p2.score) { sfx('draw'); setTimeout(() => showReplay(container, 'BERABERE!', () => initBump(container, difficulty, players)), 350); }
            else { sfx('win'); const w = p1.score > p2.score ? players.p1 : players.p2; setTimeout(() => showReplay(container, `${w} Kazandı!`, () => initBump(container, difficulty, players)), 350); }
        }
    }, 1000);
    const loop = setInterval(() => { update(); draw(); }, 16);
    return () => { clearInterval(loop); clearInterval(timer); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); touchP1.destroy?.(); touchP2.destroy?.(); };
}

function initVolley(container, difficulty, players) {
    container.innerHTML = `<canvas id="volleyCanvas" width="640" height="420"></canvas>`;
    const canvas = container.querySelector('#volleyCanvas');
    const ctx = pixelCtx(canvas.getContext('2d'));
    const keys = {};
    const touchP1 = mountTouch(container, keys, { dpad: false, buttons: [
        { key: 'a', label: 'P1 ←', className: 'primary' },
        { key: 'd', label: 'P1 →', className: 'primary' },
        { key: 'w', label: 'P1 ZIPLA', className: 'primary' }
    ]});
    const touchP2 = mountTouch(container, keys, { dpad: false, buttons: [
        { key: 'ArrowLeft', label: 'P2 ←', className: 'primary' },
        { key: 'ArrowRight', label: 'P2 →', className: 'primary' },
        { key: 'ArrowUp', label: 'P2 ZIPLA', className: 'primary' }
    ]});

    let p1 = { x: 160, y: 340, vy: 0, score: 0 };
    let p2 = { x: 480, y: 340, vy: 0, score: 0 };
    let ball = { x: 320, y: 120, vx: 2.1, vy: 0.0 };
    let over = false;
    let timeLeft = 75; // seconds
    // time-based pace ramp: 30s -> +, 25s -> +, 20s -> +, then slower steps
    let liveFrames = 0; // counts only while ball is live (serveWait==0)
    let serveWait = 5 * 60; // 5s at match start
    let serveDirLeft = true;
    // cosmetic: occasional dolphin jump in the sea
    let dolphin = null;
    let nextDolphinAt = Date.now() + 6000 + Math.random() * 9000;
    // cosmetic: occasional crab crossing on sand
    let crab = null;
    let nextCrabAt = Date.now() + 5000 + Math.random() * 8000;

    function resetBall(toLeft) {
        liveFrames = 0;
        serveDirLeft = !!toLeft;
        serveWait = 3 * 60; // 3s after point
        ball = { x: 320, y: 120, vx: 0, vy: 0 };
    }

    function jump(p) {
        if (p.y >= 340) { p.vy = -8.2; sfx('jump'); }
    }

    function updatePlayer(p, left, right, jumpKey) {
        if (left) p.x -= 4.6;
        if (right) p.x += 4.6;
        if (jumpKey) { jump(p); }
        p.x = Math.max(30, Math.min(610, p.x));
        p.vy += 0.45;
        p.y += p.vy;
        if (p.y > 340) { p.y = 340; p.vy = 0; }
    }

    function collide(p) {
        return Math.abs(ball.x - p.x) < 18 && Math.abs(ball.y - (p.y - 12)) < 22;
    }

    function update() {
        if (over) return;

        updatePlayer(p1, keys['a'], keys['d'], keys['w']);
        updatePlayer(p2, keys['ArrowLeft'] || keys['arrowleft'], keys['ArrowRight'] || keys['arrowright'], keys['ArrowUp'] || keys['arrowup']);

        // net
        const netX = 320;
        // players cannot cross the net (stay in their own half) — allow closer to net
        p1.x = Math.min(p1.x, netX - 16);
        p2.x = Math.max(p2.x, netX + 16);

        // serve countdown (no movement until it hits 0)
        if (serveWait > 0) {
            serveWait--;
            if (serveWait === 0) {
                // slower serve start
                ball.vx = serveDirLeft ? -1.15 : 1.15;
                ball.vy = 0.08; // start gentle fall
                sfx('start');
            }
            return;
        }

        // ball physics (slower fall + time-based gradual speed-up)
        liveFrames++;
        const t = liveFrames / 60; // seconds of live play
        // thresholds: 30s, 55s, 75s, 90s, 102s ... small steps
        let pace = 1.00;
        if (t >= 30) pace = 1.04;
        if (t >= 55) pace = 1.08;
        if (t >= 75) pace = 1.10;
        if (t >= 90) pace = 1.12;
        if (t >= 102) pace = 1.14;
        ball.vy += 0.14 * pace;
        ball.x += ball.vx * pace;
        ball.y += ball.vy;

        if (ball.y < 30) { ball.y = 30; ball.vy *= -0.8; sfx('hit'); }
        if (ball.x < 20) { ball.x = 20; ball.vx *= -1; sfx('hit'); }
        if (ball.x > 620) { ball.x = 620; ball.vx *= -1; sfx('hit'); }
        // net collision
        if (Math.abs(ball.x - netX) < 8 && ball.y > 220) { ball.vx *= -1; sfx('hit'); }

        // player hits (directional: if ball hits head corners, it goes toward that corner)
        const headHit = (p, side) => {
            // approx head center
            const hx = p.x;
            const hy = p.y - 18;
            // corner influence based on horizontal offset (left/right of head)
            const off = (ball.x - hx);
            const corner = Math.max(-1, Math.min(1, off / 14)); // -1..1
            // base upward launch
            ball.vy = -10.2;
            // send ball toward the corner direction, but keep it on correct side overall
            const toward = side === 'left' ? 1 : -1; // left player generally sends right, right player sends left
            // slower horizontal speed overall
            ball.vx = toward * (1.4 + Math.abs(corner) * 1.8) + corner * 0.6;
            // damping so it doesn't spike
            ball.vx *= 0.90;
            sfx('hit');
        };
        if (collide(p1) && ball.x < netX) headHit(p1, 'left');
        if (collide(p2) && ball.x > netX) headHit(p2, 'right');

        // ground score
        if (ball.y > 372) {
            if (ball.x < netX) p2.score++; else p1.score++;
            sfx('point');
            resetBall(ball.x > netX);
            if (p1.score >= 5 || p2.score >= 5) {
                over = true; sfx('win');
                clearInterval(loop);
                const winner = p1.score > p2.score ? players.p1 : players.p2;
                setTimeout(() => showReplay(container, `${winner} Kazandı!`, () => initVolley(container, difficulty, players)), 350);
            }
        }

        // dolphin scheduler (cosmetic)
        const now = Date.now();
        if (!dolphin && now >= nextDolphinAt) {
            dolphin = {
                start: now,
                dur: 1300,
                x0: 40 + Math.random() * 560,
                dir: Math.random() < 0.5 ? -1 : 1
            };
            nextDolphinAt = now + 7000 + Math.random() * 12000;
        }
        if (dolphin && (now - dolphin.start) > dolphin.dur) dolphin = null;

        // crab scheduler (cosmetic)
        if (!crab && now >= nextCrabAt) {
            const dir = Math.random() < 0.5 ? -1 : 1;
            crab = {
                start: now,
                dur: 2200,
                dir,
                y: 366 + Math.floor(Math.random() * 14) // on sand
            };
            nextCrabAt = now + 9000 + Math.random() * 14000;
        }
        if (crab && (now - crab.start) > crab.dur) crab = null;
    }

    function drawMan(p, uniformMain, uniformAccent, name) {
        const x = p.x, y = p.y;
        const outline = '#0b1020';
        const skin = '#f5d6b4';
        // shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x - 10, y + 18, 20, 4);
        // legs
        ctx.fillStyle = outline; ctx.fillRect(x - 10, y + 6, 8, 16); ctx.fillRect(x + 2, y + 6, 8, 16);
        ctx.fillStyle = uniformMain; ctx.fillRect(x - 9, y + 7, 6, 14); ctx.fillRect(x + 3, y + 7, 6, 14);
        // shoes
        ctx.fillStyle = outline; ctx.fillRect(x - 11, y + 20, 10, 4); ctx.fillRect(x + 1, y + 20, 10, 4);
        // torso
        ctx.fillStyle = outline; ctx.fillRect(x - 12, y - 10, 24, 20);
        ctx.fillStyle = uniformMain; ctx.fillRect(x - 11, y - 9, 22, 18);
        ctx.fillStyle = uniformAccent; ctx.fillRect(x - 11, y - 3, 22, 4); // stripe
        ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(x - 8, y - 8, 8, 3);
        // arms
        ctx.fillStyle = outline; ctx.fillRect(x - 16, y - 8, 5, 14); ctx.fillRect(x + 11, y - 8, 5, 14);
        ctx.fillStyle = skin; ctx.fillRect(x - 15, y - 7, 3, 10); ctx.fillRect(x + 12, y - 7, 3, 10);
        // head
        ctx.fillStyle = outline; ctx.fillRect(x - 8, y - 26, 16, 16);
        ctx.fillStyle = skin; ctx.fillRect(x - 7, y - 25, 14, 14);
        // hair
        ctx.fillStyle = '#111827'; ctx.fillRect(x - 7, y - 26, 14, 5);
        // face
        ctx.fillStyle = '#111827'; ctx.fillRect(x - 4, y - 20, 3, 3); ctx.fillRect(x + 1, y - 20, 3, 3);
        ctx.fillStyle = '#7d2d2d'; ctx.fillRect(x - 2, y - 16, 4, 2);
        // name
        ctx.fillStyle = 'white'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center';
        ctx.fillText(name.substring(0, 9), x, y - 34);
    }

    function draw() {
        // beach background: sky + clouds + sea + sand
        const sky = ctx.createLinearGradient(0, 0, 0, 220);
        sky.addColorStop(0, '#87ceeb');
        sky.addColorStop(1, '#cfefff');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, 640, 220);
        // clouds
        for (let i = 0; i < 6; i++) {
            const cx = (i * 120 + (Date.now() / 40)) % 760 - 60;
            const cy = 40 + (i % 3) * 24;
            ctx.fillStyle = 'rgba(255,255,255,0.65)';
            ctx.fillRect(cx, cy, 46, 16);
            ctx.fillRect(cx + 18, cy - 8, 34, 14);
            ctx.fillRect(cx + 10, cy + 10, 38, 12);
        }
        // sea
        const sea = ctx.createLinearGradient(0, 220, 0, 310);
        sea.addColorStop(0, '#1b4f72');
        sea.addColorStop(1, '#0b1020');
        ctx.fillStyle = sea; ctx.fillRect(0, 220, 640, 90);
        for (let x = 0; x < 640; x += 16) {
            const yy = 260 + Math.sin((Date.now() / 240) + x / 40) * 2;
            ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(x, yy, 10, 2);
        }
        // dolphin jump (occasional, cosmetic)
        if (dolphin) {
            const p = Math.max(0, Math.min(1, (Date.now() - dolphin.start) / dolphin.dur));
            // arc: up then down
            const h = Math.sin(p * Math.PI) * 34; // height above sea
            const dx = (p - 0.5) * 90 * dolphin.dir;
            const x = dolphin.x0 + dx;
            const y = 276 - h;
            // splash at start/end
            if (p < 0.12 || p > 0.88) {
                const sx = x + (dolphin.dir * 6);
                const sy = 282;
                ctx.fillStyle = 'rgba(255,255,255,0.18)';
                ctx.fillRect(sx - 10, sy, 20, 2);
                ctx.fillRect(sx - 6, sy - 2, 12, 2);
            }
            // dolphin body (more detailed pixel)
            const outline = '#0b1020';
            const body = '#7fb9d6', body2 = '#5aa0c4', belly = '#a8d7ea';
            // body base
            ctx.fillStyle = outline; ctx.fillRect(x - 18, y - 9, 36, 18);
            ctx.fillStyle = body; ctx.fillRect(x - 17, y - 8, 34, 16);
            ctx.fillStyle = body2; ctx.fillRect(x - 12, y - 1, 24, 7);
            ctx.fillStyle = belly; ctx.fillRect(x - 10, y + 1, 20, 4);
            // nose / rostrum
            ctx.fillStyle = outline; ctx.fillRect(x + 16 * dolphin.dir, y - 4, 5, 8);
            ctx.fillStyle = body; ctx.fillRect(x + 17 * dolphin.dir, y - 3, 3, 6);
            ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x + 18 * dolphin.dir, y - 2, 1, 2);
            // dorsal fin
            ctx.fillStyle = outline; ctx.fillRect(x - 2, y - 14, 5, 6);
            ctx.fillStyle = body2; ctx.fillRect(x - 1, y - 13, 3, 4);
            // side flipper
            ctx.fillStyle = outline; ctx.fillRect(x - 2, y + 6, 6, 3);
            ctx.fillStyle = body2; ctx.fillRect(x - 1, y + 7, 4, 1);
            // tail + flukes
            ctx.fillStyle = outline; ctx.fillRect(x - 21 * dolphin.dir, y - 4, 5, 8);
            ctx.fillStyle = body; ctx.fillRect(x - 20 * dolphin.dir, y - 3, 3, 6);
            ctx.fillStyle = outline;
            ctx.fillRect(x - 25 * dolphin.dir, y - 7, 4, 3);
            ctx.fillRect(x - 25 * dolphin.dir, y + 4, 4, 3);
            ctx.fillStyle = body2;
            ctx.fillRect(x - 24 * dolphin.dir, y - 6, 2, 1);
            ctx.fillRect(x - 24 * dolphin.dir, y + 5, 2, 1);
            // eye + smile line
            ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(x + 7 * dolphin.dir, y - 4, 2, 2);
            ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x + 7 * dolphin.dir, y - 4, 1, 1);
            ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 10 * dolphin.dir, y + 1, 3, 1);
        }

        // sand court
        ctx.fillStyle = '#f7d794'; ctx.fillRect(0, 310, 640, 110);
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        for (let x = 0; x < 640; x += 20) ctx.fillRect(x + ((Date.now() / 120) % 4), 330 + (x % 18), 8, 2);

        // crab crossing on sand (occasional, cosmetic)
        if (crab) {
            const p = Math.max(0, Math.min(1, (Date.now() - crab.start) / crab.dur));
            const x = (crab.dir > 0) ? (-30 + p * 700) : (670 - p * 700);
            const y = crab.y;
            const outline = '#0b1020';
            const shell = '#ff6b6b';
            const shell2 = '#c44569';
            // shadow
            ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x - 10, y + 10, 20, 3);
            // body
            ctx.fillStyle = outline; ctx.fillRect(x - 14, y - 6, 28, 14);
            ctx.fillStyle = shell; ctx.fillRect(x - 13, y - 5, 26, 12);
            ctx.fillStyle = shell2; ctx.fillRect(x - 8, y, 16, 4);
            // eyes stalks
            ctx.fillStyle = outline; ctx.fillRect(x - 8, y - 10, 3, 5); ctx.fillRect(x + 5, y - 10, 3, 5);
            ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(x - 7, y - 9, 1, 1); ctx.fillRect(x + 6, y - 9, 1, 1);
            // claws
            const claw = (sx) => {
                ctx.fillStyle = outline; ctx.fillRect(x + sx, y - 4, 6, 6);
                ctx.fillStyle = shell; ctx.fillRect(x + sx + 1, y - 3, 4, 4);
                ctx.fillStyle = outline; ctx.fillRect(x + sx + 5, y - 3, 2, 2);
            };
            claw(-18); claw(12);
            // legs (wiggle)
            const wig = (Math.sin(Date.now()/120) * 1.5) | 0;
            ctx.fillStyle = outline;
            for (let i = -10; i <= 10; i += 5) {
                ctx.fillRect(x + i, y + 6, 3, 2);
                ctx.fillRect(x + i - 2, y + 7 + (i%2?wig:-wig), 2, 2);
            }
            // highlight
            ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(x - 10, y - 4, 8, 2);
        }
        // court lines
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(16, 360, 608, 2);
        ctx.fillRect(16, 312, 608, 2);

        // volleyball net (grid)
        // nicer metal posts + tape (more "volleyball" look)
        // posts (slightly thinner)
        ctx.fillStyle = '#0b1020'; ctx.fillRect(299, 196, 10, 176);
        ctx.fillStyle = '#0b1020'; ctx.fillRect(331, 196, 10, 176);
        ctx.fillStyle = '#aab6c4'; ctx.fillRect(301, 198, 6, 172);
        ctx.fillStyle = '#aab6c4'; ctx.fillRect(333, 198, 6, 172);
        // brushed highlight + shadow
        ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(302, 200, 1, 168);
        ctx.fillRect(334, 200, 1, 168);
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(306, 200, 1, 168);
        ctx.fillRect(338, 200, 1, 168);
        // bolts
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        for (let yy = 210; yy <= 354; yy += 24) {
            ctx.fillRect(302, yy, 2, 2); ctx.fillRect(335, yy, 2, 2);
            ctx.fillStyle = 'rgba(255,255,255,0.14)';
            ctx.fillRect(303, yy + 1, 1, 1); ctx.fillRect(336, yy + 1, 1, 1);
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
        }
        // top tape (white) + cable
        ctx.fillStyle = '#0b1020'; ctx.fillRect(306, 204, 34, 14);
        ctx.fillStyle = '#f5f6fa'; ctx.fillRect(308, 206, 30, 8);
        ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.fillRect(308, 213, 30, 1);
        ctx.fillStyle = 'rgba(255,255,255,0.30)'; ctx.fillRect(310, 207, 12, 2);
        // net spine
        ctx.fillStyle = '#0b1020'; ctx.fillRect(318, 210, 4, 150);
        ctx.fillStyle = 'rgba(245,246,250,0.28)'; ctx.fillRect(312, 216, 16, 3);
        ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1;
        for (let y = 220; y < 360; y += 10) {
            ctx.beginPath(); ctx.moveTo(302, y); ctx.lineTo(338, y); ctx.stroke();
        }
        for (let x = 304; x < 338; x += 8) {
            ctx.beginPath(); ctx.moveTo(x, 220); ctx.lineTo(x, 360); ctx.stroke();
        }

        // players (full-body males in uniform)
        drawMan(p1, '#2e86de', '#00f2ff', players.p1);
        drawMan(p2, '#ff4757', '#ffd32a', players.p2);

        // ball (volleyball)
        const bx = ball.x, by = ball.y;
        // outline + roundness
        ctx.fillStyle = '#0b1020'; ctx.fillRect(bx - 10, by - 10, 20, 20);
        ctx.fillStyle = '#f5f6fa'; ctx.fillRect(bx - 8, by - 9, 16, 18);
        ctx.fillRect(bx - 9, by - 8, 18, 16);
        // corner cuts (rounded)
        ctx.fillStyle = '#0b1020';
        ctx.fillRect(bx - 9, by - 9, 2, 2);
        ctx.fillRect(bx + 7, by - 9, 2, 2);
        ctx.fillRect(bx - 9, by + 7, 2, 2);
        ctx.fillRect(bx + 7, by + 7, 2, 2);
        // shading
        ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.fillRect(bx - 7, by + 1, 14, 6);
        ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(bx - 5, by - 6, 6, 4);
        // seams (curved-ish pixel arcs)
        ctx.fillStyle = '#ffd32a';
        ctx.fillRect(bx - 1, by - 8, 2, 16);
        ctx.fillRect(bx - 8, by - 1, 16, 2);
        ctx.fillStyle = 'rgba(255,211,42,0.55)';
        ctx.fillRect(bx - 6, by - 6, 2, 2);
        ctx.fillRect(bx + 4, by - 6, 2, 2);
        ctx.fillRect(bx - 6, by + 4, 2, 2);
        ctx.fillRect(bx + 4, by + 4, 2, 2);
        // panel hints
        ctx.fillStyle = 'rgba(0,0,0,0.10)';
        ctx.fillRect(bx - 6, by - 3, 1, 6);
        ctx.fillRect(bx + 5, by - 3, 1, 6);

        // score
        ctx.fillStyle = '#00f2ff'; ctx.font = 'bold 14px Inter'; ctx.textAlign = 'left';
        ctx.fillText(`${players.p1}: ${p1.score}`, 20, 20);
        ctx.fillStyle = '#ff5e57'; ctx.textAlign = 'right';
        ctx.fillText(`${players.p2}: ${p2.score}`, 620, 20);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd32a';
        ctx.fillText(`Süre: ${Math.max(0, Math.ceil(timeLeft))}s`, 320, 20);

        if (!over && serveWait > 0) {
            const sec = Math.ceil(serveWait / 60);
            ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(220, 150, 200, 90);
            ctx.fillStyle = '#ffd32a'; ctx.font = 'bold 42px Inter';
            ctx.fillText(`${sec}`, 320, 210);
            ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = 'bold 12px Inter';
            ctx.fillText('SERVİS', 320, 235);
        }
    }

    const kd = (e) => { keys[e.key] = true; keys[e.key.toLowerCase()] = true; e.preventDefault(); };
    const ku = (e) => { keys[e.key] = false; keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    const timer = setInterval(() => {
        if (over) return;
        timeLeft -= 1;
        if (timeLeft <= 0) {
            over = true;
            clearInterval(loop);
            clearInterval(timer);
            if (p1.score === p2.score) {
                sfx('draw');
                setTimeout(() => showReplay(container, 'BERABERE!', () => initVolley(container, difficulty, players)), 350);
            } else {
                sfx('win');
                const winner = p1.score > p2.score ? players.p1 : players.p2;
                setTimeout(() => showReplay(container, `${winner} Kazandı!`, () => initVolley(container, difficulty, players)), 350);
            }
        }
    }, 1000);
    const loop = setInterval(() => { update(); draw(); }, 16);
    return () => { clearInterval(loop); clearInterval(timer); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); touchP1.destroy?.(); touchP2.destroy?.(); };
}

function initArtillery(container, difficulty, players) {
    container.innerHTML = `<canvas id="artCanvas" width="640" height="420"></canvas>`;
    const canvas = container.querySelector('#artCanvas');
    const ctx = pixelCtx(canvas.getContext('2d'));
    const keys = {};
    const touchP1 = mountTouch(container, keys, { dpad: false, buttons: [
        { key: 'a', label: 'P1 AÇI -', className: 'primary' },
        { key: 'd', label: 'P1 AÇI +', className: 'primary' },
        { key: 'w', label: 'P1 GÜÇ +', className: 'primary' },
        { key: 's', label: 'P1 GÜÇ -', className: 'primary' },
        { key: ' ', label: 'P1 ATEŞ', className: 'danger' }
    ]});
    const touchP2 = mountTouch(container, keys, { dpad: false, buttons: [
        { key: 'j', label: 'P2 AÇI -', className: 'primary' },
        { key: 'l', label: 'P2 AÇI +', className: 'primary' },
        { key: 'i', label: 'P2 GÜÇ +', className: 'primary' },
        { key: 'k', label: 'P2 GÜÇ -', className: 'primary' },
        { key: 'Enter', label: 'P2 ATEŞ', className: 'danger' }
    ]});

    // boats on water + free-aim cursor (move up/down/left/right)
    let p1 = { x: 120, y: 308, hp: 4, aimX: 220, aimY: 220 };
    let p2 = { x: 520, y: 308, hp: 4, aimX: 420, aimY: 220 };
    let proj = null;
    let explosions = []; // explosion particles
    let turn = 1;
    let over = false;
    let timeLeft = 90;
    const grav = 0.22;
    const island = { x: 280, y: 290, w: 80, h: 60 }; // sandy mound in the middle

    function fire(p, owner) {
        const sx = p.x;
        const sy = p.y - 26;
        const dx = (p.aimX - sx);
        const dy = (p.aimY - sy);
        const len = Math.max(1, Math.hypot(dx, dy));
        const spd = 11.5;
        proj = { x: sx, y: sy, vx: (dx / len) * spd, vy: (dy / len) * spd, owner };
        sfx('shoot');
    }

    function createExplosion(x, y, size = 8) {
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const spd = 2 + Math.random() * 3;
            explosions.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                life: 30,
                maxLife: 30,
                size: size
            });
        }
    }

    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    function update() {
        if (over) return;

        // aim controls (move cursor with up/down/left/right)
        if (!proj) {
            if (turn === 1) {
                if (keys['a']) { p1.aimX = clamp(p1.aimX - 10, 30, 610); }
                if (keys['d']) { p1.aimX = clamp(p1.aimX + 10, 30, 610); }
                if (keys['w']) { p1.aimY = clamp(p1.aimY - 10, 40, 320); }
                if (keys['s']) { p1.aimY = clamp(p1.aimY + 10, 40, 320); }
                if (keys[' '] || keys['space']) { keys[' '] = keys['space'] = false; fire(p1, 1); }
            } else {
                if (keys['j']) { p2.aimX = clamp(p2.aimX - 10, 30, 610); }
                if (keys['l']) { p2.aimX = clamp(p2.aimX + 10, 30, 610); }
                if (keys['i']) { p2.aimY = clamp(p2.aimY - 10, 40, 320); }
                if (keys['k']) { p2.aimY = clamp(p2.aimY + 10, 40, 320); }
                if (keys['Enter'] || keys['enter']) { keys['Enter'] = keys['enter'] = false; fire(p2, 2); }
            }
        }

        // projectile physics
        if (proj) {
            proj.vy += grav;
            proj.x += proj.vx;
            proj.y += proj.vy;

            const hit1 = proj.owner === 2 && Math.abs(proj.x - p1.x) < 18 && Math.abs(proj.y - (p1.y - 26)) < 28;
            const hit2 = proj.owner === 1 && Math.abs(proj.x - p2.x) < 18 && Math.abs(proj.y - (p2.y - 26)) < 28;
            if (hit1) { p1.hp--; createExplosion(proj.x, proj.y, 10); proj = null; sfx('hit'); turn = 1; }
            if (hit2) { p2.hp--; createExplosion(proj.x, proj.y, 10); proj = null; sfx('hit'); turn = 2; }
            // island block (sand mound)
            if (proj && proj.x > island.x && proj.x < island.x + island.w && proj.y > island.y && proj.y < island.y + island.h) {
                createExplosion(proj.x, proj.y, 6);
                proj = null;
                sfx('hit');
                turn = turn === 1 ? 2 : 1;
            }

            // out of bounds / ground
            if (proj && (proj.x < -30 || proj.x > 670 || proj.y > 338)) {
                createExplosion(proj.x, proj.y, 6);
                proj = null;
                sfx('click');
                turn = turn === 1 ? 2 : 1;
            }
        }

        // update explosions
        for (let i = explosions.length - 1; i >= 0; i--) {
            const exp = explosions[i];
            exp.life--;
            exp.x += exp.vx;
            exp.y += exp.vy;
            exp.vy += 0.12; // gravity
            exp.vx *= 0.98; // drag
            if (exp.life <= 0) explosions.splice(i, 1);
        }

        if (p1.hp <= 0 || p2.hp <= 0) {
            over = true;
            clearInterval(loop);
            clearInterval(timer);
            sfx('win');
            const winner = p1.hp > 0 ? players.p1 : players.p2;
            setTimeout(() => showReplay(container, `${winner} Kazandı!`, () => initArtillery(container, difficulty, players)), 350);
        }
    }

    function drawBoat(t, color, name, isActive, side) {
        // water wake (çalkalanma)
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.arc(t.x - 20, t.y + 8, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(t.x + 20, t.y + 8, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // boat shadow (elipse yerine arc kullan)
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.arc(t.x, t.y + 12, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // boat hull (3D effect)
        ctx.fillStyle = '#0b1020'; 
        ctx.fillRect(t.x - 34, t.y - 10, 68, 24);
        
        // hull gradient
        ctx.fillStyle = '#6b4423'; 
        ctx.fillRect(t.x - 32, t.y - 8, 64, 10);
        ctx.fillStyle = '#8d5524'; 
        ctx.fillRect(t.x - 32, t.y + 2, 64, 10);
        
        // hull details (rivets)
        ctx.fillStyle = '#4a3520';
        for (let i = -28; i <= 28; i += 14) {
            ctx.fillRect(t.x + i, t.y - 2, 2, 2);
            ctx.fillRect(t.x + i, t.y + 4, 2, 2);
        }
        
        // water line reflection
        ctx.fillStyle = 'rgba(0,0,0,0.20)'; 
        ctx.fillRect(t.x - 28, t.y + 10, 56, 3);
        
        // deck details
        ctx.fillStyle = '#2d3436'; 
        ctx.fillRect(t.x - 24, t.y - 14, 48, 10);
        ctx.fillStyle = color; 
        ctx.fillRect(t.x - 22, t.y - 12, 44, 6);
        
        // deck wood planks
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(t.x - 22, t.y - 8);
        ctx.lineTo(t.x + 22, t.y - 8);
        ctx.stroke();
        
        // portholes (gemi penceresi)
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.arc(t.x - 12, t.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(t.x + 12, t.y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // flag pole
        ctx.fillStyle = '#8d5524'; 
        ctx.fillRect(t.x + (side === 1 ? -22 : 20), t.y - 18, 2, 8);
        
        // flag
        const flag = side === 1 ? '#2e86de' : '#ff4757';
        ctx.fillStyle = flag;
        ctx.fillRect(t.x + (side === 1 ? -20 : 22), t.y - 16, 8, 5);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(t.x + (side === 1 ? -19 : 23), t.y - 15, 3, 2);
        
        // gunner (holds gun)
        const gx = t.x + (side === 1 ? -8 : 8);
        const gy = t.y - 18;
        
        // body outline
        ctx.fillStyle = '#0b1020'; 
        ctx.fillRect(gx - 10, gy - 18, 20, 26);
        
        // soldier body (blue vs red)
        const suit = side === 1 ? '#2e86de' : '#ff4757';
        const suitDark = side === 1 ? '#1e5ea0' : '#b33939';
        ctx.fillStyle = suit; 
        ctx.fillRect(gx - 9, gy - 16, 18, 22);
        
        // belt
        ctx.fillStyle = '#111827'; 
        ctx.fillRect(gx - 9, gy - 4, 18, 3);
        ctx.fillStyle = '#ffd32a'; 
        ctx.fillRect(gx - 3, gy - 3, 6, 1); // buckle
        
        // torso shading
        ctx.fillStyle = suitDark; 
        ctx.fillRect(gx - 8, gy - 2, 3, 8);
        ctx.fillRect(gx + 5, gy - 2, 3, 8);
        
        // head + helmet
        ctx.fillStyle = '#0b1020'; 
        ctx.fillRect(gx - 7, gy - 22, 14, 6);
        ctx.fillStyle = side === 1 ? '#4a90a4' : '#5c2e2e'; 
        ctx.fillRect(gx - 6, gy - 21, 12, 5);
        
        // face
        ctx.fillStyle = '#f5d6b4'; 
        ctx.fillRect(gx - 5, gy - 14, 10, 8);
        
        // eyes
        ctx.fillStyle = '#111827'; 
        ctx.fillRect(gx - 3, gy - 12, 2, 2); 
        ctx.fillRect(gx + 1, gy - 12, 2, 2);
        
        // mouth
        ctx.fillStyle = '#8d5524';
        ctx.fillRect(gx - 2, gy - 8, 4, 1);
        
        // arms
        ctx.fillStyle = '#f5d6b4'; 
        ctx.fillRect(gx - 10, gy - 8, 4, 10); 
        ctx.fillRect(gx + 6, gy - 8, 4, 10);
        ctx.fillStyle = suitDark; 
        ctx.fillRect(gx - 10, gy - 2, 4, 6); 
        ctx.fillRect(gx + 6, gy - 2, 4, 6);
        
        // rifle (more detailed with 3D effect)
        const dir = side === 1 ? 1 : -1;
        ctx.fillStyle = '#0b1020'; 
        ctx.fillRect(gx + dir * 3, gy - 7, dir * 24, 7);
        ctx.fillStyle = '#4a4a4a'; 
        ctx.fillRect(gx + dir * 4, gy - 6, dir * 22, 5);
        ctx.fillStyle = '#dfe6e9'; 
        ctx.fillRect(gx + dir * 5, gy - 5, dir * 18, 3);
        ctx.fillStyle = '#111827'; 
        ctx.fillRect(gx + dir * 16, gy - 4, dir * 6, 3); // grip
        ctx.fillStyle = '#222'; 
        ctx.fillRect(gx + dir * 20, gy - 6, dir * 4, 5); // muzzle
        ctx.fillStyle = '#888'; 
        ctx.fillRect(gx + dir * 22, gy - 7, dir * 2, 7); // scope
        ctx.fillStyle = 'rgba(255,255,255,0.2)'; 
        ctx.fillRect(gx + dir * 6, gy - 4, dir * 10, 1);

        // gun direction line (nişan çizgisi)
        const ax = t.aimX, ay = t.aimY;
        const dx = ax - t.x, dy = ay - (t.y - 26);
        const len = Math.max(1, Math.hypot(dx, dy));
        const ux = dx / len, uy = dy / len;
        
        // aim line from gun barrel
        ctx.strokeStyle = side === 1 ? 'rgba(0,242,255,0.3)' : 'rgba(255,211,0,0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        const bx = t.x + ux * 26;
        const by = (t.y - 26) + uy * 26;
        ctx.moveTo(bx, by);
        ctx.lineTo(ax, ay);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // muzzle point
        ctx.fillStyle = '#ff9500';
        ctx.beginPath();
        ctx.arc(bx, by, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // name + hp
        ctx.fillStyle = 'white'; 
        ctx.font = 'bold 12px Inter'; 
        ctx.textAlign = 'center';
        ctx.fillText(name.substring(0, 9), t.x, t.y - 40);
        
        // HP bar background
        ctx.fillStyle = 'rgba(255,255,255,0.15)'; 
        ctx.fillRect(t.x - 24, t.y - 34, 48, 5);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(t.x - 24, t.y - 34, 48, 5);
        
        // HP bar fill
        const hpColor = t.hp <= 1 ? '#ff4757' : isActive ? '#ffd32a' : '#00f2ff';
        ctx.fillStyle = hpColor; 
        ctx.fillRect(t.x - 24, t.y - 34, (t.hp / 4) * 48, 5);
        
        // HP text
        ctx.fillStyle = hpColor;
        ctx.font = '10px Inter';
        ctx.fillText(`${t.hp}/4`, t.x, t.y - 28);
    }

    function draw() {
        // sky gradient (gökçüsü)
        const sky = ctx.createLinearGradient(0, 0, 0, 150);
        sky.addColorStop(0, '#0a1929');
        sky.addColorStop(0.3, '#1a3a52');
        sky.addColorStop(1, '#1b4f72');
        ctx.fillStyle = sky; 
        ctx.fillRect(0, 0, 640, 150);
        
        // clouds (bulutlar)
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        const cloudT = Date.now() / 15000;
        ctx.beginPath();
        ctx.arc(100 + Math.sin(cloudT) * 50, 40, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(500 + Math.cos(cloudT * 0.7) * 60, 60, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // sea background
        const g = ctx.createLinearGradient(0, 150, 0, 420);
        g.addColorStop(0, '#0f2027');
        g.addColorStop(0.5, '#1b4f72');
        g.addColorStop(0.8, '#0e3a4a');
        g.addColorStop(1, '#0b1020');
        ctx.fillStyle = g; 
        ctx.fillRect(0, 150, 640, 270);
        
        // animated waves (dalgalar)
        const waveTime = Date.now() / 200;
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        for (let x = 0; x < 640; x += 20) {
            const y = 310 + Math.sin((waveTime + x / 40) * 0.3) * 4;
            ctx.fillRect(x, y, 18, 2);
            const y2 = 320 + Math.sin((waveTime + x / 40 + 2) * 0.3) * 3;
            ctx.fillRect(x, y2, 18, 1);
        }
        
        // wave sparkles (dalga parıltıları)
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        for (let x = 0; x < 640; x += 60) {
            const yoff = 315 + Math.sin(waveTime + x / 80) * 5;
            ctx.beginPath();
            ctx.arc(x + (waveTime * 30) % 60, yoff, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // island mound (ada - daha detaylı)
        // shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; 
        ctx.beginPath();
        ctx.arc(island.x + island.w / 2, island.y + island.h + 5, 38, 0, Math.PI * 2);
        ctx.fill();
        
        // sand outline
        ctx.fillStyle = '#0b1020'; 
        ctx.fillRect(island.x - 3, island.y - 3, island.w + 6, island.h + 6);
        
        // sand main
        ctx.fillStyle = '#feca57'; 
        ctx.fillRect(island.x, island.y, island.w, island.h);
        
        // sand details + grain
        ctx.fillStyle = 'rgba(0,0,0,0.08)'; 
        for (let i = 0; i < 20; i++) {
            const x = island.x + Math.random() * island.w;
            const y = island.y + Math.random() * island.h;
            ctx.fillRect(x, y, 2, 2);
        }
        
        // palm trunk
        ctx.fillStyle = '#8d5524'; 
        ctx.fillRect(island.x + island.w / 2 - 4, island.y - 35, 8, 35);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(island.x + island.w / 2 - 3, island.y - 35, 3, 35);
        
        // palm fronds (palmiye yaprakları)
        const palmT = Date.now() / 1000;
        ctx.fillStyle = '#2ed573';
        const px = island.x + island.w / 2;
        const py = island.y - 35;
        
        // frond 1
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(Math.sin(palmT) * 0.2);
        ctx.fillRect(0, -25, 22, 8);
        ctx.restore();
        
        // frond 2
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(Math.sin(palmT + 2) * 0.2 + Math.PI * 0.66);
        ctx.fillRect(0, -25, 22, 8);
        ctx.restore();
        
        // frond 3
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(Math.sin(palmT + 4) * 0.2 + Math.PI * 1.33);
        ctx.fillRect(0, -25, 22, 8);
        ctx.restore();
        
        // sand shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)'; 
        ctx.fillRect(island.x + 8, island.y + 35, island.w - 16, 15);
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; 
        ctx.fillRect(island.x + 10, island.y + 8, island.w - 20, 3);

        // boats (P1 blue, P2 red)
        drawBoat(p1, '#2e86de', players.p1, turn === 1, 1);
        drawBoat(p2, '#ff4757', players.p2, turn === 2, 2);

        // aim cursors (nişan imleçleri - daha detaylı)
        const cursor = (p, col) => {
            // outer ring
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.aimX, p.aimY, 10, 0, Math.PI * 2);
            ctx.stroke();
            
            // inner circle
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(p.aimX, p.aimY, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // crosshair center
            ctx.fillStyle = '#0b1020';
            ctx.fillRect(p.aimX - 1, p.aimY - 1, 2, 2);
            
            // crosshair lines
            ctx.strokeStyle = col;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(p.aimX - 8, p.aimY);
            ctx.lineTo(p.aimX - 14, p.aimY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(p.aimX + 8, p.aimY);
            ctx.lineTo(p.aimX + 14, p.aimY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(p.aimX, p.aimY - 8);
            ctx.lineTo(p.aimX, p.aimY - 14);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(p.aimX, p.aimY + 8);
            ctx.lineTo(p.aimX, p.aimY + 14);
            ctx.stroke();
            
            // glow
            ctx.shadowColor = col;
            ctx.shadowBlur = 8;
            ctx.strokeStyle = col;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(p.aimX, p.aimY, 12, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        };
        cursor(p1, '#00f2ff');
        cursor(p2, '#ffd32a');

        // projectile (mermi - canlı)
        if (proj) {
            // trail effect
            ctx.fillStyle = 'rgba(255,208,0,0.3)';
            ctx.beginPath();
            ctx.arc(proj.x + proj.vx, proj.y + proj.vy, 5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255,208,0,0.15)';
            ctx.beginPath();
            ctx.arc(proj.x + proj.vx * 2, proj.y + proj.vy * 2, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // main projectile
            ctx.fillStyle = '#111827'; 
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffd32a'; 
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // highlight
            ctx.fillStyle = 'rgba(255,255,255,0.4)'; 
            ctx.beginPath();
            ctx.arc(proj.x - 1, proj.y - 1, 1, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // explosions (patlamalar)
        for (const exp of explosions) {
            const alpha = exp.life / exp.maxLife;
            ctx.fillStyle = `rgba(255, ${Math.round(165 * alpha)}, 0, ${alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(exp.x, exp.y, exp.size * (1 - alpha * 0.5), 0, Math.PI * 2);
            ctx.fill();
            
            // secondary particles
            ctx.fillStyle = `rgba(255, 255, 0, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(exp.x, exp.y, exp.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }

        // HUD
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#ffd32a'; 
        ctx.font = 'bold 16px Inter'; 
        ctx.textAlign = 'center';
        ctx.fillText(`${turn === 1 ? '► ' : ''}${players.p1} vs ${players.p2}${turn === 2 ? ' ◄' : ''}`, 320, 24);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = 'rgba(255,211,0,0.9)'; 
        ctx.font = 'bold 24px Inter';
        ctx.fillText(`${Math.max(0, Math.ceil(timeLeft))}s`, 580, 28);
        
        ctx.fillStyle = '#9494b8'; 
        ctx.font = '11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`Nişan: Hareket Tuşlarıyla Yön Belirle`, 320, 410);
        
        ctx.font = '10px Inter';
        ctx.fillText(`P1: A/D + W/S + BOŞLUK  |  P2: J/L + I/K + ENTER`, 320, 420);
    }

    const kd = (e) => { keys[e.key] = true; keys[e.key.toLowerCase()] = true; e.preventDefault(); };
    const ku = (e) => { keys[e.key] = false; keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    const timer = setInterval(() => {
        if (over) return;
        timeLeft -= 1;
        if (timeLeft <= 0) {
            over = true;
            clearInterval(loop);
            clearInterval(timer);
            if (p1.hp === p2.hp) {
                sfx('draw');
                setTimeout(() => showReplay(container, 'BERABERE!', () => initArtillery(container, difficulty, players)), 450);
            } else {
                sfx('win');
                const winner = p1.hp > p2.hp ? players.p1 : players.p2;
                setTimeout(() => showReplay(container, `${winner} Kazandı!`, () => initArtillery(container, difficulty, players)), 450);
            }
        }
    }, 1000);
    const loop = setInterval(() => { update(); draw(); }, 16);
    return () => { clearInterval(loop); clearInterval(timer); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); touchP1.destroy?.(); touchP2.destroy?.(); };
}

// ============== GAME INITIALIZERS ==============
const GAME_INITIALIZERS = {
    'reflex': initReflex, 'sumo': initSumo, 'tictactoe': initXOX, 'snake': initSnake,
    'memory': initMemory, 'pong': initPong, 'race': initRace, 'space': initSpace,
    'flappy': initFlappy, 'tank': initTank,
    'breakout': initBreakout, 'dodger': initDodger, 'invaders': initInvaders, 'maze': initMaze, 'lockpick': initLockpick,
    'duel': initDuel, 'tag': initTag, 'bump': initBump, 'volley': initVolley, 'artillery': initArtillery
};
