# CS10 Unit 1 Test Prep (CMU CS Academy aligned)

A lightweight **web-based study tool** for Grade 10 Computer Studies students to prepare for unit tests.

- **Mode 1:** Flashcards
- **Mode 2:** Checkpoint-style quizzes
- **Mode 3:** Review missed questions

This project is aligned to **CMU CS Academy – Unit 1: Drawing with Shapes**.

---

## Run locally
No build tools needed.

1. Download/clone this repo
2. Open `index.html` in a browser

(If your browser blocks local file loading, run a tiny local server)

### Optional local server
If you have Python installed:
```bash
python -m http.server 8000
```
Then open: http://localhost:8000

---

## Add content (students)
Study content lives in JSON files:
- `data/unit1/1.1.1.json`

To add value, students can:
- add new flashcards
- add new quiz questions
- improve the UI/UX
- add a new section file (ex: `1.1.2.json`)

See `CONTRIBUTING.md` for the exact format.
