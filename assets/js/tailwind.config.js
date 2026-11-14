/**
 * Chicago Yacht Booking — Tailwind theme
 * ------------------------------------------------------------
 * Mockup: loaded right after the Tailwind Play CDN script.
 * Laravel: copy the `theme.extend` object into tailwind.config.js
 * (Tailwind v3) or translate colors/fonts into an `@theme {}` block
 * in resources/css/app.css (Tailwind v4). Class names stay identical.
 */
tailwind.config = {
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' },
      screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1320px' },
    },
    extend: {
      colors: {
        navy: {
          50: '#f2f5f9', 100: '#e2e8f1', 200: '#c6d2e2', 300: '#9bb0c9', 400: '#6a86a8',
          500: '#48668b', 600: '#365071', 700: '#2a3f5a', 800: '#1a2b42', 900: '#0f1e31', 950: '#07111e',
        },
        brass: {
          50: '#fbf7ee', 100: '#f4eacf', 200: '#e9d4a1', 300: '#dcbb72', 400: '#cfa34c',
          500: '#bd8c37', 600: '#a2702d', 700: '#835628', 800: '#6c4626', 900: '#5a3b23',
        },
        shell: '#f7f4ee',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(7,17,30,.18)',
        card: '0 1px 2px rgba(7,17,30,.04), 0 18px 40px -18px rgba(7,17,30,.28)',
        glow: '0 10px 30px -8px rgba(207,163,76,.55)',
      },
      keyframes: {
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        'scroll-dot': { '0%': { transform: 'translateY(0)', opacity: 1 }, '80%': { transform: 'translateY(14px)', opacity: 0 }, '100%': { opacity: 0 } },
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        'scroll-dot': 'scroll-dot 1.8s ease-in-out infinite',
      },
    },
  },
};
