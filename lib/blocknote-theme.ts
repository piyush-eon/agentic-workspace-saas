// BlockNote's built-in "dark" theme ships its own (brownish) palette, not ours — override with
// the app's actual tokens from globals.css so the doc panel matches the rest of the UI exactly.
export const outpostDarkTheme = {
  colors: {
    editor: { text: "oklch(0.97 0.002 285)", background: "oklch(0.13 0.004 285)" },
    menu: { text: "oklch(0.97 0.002 285)", background: "oklch(0.17 0.005 285)" },
    tooltip: { text: "oklch(0.97 0.002 285)", background: "oklch(0.17 0.005 285)" },
    hovered: { text: "oklch(0.97 0.002 285)", background: "oklch(0.22 0.006 285)" },
    selected: { text: "oklch(0.93 0.03 60)", background: "oklch(0.27 0.02 55)" },
    disabled: { text: "oklch(0.64 0.01 285)", background: "oklch(0.22 0.006 285)" },
    shadow: "oklch(0 0 0 / 30%)",
    border: "oklch(1 0 0 / 10%)",
    sideMenu: "oklch(0.64 0.01 285)",
    highlights: {},
  },
  borderRadius: 8,
  fontFamily: "var(--font-geist-sans)",
};
