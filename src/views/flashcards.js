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

    el.innerHTML = `
      <div class="flashcard">
        <div class="flashcard__term">${escapeHtml(c.term)}</div>
        <div class="flashcard__def">${showDef ? escapeHtml(c.definition) : '<span class="small">(Click Reveal)</span>'}</div>
        ${c.example ? `<div class="hr"></div><div class="code">${escapeHtml(c.example)}</div>` : ''}
      </div>

      <div class="row" style="margin-top: 12px;">
        <button class="btn" data-action="prev">Prev</button>
        <button class="btn primary" data-action="reveal">${showDef ? 'Hide' : 'Reveal'}</button>
        <button class="btn" data-action="next">Next</button>
        <div class="small">Card ${i + 1} / ${cards.length}</div>
      </div>
    `;

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

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
