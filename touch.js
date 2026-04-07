// On-screen touch controls that map to a shared "keys" object.
// Games can call:
//   const { el, destroy } = TouchControls.mount(container, keys, { dpad: true, buttons: [{ key:' ', label:'FIRE', className:'primary' }] })

const TouchControls = (() => {
  function btn(label, className = '', size = 64) {
    const b = document.createElement('div');
    b.className = `touch-btn ${className}`.trim();
    b.textContent = label;
    b.style.width = `${size}px`;
    b.style.height = `${size}px`;
    return b;
  }

  function bindHold(el, keys, keyName, { prevent = true } = {}) {
    const down = (e) => {
      if (prevent) e.preventDefault();
      keys[keyName] = true;
      if (typeof keyName === 'string') keys[keyName.toLowerCase()] = true;
      SFX?.play?.('click');
    };
    const up = (e) => {
      if (prevent) e.preventDefault();
      keys[keyName] = false;
      if (typeof keyName === 'string') keys[keyName.toLowerCase()] = false;
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('pointerleave', up);
    };
  }

  function mount(container, keys, opts = {}) {
    const { dpad = false, buttons = [] } = opts;

    const root = document.createElement('div');
    root.className = 'touch-controls active';
    // mark container so CSS can reserve bottom space
    try { container.classList.add('touch-on'); } catch (_) {}

    const destroys = [];

    if (dpad) {
      const pad = document.createElement('div');
      pad.className = 'touch-pad';
      // 3x3 grid: up at [1], left [3], right [5], down [7]
      const cells = Array.from({ length: 9 }, () => document.createElement('div'));
      cells.forEach((c) => (c.style.pointerEvents = 'none'));

      const upBtn = btn('↑', 'primary');
      const leftBtn = btn('←', 'primary');
      const rightBtn = btn('→', 'primary');
      const downBtn = btn('↓', 'primary');
      upBtn.style.pointerEvents = leftBtn.style.pointerEvents = rightBtn.style.pointerEvents = downBtn.style.pointerEvents = 'auto';

      destroys.push(bindHold(upBtn, keys, 'ArrowUp'));
      destroys.push(bindHold(downBtn, keys, 'ArrowDown'));
      destroys.push(bindHold(leftBtn, keys, 'ArrowLeft'));
      destroys.push(bindHold(rightBtn, keys, 'ArrowRight'));

      cells[1] = upBtn;
      cells[3] = leftBtn;
      cells[5] = rightBtn;
      cells[7] = downBtn;
      cells.forEach((c) => pad.appendChild(c));
      root.appendChild(pad);
    } else {
      const spacer = document.createElement('div');
      spacer.style.width = '1px';
      root.appendChild(spacer);
    }

    const actions = document.createElement('div');
    actions.className = 'touch-actions';

    buttons.forEach((b) => {
      const el = btn(b.label, b.className || 'primary', 64);
      destroys.push(bindHold(el, keys, b.key));
      actions.appendChild(el);
    });

    root.appendChild(actions);
    container.appendChild(root);

    const destroy = () => {
      destroys.forEach((d) => d());
      root.remove();
      try { container.classList.remove('touch-on'); } catch (_) {}
    };

    return { el: root, destroy };
  }

  return { mount };
})();

