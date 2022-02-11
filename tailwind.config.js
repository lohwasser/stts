module.exports = {
    purge: ["./src/**/*.svelte"],

    theme: {
        fontFamily: {
            sans: ["IBM Plex Sans", "ui-sans-serif", "sans-serif"],
            serif: ["IBM Plex Serif", "ui-serif", "serif"],
            mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
            display: ["IBM Plex Sans Condensed", "ui-sans-serif", "sans-serif"],
            pixel: ["fippsregular", "ui-sans-serif", "sans-serif"],
        },
        extend: {
            keyframes: {
                rainbow: {
                    "0%": { filter: "hue-rotate(0deg)" },
                    "100%": { filter: "hue-rotate(360deg)" },
                },
            },
            animation: {
                rainbow: "rainbow 4s linear infinite",
            },
        },
    },
    variants: {},
    plugins: [],
}
