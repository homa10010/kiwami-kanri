/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.{js,jsx,html}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Hiragino Sans"', '"Hiragino Kaku Gothic ProN"', '"Yu Gothic"', 'Meiryo', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
