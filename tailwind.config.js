/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        hcsj: {
          accent: "#0b6b6b",
          "accent-soft": "#e6f2f2",
          paper: "#ffffff",
          bg: "#eef2f5",
          line: "#c9d6dd",
          "line-strong": "#9db0ba",
          ink: "#12232e",
          "ink-soft": "#4a5b66",
        }
      }
    },
  },
  plugins: [],
}
