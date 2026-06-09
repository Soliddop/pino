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
  initLogoHover(); // inline the header logo so GSAP can tween its fill white -> orange on hover
  initBackToTop(); // floating button -> smooth scroll to top, shows after the first viewport
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
  } else {
    /* mobile: cards stack vertically — reveal + tilt each in, parallax inside frame */
    const intro = document.querySelector("[data-table] .table__intro");
    if (intro) {
      gsap.from(intro.children, {
        yPercent: 45,
        opacity: 0,
        duration: 1,
        ease: "expo.out",
        stagger: 0.12,
        scrollTrigger: { trigger: intro, start: "top 85%" },
      });
    }
    gsap.utils.toArray("[data-table] .table__card").forEach((card, i) => {
      gsap.from(card, {
        yPercent: 16,
        opacity: 0,
        scale: 0.94,
        rotation: i % 2 ? 2.5 : -2.5,
        duration: 1.1,
        ease: "expo.out",
        scrollTrigger: { trigger: card, start: "top 88%" },
      });
      const img = card.querySelector("img");
      if (img) {
        gsap.set(img, { scale: 1.22 }); // buffer so parallax never reveals frame edges
        gsap.fromTo(
          img,
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: "none",
            scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true },
          }
        );
      }
    });
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
  } else {
    /* mobile: halves stack — slow photo zoom-out + words rise as each enters */
    gsap.utils.toArray("[data-catalogue] .catalogue__half").forEach((half) => {
      const photo = half.querySelector(".catalogue__photo");
      const inner = half.querySelector(".catalogue__inner");
      const tl = gsap.timeline({ scrollTrigger: { trigger: half, start: "top 82%" } });
      if (photo) tl.from(photo, { scale: 1.25, opacity: 0, duration: 1.3, ease: "power3.out" }, 0);
      if (inner)
        tl.from(
          inner.children,
          { yPercent: 65, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.12 },
          0.2
        );
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

  /* ----------------------- back to top button ----------------------- */
  function initBackToTop() {
    const btn = document.querySelector("[data-to-top]");
    if (!btn) return;
    btn.removeAttribute("hidden");

    const toTop = () => {
      const sm = window.ScrollSmoother && ScrollSmoother.get && ScrollSmoother.get();
      if (sm) sm.scrollTo(0, !reduced);
      else window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    };
    btn.addEventListener("click", toTop);

    const show = () => btn.classList.add("is-visible");
    const hide = () => btn.classList.remove("is-visible");

    if (hasGSAP) {
      ScrollTrigger.create({
        start: () => window.innerHeight * 0.8,
        end: "max",
        onToggle: (self) => (self.isActive ? show() : hide()),
      });
    } else {
      const onScroll = () => (window.scrollY > window.innerHeight * 0.8 ? show() : hide());
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  }

  /* ----------- logo hover: inline SVG + GSAP fill white -> orange ----- */
  function initLogoHover() {
    const header = document.querySelector("[data-header]");
    const brand = document.querySelector(".header__brand");
    const img = brand && brand.querySelector("img");
    if (!brand || !img) return;

    fetch(img.getAttribute("src"))
      .then((r) => r.text())
      .then((markup) => {
        const tmp = document.createElement("div");
        tmp.innerHTML = markup;
        const svg = tmp.querySelector("svg");
        if (!svg) return;
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.setAttribute("aria-hidden", "true");
        img.replaceWith(svg); // CSS now drives base fill via --logo-fill; :hover is the no-GSAP fallback

        if (!hasGSAP || reduced) return; // CSS :hover handles the tint when motion is off
        const paths = svg.querySelectorAll("path");
        const css = getComputedStyle(document.documentElement);
        const tomato = css.getPropertyValue("--tomato").trim() || "#cf5919";
        const baseColor = () =>
          (header && header.getAttribute("data-scrolled") === "dark"
            ? css.getPropertyValue("--ink")
            : css.getPropertyValue("--paper")
          ).trim() || "#f4ecdc";

        brand.addEventListener("mouseenter", () => {
          gsap.to(paths, { fill: tomato, duration: 0.4, ease: "power2.out", overwrite: true });
        });
        brand.addEventListener("mouseleave", () => {
          gsap.to(paths, {
            fill: baseColor(),
            duration: 0.45,
            ease: "power2.out",
            overwrite: true,
            onComplete: () => paths.forEach((p) => p.style.removeProperty("fill")), // hand back to CSS var
          });
        });
      })
      .catch(() => {}); // fetch failed -> original <img> stays, no harm
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
    const blockNav = (a) => {
      if (a.hasAttribute("href")) {
        a.dataset.href = a.getAttribute("href"); // stash for easy restore
        a.removeAttribute("href");
      }
      a.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); });
    };
    const fullyDisable = (a) => {
      a.classList.add("is-disabled");        // pointer-events:none — kills hover too
      a.setAttribute("aria-disabled", "true");
      a.setAttribute("tabindex", "-1");
      blockNav(a);
    };

    const dead = [
      ...document.querySelectorAll(".overlay__nav ul a"),
      ...document.querySelectorAll('a[href*="catalogue.html"]'),
    ];
    dead.forEach((a) => {
      if (a.matches("[data-cat-half], .overlay__nav ul a")) {
        // keep the hover reveal alive (color/slide + preview image), block navigation only
        a.setAttribute("aria-disabled", "true");
        a.style.cursor = "default";
        blockNav(a);
      } else {
        fullyDisable(a);
      }
    });
  })();
})();
