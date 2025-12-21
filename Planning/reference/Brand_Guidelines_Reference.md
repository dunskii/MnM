# Music 'n Me - Brand Guidelines Reference

**Source**: `00_MNM_Brand Guideline (2).pdf`
**Last Updated**: December 2025

---

## Table of Contents

1. [Brand Colors](#brand-colors)
2. [Typography](#typography)
3. [Logo Usage](#logo-usage)
4. [Visual Style](#visual-style)
5. [Characters](#characters)
6. [Sub-Brands](#sub-brands)
7. [Implementation Guidelines](#implementation-guidelines)

---

## Brand Colors

### Primary Palette

| Color | HEX | RGB | CMYK | Pantone | Usage |
|-------|-----|-----|------|---------|-------|
| **Blue** | `#4580E4` | R69 G128 B228 | C72% M49% Y0% K0% | 279 C | Primary brand color, headers, buttons |
| **Yellow** | `#FFCE00` | R255 G206 B0 | C1% M18% Y100% K0% | 116 C | Secondary accent, CTAs, highlights |
| **Mint** | `#96DAC9` | R150 G218 B201 | C40% M0% Y26% K0% | 571 C | Accent, backgrounds, success states |
| **Coral** | `#FFAE9E` | R255 G174 B158 | C0% M39% Y31% K0% | 169 C | Accent, warm highlights, characters |
| **Cream** | `#FCF6E6` | R252 G246 B230 | C1% M2% Y9% K0% | 7604 C | Backgrounds, cards, panels |

### Material-UI Theme Configuration

```typescript
const theme = createTheme({
  palette: {
    primary: {
      main: '#4580E4',      // Blue
      light: '#a3d9f6',
      dark: '#3899ec',
    },
    secondary: {
      main: '#FFCE00',      // Yellow
    },
    accent: {
      mint: '#96DAC9',
      coral: '#FFAE9E',
      cream: '#FCF6E6',
    },
    background: {
      default: '#ffffff',
      paper: '#FCF6E6',     // Cream for cards
    },
    text: {
      primary: '#080808',
      secondary: '#9DA5AF',
    },
  },
});
```

### Color Usage Rules

✅ **DO:**
- Use **RGB** color codes for digital/web
- Use **CMYK** color codes for print materials
- Use color blocking with slightly darker/brighter shades for dimension
- Maintain brand colors across all touchpoints

❌ **DON'T:**
- Use gradients or color transitions
- Add drop shadows or 3D effects
- Use colors outside the official palette
- Lower opacity/transparency of brand colors

---

## Typography

### Font Families

**Primary Font: Monkey Mayhem**
- Type: Playful, hand-drawn display font
- Usage: Page titles, hero sections, headings (H1-H3), playful UI elements
- Characteristics: Rounded, friendly, energetic
- License: Verify commercial use license

**Secondary Font: Avenir**
- Type: Clean, modern sans-serif
- Usage: Body text, forms, tables, buttons, navigation, UI elements
- Weights: Regular (400), Medium (500), Bold (700)
- Alternative: System fonts (Roboto, SF Pro, Segoe UI)

### Typography Scale

```typescript
typography: {
  fontFamily: {
    heading: '"Monkey Mayhem", "Comic Sans MS", cursive',
    body: '"Avenir", "Roboto", "SF Pro", "Segoe UI", sans-serif',
  },
  h1: {
    fontFamily: '"Monkey Mayhem", cursive',
    fontSize: '3rem',      // 48px
    fontWeight: 700,
    color: '#4580E4',
  },
  h2: {
    fontFamily: '"Monkey Mayhem", cursive',
    fontSize: '2.25rem',   // 36px
    fontWeight: 700,
    color: '#4580E4',
  },
  h3: {
    fontFamily: '"Monkey Mayhem", cursive',
    fontSize: '1.75rem',   // 28px
    fontWeight: 700,
  },
  body1: {
    fontFamily: '"Avenir", sans-serif',
    fontSize: '1rem',      // 16px
    fontWeight: 400,
    lineHeight: 1.6,
  },
  button: {
    fontFamily: '"Avenir", sans-serif',
    fontSize: '0.875rem',  // 14px
    fontWeight: 600,
    textTransform: 'none', // Avoid all-caps
  },
}
```

---

## Logo Usage

### Logo Characteristics

- **Shape**: Doodle-like, playful letterforms spelling "MUSIC N ME"
- **M's**: Shaped like piano keys and guitar (represent instruments)
- **C's**: Represent a happy person (two semi-circles forming a smile)
- **Style**: Soft, rounded edges (not rigid geometric shapes)
- **Colors**: Multi-colored using brand palette (blue, yellow, mint, coral)

### Logo Variations

1. **Primary Logo**: Full "MUSIC N ME" wordmark (horizontal layout)
2. **Standalone Logogram**: Just the "M" icon (for app icons, favicons, small spaces)

### Clear Space

- Maintain clear space around logo equal to the width of the letter "C"
- Logo should NOT intersect with highly-saturated patterns or busy backgrounds
- Use cream background (#FCF6E6) or white for optimal visibility

### Logo Don'ts

❌ **DO NOT:**
- Distort or stretch the logo
- Tilt or rotate the logo
- Lower the transparency/opacity
- Change colors outside the brand palette
- Add effects (shadows, outlines, glows)
- Place on busy backgrounds without sufficient contrast

### File Formats

- **SVG**: Primary format for web (scalable, crisp at any size)
- **PNG**: Transparent background for general use
- **JPG**: Solid background for print/photos

---

## Visual Style

### Design Principles

**1. Simple, Basic Shapes**
- Use circles, squares, ovals, triangles, rectangles
- Keep shapes clean and recognizable
- Combine shapes to create instruments, characters, and icons

**2. Soft, Doodle-Like Edges**
- Add subtle hand-drawn texture to edges
- Avoid perfectly rigid geometric shapes
- Create approachable, friendly, human feel

**3. Flat Design (No Depth)**
- NO gradients
- NO drop shadows
- NO 3D effects or bevels
- Use color blocking for dimension

**4. Color Blocking for Dimension**
✅ **YES**: Use slightly darker or brighter shades of the same color to create layers
❌ **NO**: Use gradients, shadows, or transparency

### Illustration Style

```
Example: Drawing a Piano
1. Start with basic rectangle (yellow #FFCE00)
2. Add piano keys (darker yellow shade for dimension)
3. Add doodle texture to edges (hand-drawn feel)
4. Use flat colors (no gradients)
5. Keep it simple and recognizable
```

**Shapes Symbolize Diversity**: Different shapes molded into each letter represent Music 'n Me's dedication to helping students grow into their own unique version.

---

## Characters

Music 'n Me uses **4 mascot characters** representing different age groups. Each character has a unique personality and visual style.

### Character Roster

| Character | Age Group | Color | Traits | Story Highlights |
|-----------|-----------|-------|--------|------------------|
| **Alice** | Pre-school (3-5 years) | Pink (#FFAE9E) | Day-dreamer, Mini Maestro, Sweet | Dreams of being a world-famous pianist; tiny fingers learning piano |
| **Steve** | Kids (6-12 years) | Yellow (#FFCE00) | Curious, Perfect Pitch, Watch n' Learn | Has big ears (perfect pitch); learns by eavesdropping on brother; wants to play in a band |
| **Liam** | Teens (13-17 years) | Blue (#4580E4) | Riff Chief, Crowd Pleaser, Nintendo Ninja | Rock n' roll enthusiast; practices Les Paul guitar daily; dreams of Coachella |
| **Floyd** | Adult & Senior (18+ years) | Mint (#96DAC9) | Career Climber, No Risk No Problem, Late Bloomer | Busy with work/bills; plays Taylor guitar at night; music is his safe haven |

### Character Design Details

**Alice (Pre-school)**
- Shape: Rounded blob with small arms/legs
- Features: Big round eyes, small smile, antenna-like hair tufts
- Color: Coral pink (#FFAE9E)
- Personality: Innocent, imaginative, enthusiastic

**Steve (Kids)**
- Shape: Bear-like with prominent ears
- Features: Large round ears, cap on head, friendly smile
- Color: Bright yellow (#FFCE00)
- Personality: Inquisitive, mischievous, musical talent

**Liam (Teens)**
- Shape: Cool, confident stance
- Features: Sunglasses, spiky hair, star accents
- Color: Primary blue (#4580E4)
- Personality: Confident, passionate, rock enthusiast

**Floyd (Adult)**
- Shape: Gentle, rounded figure
- Features: Simple facial features, bow tie, content smile
- Color: Mint green (#96DAC9)
- Personality: Mature, reflective, finds joy in music

### Character Usage Guidelines

**When to Use:**
- Student dashboards (show age-appropriate character)
- Welcome screens and onboarding
- Empty states and error messages
- Email templates and communications
- Educational materials and guides

**How to Use:**
- Characters can interact with instruments (piano, guitar, drums, etc.)
- Use consistent color palette per character
- Maintain playful, friendly tone
- Characters should be welcoming and non-intimidating

**Character Implementation:**
```typescript
const getCharacterByAge = (age: number) => {
  if (age < 6) return 'alice';        // Pre-school
  if (age < 13) return 'steve';       // Kids
  if (age < 18) return 'liam';        // Teens
  return 'floyd';                     // Adults
};
```

---

## Sub-Brands

Music 'n Me has **6 sub-brands** representing different program levels and specializations. Each has a unique icon based on piano keys or instruments.

### Sub-Brand Breakdown

| Sub-Brand | Target Group | Icon Style | Color Scheme |
|-----------|--------------|------------|--------------|
| **Music N Me Mini** | Pre-school (3-5 years) | Rainbow icon | Multi-colored |
| **Music N Me Master** | Kids (beginner-intermediate) | Piano keys | Purple (#8B5CF6) + Yellow (#FFCE00) |
| **Music N Me Mezzo** | Kids/Teens (intermediate) | Piano keys | Blue (#4580E4) + Yellow (#FFCE00) |
| **Music N Me Molto** | Advanced students | Piano keys | Black (#000000) + Yellow (#FFCE00) |
| **Music N Me Maestro** | Intermediate (multi-instrument) | Pac-Man style icon | Teal (#96DAC9) + Yellow (#FFCE00) |
| **Music N Me Voice** | Singing/Vocal students | Microphone icon | Pink (#FFAE9E) + Yellow (#FFCE00) |

### Sub-Brand Usage

**When to Display:**
- Lesson type badges
- Course enrollment pages
- Student progress indicators
- Class schedules and calendars
- Certificates and achievements

**Implementation Example:**
```typescript
const subBrandConfig = {
  MINI: { icon: 'rainbow', colors: ['#FFAE9E', '#FFCE00', '#96DAC9', '#4580E4'] },
  MASTER: { icon: 'piano-keys', colors: ['#8B5CF6', '#FFCE00'] },
  MEZZO: { icon: 'piano-keys', colors: ['#4580E4', '#FFCE00'] },
  MOLTO: { icon: 'piano-keys', colors: ['#000000', '#FFCE00'] },
  MAESTRO: { icon: 'pacman', colors: ['#96DAC9', '#FFCE00'] },
  VOICE: { icon: 'microphone', colors: ['#FFAE9E', '#FFCE00'] },
};
```

---

## Implementation Guidelines

### Frontend (React + Material-UI)

**1. Theme Setup (Week 2, Day 5)**

```typescript
// theme.ts
import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    accent: {
      mint: string;
      coral: string;
      cream: string;
    };
  }
  interface PaletteOptions {
    accent?: {
      mint?: string;
      coral?: string;
      cream?: string;
    };
  }
}

export const theme = createTheme({
  palette: {
    primary: {
      main: '#4580E4',
      light: '#a3d9f6',
      dark: '#3899ec',
    },
    secondary: {
      main: '#FFCE00',
    },
    accent: {
      mint: '#96DAC9',
      coral: '#FFAE9E',
      cream: '#FCF6E6',
    },
    background: {
      default: '#ffffff',
      paper: '#FCF6E6',
    },
    text: {
      primary: '#080808',
      secondary: '#9DA5AF',
    },
  },
  typography: {
    fontFamily: '"Avenir", "Roboto", "SF Pro", "Segoe UI", sans-serif',
    h1: {
      fontFamily: '"Monkey Mayhem", cursive',
      fontSize: '3rem',
      fontWeight: 700,
      color: '#4580E4',
    },
    h2: {
      fontFamily: '"Monkey Mayhem", cursive',
      fontSize: '2.25rem',
      fontWeight: 700,
      color: '#4580E4',
    },
    h3: {
      fontFamily: '"Monkey Mayhem", cursive',
      fontSize: '1.75rem',
      fontWeight: 700,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12, // Soft, rounded corners
  },
  shadows: [
    'none',           // Remove all shadows
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          boxShadow: 'none', // Flat design
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: 'none', // Flat design
          border: '2px solid #FCF6E6',
        },
      },
    },
  },
});
```

**2. Font Loading**

Add to `public/index.html` or use `@font-face` in CSS:

```html
<!-- Load fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Avenir:wght@400;500;700&display=swap" rel="stylesheet">

<!-- Monkey Mayhem font (commercial license required) -->
<link href="path/to/monkey-mayhem.css" rel="stylesheet">
```

**3. Logo Component**

```tsx
// components/Logo.tsx
import React from 'react';

interface LogoProps {
  variant?: 'full' | 'icon';
  width?: number;
  height?: number;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  width = 200,
  height = 80
}) => {
  return (
    <img
      src={variant === 'full' ? '/assets/logo-full.svg' : '/assets/logo-icon.svg'}
      alt="Music 'n Me"
      width={width}
      height={height}
      style={{ display: 'block' }}
    />
  );
};
```

**4. Character Component**

```tsx
// components/Character.tsx
import React from 'react';

type CharacterName = 'alice' | 'steve' | 'liam' | 'floyd';

interface CharacterProps {
  name: CharacterName;
  size?: number;
  withInstrument?: boolean;
}

export const Character: React.FC<CharacterProps> = ({
  name,
  size = 200,
  withInstrument = false
}) => {
  const imagePath = `/assets/characters/${name}${withInstrument ? '-instrument' : ''}.svg`;

  return (
    <img
      src={imagePath}
      alt={`${name} character`}
      width={size}
      height={size}
      style={{ display: 'block' }}
    />
  );
};
```

**5. Asset Organization**

```
apps/frontend/public/assets/
├── logo/
│   ├── logo-full.svg         # Full "MUSIC N ME" wordmark
│   ├── logo-icon.svg         # Standalone "M" icon
│   └── logo-full.png         # PNG fallback
├── characters/
│   ├── alice.svg
│   ├── alice-instrument.svg  # Alice with piano
│   ├── steve.svg
│   ├── steve-instrument.svg  # Steve with guitar
│   ├── liam.svg
│   ├── liam-instrument.svg   # Liam with guitar
│   ├── floyd.svg
│   └── floyd-instrument.svg  # Floyd with guitar
├── sub-brands/
│   ├── mini.svg              # Rainbow icon
│   ├── master.svg            # Purple/yellow piano keys
│   ├── mezzo.svg             # Blue/yellow piano keys
│   ├── molto.svg             # Black/yellow piano keys
│   ├── maestro.svg           # Teal/yellow Pac-Man
│   └── voice.svg             # Pink microphone
└── fonts/
    ├── MonkeyMayhem-Regular.woff2
    └── Avenir-*.woff2
```

### Design Checklist (Week 11, Days 1-2)

Use this checklist during the **UI Polish + Brand Refinement** phase:

- [ ] All pages use official brand colors (#4580E4, #FFCE00, #96DAC9, #FFAE9E, #FCF6E6)
- [ ] Monkey Mayhem font used for all H1, H2, H3 headings
- [ ] Avenir font used for all body text, forms, buttons
- [ ] NO gradients anywhere in the UI
- [ ] NO drop shadows on any elements
- [ ] Logo has proper clear space (C-width guideline)
- [ ] Logo is not distorted, tilted, or transparent
- [ ] Age-appropriate characters displayed on student dashboards
- [ ] Sub-brand icons shown on lesson type badges
- [ ] All buttons have flat design (no shadows)
- [ ] Cards use cream background (#FCF6E6) with no shadows
- [ ] Color blocking used for dimension (not shadows/gradients)
- [ ] Soft, rounded corners (12-16px border-radius)
- [ ] Color contrast meets WCAG AA standards (4.5:1 for text)
- [ ] Brand guidelines PDF assets are properly licensed

---

## Quick Reference

### Color Hex Codes (Copy-Paste Ready)

```
Primary Blue:   #4580E4
Yellow:         #FFCE00
Mint:           #96DAC9
Coral:          #FFAE9E
Cream:          #FCF6E6
Text Dark:      #080808
Text Light:     #9DA5AF
White:          #FFFFFF
```

### Font Stack (Copy-Paste Ready)

```css
/* Headings */
font-family: "Monkey Mayhem", "Comic Sans MS", cursive;

/* Body Text */
font-family: "Avenir", "Roboto", "SF Pro", "Segoe UI", sans-serif;
```

### Key Brand Principles

1. **Playful yet Professional**: Balance fun brand personality with functional design
2. **Flat Design**: No gradients, shadows, or 3D effects
3. **Simple Shapes**: Use basic geometric shapes with soft, doodle-like edges
4. **Color Blocking**: Create dimension through color variations, not depth
5. **Age-Appropriate**: Use characters and sub-brands to connect with different age groups
6. **Accessibility**: Maintain sufficient color contrast and clear typography

---

## Resources

- **Brand Guidelines PDF**: `Planning/00_MNM_Brand Guideline (2).pdf`
- **Logo Assets**: Request from Music 'n Me team
- **Font Licenses**: Verify Monkey Mayhem commercial use license
- **Character SVGs**: Request high-resolution assets from Music 'n Me team

---

**Last Updated**: December 2025
**Maintained By**: Development Team
**For Questions**: Contact Music 'n Me brand team
