// BlockNote's built-in "dark" theme ships its own (brownish) palette, not ours — override with
// the app's actual tokens from globals.css so the doc panel matches the rest of the UI exactly.
export const outpostDarkTheme = {
  colors: {
    editor: { text: "oklch(0.98 0 0)", background: "oklch(0.12 0 0)" },
    menu: { text: "oklch(0.98 0 0)", background: "oklch(0.17 0 0)" },
    tooltip: { text: "oklch(0.98 0 0)", background: "oklch(0.17 0 0)" },
    hovered: { text: "oklch(0.98 0 0)", background: "oklch(0.24 0 0)" },
    selected: { text: "oklch(0.98 0 0)", background: "oklch(0.32 0 0)" },
    disabled: { text: "oklch(0.72 0 0)", background: "oklch(0.24 0 0)" },
    shadow: "oklch(0 0 0 / 30%)",
    border: "oklch(1 0 0 / 10%)",
    sideMenu: "oklch(0.72 0 0)",
    highlights: {},
  },
  borderRadius: 8,
  fontFamily: "var(--font-geist-sans)",
};
