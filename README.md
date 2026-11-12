# Ayan's portfolio

A landing page about Ayan, with one button that opens an n8n-style node canvas. Visitors connect nodes to a manual
trigger, press **Execute workflow**, and each node opens a page: about, projects, services, results, contact and more.

The whole site is one self-contained file, `index.html`, with no build tools or dependencies. Fonts come from Google Fonts.

## Editing

The page is assembled from parts in `src/`:

| File | What it holds |
|---|---|
| `p1_head.html` | title, fonts, colour and type tokens, shared styles |
| `p1c_land.css` | landing page styles |
| `p1d_canvas.css`, `p1b_extra.css` | canvas styles and responsive rules |
| `p2_land.html` | landing page markup |
| `p3_app.html` | canvas markup |
| `p4_data.js` | photos, content for every node page |
| `p5_app.js` | canvas behaviour |

Edit the parts, then rebuild `index.html`:

```bash
bash src/build.sh
```

## Photos

Set the `PHOTOS` object at the top of `src/p4_data.js` (portrait, work, project screenshots, client photos).
Empty slots show a placeholder.

## Status

Preview. Names, numbers, projects and quotes are sample content until the real ones are added.
