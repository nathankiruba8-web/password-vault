/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 31: frontend/tailwind.config.js
 * Production-ready Tailwind CSS configuration file.
 * Integrates comprehensive material palette colors, custom fonts, 
 * layout viewports, and custom animation durations matching the 
 * Symmetrical Krypton UI standards.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./frontend/src/**/*.{js,ts,jsx,tsx}",
    "../frontend/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // High-integrity custom slate tones supporting absolute contrast
        slate: {
          850: "#1b2330",
          855: "#131a24",
          950: "#090d16",
        },
        // Deep indigo corporate gradients
        indigo: {
          650: "#4f46e5",
          755: "#3730a3",
        },
        // Secure emerald validation signals
        emerald: {
          450: "#34d399",
        },
        // High-consequence warning amber signals
        amber: {
          450: "#fbbf24",
        },
        // Risk assessment rose danger alerts
        rose: {
          450: "#f87171",
          655: "#e11d48",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      animation: {
        "fade-in": "fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
