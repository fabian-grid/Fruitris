# 🤖 AGENTS.md

## Purpose

This file defines the **coding standards, architectural guidelines, and behavioral constraints** that Codex (or any AI code assistant) must follow when generating or editing code for the Fruitris project.

These are not AI agents, but modular **functional components** — each responsible for a different aspect of gameplay. You should refer to [`PLAN.md`](./PLAN.md) for task-level implementation guidance and development status.

—

## 🔧 General Development Guidelines

- **Environment**: Browser-local HTML/CSS/JavaScript only
- **No build tools, bundlers, or dependencies**
- **All files must be standalone and portable**

—

## 📁 Project Structure

| File         | Purpose                            |
|—————|-————————————|
| `index.html` | Game layout & script/style loading  |
| `style.css`  | Grid layout, fruit styles, UI polish|
| `game.js`    | All game logic and control          |
| `README.md`  | Overview of project                 |
| `PLAN.md`    | Roadmap and dev milestones          |
| `AGENTS.md`  | Codex prompt/control doc            |

—

## 🧠 Codex Prompt Instructions

When generating or editing code, follow these directives:

### 🎯 1. **Code Quality and Style**
- Use **ES6+ syntax**
- Always include `const` or `let` — never use implicit globals
- Write small, modular functions
- Add inline comments for complex logic
- Avoid deeply nested callbacks or state machines

### 🎨 2. **CSS Guidelines**
- Use **CSS Grid** for layout
- Use `emojis` as inline content, not background images
- Define game area using fixed dimensions (e.g. 10x20 grid)
- Style all grid cells to be square and centered

### 🎮 3. **Game Logic**
- Store the playfield as a 2D array (`grid[y][x]`)
- Each cell can be:
  - `null` (empty)
  - An emoji string (e.g. `’🍓’`)
- Use a `requestAnimationFrame()` loop to manage the game
- Animate gravity and matches with CSS classes or timed JS callbacks

—

## 📦 Libraries and Dependencies

- ✅ Vanilla JavaScript only
- ✅ Use standard browser APIs (`querySelector`, `setInterval`, etc.)
- ✅ You **may optionally** use:
  - [`anime.js`](https://animejs.com) – for animations
  - [`Tone.js`](https://tonejs.github.io) – for sound effects
- ❌ No React, Vue, Webpack, or external frameworks

—

## 📋 Coding Conventions

- Use **camelCase** for variables and functions
- Group all `DOM` references at the top of `game.js`
- Use `addEventListener` for keyboard input
- Never mutate DOM directly inside logic functions — separate rendering

### Example DOM Setup:
```js
const gameGrid = document.getElementById(‘grid’);
const scoreDisplay = document.getElementById(‘score’);
```

### Example Cell Update:
```js
function updateCell(x, y, emoji) {
  const cell = document.querySelector(`[data-x=“${x}”][data-y=“${y}”]`);
  cell.textContent = emoji || ‘’;
}
```

—

## 🧪 Testing and Debugging

- Provide simulated data where needed
- Wrap all test code in a `if (DEBUG)` block
- Include console logs for state transitions, e.g., new column drop, match found, game over

—

## 🧭 Project Context Summary

**Fruitris** is a falling-block game with match-3 rules.  
Key mechanics:
- Blocks are vertical stacks of 3 fruit emojis
- Fruits match and clear when 3 of the same emoji are adjacent (in any direction)
- The game ends when the spawn area is blocked

Refer to [`PLAN.md`](./PLAN.md) for detailed milestones and [`README.md`](./README.md) for gameplay overview.

—

## 🚫 Things Codex Must Avoid

- ❌ Using libraries like jQuery, React, or Lodash
- ❌ Fetching data or making network calls
- ❌ Using `eval`, `innerHTML` unsafely
- ❌ Mixing logic with DOM mutations

—

## ✅ Example Prompts Codex Should Accept

- “Add a function to detect 3-adjacent matching emojis in 8 directions”
- “Implement keyboard controls to move falling fruit column”
- “Create a game loop using requestAnimationFrame”
- “Apply gravity after clearing matched fruit”

—

## 🧩 Appendix: Emoji Set

Use the following emoji pool for fruits:

```js
const fruitTypes = [‘🍓’, ‘🍌’, ‘🍇’, ‘🍍’, ‘🍎’, ‘🍒’];
```

—

*End of Codex Agent Guidelines*