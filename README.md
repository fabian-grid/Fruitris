# 🍇 Fruitris

*A match-3 twist on classic falling-block puzzle games — made with HTML, CSS, and JavaScript.*

—

## 🎮 Game Concept

**Fruitris** is a browser-based puzzle game where vertical stacks of 3 random fruit emojis fall into a grid. Your goal is to align three identical fruits adjacent to one another — in any direction a chess king could move: vertically, horizontally, or diagonally. When matched, the fruits pop and disappear. Chain reactions, special powers, and gravity keep the gameplay dynamic and engaging.

The game ends when the stacked fruit reaches the top of the playfield and can no longer fall.

—

## 📦 Features

- 🍓 Falling columns made of 3 random fruit emojis (number of fruit based on difficulty level (just 🍌, 🍒, 🍏 to start with, in a random order within column)
- 🔃 Rotate order of fruit by pressing space before dropping
- 🧠 Match-3 detection in **8 directions** (up, down, left, right, and diagonals)
- 🍒 Gravity-based settling after clears
- 💣 Special power emoji like bomb that clears all fruit it is above in column
- 🍍 Combo chaining for advanced play
- 🍎 Game over detection and restart flow
- 💻 Local-only game — runs entirely in the browser (no backend)

—

## 🕹️ Controls

| Action       | Key        |
|—————|————|
| Move left    | ← arrow    |
| Move right   | → arrow    |
| Drop faster  | ↓ arrow    |
| Rotate       | <space>    |
| Restart game | R (planned)|

—

## 🚀 Getting Started

No installation needed. Just open `index.html` in your browser.

```bash
git clone https://github.com/<your-username>/fruitris.git
cd fruitris
open index.html
```

## 🌐 Play Online

You can also play Fruitris on Gitbook Pages:
[https://fruitris.gitbook.io/index.html](https://fruitris.gitbook.io/index.html)
