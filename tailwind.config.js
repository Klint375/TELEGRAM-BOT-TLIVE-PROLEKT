/** @type {import('tailwindcss').Config} */
export default {
  content: ["./pages/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: { bg: "#0f1720", panel: "#17212b", primary: "#2a82da", danger: "#e5484d", success: "#2eb67d" },
      borderRadius: { '2xl': '1.25rem' },
      boxShadow: { soft: "0 8px 30px rgba(0,0,0,.25)" }
    }
  },
  plugins: []
};
