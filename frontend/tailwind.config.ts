import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // ── Colors (exact Stitch tokens) ──────────────────────────────────
      colors: {
        primary: '#000000',
        'on-primary': '#ffffff',
        'primary-container': '#1c1b1d',
        'on-primary-container': '#858386',
        'primary-fixed': '#e5e1e4',
        'primary-fixed-dim': '#c8c6c8',
        'on-primary-fixed': '#1c1b1d',
        'on-primary-fixed-variant': '#474649',
        'inverse-primary': '#c8c6c8',

        secondary: '#5e5e65',
        'on-secondary': '#ffffff',
        'secondary-container': '#e3e1ea',
        'on-secondary-container': '#64646b',
        'secondary-fixed': '#e3e1ea',
        'secondary-fixed-dim': '#c7c5ce',
        'on-secondary-fixed': '#1b1b21',
        'on-secondary-fixed-variant': '#46464d',

        tertiary: '#000000',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#1f1a1a',
        'on-tertiary-container': '#8a8282',
        'tertiary-fixed': '#ebe0df',
        'tertiary-fixed-dim': '#cec4c4',
        'on-tertiary-fixed': '#1f1a1a',
        'on-tertiary-fixed-variant': '#4c4545',

        background: '#f9f9fa',
        'on-background': '#1a1c1d',

        surface: '#f9f9fa',
        'surface-bright': '#f9f9fa',
        'surface-dim': '#dadadb',
        'surface-tint': '#5f5e60',
        'surface-variant': '#e2e2e3',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f3f3f4',
        'surface-container': '#eeeeef',
        'surface-container-high': '#e8e8e9',
        'surface-container-highest': '#e2e2e3',
        'on-surface': '#1a1c1d',
        'on-surface-variant': '#47464a',
        'inverse-surface': '#2f3132',
        'inverse-on-surface': '#f0f1f2',

        outline: '#78767b',
        'outline-variant': '#c8c5ca',

        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
      },

      // ── Border Radius (Stitch tokens) ────────────────────────────────
      borderRadius: {
        DEFAULT: '0.125rem',  // 2px — inputs, buttons
        lg: '0.25rem',        // 4px — cards
        xl: '0.5rem',         // 8px — larger containers
        '2xl': '0.75rem',     // 12px — modals
        full: '9999px',       // pills, avatars
      },

      // ── Spacing (4px grid) ───────────────────────────────────────────
      spacing: {
        unit: '4px',
        'stack-sm': '8px',
        'stack-md': '16px',
        'stack-lg': '32px',
        gutter: '16px',
        'container-padding': '24px',
      },

      // ── Font Families ────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        'display': ['Inter', 'sans-serif'],
        'headline-lg': ['Inter', 'sans-serif'],
        'headline-sm': ['Inter', 'sans-serif'],
        'body-lg': ['Inter', 'sans-serif'],
        'body-md': ['Inter', 'sans-serif'],
        'label-md': ['Inter', 'sans-serif'],
        'label-sm': ['Inter', 'sans-serif'],
        code: ['"JetBrains Mono"', 'monospace'],
      },

      // ── Font Sizes with line-height, tracking, weight ────────────────
      fontSize: {
        display: ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        'headline-lg': ['30px', { lineHeight: '36px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-sm': ['20px', { lineHeight: '28px', letterSpacing: '-0.01em', fontWeight: '500' }],
        'body-lg': ['16px', { lineHeight: '24px', letterSpacing: '0', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', letterSpacing: '0', fontWeight: '400' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.01em', fontWeight: '500' }],
        'label-sm': ['11px', { lineHeight: '14px', letterSpacing: '0.03em', fontWeight: '600' }],
        code: ['13px', { lineHeight: '20px', fontWeight: '400' }],
      },

      // ── Box Shadows (Stitch elevation system) ────────────────────────
      boxShadow: {
        card: '0px 2px 4px rgba(0,0,0,0.05)',
        modal: '0px 10px 15px rgba(0,0,0,0.1)',
        drawer: '0px 4px 24px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

export default config

