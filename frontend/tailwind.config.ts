import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gh: {
          bg:     '#0d1117',
          surface:'#161b22',
          border: '#30363d',
          text:   '#e6edf3',
          muted:  '#8b949e',
          blue:   '#58a6ff',
          green:  '#3fb950',
          red:    '#f85149',
          yellow: '#d29922',
          orange: '#f0883e',
          purple: '#bc8cff',
        }
      }
    }
  },
  plugins: [],
} satisfies Config
