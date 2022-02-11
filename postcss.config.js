const tailwindcss = require("tailwindcss")
const autoprefixer = require("autoprefixer")
const postcss-import = require("postcss-import")

const mode = process.env.NODE_ENV
const dev = mode === "development"

module.exports = {
    plugins: [
        postcss-import,
        tailwindcss,
        autoprefixer,
    ],
}
