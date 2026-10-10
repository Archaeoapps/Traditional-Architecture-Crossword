# Traditional Architecture Crossword + Classroom Games

Standalone browser-based classroom activities for teaching Cypriot folk arts and culture.

## Included games

- Traditional Architecture Crossword — repository root
- Quiz Board — `/games/quiz-board/`
- Έσπασεν η κούζα — `/games/kouza/`
- Millionaire Quiz — `/games/millionaire/`
- Game launcher — `/games/`

All games are plain HTML, CSS and JavaScript. There is no build step, framework or server component.

## Editing lesson content

The three newer games read their lesson material from simple UTF-8 text files:

- `games/quiz-board/content.txt`
- `games/kouza/content.txt`
- `games/millionaire/content.txt`

Detailed instructions and examples are in:

- `games/CONTENT-GUIDE.md`

This means lesson content can be changed directly in GitHub without editing the game code.

## GitHub Pages

The repository is designed to publish directly from the `main` branch root using GitHub Pages.

The crossword stores its current state only in the visitor's browser using `localStorage`. The new games keep their session state in the current browser tab only. No learner data is sent back to GitHub.
