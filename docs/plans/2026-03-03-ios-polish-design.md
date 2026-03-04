# iOS-Style UI Polish Design

**Goal:** Make the entire app feel crisp, clean, and buttery smooth with an Apple/iOS aesthetic — floating cards, spring physics, smooth scrolling.

**Approach:** CSS-only (zero new dependencies). Pure CSS transitions, multi-layer shadows, spring-eased curves, and minimal JS for scroll-to-top.

---

## 1. Global Smoothness

- `scroll-behavior: smooth` on `html`
- `-webkit-font-smoothing: antialiased` on `body`
- `-webkit-tap-highlight-color: transparent` on `body`
- Scroll-to-top (`window.scrollTo({ top: 0, behavior: 'smooth' })`) on wizard step change

## 2. Floating Card Shadows

Replace `shadow-sm` with multi-layer iOS-style shadow:
```
0 1px 2px rgba(0,0,0,0.04),
0 4px 12px rgba(0,0,0,0.06),
0 12px 32px rgba(0,0,0,0.04)
```

Apply to all white card containers. Hover state lifts with `translateY(-1px)` and amplified middle shadow.

## 3. Step Transitions

Wizard step content uses `animate-fadeInUp` on entrance. Wrapper provides smooth opacity transition so content breathes in/out.

## 4. Input Focus Polish

- `transition: box-shadow 0.2s ease, border-color 0.2s ease`
- Focus glow: `0 0 0 3px rgba(184, 155, 94, 0.15)` (soft gold halo)

## 5. Button Spring Physics

- Hover/active use `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring overshoot)
- Subtle bounce-settle on hover lift

## 6. Wizard Progress Bar

- `transition: all 0.3s ease` on connector lines and step circles
- Smooth color/size transitions between states

## Files to Modify

- `src/main.css` — global styles, shadows, input focus, button springs
- `src/pages/ClientSign.tsx` — scroll-to-top on step change
- `src/components/WizardProgress.tsx` — transition classes on circles/lines
- All card containers: update shadow classes (grep for `shadow-sm`)
