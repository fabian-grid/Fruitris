# 🍇 Fruitris

*A match-3 twist on classic falling-block puzzle games — made with HTML, CSS, and JavaScript.*

—

## 🎮 Game Concept

**Fruitris** is a browser-based puzzle game where vertical stacks of 3 random fruit emojis fall into a grid. Your goal is to align three identical fruits adjacent to one another — in any direction a chess king could move: vertically, horizontally, or diagonally. When matched, the fruits pop and disappear. Chain reactions, special powers, and gravity keep the gameplay dynamic and engaging.

The game ends when the stacked fruit reaches the top of the playfield and can no longer fall.

—

## 📦 Features

- 🥥 Falling columns made of 3 random fruit emojis (number of fruit based on difficulty level — starting set is 🥥, 🍌 and 🍇 in a random order within each column)
- 🔃 Rotate order of fruit by pressing space before dropping
- 🧠 Match-3 detection in **8 directions** (up, down, left, right, and diagonals)
- 🍒 Gravity-based settling after clears
- 💣 Bomb clears all fruit matching the one it lands on
- 🔫 Gun clears all fruit to its right
- 🏹 Arrow clears the diagonal toward the top-left
- ☠️ Skull blocks a cell for 1 minute, flashing before it disappears
- ☄️ Extra bonus and meteor celebration when clearing more than six fruits at once
- 🍊 Combo chaining for advanced play
- 🍏 Game over detection and restart flow
- 🎵 Retro 8-bit sound effects
- 💻 Local-only game — runs entirely in the browser (no backend)

—

## 🕹️ Controls

| Action       | Key        |
|——————————————|————————————|
| Move left    | ← arrow    |
| Move right   | → arrow    |
| Drop faster  | ↓ arrow    |
| Rotate       | <space>    |
| Restart game | R |
| Touch play   | On-screen buttons or swipe/tap |

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
[https://fabian-grid.gitbook.io/fruitris/index.html](https://fabian-grid.github.io/Fruitris/)
