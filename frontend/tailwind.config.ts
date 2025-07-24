import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    
    spacing: {
      '0': '0rem',
      '1': '0.75rem',
      '2': '1.5rem',
      '3': '2.25rem',
      '4': '4.5rem',
      '5': '11.25rem'
    },
    colors: {
      white: "#fcfcf8",
      black: "#272526",
      red: "#ff4035",
      blue: "#5146f4"
    },
    fontFamily: {
      'sans': ['Rules', 'Merriweather Sans', 'ui-sans-serif', 'system-ui', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
      'mono': ['BPdots', 'Roboto Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
    },
    extend: {
      
      
    },
  },
  plugins: [require('@tailwindcss/typography')],
} satisfies Config;
