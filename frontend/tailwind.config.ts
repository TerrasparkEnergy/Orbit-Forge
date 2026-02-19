import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        space: {
          900: '#0A0E17',
          800: '#111827',
          700: '#1F2937',
          600: '#374151',
        },
        accent: {
          blue: '#3B82F6',
          'blue-hover': '#2563EB',
          green: '#10B981',
          amber: '#F59E0B',
          red: '#EF4444',
          purple: '#8B5CF6',
          cyan: '#06B6D4',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

export default config
