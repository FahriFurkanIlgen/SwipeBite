// Scroll reveal animations
(function () {
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // Selectors auto-tagged for reveal animation
  const SELECTORS = [
    ".hero__inner > .eyebrow",
    ".hero__inner > .display-xl",
    ".hero__inner > .lead",
    ".hero__inner > .hero__actions",
    ".hero__inner > .hero__meta",
    ".hero__art",
    ".section__head > *",
    ".feature-card",
    ".step",
    ".split__copy > *",
    ".split__visual",
    ".testimonial",
    ".faq__list > details",
    ".cta__inner > *",
    ".social__row",
  ];

  const targets = document.querySelectorAll(SELECTORS.join(","));

  if (prefersReduced || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  // Mark elements as reveal candidates and assign a stagger index per parent
  const groupCounters = new Map();
  targets.forEach((el) => {
    el.classList.add("reveal");
    const parent = el.parentElement;
    const idx = groupCounters.get(parent) ?? 0;
    el.style.setProperty("--reveal-delay", `${Math.min(idx, 8) * 80}ms`);
    groupCounters.set(parent, idx + 1);
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
  );

  targets.forEach((el) => io.observe(el));

  // Subtle parallax for hero art blobs / card stack
  const heroArt = document.querySelector(".hero__art");
  if (heroArt) {
    const onScroll = () => {
      const y = window.scrollY;
      heroArt.style.setProperty("--parallax", `${Math.min(y * 0.08, 40)}px`);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
  }
})();
