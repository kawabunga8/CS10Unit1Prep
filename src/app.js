import { renderHome } from './pages/home.js';
import { renderSection } from './pages/section.js';

function parseHash() {
  const raw = location.hash.replace(/^#\//, '');
  const parts = raw.split('/').filter(Boolean);
  return parts;
}

function route() {
  const app = document.getElementById('app');
  if (!app) return;

  const parts = parseHash();

  // #/section/unit1/1.1.1
  if (parts[0] === 'section' && parts.length >= 3) {
    const unit = parts[1];
    const sectionId = parts.slice(2).join('/');
    renderSection(app, { unit, sectionId });
    return;
  }

  renderHome(app);
}

window.addEventListener('hashchange', route);
route();
