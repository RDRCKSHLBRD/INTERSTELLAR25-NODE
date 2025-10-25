# Preloader SVG Assets

This folder contains the SVG components for the Interstellar Packages preloader animation.

## File Structure

### Lines (line-1.svg through line-13.svg)
- 13 individual vertical line SVGs
- Each line has unique positioning and styling (color, stroke-width)
- All share the same viewBox: `653.24 x 225`
- Lines are positioned at different x-coordinates with varying heights
- Create the structural/architectural framework of the logo

### Text (text.svg)
- Contains "INTERSTELLAR PACKAGES" typography
- Custom SVG font design
- Matches viewBox: `653.24 x 225`
- Appears AFTER lines complete their animation

## Animation Sequence

1. **Phase 1 (0-1.3s):** Lines 1-13 fly in with staggered delays
2. **Phase 2 (1.3-2.0s):** Text fades/scales in over the line structure
3. **Phase 3:** Complete logo revealed, click to dismiss

## ViewBox Alignment

CRITICAL: All SVGs share viewBox `653.24 x 225` to ensure perfect alignment when stacked with `position: absolute` in the preloader container.

## Usage in Preloader

```html
<div class="logo-container">
  <!-- Lines layer -->
  <div class="logo-line"><img src="/svg/preloaderSvg/line-1.svg" /></div>
  <!-- ... lines 2-13 ... -->
  
  <!-- Text layer -->
  <div class="logo-text"><img src="/svg/preloaderSvg/text.svg" /></div>
</div>
```
