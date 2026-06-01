/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f1117',
        foreground: '#e8eaed',
        card: '#1a1e26',
        'card-foreground': '#e8eaed',
        primary: '#57e4e4',
        'primary-foreground': '#0a1f1f',
        secondary: '#1a1e26',
        'secondary-foreground': '#e8eaed',
        muted: '#1a1e26',
        'muted-foreground': '#9ca3af',
        accent: '#e4578d',
        'accent-foreground': '#fce8f0',
        destructive: '#ef4444',
        'destructive-foreground': '#ffffff',
        border: '#2a2f3a',
        input: '#2a2f3a',
        ring: '#57e4e4',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
