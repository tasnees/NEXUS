/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                "primary": "#415A77",
                "navy-deep": "#0D1B2A",
                "navy-dark": "#1B263B",
                "accent": "#778DA9",
                "off-white": "#E0E1DD",
                "dark-sidebar": "#0D1B2A",
                "background-light": "#f6f7f7",
                "background-dark": "#16191c",
                "surface": "#FFFFFF",
                "header": "#1B263B",
                "secondary": "#778DA9",
                "background": "#E0E1DD",
                "overlay-dark": "#0D1B2A",
                "form-neutral": "#E0E1DD",
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(13, 27, 42, 0.08)',
                'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
            },
            fontFamily: {
                "display": ["Space Grotesk", "sans-serif"],
                "sans": ["Inter", "sans-serif"]
            }
        },
    },
    plugins: [],
}
