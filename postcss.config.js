/* eslint global-require: off, import/no-extraneous-dependencies: off */

module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
    require('postcss-preset-mantine'),
    require('postcss-simple-vars'),
  ],
};
