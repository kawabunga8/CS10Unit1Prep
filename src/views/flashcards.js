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
    const drawables = showDef ? parseDrawablesFromExample(c.example) : [];
    const guide = showDef ? parseConceptGuideFromExample(c.example) : null;
    const hasPreview = drawables.length || guide;

    el.innerHTML = `
      <div class="flashcard">
        <div class="flashcard__term">${escapeHtml(c.term)}</div>
        <div class="flashcard__def">${showDef ? escapeHtml(c.definition) : '<span class="small">(Click Reveal)</span>'}</div>
        ${showDef && c.example ? `<div class="hr"></div><div class="code">${escapeHtml(c.example)}</div>` : ''}

        ${showDef && c.example && !hasPreview ? `
          <div class="preview">
            <div class="preview__title">No preview available for this card.</div>
          </div>
        ` : ''}

        ${showDef && hasPreview ? `
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

    if (hasPreview) {
      const canvas = el.querySelector('canvas[data-preview="canvas"]');
      if (canvas) {
        if (guide) drawConceptGuide(canvas, guide);
        else drawPreview(canvas, drawables);
      }
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

function parseDrawablesFromExample(example) {
  if (!example) return [];
  const text = String(example);

  const drawables = [];

  // Parse function-style draw calls with nested parentheses support (e.g., gradient(...)).
  for (const call of findCalls(text, 'Circle')) {
    const args = splitTopLevelArgs(call);
    if (args.length < 3) continue;
    const cx = clampNum(Number(args[0]));
    const cy = clampNum(Number(args[1]));
    const r = clampNum(Number(args[2]));
    const props = parsePropsFromArgs(args.slice(3));
    drawables.push({ kind: 'circle', cx, cy, r, props });
  }

  for (const call of findCalls(text, 'Rect')) {
    const args = splitTopLevelArgs(call);
    if (args.length < 4) continue;
    const left = clampNum(Number(args[0]));
    const top = clampNum(Number(args[1]));
    const w = clampNum(Number(args[2]));
    const h = clampNum(Number(args[3]));
    const props = parsePropsFromArgs(args.slice(4));
    drawables.push({ kind: 'rect', left, top, w, h, props });
  }

  for (const call of findCalls(text, 'Star')) {
    const args = splitTopLevelArgs(call);
    if (args.length < 4) continue;
    const cx = clampNum(Number(args[0]));
    const cy = clampNum(Number(args[1]));
    const r = clampNum(Number(args[2]));
    const points = Math.max(3, Number(args[3]));
    const props = parsePropsFromArgs(args.slice(4));
    drawables.push({ kind: 'star', cx, cy, r, points, props });
  }

  for (const call of findCalls(text, 'Oval')) {
    const args = splitTopLevelArgs(call);
    if (args.length < 4) continue;
    const cx = clampNum(Number(args[0]));
    const cy = clampNum(Number(args[1]));
    const w = clampNum(Number(args[2]));
    const h = clampNum(Number(args[3]));
    const props = parsePropsFromArgs(args.slice(4));
    drawables.push({ kind: 'oval', cx, cy, w, h, props });
  }

  for (const call of findCalls(text, 'Line')) {
    const args = splitTopLevelArgs(call);
    if (args.length < 4) continue;
    const x1 = clampNum(Number(args[0]));
    const y1 = clampNum(Number(args[1]));
    const x2 = clampNum(Number(args[2]));
    const y2 = clampNum(Number(args[3]));
    const props = parsePropsFromArgs(args.slice(4));
    drawables.push({ kind: 'line', x1, y1, x2, y2, props });
  }

  for (const call of findCalls(text, 'Label')) {
    const args = splitTopLevelArgs(call);
    if (args.length < 3) continue;
    const value = stripQuotes(args[0]);
    const cx = clampNum(Number(args[1]));
    const cy = clampNum(Number(args[2]));
    const props = parsePropsFromArgs(args.slice(3));
    drawables.push({ kind: 'label', value, cx, cy, props });
  }

  return drawables;
}

function parseConceptGuideFromExample(example) {
  if (!example) return null;
  const text = String(example);

  // Detect width concept cards like:
  // leftX=50, rightX=350
  const mW = text.match(/leftX\s*=\s*(\d+)[^\d]+rightX\s*=\s*(\d+)/);
  if (mW) {
    const leftX = clampNum(Number(mW[1]));
    const rightX = clampNum(Number(mW[2]));
    return { kind: 'width', leftX, rightX };
  }

  // Detect height concept cards like:
  // topY=50, bottomY=150
  const mH = text.match(/topY\s*=\s*(\d+)[^\d]+bottomY\s*=\s*(\d+)/);
  if (mH) {
    const topY = clampNum(Number(mH[1]));
    const bottomY = clampNum(Number(mH[2]));
    return { kind: 'height', topY, bottomY };
  }

  return null;
}

function parsePropsFromArgs(extraArgs) {
  // Parse keyword args (best effort). Works even if an arg contains nested parens.
  // Examples:
  // - fill='dodgerBlue'
  // - opacity=80
  // - fill=gradient('dodgerBlue','limeGreen', start='left-top')
  const props = {};
  for (const raw of extraArgs) {
    const s = String(raw).trim();

    // fill=gradient(...)
    const grad = s.match(/^fill\s*=\s*gradient\(\s*'([^']+)'\s*,\s*'([^']+)'(?:\s*,\s*start\s*=\s*'([^']+)')?\s*\)\s*$/);
    if (grad) {
      props.gradient = { c1: grad[1], c2: grad[2], start: grad[3] || null };
      continue;
    }

    // fill='color'
    const fill = s.match(/^fill\s*=\s*'([^']+)'\s*$/);
    if (fill) {
      props.fill = fill[1];
      continue;
    }

    const opacity = s.match(/^opacity\s*=\s*(\d+)\s*$/);
    if (opacity) {
      props.opacity = clamp01to100(Number(opacity[1]));
      continue;
    }

    const border = s.match(/^border\s*=\s*'([^']+)'\s*$/);
    if (border) {
      props.border = border[1];
      continue;
    }

    const borderWidth = s.match(/^borderWidth\s*=\s*(\d+)\s*$/);
    if (borderWidth) {
      props.borderWidth = Math.max(1, Number(borderWidth[1]));
      continue;
    }

    const lineWidth = s.match(/^lineWidth\s*=\s*(\d+)\s*$/);
    if (lineWidth) {
      props.lineWidth = Math.max(1, Number(lineWidth[1]));
      continue;
    }

    const dashes = s.match(/^dashes\s*=\s*(True|False)\s*$/);
    if (dashes) {
      props.dashes = dashes[1] === 'True';
      continue;
    }

    const rotateAngle = s.match(/^rotateAngle\s*=\s*(-?\d+)\s*$/);
    if (rotateAngle) {
      props.rotateAngle = Number(rotateAngle[1]);
      continue;
    }

    const roundness = s.match(/^roundness\s*=\s*(\d+)\s*$/);
    if (roundness) {
      props.roundness = clamp01to100(Number(roundness[1]));
      continue;
    }

    const size = s.match(/^size\s*=\s*(\d+)\s*$/);
    if (size) {
      props.size = Number(size[1]);
      continue;
    }

    const bold = s.match(/^bold\s*=\s*(True|False)\s*$/);
    if (bold) {
      props.bold = bold[1] === 'True';
      continue;
    }

    const italic = s.match(/^italic\s*=\s*(True|False)\s*$/);
    if (italic) {
      props.italic = italic[1] === 'True';
      continue;
    }

    const font = s.match(/^font\s*=\s*'([^']+)'\s*$/);
    if (font) {
      props.font = font[1];
      continue;
    }
  }

  return props;
}

