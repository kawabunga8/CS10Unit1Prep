# Contributing (Student-Friendly)

This project is designed so Grade 10 CS students can **add value** with small improvements.

## Easy ways to contribute
- Add flashcards
- Add quiz questions
- Fix typos
- Improve layout / colors / spacing
- Add a new section file (example: `data/unit1/1.1.2.json`)

## Content format
Each section lives in a JSON file, for example:
- `data/unit1/1.1.1.json`

### Flashcard format
```json
{
  "term": "centerX",
  "definition": "The x-coordinate of the circle's center.",
  "example": "Circle(300, 200, 50)"
}
```

### Quiz question format
```json
{
  "id": "u1-111-q8",
  "prompt": "Where is (0,0) on the canvas?",
  "options": ["Top-left", "Center", "Bottom-left", "Top-right"],
  "answerIndex": 0,
  "feedbackCorrect": "Correct.",
  "feedbackIncorrect": "Not quite."
}
```

Notes:
- `id` must be unique.
- `options` should usually have 4 items.
- You can optionally add a code block:
  - `"code": "Circle(100 200 50)"`

## GitHub workflow
1. Fork the repo
2. Create a branch: `feature-add-questions` or `fix-ui-spacing`
3. Make your changes
4. Commit with a clear message
5. Open a Pull Request with:
   - what you changed
   - why it helps
   - how to test
