import { loadJSON, saveJSON } from '../utils/storage.js';

export function ReviewView({ unit, sectionId }) {
  const el = document.createElement('div');
  const missedKey = `cs10_missed_${unit}_${sectionId}`;

  let missed = loadJSON(missedKey, []);

  function render() {
    if (!missed.length) {
      el.innerHTML = `<p class="p">No missed questions saved yet. Do the quiz and get one wrong to see it here.</p>`;
      return;
    }

    el.innerHTML = `
      <div class="row" style="justify-content: space-between;">
        <div>
          <h3>Missed questions</h3>
          <p class="p">These are questions you missed in Quiz mode. Use this as a focused review list.</p>
        </div>
        <div>
          <button class="btn bad" data-action="clear">Clear</button>
        </div>
      </div>

      <div class="hr"></div>

      ${missed
        .map(
          (m) => `
            <div class="flashcard" style="margin-top: 10px;">
              <div class="flashcard__term">${escapeHtml(m.prompt)}</div>
              ${m.code ? `<div class="hr"></div><div class="code">${escapeHtml(m.code)}</div>` : ''}
              <div class="hr"></div>
              <div class="flashcard__def"><b>Correct:</b> ${escapeHtml(m.correct)}</div>
            </div>
          `
        )
        .join('')}
    `;

    el.querySelector('[data-action="clear"]').onclick = () => {
      missed = [];
      saveJSON(missedKey, missed);
      render();
    };
  }

  render();
  return el;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
