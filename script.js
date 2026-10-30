/* =========================================================
   CONFIGURAÇÃO
   ========================================================= */
const WA_NUMBER = '5517991302572'; // DDI + DDD + número, só dígitos
const WA_DEFAULT = 'Olá! Gostaria de agendar uma consulta.';
const waURL = (msg) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

/* ---------- Ano no rodapé ---------- */
document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Links de WhatsApp ---------- */
document.querySelectorAll('.wa-link').forEach(el => {
  el.href = waURL(el.dataset.wa || WA_DEFAULT);
  el.target = '_blank';
  el.rel = 'noopener';
});

/* ---------- Tema dia / noite ---------- */
const themeBtn = document.getElementById('themeBtn');
themeBtn.addEventListener('click', () => {
  const atual = document.documentElement.getAttribute('data-theme');
  const novo = atual === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', novo);
  try { localStorage.setItem('tema', novo); } catch (e) {}
});

/* ---------- Navbar sólida ao rolar ---------- */
const navbar = document.getElementById('navbar');
const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Menu mobile ---------- */
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const toggleMenu = (force) => {
  const open = force ?? !mobileMenu.classList.contains('open');
  mobileMenu.classList.toggle('open', open);
  menuBtn.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
};
menuBtn.addEventListener('click', () => toggleMenu());
document.querySelectorAll('.mobile-link').forEach(a => a.addEventListener('click', () => toggleMenu(false)));

/* ---------- Contadores ---------- */
const counted = new WeakSet();
function animateCount(el) {
  if (counted.has(el)) return;
  counted.add(el);
  const target = +el.dataset.count;
  const dur = 1800;
  const start = performance.now();
  const step = (now) => {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 4);
    el.textContent = Math.round(target * eased).toLocaleString('pt-BR');
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

  /* ---------- Revelar ao rolar ---------- */
const revealEls = document.querySelectorAll('.reveal');

const showEl = (el) => {
  el.classList.add('in');
  el.querySelectorAll('[data-count]').forEach(animateCount);
};

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        showEl(e.target);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px 0px 0px' });
  revealEls.forEach(el => io.observe(el));
} else {
  revealEls.forEach(showEl);
}

// Segurança: mostra tudo que ainda estiver oculto depois de 2,5 s
// (o celular às vezes não dispara a detecção ao rolar rápido)
setTimeout(() => revealEls.forEach(showEl), 2500);

/* ---------- Parallax leve (só desktop) ---------- */
const parallaxEls = [...document.querySelectorAll('[data-speed]')];
const podeParallax = () => window.innerWidth >= 768 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let ticking = false;
function parallax() {
  if (podeParallax()) {
    const vh = window.innerHeight;
    parallaxEls.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const center = r.top + r.height / 2 - vh / 2;
      el.style.transform = `translate3d(0, ${(-center * parseFloat(el.dataset.speed)).toFixed(1)}px, 0)`;
    });
  } else {
    parallaxEls.forEach(el => { el.style.transform = ''; });
  }
  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) { requestAnimationFrame(parallax); ticking = true; }
}, { passive: true });
window.addEventListener('resize', parallax);
parallax();

