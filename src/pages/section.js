import { loadSectionData } from '../utils/loadSectionData.js';
import { FlashcardsView } from '../views/flashcards.js';
import { QuizView } from '../views/quiz.js';
import { ReviewView } from '../views/review.js';

export async function renderSection(root, { unit, sectionId }) {
  root.innerHTML = `<div>Loading section ${sectionId}…</div>`;

  const data = await loadSectionData(unit, sectionId);
  if (!data) {
    root.innerHTML = `
      <h2>Not found</h2>
      <p class="p">Could not load section <b>${sectionId}</b>.</p>
      <a class="btn" href="#/">Back</a>
    `;
    return;
  }

  const tabs = [
    { id: 'flashcards', label: 'Flashcards' },
    { id: 'quiz', label: 'Checkpoint Quiz' },
    { id: 'review', label: 'Missed Questions' },
  ];

  const stateKey = `cs10_active_tab_${unit}_${sectionId}`;
  let activeTab = localStorage.getItem(stateKey) || 'flashcards';

  function render() {
    root.innerHTML = `
      <div class="row" style="justify-content:space-between; align-items:flex-start;">
        <div>
          <h1>${data.id} — ${data.title}</h1>
          <p class="p">${data.description || ''}</p>
        </div>
        <div class="row">
          <a class="btn" href="#/">Home</a>
        </div>
      </div>

      <div class="hr"></div>

      <div class="row">
        ${tabs
          .map(
            (t) =>
              `<button class="btn ${activeTab === t.id ? 'primary' : ''}" data-tab="${t.id}">${t.label}</button>`
          )
          .join('')}
      </div>

      <div class="hr"></div>

      <div id="tab-content"></div>
    `;

    const content = root.querySelector('#tab-content');
    if (!content) return;

    if (activeTab === 'flashcards') {
      content.appendChild(FlashcardsView(data));
    } else if (activeTab === 'quiz') {
      content.appendChild(QuizView({ unit, sectionId, data }));
    } else {
      content.appendChild(ReviewView({ unit, sectionId, data }));
    }

    root.querySelectorAll('button[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeTab = btn.getAttribute('data-tab');
        localStorage.setItem(stateKey, activeTab);
        render();
      });
    });
  }

  render();
}
