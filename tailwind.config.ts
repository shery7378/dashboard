/** @see https://tailwindcss.com/docs/configuration */
interface TailwindConfig {
  content: string[];
  theme?: { extend?: Record<string, unknown> };
  plugins?: unknown[];
}

const config: TailwindConfig = {
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
