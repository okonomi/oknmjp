/** @type {import("prettier").Config} */
export default {
  semi: false,
  singleQuote: false,
  printWidth: 120,
  plugins: ["prettier-plugin-astro"],
  overrides: [
    {
      files: "*.astro",
      options: {
        parser: "astro",
      },
    },
  ],
}
