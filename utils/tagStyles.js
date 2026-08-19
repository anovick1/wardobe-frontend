import { colors } from "../styles/tokens";

const TAG_MATCHERS = [
  [/work/i, colors.tagWork],
  [/elegant/i, colors.tagElegant],
  [/casual/i, colors.tagCasual],
  [/basics?/i, colors.tagBasics],
  [/cozy/i, colors.tagCozy],
  [/winter/i, colors.tagWinter],
];

export const tagColorStyle = (tag) => {
  const match = TAG_MATCHERS.find(([pattern]) => pattern.test(tag));
  return { backgroundColor: (match ? match[1] : colors.tagDefault).bg };
};
