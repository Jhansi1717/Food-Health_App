const palette = {
  sage: "#5b8a6e",
  sageDark: "#3f6651",
  sageLight: "#cfe1d6",
  cream: "#f7f3ec",
  cream2: "#efe8da",
  ink: "#1a2620",
  inkSoft: "#5d6963",
  warn: "#d97a4a",
  rose: "#c85f5f",
  amber: "#e3a857",
  sky: "#6aa3c2",
};

const colors = {
  light: {
    text: palette.ink,
    tint: palette.sage,

    background: palette.cream,
    foreground: palette.ink,

    card: "#ffffff",
    cardForeground: palette.ink,

    primary: palette.sage,
    primaryForeground: "#ffffff",
    primaryDark: palette.sageDark,
    primaryLight: palette.sageLight,

    secondary: palette.cream2,
    secondaryForeground: palette.ink,

    muted: palette.cream2,
    mutedForeground: palette.inkSoft,

    accent: palette.amber,
    accentForeground: "#ffffff",

    destructive: palette.rose,
    destructiveForeground: "#ffffff",

    border: "#e5dfd2",
    input: "#e5dfd2",

    protein: palette.sage,
    carbs: palette.amber,
    fat: palette.warn,
    water: palette.sky,
  },

  radius: 18,
};

export default colors;
