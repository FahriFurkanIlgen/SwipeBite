// ===========================================================================
// SwipeBite — FUN edition controller
// Swipeable card deck (drag), confetti on match, reveal on scroll
// ===========================================================================

// ---------------------------------------------------------------------------
// Smooth scroll (Lenis) — buttery anchor jumps + wheel inertia
// ---------------------------------------------------------------------------
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

let lenis = null;
if (window.Lenis && !prefersReducedMotion) {
  lenis = new window.Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.4,
  });
  const raf = (time) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}

// Smooth anchor clicks
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const id = link.getAttribute("href");
    if (!id || id === "#") return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) {
      lenis.scrollTo(target, {
        offset: -80,
        duration: 1.6,
        easing: (t) => 1 - Math.pow(1 - t, 4),
      });
    } else {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

const RECIPES = [
  {
    name: "Limonlu tavuklu makarna",
    emoji: "🍝",
    time: "20 dk",
    tag: "Hızlı",
    bg: "#ffe1cc",
    sub: "Tavuk · krema · limon",
  },
  {
    name: "Ev yapımı pizza",
    emoji: "🍕",
    time: "25 dk",
    tag: "Klasik",
    bg: "#ffd9e6",
    sub: "Mozzarella · domates · fesleğen",
  },
  {
    name: "Akdeniz salatası",
    emoji: "🥗",
    time: "10 dk",
    tag: "Sağlıklı",
    bg: "#d1f7e6",
    sub: "Domates · zeytin · feta",
  },
  {
    name: "Bal &amp; muzlu pancake",
    emoji: "🥞",
    time: "15 dk",
    tag: "Tatlı",
    bg: "#fff1b8",
    sub: "Yumurta · süt · muz",
  },
  {
    name: "Acılı tavuk ramen",
    emoji: "🍜",
    time: "30 dk",
    tag: "Acılı",
    bg: "#cce8ff",
    sub: "Erişte · tavuk · pul biber",
  },
  {
    name: "Avokadolu tost",
    emoji: "🥑",
    time: "8 dk",
    tag: "Kahvaltı",
    bg: "#d1f7e6",
    sub: "Ekmek · avokado · yumurta",
  },
  {
    name: "Çikolatalı sufle",
    emoji: "🍫",
    time: "20 dk",
    tag: "Tatlı",
    bg: "#ebdcff",
    sub: "Çikolata · yumurta · tereyağı",
  },
  {
    name: "Ev sushi rolü",
    emoji: "🍣",
    time: "35 dk",
    tag: "Gurme",
    bg: "#cce8ff",
    sub: "Pirinç · somon · avokado",
  },
  {
    name: "Etli taco",
    emoji: "🌮",
    time: "20 dk",
    tag: "Hızlı",
    bg: "#ffe1cc",
    sub: "Kıyma · marul · sos",
  },
  {
    name: "Karpuzlu smoothie",
    emoji: "🍉",
    time: "5 dk",
    tag: "Serinletici",
    bg: "#ffd9e6",
    sub: "Karpuz · nane · yoğurt",
  },
];

const deck = document.getElementById("deck");
const cntYesEl = document.getElementById("cntYes");
const cntNoEl = document.getElementById("cntNo");

let cards = [];
let yes = 0,
  no = 0,
  idx = 0;

// ---------------------------------------------------------------------------
// Build / refill deck
// ---------------------------------------------------------------------------
function makeCard(recipe) {
  const card = document.createElement("div");
  card.className = "swipecard";
  card.style.setProperty("--bg-color", recipe.bg);
  card.innerHTML = `
    <div class="swipecard__art">${recipe.emoji}
      <div class="swipecard__stamp swipecard__stamp--yes">YUM!</div>
      <div class="swipecard__stamp swipecard__stamp--no">PASS</div>
    </div>
    <div class="swipecard__body">
      <div class="swipecard__row">
        <span>⏱ <b>${recipe.time}</b></span>
        <span>${recipe.tag}</span>
      </div>
      <h3 class="swipecard__name">${recipe.name}</h3>
      <p class="swipecard__sub">${recipe.sub}</p>
    </div>
  `;
  attachDrag(card);
  return card;
}

function buildInitial() {
  for (let i = 0; i < 4; i++) {
    const r = RECIPES[idx++ % RECIPES.length];
    const c = makeCard(r);
    deck.appendChild(c);
    cards.push(c);
  }
  // top card is the LAST one in DOM order with our nth-child rules?
  // Our CSS uses nth-child(1) as the front. So we want the FIRST child to be front.
  // Reorder so first child is on top:
  reorderStack();
}

function reorderStack() {
  // Set transforms manually for first 3 (overrides CSS nth-child since we add classes)
  Array.from(deck.children).forEach((c, i) => {
    c.classList.remove("is-top");
    c.style.zIndex = String(20 - i);
    if (c.classList.contains("is-gone")) return;
    if (i === 0) {
      c.style.transform = "translateY(0) scale(1) rotate(-1deg)";
      c.classList.add("is-top");
    } else if (i === 1) {
      c.style.transform = "translateY(12px) scale(0.96) rotate(2deg)";
    } else if (i === 2) {
      c.style.transform = "translateY(22px) scale(0.92) rotate(-2deg)";
    } else {
      c.style.transform = "translateY(30px) scale(0.88)";
      c.style.opacity = "0";
    }
  });
}

// ---------------------------------------------------------------------------
// Drag handling
// ---------------------------------------------------------------------------
function attachDrag(card) {
  let startX = 0,
    startY = 0,
    dx = 0,
    dy = 0,
    dragging = false;

  const onDown = (e) => {
    if (!card.classList.contains("is-top")) return;
    dragging = true;
    card.classList.add("is-dragging");
    const p = getPoint(e);
    startX = p.x;
    startY = p.y;
    card.setPointerCapture &&
      e.pointerId &&
      card.setPointerCapture(e.pointerId);
  };
  const onMove = (e) => {
    if (!dragging) return;
    const p = getPoint(e);
    dx = p.x - startX;
    dy = p.y - startY;
    const rot = dx * 0.06;
    card.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
    const stampYes = card.querySelector(".swipecard__stamp--yes");
    const stampNo = card.querySelector(".swipecard__stamp--no");
    stampYes.style.opacity = Math.max(0, Math.min(1, dx / 100));
    stampNo.style.opacity = Math.max(0, Math.min(1, -dx / 100));
  };
  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    card.classList.remove("is-dragging");
    if (Math.abs(dx) > 110) {
      flyOff(card, dx > 0 ? "yes" : "no");
    } else {
      // snap back
      card.style.transform = "translateY(0) scale(1) rotate(-1deg)";
      card.querySelector(".swipecard__stamp--yes").style.opacity = 0;
      card.querySelector(".swipecard__stamp--no").style.opacity = 0;
    }
    dx = 0;
    dy = 0;
  };

  card.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
}