/* ---------- Cursor glow e ponto (desktop) ---------- */
if (window.matchMedia('(pointer: fine)').matches) {
  const glow = document.getElementById('cursorGlow');
  const dot = document.getElementById('cursorDot');
  let mx = window.innerWidth / 2, my = window.innerHeight / 2, gx = mx, gy = my;

  window.addEventListener('pointermove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
  });

  const loop = () => {
    gx += (mx - gx) * 0.12;
    gy += (my - gy) * 0.12;
    glow.style.transform = `translate(${gx}px, ${gy}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  };
  loop();

  document.querySelectorAll('a, button, select, input, .proto-card, .product-card, .ba, .tool-stage').forEach(el => {
    el.addEventListener('pointerenter', () => dot.classList.add('big'));
    el.addEventListener('pointerleave', () => dot.classList.remove('big'));
  });
}

/* ---------- Carrossel 3D de ferramentas (hero) ---------- */
const ring = document.getElementById('toolRing');
if (ring) {
  const stage = document.getElementById('toolStage');
  const cards = [...ring.querySelectorAll('.tool-card')];
  const labels = [...document.querySelectorAll('[data-label]')];
  const dots = [...document.querySelectorAll('.tool-dots .dot')];
  const prevBtn = document.getElementById('toolPrev');
  const nextBtn = document.getElementById('toolNext');

  const N = cards.length;
  const STEP = 360 / N;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let idx = 0;
  let angle = 0;
  let timer = null;
  let dragging = false;
  let startX = 0;
  let startAngle = 0;

  const radius = () => (window.innerWidth < 768 ? 190 : 250);

  function layout() {
    const R = radius();
    cards.forEach((card, i) => {
      card.style.transform = `rotateY(${i * STEP}deg) translateZ(${R}px)`;
    });
  }

  function go(n) {
    idx = ((n % N) + N) % N;
    angle = -idx * STEP;
    ring.classList.remove('dragging');
    ring.style.transform = `rotateY(${angle}deg)`;
    labels.forEach((l, i) => l.classList.toggle('on', i === idx));
    dots.forEach((d, i) => d.classList.toggle('on', i === idx));
  }

  function startAuto() {
    if (reduceMotion) return;
    stopAuto();
    timer = setInterval(() => go(idx + 1), 4500);
  }
  function stopAuto() { clearInterval(timer); }

  prevBtn.addEventListener('click', () => { go(idx - 1); startAuto(); });
  nextBtn.addEventListener('click', () => { go(idx + 1); startAuto(); });
  dots.forEach((d, i) => d.addEventListener('click', () => { go(i); startAuto(); }));

  stage.addEventListener('pointerdown', (e) => {
    dragging = true;
    startX = e.clientX;
    startAngle = angle;
    stopAuto();
    ring.classList.add('dragging');
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    angle = startAngle + (e.clientX - startX) * 0.35;
    ring.style.transform = `rotateY(${angle}deg)`;
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    go(Math.round(-angle / STEP));
    startAuto();
  };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  stage.addEventListener('pointerenter', () => { if (!dragging) stopAuto(); });
  stage.addEventListener('pointerleave', () => { if (!dragging) startAuto(); });

  window.addEventListener('resize', layout);

  layout();
  go(0);
  startAuto();
}

/* ---------- Filtros de protocolos ---------- */
const filterBtns = document.querySelectorAll('#filters .chip');
const cards = document.querySelectorAll('.proto-card');
filterBtns.forEach(btn => btn.addEventListener('click', () => {
  filterBtns.forEach(b => b.setAttribute('aria-pressed', 'false'));
  btn.setAttribute('aria-pressed', 'true');
  const f = btn.dataset.filter;
  cards.forEach(c => {
    const show = f === 'all' || c.dataset.cat.split(' ').includes(f);
    c.style.display = show ? '' : 'none';
    if (show) requestAnimationFrame(() => c.classList.add('in'));
  });
}));

/* ---------- Expandir protocolos ---------- */
cards.forEach(card => {
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-expanded', 'false');
  const toggle = () => {
    const open = card.classList.toggle('open');
    card.setAttribute('aria-expanded', String(open));
  };
  card.addEventListener('click', toggle);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
});

/* ---------- Hotspots (toque no celular) ---------- */
document.querySelectorAll('.hotspot').forEach(h => {
  h.setAttribute('tabindex', '0');
  h.setAttribute('role', 'button');
  h.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.hotspot.active').forEach(x => { if (x !== h) x.classList.remove('active'); });
    h.classList.toggle('active');
  });
});
document.addEventListener('click', () => {
  document.querySelectorAll('.hotspot.active').forEach(x => x.classList.remove('active'));
});

/* ---------- Slider antes e depois (mouse, toque e teclado) ---------- */
const ba = document.getElementById('ba');
let baDragging = false;
const setPos = (clientX) => {
  const r = ba.getBoundingClientRect();
  const pct = Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100));
  ba.style.setProperty('--pos', pct + '%');
  ba.setAttribute('aria-valuenow', Math.round(pct));
};
ba.addEventListener('pointerdown', (e) => {
  baDragging = true;
  ba.setPointerCapture(e.pointerId);
  setPos(e.clientX);
});
ba.addEventListener('pointermove', (e) => { if (baDragging) setPos(e.clientX); });
ba.addEventListener('pointerup', () => { baDragging = false; });
ba.addEventListener('pointercancel', () => { baDragging = false; });
ba.addEventListener('keydown', (e) => {
  const cur = parseFloat(getComputedStyle(ba).getPropertyValue('--pos')) || 50;
  if (e.key === 'ArrowLeft') ba.style.setProperty('--pos', Math.max(0, cur - 5) + '%');
  if (e.key === 'ArrowRight') ba.style.setProperty('--pos', Math.min(100, cur + 5) + '%');
});

/* ---------- Formulário -> WhatsApp ---------- */
document.getElementById('bookingForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const msg = `Olá! Meu nome é ${f.get('nome')} (${f.get('telefone')}). ` +
    (f.get('procedimento') ? `Tenho interesse em: ${f.get('procedimento')}. ` : '') +
    `Gostaria de agendar uma avaliação.`;
  window.open(waURL(msg), '_blank', 'noopener');
});