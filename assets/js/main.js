/* ============================================================
   PINO — motion layer (GSAP + ScrollTrigger + ScrollSmoother)
   ============================================================ */
(function () {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 900px)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";

  /* ---------------------- always-on behaviours ----------------------- */
  initOverlay();
  initHeaderState();
  initPinoAnima(); // looping food-toss line-art in the hero (handles reduced/no-GSAP itself)
  initScatterStatic(); // resting collage layout; GSAP overrides with scroll scatter below
  initAnchorScroll(); // smooth in-page scroll for [data-scroll-to] links

  if (!hasGSAP || reduced) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

  /* ---------------------------- smoother ----------------------------- */
  const smoother = ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: isMobile ? 0 : 1.1,
    effects: false,
    normalizeScroll: true,
  });

  /* --------------------------- intro timeline ------------------------ */
  const intro = gsap.timeline({ defaults: { ease: "expo.out" } });

  // hero animation rises up into frame
  intro.from("[data-anima]", { yPercent: 18, opacity: 0, duration: 1.6, ease: "power3.out" }, 0.2);

  // split + stagger hero lines
  document.querySelectorAll("[data-split]").forEach((el, i) => {
    const split = new SplitText(el, { type: "chars" });
    intro.from(
      split.chars,
      { yPercent: 115, opacity: 0, duration: 1, stagger: 0.04 },
      0.25 + i * 0.12
    );
  });

  intro.from("[data-hero-sub]", { y: 24, opacity: 0, duration: 1 }, "-=0.6");
  intro.from(".scroll-cue", { opacity: 0, scale: 0.7, duration: 0.8 }, "-=0.7");
  intro.from(".header__actions > *", { y: -20, opacity: 0, duration: 0.7, stagger: 0.1 }, "-=0.8");
  intro.from(".header__brand", { y: -20, opacity: 0, duration: 0.7 }, "-=0.7");
  intro.to(".header__menu-edge", { opacity: 0.85, duration: 1 }, "-=0.4");

  /* ------------------------- hero parallax --------------------------- */
  gsap.to(".hero__inner", {
    yPercent: -10,
    opacity: 0.2,
    ease: "none",
    scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: true },
  });
  gsap.to("[data-anima]", {
    yPercent: 14,
    ease: "none",
    scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: true },
  });

  /* ----------------------- story image drift ------------------------- */
  document.querySelectorAll("[data-parallax]").forEach((el) => {
    const depth = parseFloat(el.getAttribute("data-parallax")) || 0.1;
    gsap.fromTo(
      el,
      { yPercent: depth * 60 },
      {
        yPercent: depth * -60,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
      }
    );
  });

  /* ----------------------- SplitText reveals ------------------------- */
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    const split = new SplitText(el, { type: "lines", linesClass: "line-clip" });
    gsap.set(split.lines, { overflow: "hidden" });
    gsap.from(split.lines, {
      yPercent: 110,
      opacity: 0,
      duration: 1.1,
      ease: "expo.out",
      stagger: 0.08,
      scrollTrigger: { trigger: el, start: "top 85%" },
    });
  });

  /* ------------------ pinned horizontal food gallery ----------------- */
  if (!isMobile) {
    const track = document.querySelector("[data-table-track]");
    const pin = document.querySelector("[data-table-pin]");
    if (track && pin) {
      const getDistance = () => track.scrollWidth - window.innerWidth;
      gsap.to(track, {
        x: () => -getDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: "[data-table]",
          start: "top top",
          end: () => "+=" + getDistance(),
          scrub: 1,
          pin: pin,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    }
  }

  /* -------------------- catalogue split entrance --------------------- */
  if (!isMobile) {
    gsap.from("[data-catalogue] .catalogue__inner", {
      yPercent: 45,
      opacity: 0,
      duration: 1.2,
      ease: "expo.out",
      stagger: 0.14,
      scrollTrigger: { trigger: "[data-catalogue]", start: "top 70%" },
    });
  }

  /* ------------------- scatter gallery on scroll --------------------- */
  {
    const stage = document.querySelector("[data-scatter-stage]");
    const cards = stage ? gsap.utils.toArray("[data-scatter-stage] .scatter__card") : [];
    if (cards.length) {
      const stTl = gsap.timeline({
        scrollTrigger: {
          trigger: "[data-scatter]",
          start: "top top",
          end: "+=120%",
          scrub: 1,
          pin: "[data-scatter-pin]",
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
      cards.forEach((card, i) => {
        const dx = parseFloat(card.dataset.x) || 0;
        const dy = parseFloat(card.dataset.y) || 0;
        const dr = parseFloat(card.dataset.r) || 0;
        const stackRot = (i - (cards.length - 1) / 2) * 2; // slight fan while piled
        stTl.fromTo(
          card,
          { xPercent: -50, yPercent: -50, x: 0, y: 0, rotation: stackRot, scale: 0.92 },
          {
            x: () => window.innerWidth * (dx / 100) * (window.innerWidth < 900 ? 0.5 : 1),
            y: () => window.innerHeight * (dy / 100) * (window.innerWidth < 900 ? 0.62 : 1),
            rotation: dr,
            scale: 1,
            ease: "power2.out",
          },
          0
        );
      });
    }
  }

  /* -------------------- footer sign-off reveal ----------------------- */
  gsap.from("[data-footer-word]", {
    yPercent: 60,
    opacity: 0,
    duration: 1.3,
    ease: "expo.out",
    scrollTrigger: { trigger: "[data-footer-word]", start: "top 90%" },
  });

  /* -------------------- scattered food line-art ---------------------- */
  const foodItems = gsap.utils.toArray("[data-reserve-food]");
  if (foodItems.length) {
    /* pop in on scroll, staggered */
    gsap.from(foodItems, {
      scale: 0,
      opacity: 0,
      duration: 0.9,
      ease: "back.out(1.7)",
      stagger: { each: 0.08, from: "random" },
      scrollTrigger: { trigger: "#reservations", start: "top 80%" },
      onComplete: floatFood,
    });

    /* endless gentle float + sway, each its own rhythm */
    function floatFood() {
      foodItems.forEach((el, i) => {
        gsap.to(el, {
          yPercent: gsap.utils.random(-22, -10),
          rotation: gsap.utils.random(-9, 9),
          duration: gsap.utils.random(3, 5),
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: i * 0.2,
        });
      });
    }
  }

  ScrollTrigger.refresh();

  /* =================================================================== */
  /*  OVERLAY MENU                                                       */
  /* =================================================================== */
  function initOverlay() {
    const overlay = document.querySelector("[data-overlay]");
    if (!overlay) return;

    const openBtn = document.querySelector("[data-menu-open]");
    const closeBtn = document.querySelector("[data-menu-close]");
    const items = overlay.querySelectorAll("[data-nav-item]");
    const links = overlay.querySelectorAll("[data-nav-item] a");
    const previewImg = overlay.querySelector("[data-overlay-image]");
    let lastFocus = null;
    let open = false;

    function setOpen(state) {
      open = state;
      overlay.setAttribute("aria-hidden", String(!state));

      if (hasGSAP && !reduced) {
        if (state) {
          const tl = gsap.timeline();
          tl.set(overlay, { visibility: "visible" });
          tl.to(overlay, { clipPath: "inset(0 0 0% 0)", duration: 0.7, ease: "expo.inOut" });
          tl.from(items, { x: 60, opacity: 0, duration: 0.6, stagger: -0.07, ease: "power3.out" }, "-=0.3");
          tl.from(".overlay__reserve", { opacity: 0, y: 20, duration: 0.5 }, "-=0.2");
        } else {
          gsap.to(overlay, {
            clipPath: "inset(0 0 100% 0)",
            duration: 0.55,
            ease: "expo.inOut",
            onComplete: () => gsap.set(overlay, { visibility: "hidden" }),
          });
        }
      } else {
        overlay.style.visibility = state ? "visible" : "hidden";
        overlay.style.clipPath = state ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)";
      }

      if (state) {
        lastFocus = document.activeElement;
        closeBtn && closeBtn.focus();
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
        lastFocus && lastFocus.focus();
      }
    }

    openBtn && openBtn.addEventListener("click", () => setOpen(true));
    closeBtn && closeBtn.addEventListener("click", () => setOpen(false));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && open) setOpen(false);
    });

    // hover preview (desktop)
    if (previewImg && !isMobile) {
      links.forEach((a) => {
        a.addEventListener("mouseenter", () => {
          const src = a.getAttribute("data-img");
          if (!src) return;
          if (hasGSAP && !reduced) {
            gsap.to(previewImg, {
              opacity: 0,
              duration: 0.18,
              onComplete: () => {
                previewImg.src = src;
                gsap.fromTo(
                  previewImg,
                  { opacity: 0, scale: 1.08, rotation: gsap.utils.random(-2.5, 2.5) },
                  { opacity: 0.55, scale: 1, rotation: 0, duration: 0.8, ease: "power3.out" }
                );
              },
            });
          } else {
            previewImg.src = src;
          }
        });
      });
    }

    // close on nav click + smooth-scroll to target
    links.forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        if (href && href.startsWith("#")) {
          e.preventDefault();
          setOpen(false);
          const target = document.querySelector(href);
          if (target) {
            setTimeout(() => {
              if (window.ScrollSmoother && ScrollSmoother.get()) ScrollSmoother.get().scrollTo(target, true, "top top");
              else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
            }, 450);
          }
        }
      });
    });
  }

  /* ----------- header color state over light sections --------------- */
  function initHeaderState() {
    const header = document.querySelector("[data-header]");
    if (!header) return;
    const light = document.querySelectorAll(".story, .menu");
    if (!hasGSAP) return;
    light.forEach((sec) => {
      ScrollTrigger.create({
        trigger: sec,
        start: "top 80px",
        end: "bottom 80px",
        onToggle: (self) => header.setAttribute("data-scrolled", self.isActive ? "dark" : ""),
      });
    });
  }

  /* ----------- smooth in-page anchor scroll ------------------------- */
  function initAnchorScroll() {
    document.querySelectorAll("a[data-scroll-to]").forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        if (!href || !href.startsWith("#")) return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        if (window.ScrollSmoother && ScrollSmoother.get()) {
          ScrollSmoother.get().scrollTo(target, true, "top top");
        } else {
          target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
        }
      });
    });
  }

  /* ----------- scatter gallery resting layout (no-scroll) ----------- */
  function initScatterStatic() {
    document.querySelectorAll("[data-scatter-stage] .scatter__card").forEach((card) => {
      const dx = parseFloat(card.dataset.x) || 0;
      const dy = parseFloat(card.dataset.y) || 0;
      const dr = parseFloat(card.dataset.r) || 0;
      const narrow = window.innerWidth < 900;
      const fx = dx * (narrow ? 0.5 : 1);
      const fy = dy * (narrow ? 0.62 : 1);
      card.style.transform = `translate(calc(-50% + ${fx}vw), calc(-50% + ${fy}vh)) rotate(${dr}deg)`;
    });
  }

  /* ----------- reusable food-toss line-art animation ----------------- */
  function initPinoAnima() {
    const containers = document.querySelectorAll("[data-pino-anima]");
    if (!containers.length) return;

    containers.forEach(async (container) => {
      if (!container.querySelector("svg#pino")) {
        const src = container.getAttribute("data-pino-anima-src") || "assets/img/pino-anima.svg";
        try {
          const response = await fetch(src);
          if (!response.ok) throw new Error(`Could not load ${src}`);
          container.innerHTML = await response.text();
        } catch (error) {
          console.warn("Pino animation SVG failed to load:", error);
          return;
        }
      }
      animatePinoAnima(container);
    });
  }

  function animatePinoAnima(container) {
    const svg = container.querySelector("svg#pino");
    if (!svg) return;

    const figures = ["pizza", "caltzone", "pasta", "gelato"];
    const lines = ["pizzalines", "caltzolines", "pastalines", "gelatines"];
    const get = (id) => container.querySelector(`[id="${id}"]`);

    // No motion: show the first dish, hide the rest.
    if (!hasGSAP || reduced) {
      figures.forEach((id, i) => { const e = get(id); if (e) e.style.opacity = i === 0 ? 1 : 0; });
      lines.forEach((id) => { const e = get(id); if (e) e.style.opacity = 0; });
      const pl = get("pizzalines"); if (pl) pl.style.opacity = 1;
      return;
    }

    const pino__tl = gsap.timeline({ paused: true, repeat: -1, defaults: { ease: "power2.inOut", duration: 1 } });
    const lines__tl = gsap.timeline({ paused: true, repeat: -1, defaults: { ease: "power2.inOut", duration: 1 } });

    figures.forEach((id) => {
      const figure = get(id);
      if (!figure) return;
      gsap.set(figure, { opacity: 0 });
      pino__tl.to(figure, { opacity: 1, duration: 0.001 });
      pino__tl.to(figure, { opacity: 0, yoyo: true, duration: 0.001, delay: 1 }, "<");
    });

    lines.forEach((id) => {
      const line = get(id);
      if (!line) return;
      gsap.set(line, { opacity: 0, transformOrigin: "50% 50%" });
      lines__tl.to(line, { opacity: 1, duration: 0.15, delay: 0.1, ease: "bounce.out" });
      lines__tl.to(line, { rotation: (Math.round(Math.random()) * 2 - 1) * 0.15, scale: 1.01, duration: 0.25 }, "<");
      lines__tl.to(line, { opacity: 0, scale: 1, duration: 0.001, delay: 0.9 }, "<");
    });

    pino__tl.play();
    lines__tl.play();
  }

  /* ------------------------------------------------------------------ *
   *  PREVIEW LOCK — landing page only.                                  *
   *  Disables the overlay menu nav links and every link to the          *
   *  secondary catalogue.html. Remove this whole block to restore.      *
   * ------------------------------------------------------------------ */
  (function previewLock() {
    const dead = [
      ...document.querySelectorAll(".overlay__nav ul a"),
      ...document.querySelectorAll('a[href*="catalogue.html"]'),
    ];
    dead.forEach((a) => {
      a.classList.add("is-disabled");
      a.setAttribute("aria-disabled", "true");
      a.setAttribute("tabindex", "-1");
      if (a.hasAttribute("href")) {
        a.dataset.href = a.getAttribute("href"); // stash for easy restore
        a.removeAttribute("href");
      }
      a.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); });
    });
  })();
})();
