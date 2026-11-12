#!/bin/bash
# Rebuilds ../index.html (the published artifact page) from the parts in this folder.
# Order: head + tokens (p1_head) | landing CSS (p1c) | canvas CSS (p1d) | canvas additions (p1b) | landing markup (p2) | canvas markup (p3) | data (p4) | behaviour (p5)
set -e
B="$(cd "$(dirname "$0")" && pwd)"
OUT="${1:-$B/../index.html}"
{ cat "$B/p1_head.html" "$B/p1c_land.css" "$B/p1d_canvas.css" "$B/p1b_extra.css"; echo '</style>'; cat "$B/p2_land.html" "$B/p3_app.html"; echo '<script>'; cat "$B/p4_data.js" "$B/p5_app.js"; echo '</script>'; } > "$OUT"
wc -c "$OUT"
