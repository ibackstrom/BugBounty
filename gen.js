// bugged forest - generative header art
// inspired by zancan's "A Bugged Forest"
// each page gets a unique forest seeded by the article slug

function buggedForest(canvas, seed) {
  var ctx = canvas.getContext('2d');
  var W = canvas.width;
  var H = canvas.height;

  // seeded prng (mulberry32)
  var s = 0;
  for (var i = 0; i < seed.length; i++) {
    s = ((s << 5) - s + seed.charCodeAt(i)) | 0;
  }
  s = Math.abs(s);
  function rng() {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    var t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  // palette
  var bg = '#f2f0ec';
  var ink = '#111';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ground line
  var groundY = H * 0.88;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(W, groundY);
  ctx.stroke();

  // draw a bugged tree
  function tree(x, y, angle, len, depth, weight) {
    if (depth <= 0 || len < 2) return;

    var bug = rng() < 0.12; // 12% chance of glitch
    var endX = x + Math.cos(angle) * len;
    var endY = y + Math.sin(angle) * len;

    if (bug) {
      // glitch: offset, double line, or skip
      var glitchType = (rng() * 3) | 0;
      if (glitchType === 0) {
        // horizontal shift
        endX += (rng() - 0.5) * len * 0.8;
      } else if (glitchType === 1) {
        // draw twice with offset
        ctx.lineWidth = weight * 0.5;
        ctx.beginPath();
        ctx.moveTo(x + 2, y - 1);
        ctx.lineTo(endX + 2, endY - 1);
        ctx.stroke();
      }
      // glitchType 2: just proceed with shifted end
    }

    ctx.strokeStyle = ink;
    ctx.lineWidth = weight;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // branch
    var branches = rng() < 0.3 ? 3 : 2;
    var spread = 0.3 + rng() * 0.4;
    var shrink = 0.6 + rng() * 0.2;

    for (var b = 0; b < branches; b++) {
      var off = (b - (branches - 1) / 2) * spread;
      var bugAngle = bug ? (rng() - 0.5) * 0.5 : 0;
      tree(
        endX, endY,
        angle + off + bugAngle,
        len * shrink,
        depth - 1,
        Math.max(0.5, weight * 0.65)
      );
    }
  }

  // plant trees
  var numTrees = 3 + (rng() * 4) | 0;
  for (var t = 0; t < numTrees; t++) {
    var tx = W * 0.1 + rng() * W * 0.8;
    var treeH = H * 0.15 + rng() * H * 0.25;
    var maxDepth = 5 + (rng() * 4) | 0;
    tree(tx, groundY, -Math.PI / 2 + (rng() - 0.5) * 0.15,
         treeH, maxDepth, 1.5 + rng() * 1.5);
  }

  // ground texture: scattered dots
  for (var d = 0; d < 60; d++) {
    var dx = rng() * W;
    var dy = groundY + 2 + rng() * (H - groundY - 4);
    ctx.fillStyle = ink;
    ctx.fillRect(dx, dy, rng() < 0.5 ? 1 : 2, 1);
  }

  // glitch scanlines (subtle)
  var numGlitches = (rng() * 3) | 0;
  for (var g = 0; g < numGlitches; g++) {
    var gy = (rng() * H) | 0;
    var gw = 20 + rng() * 80;
    var gx = rng() * W;
    ctx.fillStyle = bg;
    ctx.fillRect(gx, gy, gw, 1);
    ctx.fillStyle = ink;
    ctx.fillRect(gx + 3, gy + 1, gw * 0.6, 1);
  }
}

// auto-init
document.addEventListener('DOMContentLoaded', function() {
  var el = document.getElementById('gen-art');
  if (el) buggedForest(el, el.getAttribute('data-seed') || 'r1gor');
});
