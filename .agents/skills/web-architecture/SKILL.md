---
name: web-architecture
description: Use when determining application structure, selecting frontend or backend frameworks, organizing services, and establishing server interactions
---

# Web Architecture

## Overview

A robust web architecture lays the foundation for scalability, long-term maintainability, and clean separation of concerns. This skill defines how to structure applications correctly.

## When to Use

- When scaffolding an entirely new project
- When refactoring "spaghetti code" into cleanly separated modules
- When organizing client-server APIs or WebSocket connections
- When deciding whether a Single Page Application (SPA), server-rendered app (SSR), or static site is needed

## Core Pattern

### Layered Separation

- **Presentation Layer**: Responsible for rendering UI components (HTML/CSS) and basic state management. Keep business logic out.
- **Service/Logic Layer**: Where calculations, data formatting, and complex orchestrations live.
- **Data Access Layer**: Wrapping all communications with APIs, WebSockets, or local databases in distinct utilities.

### Technologies

- For simple interactive components -> Vanilla JavaScript + Modern HTML5.
- For complex web apps with deep state -> React, Vite, Next.js.
- For realtime data -> WebSockets with proper reconnection logic.

## Quick Reference

| Problem                 | Recommended Approach                                                |
| ----------------------- | ------------------------------------------------------------------- |
| "Hard to read UI code"  | Extract components into separate structural functions or templates. |
| "Slow initial load"     | Audit bundle size / enforce lazy loading / SSR.                     |
| "Tightly coupled logic" | Implement dependency injection or clearly defined module imports.   |

## Common Mistakes

- **Monolithic Files**: Putting everything in `index.js`.
  - Fix: Break code down logically (e.g., `api.js`, `ui.js`, `store.js`).
- **Global State Pollution**: Relying on `window` variables.
  - Fix: Use module scope, closures, or centralized state stores.
