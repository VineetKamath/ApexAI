/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ApexAI SEBI-style palette
        'apex-navy': '#0A2A66',
        'apex-steel': '#3F4A5A',
        'apex-bg': '#F5F7FA',
        'apex-green': '#16A34A',
        'apex-yellow': '#EAB308',
        'apex-red': '#DC2626',
        'apex-blue': '#2563EB',
        'apex-gray': '#6B7280',
        'apex-light-gray': '#E5E7EB'
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace']
      }
    },
  },
  plugins: [],
}