function findCalls(text, fnName) {
  const calls = [];
  const needle = fnName + '(';
  let i = 0;
  while (i < text.length) {
    const start = text.indexOf(needle, i);
    if (start === -1) break;
    let j = start + needle.length;
    let depth = 1;
    let inSingleQuote = false;

    for (; j < text.length; j++) {
      const ch = text[j];
      if (ch === "'" && text[j - 1] !== '\\') inSingleQuote = !inSingleQuote;
      if (inSingleQuote) continue;
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (depth === 0) {
        const inside = text.slice(start + needle.length, j);
        calls.push(inside);
        i = j + 1;
        break;
      }
    }
    if (depth !== 0) break; // unbalanced
  }
  return calls;
}

function splitTopLevelArgs(argString) {
  const args = [];
  let cur = '';
  let depth = 0;
  let inSingleQuote = false;
  for (let i = 0; i < argString.length; i++) {
    const ch = argString[i];
    if (ch === "'" && argString[i - 1] !== '\\') inSingleQuote = !inSingleQuote;

    if (!inSingleQuote) {
      if (ch === '(') depth++;
      if (ch === ')') depth = Math.max(0, depth - 1);
      if (ch === ',' && depth === 0) {
        args.push(cur.trim());
        cur = '';
        continue;
      }
    }

    cur += ch;
  }
  if (cur.trim()) args.push(cur.trim());
  return args;
}

