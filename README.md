# Supernote Templates

**Live: https://adroz.github.io/supernote-templates/**

Design page templates for the Supernote Nomad in the browser, tweak them live, and
export a 1404 × 1872 px PNG (the Nomad's 300 ppi screen).

## Use

1. Pick a template, adjust the controls, and press **Export PNG**.
2. Copy the PNG into `Note/MyStyle` on the Nomad (USB via an MTP app such as OpenMTP on
   macOS, Supernote Cloud / Partner app, or Browse & Access over Wi-Fi).
3. Choose it from the custom templates when creating a note.

**Copy link** gives a URL that reopens the exact settings; only values that differ from
the template's defaults are written into it.

## Develop

```sh
npm install
npm run dev     # http://localhost:5173
npm test        # layout maths and URL state
npm run build   # typecheck + static build to dist/
```

Pushing to `main` builds, tests, and deploys to GitHub Pages
(`.github/workflows/pages.yml`).

## Adding a template

1. Create `src/templates/<name>.ts` exporting a `Template` (see `src/core/types.ts`):
   `defaults`, `groups` (the controls), and `draw(ctx, settings)`. Wrap it in
   `defineTemplate()`.
2. Add it to `TEMPLATES` in `src/templates/index.ts`.

The editor builds its controls from `groups`; drawing helpers (ruled lines, rounded
boxes, border notches and labels, mm→px) live in `src/core/`. Keep layout arithmetic
in a pure function you can test, as `left-right-goodnight.ts` does with `layout()`.

Draw for e-ink: solid lines, mid-to-dark greys, whole-pixel widths. Very light greys
fade out on the device.