function getPoint(e) {
  if (e.touches && e.touches[0])
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  return { x: e.clientX, y: e.clientY };
}

function flyOff(card, dir) {
  const targetX = dir === "yes" ? window.innerWidth : -window.innerWidth;
  const rot = dir === "yes" ? 30 : -30;
  card.classList.add("is-gone");
  card.style.transform = `translate(${targetX}px, -80px) rotate(${rot}deg)`;
  card.style.opacity = "0";

  if (dir === "yes") {
    yes++;
    cntYesEl.textContent = yes;
    burstConfetti();
  } else {
    no++;
    cntNoEl.textContent = no;
  }

  setTimeout(() => {
    card.remove();
    cards = cards.filter((c) => c !== card);
    // add fresh card behind
    const r = RECIPES[idx++ % RECIPES.length];
    const fresh = makeCard(r);
    deck.appendChild(fresh);
    cards.push(fresh);
    reorderStack();
  }, 500);
}

// ---------------------------------------------------------------------------
// Action buttons
// ---------------------------------------------------------------------------
document.querySelectorAll(".circle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const action = btn.dataset.action;
    const top = deck.querySelector(".is-top");
    if (!top || top.classList.contains("is-gone")) return;
    if (action === "yes") flyOff(top, "yes");
    else if (action === "no") flyOff(top, "no");
    else {
      // info: little wobble
      top.animate(
        [
          { transform: "translateY(0) rotate(-1deg)" },
          { transform: "translateY(-6px) rotate(4deg)" },
          { transform: "translateY(0) rotate(-4deg)" },
          { transform: "translateY(0) rotate(-1deg)" },
        ],
        { duration: 500, easing: "ease-in-out" },
      );
    }
  });
});

// Keyboard
window.addEventListener("keydown", (e) => {
  const top = deck.querySelector(".is-top");
  if (!top) return;
  if (e.key === "ArrowRight") flyOff(top, "yes");
  if (e.key === "ArrowLeft") flyOff(top, "no");
});

// ---------------------------------------------------------------------------
// Confetti (lightweight)
// ---------------------------------------------------------------------------
const cf = document.getElementById("confetti");
const ctx = cf.getContext("2d");
let pieces = [];
function sizeCanvas() {
  cf.width = window.innerWidth;
  cf.height = window.innerHeight;
}
sizeCanvas();
window.addEventListener("resize", sizeCanvas);

const EMOJIS = [
  "🍕",
  "🍔",
  "🍣",
  "🌮",
  "🍝",
  "🍩",
  "🥗",
  "🍓",
  "🥑",
  "🎉",
  "✨",
  "💚",
];

function burstConfetti() {
  const cx = window.innerWidth * 0.6;
  const cy = window.innerHeight * 0.5;
  for (let i = 0; i < 24; i++) {
    pieces.push({
      x: cx,
      y: cy,
      vx: (Math.random() - 0.5) * 14,
      vy: -8 - Math.random() * 6,
      g: 0.4,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      size: 22 + Math.random() * 18,
      life: 0,
    });
  }
}

function drawConfetti() {
  ctx.clearRect(0, 0, cf.width, cf.height);
  pieces.forEach((p) => {
    p.vy += p.g;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life++;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.font = `${p.size}px serif`;
    ctx.textAlign = "center";
    ctx.fillText(p.emoji, 0, 0);
    ctx.restore();
  });
  pieces = pieces.filter((p) => p.y < window.innerHeight + 60 && p.life < 200);
  requestAnimationFrame(drawConfetti);
}
drawConfetti();

// ---------------------------------------------------------------------------
// Scroll reveal (cheap, no GSAP)
// ---------------------------------------------------------------------------
const popables = document.querySelectorAll(
  ".bubble, .dish, .chat, .ribbon, .menu__head > *, .chats__head > *, .steps-fun__head > *, .join__card",
);
popables.forEach((el) => el.setAttribute("data-pop", ""));

if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          entry.target.style.transitionDelay = `${(i % 6) * 60}ms`;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );
  popables.forEach((el) => io.observe(el));
} else {
  popables.forEach((el) => el.classList.add("is-in"));
}

// Chip toggle
document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document
      .querySelectorAll(".chip")
      .forEach((c) => c.classList.remove("chip--active"));
    chip.classList.add("chip--active");
  });
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
buildInitial();
