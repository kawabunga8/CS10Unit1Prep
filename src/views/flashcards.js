export function FlashcardsView(section) {
  const el = document.createElement('div');

  const cards = section.flashcards || [];
  let i = 0;
  let showDef = false;

  function render() {
    const c = cards[i];
    if (!c) {
      el.innerHTML = `<p class="p">No flashcards yet for this section.</p>`;
      return;
    }

    // Only show the canvas preview when revealed.
    const circleSpec = showDef ? parseCircleExample(c.example) : null;

    el.innerHTML = `
      <div class="flashcard">
        <div class="flashcard__term">${escapeHtml(c.term)}</div>
        <div class="flashcard__def">${showDef ? escapeHtml(c.definition) : '<span class="small">(Click Reveal)</span>'}</div>
        ${c.example ? `<div class="hr"></div><div class="code">${escapeHtml(c.example)}</div>` : ''}

        ${circleSpec ? `
          <div class="preview">
            <div class="preview__title">400×400 Canvas Preview (0,0 is top-left)</div>
            <canvas class="canvas400" width="400" height="400" data-preview="canvas"></canvas>
          </div>
        ` : ''}
      </div>

      <div class="row" style="margin-top: 12px;">
        <button class="btn" data-action="prev">Prev</button>
        <button class="btn primary" data-action="reveal">${showDef ? 'Hide' : 'Reveal'}</button>
        <button class="btn" data-action="next">Next</button>
        <div class="small">Card ${i + 1} / ${cards.length}</div>
      </div>
    `;

    if (circleSpec) {
      const canvas = el.querySelector('canvas[data-preview="canvas"]');
      if (canvas) drawCirclePreview(canvas, circleSpec);
    }

    el.querySelector('[data-action="prev"]').onclick = () => {
      i = (i - 1 + cards.length) % cards.length;
      showDef = false;
      render();
    };
    el.querySelector('[data-action="next"]').onclick = () => {
      i = (i + 1) % cards.length;
      showDef = false;
      render();
    };
    el.querySelector('[data-action="reveal"]').onclick = () => {
      showDef = !showDef;
      render();
    };
  }

  render();
  return el;
}

function parseCircleExample(example) {
  if (!example) return null;

  // Look for Circle(x, y, r) anywhere in the example block.
  const m = String(example).match(/Circle\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (!m) return null;

  const cx = Number(m[1]);
  const cy = Number(m[2]);
  const r = Number(m[3]);
  if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(r)) return null;

  // Keep inside canvas bounds for preview (still draws, but clamps extremes).
  return {
    cx: Math.max(0, Math.min(400, cx)),
    cy: Math.max(0, Math.min(400, cy)),
    r: Math.max(0, Math.min(400, r)),
  };
}

function drawCirclePreview(canvas, { cx, cy, r }) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear
  ctx.clearRect(0, 0, 400, 400);

  // Background
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  ctx.fillRect(0, 0, 400, 400);

  // Grid every 50
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 400; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, 400);
    ctx.stroke();
  }
  for (let y = 0; y <= 400; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(400, y + 0.5);
    ctx.stroke();
  }

  // Corner labels
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
  ctx.fillText('(0,0)', 6, 14);
  ctx.fillText('(400,0)', 332, 14);
  ctx.fillText('(0,400)', 6, 394);
  ctx.fillText('(400,400)', 318, 394);

  // Circle
  ctx.strokeStyle = 'rgba(110,168,255,0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Center point
  ctx.fillStyle = 'rgba(50,213,131,0.95)';
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();

  // Center crosshair lines
  ctx.strokeStyle = 'rgba(50,213,131,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx + 0.5, 0);
  ctx.lineTo(cx + 0.5, 400);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, cy + 0.5);
  ctx.lineTo(400, cy + 0.5);
  ctx.stroke();

  // Label
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText(`center=(${cx},${cy})  r=${r}`, 6, 32);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
