document.addEventListener('DOMContentLoaded', () => {
  const gb = document.querySelector('.global-bubbles');
  if (!gb) return;
  const rnd = (min, max) => Math.random() * (max - min) + min;
  const viewH = window.innerHeight || 800;
  // Simple bubbles (bigger, randomized phase)
  for (let i = 0; i < 48; i++) {
    const s = document.createElement('span');
    s.className = 'bubble';
    const size = rnd(12, 42);
    s.style.width = `${size}px`;
    s.style.height = `${size}px`;
    s.style.left = `${rnd(0, 100)}%`;
    s.style.bottom = `${rnd(0, viewH)}px`;
    s.style.setProperty('--dur', `${rnd(10, 22)}s`);
    s.style.setProperty('--drift', `${rnd(-70, 70)}px`);
    s.style.animationDelay = `-${rnd(0, 18)}s`;
    gb.appendChild(s);
  }
  // Logo bubbles
  for (let i = 0; i < 8; i++) {
    const w = document.createElement('div');
    w.className = 'logo-bubble';
    w.style.left = `${rnd(0, 100)}%`;
    w.style.bottom = `${rnd(0, viewH)}px`;
    w.style.setProperty('--size', `${rnd(24, 44)}px`);
    w.style.setProperty('--dur', `${rnd(14, 24)}s`);
    w.style.setProperty('--drift', `${rnd(-80, 80)}px`);
    w.style.animationDelay = `-${rnd(0, 20)}s`;
    w.innerHTML = `
      <div class="logo-icon">
        <div class="arc-1"></div>
        <div class="arc-2"></div>
      </div>
    `;
    gb.appendChild(w);
  }

  // Split effect
  const splitBubble = () => {
    const candidates = Array.from(gb.querySelectorAll('.bubble'));
    if (!candidates.length) return;
    const b = candidates[Math.floor(rnd(0, candidates.length))];
    const left = parseFloat(b.style.left) || rnd(0, 100);
    const bottom = parseFloat(b.style.bottom) || rnd(0, viewH);
    const size = parseFloat(b.style.width) || rnd(12, 42);
    const mk = (dx) => {
      const s = document.createElement('span');
      s.className = 'bubble';
      const newSize = Math.max(8, size * rnd(0.45, 0.65));
      s.style.width = `${newSize}px`;
      s.style.height = `${newSize}px`;
      s.style.left = `${Math.min(100, Math.max(0, left + dx))}%`;
      s.style.bottom = `${bottom + rnd(-20, 20)}px`;
      s.style.setProperty('--dur', `${rnd(10, 18)}s`);
      s.style.setProperty('--drift', `${dx > 0 ? rnd(20, 80) : rnd(-80, -20)}px`);
      s.style.animationDelay = `-${rnd(0, 12)}s`;
      s.style.opacity = '0.9';
      return s;
    };
    const s1 = mk(rnd(-6, -2));
    const s2 = mk(rnd(2, 6));
    gb.appendChild(s1);
    gb.appendChild(s2);
    b.style.opacity = '0.35';
    setTimeout(() => { b.remove(); }, 1500);
    setTimeout(() => { s1.remove(); }, 25000);
    setTimeout(() => { s2.remove(); }, 25000);
  };
  setInterval(splitBubble, 2200);
});
