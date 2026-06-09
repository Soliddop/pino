# Pino — Website Handoff

Static site. No build step. Open `index.html` or serve the folder.

## Run locally

```bash
# from this folder
python3 -m http.server 8000
# → http://localhost:8000
```

Use a server (not `file://`) so GSAP ScrollSmoother and the menu fetch behave.

## Structure

```
dist/
├── index.html          # landing page
├── catalogue.html      # menu catalogue (Mangia / Bevi) — images for now
└── assets/
    ├── css/
    │   └── styles.css
    ├── js/
    │   ├── main.js             # GSAP scroll / overlay / animation logic
    │   └── vendor/gsap/        # GSAP 3 + ScrollTrigger, ScrollSmoother, SplitText
    └── img/
        ├── logo.svg
        ├── close-white.svg
        ├── pino-anima.svg       # reusable animated food line-art SVG
        ├── menu/               # 202606EN1 (food) + EN2 (dolci/drinks)
        └── photos/             # curated photos used on the site
```

## Fonts

Loaded from Adobe Typekit (`use.typekit.net/vho8vkc.css`):
- `chercan` — display serif
- `objektiv-mk1` — body sans

## Notes

- **Catalogue page** still shows the menu as JPG images (`assets/img/menu/`).
  TODO: convert to semantic HTML/CSS — content already transcribed in design notes.
- No takeaway menu image yet; catalogue has Food + Drinks only.
- Photos are a curated subset. Full library lives in the source project.
- The hero keeps the animated SVG inline for reliability. A reusable copy also lives at `assets/img/pino-anima.svg`.
- To reuse it elsewhere, either paste that SVG inline or load it into a container and run the same `data-pino-anima` animation hook:
  ```html
  <div class="pino-anima" data-pino-anima data-pino-anima-src="assets/img/pino-anima.svg" aria-hidden="true"></div>
  ```
  Serve the folder over HTTP, not `file://`, when using the fetch-based version.
