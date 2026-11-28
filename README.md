# Ankit Builds

Static single-page website for Ankit Builds. No build step and no dependencies.

## Structure

```
index.html            Page markup, SEO metadata and structured data
assets/css/styles.css All styles (design tokens at the top)
assets/js/main.js     Behaviour: WhatsApp links, menu, tabs, form, motion
assets/img/           Optimised WebP images, favicon, Open Graph image
assets/bg/            SVG backgrounds (blob scene, layered waves, layered peaks)
assets/fonts/         Self-hosted Plus Jakarta Sans (headings) and Inter (body)
robots.txt, sitemap.xml
```

## Configuration

Open `assets/js/main.js`:

- `CONTACT`: the single source for the phone number. `phone` is digits with country code
  (used for every `wa.me` and `tel:` link); `phoneLabel` is how it's displayed.
- `WA_MESSAGES`: the prefilled WhatsApp message for each button. In `index.html`, a button's
  `data-wa="key"` picks its message; `data-call` marks click-to-call links.
- The enquiry form validates name, phone and service, then opens WhatsApp with the enquiry
  written out. Nothing is stored or emailed.

Colours and fonts are design tokens at the top of `assets/css/styles.css`.

## Run locally

```
python3 -m http.server 8080
```

Then open http://localhost:8080.

## Deploy

Push to the `main` branch of the GitHub Pages repository (`ankit-builds`). If the site moves
to a custom domain, update the canonical URL, Open Graph URLs and structured data in
`index.html`, plus `robots.txt` and `sitemap.xml`.

## Credits

Motion effects are vanilla ports of components from
[motion-primitives](https://github.com/ibelick/motion-primitives) (MIT).
