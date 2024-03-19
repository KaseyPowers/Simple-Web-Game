type BaseThemeColors = "main";
type BaseThemeColorObj = Record<BaseThemeColors, string>;
// NOTE: base color should be middle of the road for black+white cards to have decent contrast
const backgrounds: BaseThemeColorObj = {
  main: "bg-emerald-600",
} as const;

const typography: {
  colors: BaseThemeColorObj;
} = {
  colors: {
    main: "text-white",
  },
} as const;

const baseStyles = {
  backgrounds,
  typography,
} as const;

export default baseStyles;
