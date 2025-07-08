# 📋 PLAN.md

## Fruitris Development Plan

This document outlines the planned phases and tasks for building **Fruitris**, a browser-based puzzle game where columns of fruit emojis fall and clear when 3 of the same emoji are adjacent in any direction (like a chess king’s move).

—

## 🧱 Phase 1: Project Setup

- [x] Create `index.html`, `style.css`, and `game.js`
- [x] Define 10x20 grid structure using CSS Grid
- [x] Push initial files to GitHub

—

## 🎮 Phase 2: Core Game Mechanics

### Falling Fruit Columns
- [ ] Define difficulty level (speed of falling and number of fruit)
- [x] Define emoji set (`🥥`, `🍌`, `🍇`, `🍊`, `🍏`, `🍒`)
- [x] Generate 3-emoji vertical column at top of grid
- [x] Animate column falling over time
- [x] Allow movement: ← (left), → (right), ↓ (faster fall), ‘ ‘ (space; rotate fruit in column)
- [x] Implement collision detection and column lock-in

—

## 🔍 Phase 3: Match Detection

- [x] Represent grid state in a 2D array
- [x] Implement match-3 detection:
  - [x] Horizontal
  - [x] Vertical
  - [x] Diagonal (↖, ↘, ↗, ↙)
- [x] Mark and clear matched emojis
- [x] Add match animation or highlight


## ⬇️ Phase 4: Gravity & Cascades

- [x] Apply gravity to fruits above cleared cells
- [x] Re-check for new matches (chain reactions)
- [ ] Add special power emoji (💣 = clear all emoji on screen below bomb; 🏹 = clear all emoji in column; 🗡️ clear all emoji in row)
- [ ] Update score per emoji cleared and chain multiplier

—

## 🚨 Phase 5: Game Over & Restart

- [x] Detect when a new column cannot spawn
- [x] Show “Game Over” screen
- [ ] Add restart button or keyboard reset (e.g. `R` key)
- [ ] Reset game state and score

—

## 🧪 Phase 6: Polish & UX Enhancements

- [ ] Animate falling columns and clears
- [ ] Add sound effects (optional: use `Tone.js`)
- [x] Add scoring UI
- [ ] Add pause/resume functionality
- [ ] Handle mobile responsiveness and landscape mode
- [ ] Final code cleanup and documentation

—

## 📤 Deployment

- [ ] Ensure game runs via `index.html` in Safari
- [x] Optional: Host on GitHub Pages or similar
- [ ] Write release note for version `v1.0`

—

## ✅ Completed Tasks

Use checkboxes above to track development progress.

For coding style, libraries, and Codex usage conventions, refer to [`AGENTS.md`](./AGENTS.md).
