import { unit1Outline } from '../data/unit1Outline.js';

export function renderHome(root) {
  root.innerHTML = `
    <div class="grid">
      <div>
        <h1>Unit 1: Drawing with Shapes</h1>
        <p class="p">Use this tool to review key ideas before your unit test. Start with <b>1.1.1</b> and work forward.</p>
        <div class="pills">
          <div class="pill">Flashcards</div>
          <div class="pill">Checkpoint Quiz</div>
          <div class="pill">Review Missed</div>
        </div>
      </div>

      <div class="card" style="padding: 0; overflow: hidden;">
        <div style="padding: 16px;">
          <h2>Sections</h2>
          <p class="p">Pick a section to study.</p>
        </div>
        <div class="hr"></div>
        <div style="padding: 16px;">
          ${unit1Outline
            .map((s) => {
              const href = `#/section/unit1/${s.id}`;
              return `
                <div style="display:flex;align-items:center;justify-content:space-between;gap:10px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">
                  <div>
                    <div style="font-weight:700;">${s.id} — ${s.title}</div>
                    <div class="small">${s.summary}</div>
                  </div>
                  <a class="btn primary" href="${href}">Study</a>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>

      <div>
        <h2>Teacher notes</h2>
        <p class="p">This is intentionally simple so Grade 10 students can improve it through GitHub: add questions, improve UI, add a timer, add progress charts, etc.</p>
      </div>
    </div>
  `;
}
