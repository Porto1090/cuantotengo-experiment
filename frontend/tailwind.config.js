/** @type {import('tailwindcss').Config} */
export default {
  content: [
    '.index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-50': 'oklch(97.9% 0.021 166.113)',
        'primary-100': 'oklch(93% 0.034 272.788)',
        'primary-200': '#1C1E20',
        'primary-300': '#1C1E20',
        'primary-400': '#1C1E20',
        'primary-500': '#1C1E20',
        'primary-600': '#1C1E20',
        'primary-700': '#1C1E20',
        'primary-800': '#1C1E20',
        'primary-900': '#1C1E20',
      },
    },
  },
  safelist: [],
  plugins: [],
}

