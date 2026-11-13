/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          midnight: '#101D32',
          deepslate: '#19283D',
          indigo: '#405CF5',
          teal: '#13A58B',
          softwhite: '#FFFFFF',
          bg: '#F5F7FB',
          border: '#E7EBF2',
          muted: '#718096',
        },
        navy: {
          950: '#0A1220',
          900: '#101D32',
          800: '#19283D',
          DEFAULT: '#101D32',
          700: '#233754',
          600: '#2F486D',
        },
        royal: {
          50: '#EFF2FE',
          100: '#E0E5FD',
          500: '#405CF5',
          DEFAULT: '#405CF5',
          600: '#324BD9',
          700: '#253ABE',
          800: '#1C2C94',
        },
        teal: {
          50: '#F0FDF9',
          100: '#CCFBF0',
          500: '#13A58B',
          DEFAULT: '#13A58B',
          600: '#0F8873',
          700: '#0C6E5D',
        },
        civic: {
          bg: '#F5F7FB',
          border: '#E7EBF2',
          muted: '#718096',
          success: '#16A34A',
          warning: '#F59E0B',
          danger: '#DC2626',
          info: '#2563EB',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(16, 29, 50, 0.04), 0 1px 2px 0 rgba(16, 29, 50, 0.02)',
        'card': '0 4px 12px -2px rgba(16, 29, 50, 0.06), 0 2px 6px -1px rgba(16, 29, 50, 0.03)',
        'elevated': '0 12px 24px -4px rgba(16, 29, 50, 0.08), 0 4px 10px -2px rgba(16, 29, 50, 0.04)',
        'floating': '0 20px 35px -5px rgba(16, 29, 50, 0.12), 0 8px 16px -4px rgba(16, 29, 50, 0.06)',
      }
    },
  },
  plugins: [],
}
