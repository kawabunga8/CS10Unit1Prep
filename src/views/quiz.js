import { loadJSON, saveJSON } from '../utils/storage.js';

export function QuizView({ unit, sectionId, data }) {
  const el = document.createElement('div');
  const questions = data.quiz || [];

  const missedKey = `cs10_missed_${unit}_${sectionId}`;
  let missed = loadJSON(missedKey, []);

  let idx = 0;
  let score = 0;
  let locked = false;

  function render() {
    const q = questions[idx];
    if (!q) {
      el.innerHTML = `<p class="p">No quiz questions yet for this section.</p>`;
      return;
    }

    el.innerHTML = `
      ${q.code ? `<div class="code">${escapeHtml(q.code)}</div>` : ''}
      <h3 style="margin-top: 10px;">${escapeHtml(q.prompt)}</h3>
      <div class="small">Question ${idx + 1} / ${questions.length}</div>

      <div>
        ${q.options
          .map(
            (opt, i) =>
              `<button class="btn quiz__option" data-opt="${i}">${escapeHtml(opt)}</button>`
          )
          .join('')}
      </div>

      <div id="feedback" class="p" style="margin-top: 10px;"></div>

      <div class="row" style="margin-top: 12px;">
        <button class="btn" data-action="restart">Restart</button>
        <button class="btn primary" data-action="next">Next</button>
        <div class="small">Score: ${score}</div>
      </div>
    `;

    const feedback = el.querySelector('#feedback');

    el.querySelectorAll('button[data-opt]').forEach((b) => {
      b.onclick = () => {
        if (locked) return;
        locked = true;

        const chosen = Number(b.getAttribute('data-opt'));
        const isCorrect = chosen === q.answerIndex;

        if (isCorrect) {
          score++;
          b.classList.add('good');
          feedback.textContent = q.feedbackCorrect || 'Correct.';
        } else {
          b.classList.add('bad');
          const correctButton = el.querySelector(`button[data-opt="${q.answerIndex}"]`);
          if (correctButton) correctButton.classList.add('good');
          feedback.textContent = q.feedbackIncorrect || 'Not quite.';

          // track missed
          const missRecord = { id: q.id, prompt: q.prompt, code: q.code || null, correct: q.options[q.answerIndex] };
          missed = [missRecord, ...missed.filter((m) => m.id !== q.id)].slice(0, 50);
          saveJSON(missedKey, missed);
        }
      };
    });

    el.querySelector('[data-action="next"]').onclick = () => {
      idx = (idx + 1) % questions.length;
      locked = false;
      render();
    };

    el.querySelector('[data-action="restart"]').onclick = () => {
      idx = 0;
      score = 0;
      locked = false;
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
