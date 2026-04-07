// WebAudio SFX (no external audio files required)
// Usage: SFX.unlock(); SFX.play('click' | 'start' | 'hit' | 'point' | 'coin' | 'jump' | 'shoot' | 'win' | 'lose' | 'draw');

const SFX = (() => {
  let ctx = null;
  let master = null;
  let music = null;
  let profile = 'default';
  let musicGain = null;
  let musicLP = null;
  let musicNodes = [];
  let musicTimers = [];
  let muted = false;
  let unlocked = false;

  function ensure() {
    if (ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = 0.55;
    // Smooth out harsh/buzzy tones
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -22;
    comp.knee.value = 20;
    comp.ratio.value = 4;
    comp.attack.value = 0.004;
    comp.release.value = 0.18;
    master.connect(comp);
    comp.connect(ctx.destination);

    musicGain = ctx.createGain();
    // louder so it's clearly audible on phones too
    musicGain.gain.value = 0.28;
    musicLP = ctx.createBiquadFilter();
    musicLP.type = 'lowpass';
    musicLP.frequency.value = 1400;
    musicLP.Q.value = 0.8;
    musicGain.connect(musicLP);
    musicLP.connect(master);
  }

  async function unlock() {
    try {
      ensure();
      // don't block; some browsers resume async
      if (ctx.state === 'suspended') ctx.resume();
      // tiny silent beep to satisfy gesture chains
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      g.gain.value = 0.00001;
      o.connect(g);
      g.connect(master);
      o.start();
      o.stop(ctx.currentTime + 0.01);
      unlocked = true;
    } catch (_) {
      // ignore
    }
  }

  function envGain(g, t0, a, d, s, r, peak = 0.7) {
    g.gain.cancelScheduledValues(t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * s), t0 + a + d);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d + r);
  }

  function tone({ type = 'square', f = 440, f2 = null, dur = 0.12, gain = 0.7, detune = 0, slide = 0 } = {}) {
    ensure();
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.detune.value = detune;
    o.frequency.setValueAtTime(f, t0);
    if (f2 != null) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(50, f * slide), t0 + dur);
    envGain(g, t0, 0.005, 0.03, 0.35, Math.max(0.04, dur), gain);
    o.connect(g);
    g.connect(master);
    o.start(t0);
    o.stop(t0 + dur + 0.08);
  }

  function chord({ freqs = [440, 550, 660], type = 'triangle', dur = 0.22, gain = 0.35 } = {}) {
    ensure();
    freqs.forEach((f, i) => {
      tone({ type, f, f2: f * (i === 0 ? 1.01 : 1.0), dur, gain: gain * (i === 0 ? 1 : 0.8), detune: i * 2 });
    });
  }

  function sparkle({ base = 880, steps = [1, 1.25, 1.5, 2], gap = 0.055, type = 'square', gain = 0.22 } = {}) {
    ensure();
    const t0 = ctx.currentTime;
    steps.forEach((m, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(base * m, t0 + i * gap);
      envGain(g, t0 + i * gap, 0.002, 0.02, 0.2, 0.05, gain);
      o.connect(g);
      g.connect(master);
      o.start(t0 + i * gap);
      o.stop(t0 + i * gap + 0.09);
    });
  }

  function noise({ dur = 0.12, gain = 0.4, hp = 900 } = {}) {
    ensure();
    const t0 = ctx.currentTime;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = hp;
    const g = ctx.createGain();
    envGain(g, t0, 0.002, 0.02, 0.25, dur, gain);
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(t0);
    src.stop(t0 + dur);
  }

  function play(name) {
    if (!unlocked) return;
    if (muted) return;
    const p = String(profile || 'default').toLowerCase();
    const n = String(name || '').toLowerCase();

    // Per-game SFX tint: keep similar genres similar, but every game distinct.
    // We "bend" frequency, waveform, and brightness a bit per profile.
    const tint = (() => {
      switch (p) {
        case 'space': return { bright: 2200, det: 6, base: 1.08, wave: 'square' };
        case 'invaders': return { bright: 2000, det: 4, base: 1.05, wave: 'square' };
        case 'flappy': return { bright: 1600, det: 2, base: 1.00, wave: 'triangle' };
        case 'snake': return { bright: 1500, det: 1, base: 0.98, wave: 'triangle' };
        case 'memory': return { bright: 1300, det: 0, base: 0.95, wave: 'sine' };
        case 'maze': return { bright: 1200, det: 0, base: 0.92, wave: 'sine' };
        case 'lockpick': return { bright: 2600, det: 3, base: 1.02, wave: 'triangle' };
        case 'sumo': return { bright: 900, det: -2, base: 0.88, wave: 'sine' };
        case 'tank': return { bright: 1100, det: -3, base: 0.90, wave: 'sawtooth' };
        case 'duel': return { bright: 1400, det: -1, base: 0.94, wave: 'square' };
        case 'artillery': return { bright: 1200, det: -2, base: 0.92, wave: 'triangle' };
        case 'race': return { bright: 1800, det: 2, base: 1.06, wave: 'square' };
        case 'pong': return { bright: 1500, det: 1, base: 1.00, wave: 'triangle' };
        case 'breakout': return { bright: 1700, det: 1, base: 1.02, wave: 'triangle' };
        case 'dodger': return { bright: 2100, det: 2, base: 1.01, wave: 'square' };
        case 'tictactoe': return { bright: 1600, det: 0, base: 0.99, wave: 'sine' };
        case 'tag': return { bright: 1750, det: 1, base: 1.03, wave: 'triangle' };
        case 'bump': return { bright: 1650, det: 1, base: 1.01, wave: 'square' };
        case 'volley': return { bright: 1550, det: 0, base: 1.00, wave: 'sine' };
        case 'reflex': return { bright: 1900, det: 2, base: 1.04, wave: 'square' };
        default: return { bright: 1500, det: 0, base: 1.0, wave: 'triangle' };
      }
    })();

    const filtTone = (opts) => {
      ensure();
      const t0 = ctx.currentTime;
      const o = ctx.createOscillator();
      o.type = opts.type || tint.wave;
      o.detune.value = (opts.detune || 0) + tint.det;
      o.frequency.setValueAtTime((opts.f || 440) * tint.base, t0);
      if (opts.f2 != null) o.frequency.exponentialRampToValueAtTime((opts.f2 * tint.base), t0 + (opts.dur || 0.1));
      const g = ctx.createGain();
      envGain(g, t0, 0.005, 0.03, 0.35, Math.max(0.04, (opts.dur || 0.1)), opts.gain || 0.2);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = opts.lpHz || tint.bright;
      lp.Q.value = 0.7;
      o.connect(g);
      g.connect(lp);
      lp.connect(master);
      o.start(t0);
      o.stop(t0 + (opts.dur || 0.1) + 0.08);
      musicNodes.push(o, g, lp);
    };

    switch (name) {
      case 'click':
        filtTone({ type: n === 'click' ? tint.wave : 'triangle', f: 740, f2: 520, dur: 0.05, gain: 0.18, lpHz: tint.bright });
        break;
      case 'start':
        // keep start consistent across games, but slightly tinted
        filtTone({ type: 'triangle', f: 392, f2: 523.25, dur: 0.10, gain: 0.12, lpHz: tint.bright });
        filtTone({ type: 'triangle', f: 523.25, f2: 659.25, dur: 0.12, gain: 0.12, lpHz: tint.bright });
        sparkle({ base: 740 * tint.base, steps: [1, 1.25, 1.5], gap: 0.05, gain: 0.14 });
        break;
      case 'hit':
        filtTone({ type: tint.wave, f: 210, f2: 120, dur: 0.07, gain: 0.20, lpHz: Math.max(650, tint.bright * 0.8) });
        noise({ dur: 0.05, gain: 0.14, hp: Math.max(700, tint.bright * 0.6) });
        break;
      case 'point':
        filtTone({ type: 'sine', f: 784, f2: 1174, dur: 0.10, gain: 0.16, lpHz: tint.bright });
        sparkle({ base: 988 * tint.base, steps: [1, 1.5], gap: 0.05, gain: 0.11 });
        break;
      case 'coin':
        sparkle({ base: 880 * tint.base, steps: [1, 1.25, 1.5, 2], gap: 0.05, type: tint.wave === 'sine' ? 'triangle' : tint.wave, gain: 0.13 });
        break;
      case 'win':
        // win remains clearly "win", but each game has slightly different brightness/pitch
        filtTone({ type: 'triangle', f: 523.25, f2: 659.25, dur: 0.16, gain: 0.18, lpHz: tint.bright });
        filtTone({ type: 'triangle', f: 659.25, f2: 783.99, dur: 0.16, gain: 0.16, lpHz: tint.bright });
        sparkle({ base: 659.25 * tint.base, steps: [1, 1.25, 1.5, 2], gap: 0.05, gain: 0.12 });
        break;
      case 'confetti':
        noise({ dur: 0.08, gain: 0.14, hp: 1200 });
        filtTone({ type: 'triangle', f: 880, f2: 1100, dur: 0.08, gain: 0.10, lpHz: 1800 });
        sparkle({ base: 1100 * tint.base, steps: [1, 1.15, 1.3], gap: 0.04, gain: 0.08 });
        break;
      case 'lose':
        filtTone({ type: 'sawtooth', f: 220, f2: 130, dur: 0.22, gain: 0.22, lpHz: Math.max(650, tint.bright * 0.7) });
        filtTone({ type: 'sawtooth', f: 164.81, f2: 98, dur: 0.26, gain: 0.16, detune: -4, lpHz: Math.max(650, tint.bright * 0.7) });
        noise({ dur: 0.09, gain: 0.12, hp: 800 });
        break;
      case 'draw':
        filtTone({ type: 'triangle', f: 392, f2: 493.88, dur: 0.14, gain: 0.12, lpHz: tint.bright });
        filtTone({ type: 'triangle', f: 493.88, f2: 587.33, dur: 0.14, gain: 0.10, lpHz: tint.bright });
        break;
      case 'jump':
        filtTone({ type: 'square', f: 560, f2: 820, dur: 0.06, gain: 0.12, lpHz: tint.bright });
        break;
      case 'shoot':
        filtTone({ type: 'square', f: 980, f2: 640, dur: 0.05, gain: 0.10, lpHz: Math.max(900, tint.bright) });
        noise({ dur: 0.03, gain: 0.06, hp: Math.max(1400, tint.bright) });
        break;
      default:
        filtTone({ type: 'triangle', f: 440, dur: 0.08, gain: 0.10, lpHz: tint.bright });
    }
  }

  function stopMusic() {
    if (!ctx) return;
    musicTimers.forEach((id) => {
      try { clearInterval(id); } catch (_) {}
      try { clearTimeout(id); } catch (_) {}
    });
    musicTimers = [];
    musicNodes.forEach((n) => {
      try { n.stop?.(); } catch (_) {}
      try { n.disconnect?.(); } catch (_) {}
    });
    musicNodes = [];
    music = null;
  }

  function setMuted(v) {
    muted = !!v;
    if (!ctx) return muted;
    master.gain.value = muted ? 0.00001 : 0.55;
    return muted;
  }

  function isMuted() { return muted; }

  function setMusicProfile(profileName) {
    music = profileName || 'default';
    profile = music;
  }

  function startMusic() {
    if (muted) return;
    ensure();
    // allow scheduling even if resume is pending
    unlocked = true;
    stopMusic();
    const t0 = ctx.currentTime;

    // tiny helper to create a soft loop with oscillators
    const mk = (type, f, gain, pan = 0, lpHz = 1400) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f, t0);
      const g = ctx.createGain();
      g.gain.value = gain;
      // light tremolo
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.25 + Math.random() * 0.25;
      const lfoG = ctx.createGain();
      lfoG.gain.value = gain * 0.35;
      lfo.connect(lfoG);
      lfoG.connect(g.gain);

      // lowpass to remove "zzz" harshness on sustained tones
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = lpHz;
      lp.Q.value = 0.7;

      let nodeOut = lp;
      if (ctx.createStereoPanner) {
        const p = ctx.createStereoPanner();
        p.pan.value = pan;
        lp.connect(p);
        nodeOut = p;
      }
      nodeOut.connect(musicGain);
      o.connect(g);
      g.connect(lp);
      o.start();
      lfo.start();
      musicNodes.push(o, g, lp, lfo, lfoG);
      return o;
    };

    const oneShot = (type, f, dur, gain, detune = 0) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f, ctx.currentTime);
      o.detune.value = detune;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + Math.max(0.03, dur));
      o.connect(g);
      g.connect(musicGain);
      o.start();
      o.stop(ctx.currentTime + dur + 0.05);
      musicNodes.push(o, g);
    };

    const drum = (kind = 'kick') => {
      // Very lightweight "taiko-ish" / arcade drums with noise + pitch drop
      const now = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const nBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.08), ctx.sampleRate);
      const d = nBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const n = ctx.createBufferSource();
      n.buffer = nBuf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = kind === 'snare' ? 1400 : 220;
      bp.Q.value = kind === 'snare' ? 0.8 : 1.2;
      const ng = ctx.createGain();

      o.type = kind === 'snare' ? 'square' : 'sine';
      o.frequency.setValueAtTime(kind === 'snare' ? 240 : 140, now);
      o.frequency.exponentialRampToValueAtTime(kind === 'snare' ? 180 : 60, now + 0.06);

      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(kind === 'snare' ? 0.06 : 0.09, now + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);

      ng.gain.setValueAtTime(0.0001, now);
      ng.gain.exponentialRampToValueAtTime(kind === 'snare' ? 0.06 : 0.03, now + 0.005);
      ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      o.connect(g);
      g.connect(musicGain);

      n.connect(bp);
      bp.connect(ng);
      ng.connect(musicGain);

      o.start(now);
      o.stop(now + 0.12);
      n.start(now);
      n.stop(now + 0.08);
      musicNodes.push(o, g, n, bp, ng);
    };

    const startBeat = (bpm, fn) => {
      const stepMs = Math.round(60000 / bpm);
      let step = 0;
      const id = setInterval(() => { fn(step++); }, stepMs);
      musicTimers.push(id);
    };

    // One global fun theme for ALL games (requested).
    // Uses short one-shots + drums (no harsh sustained buzz).
    const note = (type, f, dur, gain, detune = 0) => oneShot(type, f, dur, gain, detune);
    const tri = (f, d = 0.07, g = 0.012) => note('triangle', f, d, g);
    const sin = (f, d = 0.08, g = 0.010) => note('sine', f, d, g);
    const sq = (f, d = 0.06, g = 0.010, det = 0) => note('square', f, d, g, det);
    const seqA = [523.25, 659.25, 783.99, 659.25, 523.25, 440, 392, 440];
    const seqB = [392, 440, 493.88, 587.33, 659.25, 587.33, 493.88, 440];
    startBeat(136, (s) => {
      // drums
      if (s % 4 === 0) drum('kick');
      if (s % 8 === 4) drum('snare');
      // bass pulse
      if (s % 2 === 0) sin(196, 0.07, 0.010);
      // lead
      if (s % 2 === 0) tri(seqA[s % seqA.length], 0.06, 0.012);
      // sparkle fill
      if (s % 16 === 14) sq(seqB[s % seqB.length] * 2, 0.04, 0.008, 3);
    });
  }

  return { unlock, play, startMusic, stopMusic, setMusicProfile, setMuted, isMuted };
})();

// Autounlock on first user gesture (click/touch/keydown)
window.addEventListener('pointerdown', () => SFX.unlock(), { once: true });
window.addEventListener('keydown', () => SFX.unlock(), { once: true });

