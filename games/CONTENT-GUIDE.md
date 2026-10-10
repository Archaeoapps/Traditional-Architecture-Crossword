# Content guide

All three games use plain UTF-8 text files named `content.txt`. Edit these files directly in GitHub; you do not need to edit JavaScript to change lesson content.

## General format
Each entry is a group of lines written as `field: value`. Separate entries with a line containing only `---`. Lines beginning with `#` are comments and are ignored.

The parser uses the first colon on each line as the separator, so additional colons are allowed in the value.

## Quiz Board
File: `games/quiz-board/content.txt`

Required fields:
- `category`: column heading
- `points`: score value
- `question`: question shown to students
- `answer`: answer revealed by the teacher

For a classic board, give every category one question at each points level.

Example:
```
category: Κεραμική
points: 300
question: Σε ποιο χωριό...
answer: Φοινί
```

## Έσπασεν η κούζα
File: `games/kouza/content.txt`

Required:
- `word`: hidden word or phrase

Optional:
- `hint`: clue
- `category`: topic label

Greek accents are ignored when matching letters. Spaces and hyphens display automatically. Six wrong letters break the kuza.

Example:
```
word: ΜΑΚΡΥΝΑΡΙ
hint: Μακρόστενος τύπος χώρου.
category: Κατοικία
```

## Millionaire Quiz
File: `games/millionaire/content.txt`

Required:
- `question`
- `a`, `b`, `c`, `d`
- `correct`: exactly A, B, C or D

Optional:
- `hint`
- `points`

Example:
```
question: Ποιο από τα παρακάτω...
a: ...
b: ...
c: ...
d: ...
correct: B
hint: Προαιρετική υπόδειξη.
points: 500
```

The 50:50, class vote and hint buttons are single-use lifelines for the whole session.

## Publishing
GitHub Pages serves these files directly. After committing a content change, reload the Pages site. If a browser shows an older version, use a hard refresh.
