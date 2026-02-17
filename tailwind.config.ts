import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/@auth/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/@fuse/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/styles/**/*.{css,scss}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
