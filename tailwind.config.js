/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "375px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        tablet: "768px",
        desktop: "1024px",
      },
      spacing: {
        safe: "env(safe-area-inset-bottom, 0px)",
        "safe-top": "env(safe-area-inset-top, 0px)",
      },
      minHeight: {
        screen: "100vh",
        "screen-dynamic": "100dvh",
      },
    },
  },
  plugins: [],
};
