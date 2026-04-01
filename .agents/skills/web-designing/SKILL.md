---
name: web-designing
description: Use when creating UI designs, styling web applications, or implementing frontend aesthetics and user experiences
---

# Web Designing

## Overview

Modern web applications require rich aesthetics and a premium feel. Web designing involves focusing on harmony, typography, micro-interactions, and visual excellence over basic MVP implementations.

## When to Use

- When building user interfaces from scratch
- When styling HTML elements
- When requested to improve the "look and feel" of an existing UI
- When implementing a design system or component library

## Core Pattern

### The Premium Aesthetics Standard

- **Colors**: Avoid generic HTML colors (plain red, blue, green). Use curated palettes, harmonious HSL tailored colors, or sleek dark mode presets.
- **Typography**: Utilize modern web fonts (e.g., Inter, Roboto, Outfit). Do not rely on browser defaults.
- **Layout**: Use flexbox and CSS grids to create organized, responsive layouts rather than floating elements.
- **Interactivity**: Add subtle micro-animations (hover states, focus rings, transitions) to make the interface feel alive.
- **Technology Stack**: Stick to standard HTML/CSS/JS for foundational design. Avoid Tailwind CSS unless the project explicitly requests it.

### Workflow

1. **Define Design Tokens**: First, create CSS variables for colors, typography, spacing, and shadows in a central `index.css`.
2. **Build Base Styles**: Style typography, resets, and layout containers.
3. **Component Construction**: Build isolated, reusable UI components applying your tokens.
4. **Polish**: Add hover effects, smooth transitions, and responsive queries.

## Quick Reference

| Operation  | Best Practice                                                       |
| ---------- | ------------------------------------------------------------------- |
| Colors     | Use CSS custom variables (`--primary-color: #...')                  |
| Gradients  | Smooth gradients (`linear-gradient(135deg, ...)`) avoid harsh bands |
| Shadows    | Layered soft shadows (`box-shadow: 0 4px 6px rgba(0,0,0,0.1)`)      |
| Animations | Use `transition: all 0.3s ease` on interactive elements             |

## Common Mistakes

- **Placeholder Images**: Leaving broken image tags. Fix: Always generate or provide working demonstrations.
- **Basic Styling**: Stopping at "functional". Fix: Always ensure a premium, finished look.