function stripQuotes(s) {
  const t = String(s).trim();
  if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) {
    return t.slice(1, -1);
  }
  return t;
}

function drawConceptGuide(canvas, guide) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Base canvas
  ctx.clearRect(0, 0, 400, 400);
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

  // A demo rectangle to illustrate measurement.
  const rect = { left: 80, top: 80, w: 240, h: 180 };
  const right = rect.left + rect.w;
  const bottom = rect.top + rect.h;

  ctx.strokeStyle = 'rgba(110,168,255,0.9)';
  ctx.lineWidth = 3;
  ctx.strokeRect(rect.left, rect.top, rect.w, rect.h);

  // Draw measurement arrows
  ctx.strokeStyle = 'rgba(50,213,131,0.85)';
  ctx.lineWidth = 2;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '13px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

  if (guide.kind === 'width') {
    // horizontal arrow under the rectangle
    const y = bottom + 30;
    drawArrow(ctx, rect.left, y, right, y);
    const width = Math.max(0, guide.rightX - guide.leftX);
    ctx.fillText(`width = rightX - leftX = ${guide.rightX} - ${guide.leftX} = ${width}`, 10, 24);
  }

  if (guide.kind === 'height') {
    // vertical arrow to the right of the rectangle
    const x = right + 30;
    drawArrow(ctx, x, rect.top, x, bottom);
    const height = Math.max(0, guide.bottomY - guide.topY);
    ctx.fillText(`height = bottomY - topY = ${guide.bottomY} - ${guide.topY} = ${height}`, 10, 24);
  }

  // Corner labels
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
  ctx.fillText('(0,0)', 6, 14);
  ctx.fillText('(400,0)', 332, 14);
  ctx.fillText('(0,400)', 6, 394);
  ctx.fillText('(400,400)', 318, 394);
}

function drawArrow(ctx, x0, y0, x1, y1) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();

  const headLen = 10;
  const angle = Math.atan2(y1 - y0, x1 - x0);
  // arrow head at end
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - headLen * Math.cos(angle - Math.PI / 6), y1 - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x1 - headLen * Math.cos(angle + Math.PI / 6), y1 - headLen * Math.sin(angle + Math.PI / 6));
  ctx.lineTo(x1, y1);
  ctx.fillStyle = 'rgba(50,213,131,0.85)';
  ctx.fill();

  // arrow head at start
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x0 + headLen * Math.cos(angle - Math.PI / 6), y0 + headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x0 + headLen * Math.cos(angle + Math.PI / 6), y0 + headLen * Math.sin(angle + Math.PI / 6));
  ctx.lineTo(x0, y0);
  ctx.fill();
}

function drawPreview(canvas, drawables) {
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

  // Draw each shape in order.
  for (const d of drawables) {
    drawOne(ctx, d);
  }
}

