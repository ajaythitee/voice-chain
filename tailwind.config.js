/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    500: '#667eea',
                    600: '#764ba2',
                },
                secondary: {
                    500: '#f093fb',
                    600: '#f5576c',
                },
                dark: {
                    900: '#0f0f23',
                    800: '#1a1a2e',
                    700: '#16213e',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
