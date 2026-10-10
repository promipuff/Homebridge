/** Colors are CSS variables so light, dark and high-contrast themes swap at runtime. */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', surface: 'var(--surface)', 'surface-2': 'var(--surface-2)',
        ink: 'var(--ink)', muted: 'var(--muted)', line: 'var(--line)',
        forest: 'var(--forest)', 'forest-ink': 'var(--forest-ink)', 'forest-soft': 'var(--forest-soft)',
        sage: 'var(--sage)', 'sage-soft': 'var(--sage-soft)',
        amber: 'var(--amber)', 'amber-soft': 'var(--amber-soft)',
        danger: 'var(--danger)', 'danger-soft': 'var(--danger-soft)',
        ok: 'var(--ok)', 'ok-soft': 'var(--ok-soft)',
        info: 'var(--info)', 'info-soft': 'var(--info-soft)',
        focus: 'var(--focus)',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"Atkinson Hyperlegible"', 'system-ui', 'sans-serif'],
        body: ['"Atkinson Hyperlegible"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: { card: '14px' },
    },
  },
  plugins: [],
};