function drawOne(ctx, d) {
  const props = d.props || {};
  const alpha = props.opacity != null ? props.opacity / 100 : 1;

  // Fill style: solid or gradient.
  const fillStyle = getFillStyle(ctx, props, alpha, d);
  const strokeStyle = props.border ? colorToRgba(props.border, alpha) : 'rgba(255,255,255,0.7)';
  const strokeWidth = props.borderWidth || 2;

  if (d.kind === 'circle') {
    ctx.save();
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.arc(d.cx, d.cy, d.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawCenter(ctx, d.cx, d.cy);
    ctx.restore();
    return;
  }

  if (d.kind === 'rect') {
    ctx.save();
    ctx.translate(d.left, d.top);
    if (props.rotateAngle) {
      // Rotate around center of rect
      ctx.translate(d.w / 2, d.h / 2);
      ctx.rotate((props.rotateAngle * Math.PI) / 180);
      ctx.translate(-d.w / 2, -d.h / 2);
    }

    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.rect(0, 0, d.w, d.h);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (d.kind === 'oval') {
    ctx.save();
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.fillStyle = fillStyle;

    ctx.beginPath();
    ctx.ellipse(d.cx, d.cy, d.w / 2, d.h / 2, (props.rotateAngle || 0) * Math.PI / 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawCenter(ctx, d.cx, d.cy);
    ctx.restore();
    return;
  }

  if (d.kind === 'line') {
    ctx.save();
    ctx.strokeStyle = props.fill ? colorToRgba(props.fill, alpha) : 'rgba(110,168,255,0.9)';
    ctx.lineWidth = props.lineWidth || 3;
    if (props.dashes) ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(d.x1, d.y1);
    ctx.lineTo(d.x2, d.y2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (d.kind === 'star') {
    ctx.save();
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.fillStyle = fillStyle;

    const points = Math.max(3, d.points || 5);
    const outerR = d.r;
    const innerR = outerR * 0.5 + (props.roundness ? (props.roundness / 100) * outerR * 0.15 : 0);
    const rot = (props.rotateAngle || -90) * Math.PI / 180;

    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = rot + (i * Math.PI) / points;
      const r = i % 2 === 0 ? outerR : innerR;
      const x = d.cx + Math.cos(angle) * r;
      const y = d.cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawCenter(ctx, d.cx, d.cy);
    ctx.restore();
    return;
  }

  if (d.kind === 'label') {
    ctx.save();
    ctx.fillStyle = props.fill ? colorToRgba(props.fill, alpha) : 'rgba(255,255,255,0.85)';
    const size = props.size ? Number(props.size) : 18;
    const font = props.font ? String(props.font) : 'monospace';
    const bold = props.bold ? '700 ' : '';
    const italic = props.italic ? 'italic ' : '';
    ctx.font = `${italic}${bold}${size}px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.value, d.cx, d.cy);
    drawCenter(ctx, d.cx, d.cy);
    ctx.restore();
  }
}

function getFillStyle(ctx, props, alpha, d) {
  if (props.gradient) {
    const { c1, c2, start } = props.gradient;

    // default radial gradient (center to edge)
    if (!start) {
      const g = ctx.createRadialGradient(d.cx || 200, d.cy || 200, 0, d.cx || 200, d.cy || 200, 180);
      g.addColorStop(0, colorToRgba(c1, alpha));
      g.addColorStop(1, colorToRgba(c2, alpha));
      return g;
    }

    // linear gradient based on start
    const { x0, y0, x1, y1 } = gradientLine(start);
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, colorToRgba(c1, alpha));
    g.addColorStop(1, colorToRgba(c2, alpha));
    return g;
  }

  if (props.fill) return colorToRgba(props.fill, alpha);
  return `rgba(110,168,255,${0.18 * alpha})`;
}

function gradientLine(start) {
  // normalized to 400x400
  const s = String(start).toLowerCase();

  const left = s.includes('left');
  const right = s.includes('right');
  const top = s.includes('top');
  const bottom = s.includes('bottom');

  // default center→right
  let x0 = 200, y0 = 200, x1 = 400, y1 = 200;

  if (left && !right && !top && !bottom) { x0 = 0; y0 = 200; x1 = 400; y1 = 200; }
  if (right && !left && !top && !bottom) { x0 = 400; y0 = 200; x1 = 0; y1 = 200; }
  if (top && !bottom && !left && !right) { x0 = 200; y0 = 0; x1 = 200; y1 = 400; }
  if (bottom && !top && !left && !right) { x0 = 200; y0 = 400; x1 = 200; y1 = 0; }

  if ((left || right) && (top || bottom)) {
    x0 = left ? 0 : 400;
    y0 = top ? 0 : 400;
    x1 = left ? 400 : 0;
    y1 = top ? 400 : 0;
  }

  return { x0, y0, x1, y1 };
}

function drawCenter(ctx, x, y) {
  ctx.fillStyle = 'rgba(50,213,131,0.95)';
  ctx.beginPath();
  ctx.arc(x, y, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function colorToRgba(name, alpha) {
  // Basic mapping for common CMU color names.
  const n = String(name).toLowerCase();
  const map = {
    dodgerblue: [30, 144, 255],
    limegreen: [50, 205, 50],
    black: [0, 0, 0],
    white: [255, 255, 255],
    red: [255, 0, 0],
    green: [0, 128, 0],
    blue: [0, 0, 255],
    yellow: [255, 215, 0],
    orange: [255, 165, 0],
    purple: [128, 0, 128],
    pink: [255, 105, 180],
    gray: [128, 128, 128],
    grey: [128, 128, 128],
  };

  const rgb = map[n];
  if (!rgb) return `rgba(110,168,255,${alpha})`;
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}

function clampNum(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(400, n));
}

function clamp01to100(n) {
  if (!Number.isFinite(n)) return 100;
  return Math.max(0, Math.min(100, n));
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
