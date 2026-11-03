import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        tani: {
          green: {
            DEFAULT: "#195B3E",
            dark: "#12432d",
            light: "#237d56",
            subtle: "#e8f5ee",
          },
          cream: {
            DEFAULT: "#FAF5E9",
            dark: "#f2e9d3",
            light: "#fdfbf5",
          },
          slate: "#1F2937",
          amber: "#D97706",
          crimson: "#DC2626",
        },
      },
    },
  },
  plugins: [],
};
export default config;
