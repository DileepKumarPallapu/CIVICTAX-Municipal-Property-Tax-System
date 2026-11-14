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
        // CivicTax 2.0 Premium Design System Tokens
        ct: {
          dark: {
            bg: '#080D18',
            sidebar: '#0C1424',
            surface: '#111C2E',
            elevated: '#17243A',
            textPrimary: '#F8FAFC',
            textSecondary: '#94A3B8',
            border: '#26354B',
            accent: '#2563EB',
            teal: '#14B8A6',
            success: '#22C55E',
            warning: '#F59E0B',
            danger: '#EF4444',
          },
          light: {
            bg: '#F4F7FB',
            sidebar: '#FFFFFF',
            surface: '#FFFFFF',
            elevated: '#F8FAFC',
            textPrimary: '#172033',
            textSecondary: '#64748B',
            border: '#E2E8F0',
            accent: '#2563EB',
            teal: '#0D9488',
            success: '#16A34A',
            warning: '#D97706',
            danger: '#DC2626',
          }
        },
        // Backward-compatible semantic color bindings
        brand: {
          midnight: '#0C1424',
          deepslate: '#111C2E',
          indigo: '#2563EB',
          teal: '#14B8A6',
          softwhite: '#FFFFFF',
          bg: '#F4F7FB',
          border: '#E2E8F0',
          muted: '#64748B',
        },
        navy: {
          950: '#080D18',
          900: '#0C1424',
          800: '#111C2E',
          DEFAULT: '#0C1424',
          700: '#17243A',
          600: '#26354B',
        },
        royal: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#2563EB',
          DEFAULT: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
          800: '#1E3A8A',
        },
        teal: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          500: '#14B8A6',
          DEFAULT: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
        },
        civic: {
          bg: '#F4F7FB',
          border: '#E2E8F0',
          muted: '#64748B',
          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#2563EB',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(8, 13, 24, 0.04), 0 1px 2px 0 rgba(8, 13, 24, 0.02)',
        'card': '0 4px 16px -2px rgba(8, 13, 24, 0.06), 0 2px 6px -1px rgba(8, 13, 24, 0.03)',
        'elevated': '0 12px 28px -4px rgba(8, 13, 24, 0.10), 0 4px 12px -2px rgba(8, 13, 24, 0.05)',
        'floating': '0 20px 40px -6px rgba(8, 13, 24, 0.16), 0 8px 20px -4px rgba(8, 13, 24, 0.08)',
        'glow-accent': '0 0 20px -3px rgba(37, 99, 235, 0.35)',
        'glow-teal': '0 0 20px -3px rgba(20, 184, 166, 0.35)',
      }
    },
  },
  plugins: [],
}
