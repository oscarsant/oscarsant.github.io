# Spacing Grid Audit (4px System)

Scope: `styles.scss` spacing and layout properties using `rem`.

Grid basis:

- 1 spacing unit = 4px = 0.25rem (assuming 16px root)

## Summary

- Total spacing `rem` values audited: 292
- Already 4px-grid compliant: 206
- Off-grid (kept unchanged for pixel-accurate rendering): 86

## Already Compliant Values (unique)

- 0.25rem (4px)
- 0.5rem (8px)
- 0.75rem (12px)
- 1rem (16px)
- 1.25rem (20px)
- 1.5rem (24px)
- 1.75rem (28px)
- 2rem (32px)
- 2.25rem (36px)
- 2.5rem (40px)
- 3rem (48px)
- 3.75rem (60px)
- 4rem (64px)
- 5rem (80px)
- 6.25rem (100px)
- 7.5rem (120px)
- 17.5rem (280px)
- 31.25rem (500px)
- 42rem (672px)
- 45rem (720px)
- 62.5rem (1000px)
- 87.5rem (1400px)

## Off-Grid Values (not auto-changed)

These are intentionally left as-is to avoid visual regressions.

- -0.0625rem (-1px) -> nearest 0rem (0px)
- 0.0625rem (1px) -> nearest 0rem (0px)
- 0.1rem (1.6px) -> nearest 0rem (0px)
- 0.125rem (2px) -> nearest 0.25rem (4px)
- 0.15rem (2.4px) -> nearest 0.25rem (4px)
- 0.1875rem (3px) -> nearest 0.25rem (4px)
- 0.2rem (3.2px) -> nearest 0.25rem (4px)
- 0.28rem (4.48px) -> nearest 0.25rem (4px)
- 0.3rem (4.8px) -> nearest 0.25rem (4px)
- 0.3125rem (5px) -> nearest 0.25rem (4px)
- 0.35rem (5.6px) -> nearest 0.25rem (4px)
- 0.375rem (6px) -> nearest 0.5rem (8px)
- 0.45rem (7.2px) -> nearest 0.5rem (8px)
- 0.6rem (9.6px) -> nearest 0.5rem (8px)
- 0.625rem (10px) -> nearest 0.75rem (12px)
- 0.65rem (10.4px) -> nearest 0.75rem (12px)
- 0.8rem (12.8px) -> nearest 0.75rem (12px)
- 0.85rem (13.6px) -> nearest 0.75rem (12px)
- 0.875rem (14px) -> nearest 1rem (16px)
- 0.9rem (14.4px) -> nearest 1rem (16px)
- 1.1rem (17.6px) -> nearest 1rem (16px)
- 1.125rem (18px) -> nearest 1.25rem (20px)

## Refactor Added

- Introduced `space($step)` in SCSS using a 0.25rem unit.
- Added semantic tokens (`$space-1`, `$space-2`, etc.) for common 4px-grid values.
- Added backward-compatible legacy tokens for known off-grid values used by existing components:
  - `$space-legacy-6px`
  - `$space-legacy-10px`
  - `$space-legacy-14px`

## Notes

- No off-grid values were auto-snapped.
- Existing visuals should remain unchanged because values were tokenized, not numerically altered.
