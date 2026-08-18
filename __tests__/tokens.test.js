import { colors, spacing, radius, typography, shadow } from "../styles/tokens";
import { colors as legacyColors } from "../styles/colors";
import { tagColorStyle } from "../utils/tagStyles";

const HEX = /^#[0-9A-F]{6}$/;

const TAG_KEYS = [
  "tagWork",
  "tagElegant",
  "tagCasual",
  "tagBasics",
  "tagCozy",
  "tagWinter",
  "tagDefault",
];

const LEGACY_KEYS = [
  "background",
  "primary",
  "text",
  "textSecondary",
  "card",
  "surface",
  "white",
  "success",
  "error",
  "gray100",
  "gray200",
  "gray300",
  "gray400",
  "gray500",
  "gray600",
];

const flatColorEntries = () =>
  Object.entries(colors).flatMap(([key, value]) =>
    typeof value === "string"
      ? [[key, value]]
      : Object.entries(value).map(([sub, hex]) => [`${key}.${sub}`, hex]),
  );

const channelLuminance = (channel) =>
  channel <= 0.03928
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);

const relativeLuminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((offset) =>
    channelLuminance(parseInt(hex.slice(offset, offset + 2), 16) / 255),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrastRatio = (foreground, background) => {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const [lighter, darker] = a > b ? [a, b] : [b, a];
  return (lighter + 0.05) / (darker + 0.05);
};

const isAscending = (scale) => {
  const values = Object.values(scale);
  return values.every(
    (value, index) => index === 0 || value > values[index - 1],
  );
};

describe("contrastRatio", () => {
  it("returns the WCAG extremes for black and white", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 2);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
  });

  it("is symmetric in its arguments", () => {
    expect(contrastRatio("#2B2620", "#F6F1E6")).toBeCloseTo(
      contrastRatio("#F6F1E6", "#2B2620"),
      10,
    );
  });
});

describe("colors", () => {
  it("expresses every token as an uppercase 6-digit hex", () => {
    flatColorEntries().forEach(([key, value]) => {
      expect(`${key}: ${value}`).toMatch(new RegExp(`^${key}: #[0-9A-F]{6}$`));
    });
  });

  it("keeps tokens that carry different meaning visually distinct", () => {
    const distinctPairs = [
      ["accent", "accentPressed"],
      ["accent", "accentSubtle"],
      ["paper", "surface"],
      ["paper", "surfaceSunken"],
      ["ink", "inkSecondary"],
      ["inkSecondary", "inkMuted"],
      ["border", "borderStrong"],
      ["success", "danger"],
      ["danger", "warning"],
    ];
    distinctPairs.forEach(([a, b]) => {
      expect(colors[a]).not.toEqual(colors[b]);
    });
  });

  it("gives every tag its own background so tags stay tellable apart", () => {
    const backgrounds = TAG_KEYS.map((key) => colors[key].bg);
    expect(new Set(backgrounds).size).toEqual(TAG_KEYS.length);
  });

  it("exposes bg and fg for every tag token", () => {
    TAG_KEYS.forEach((key) => {
      expect(Object.keys(colors[key]).sort()).toEqual(["bg", "fg"]);
    });
  });
});

describe("colors contrast", () => {
  it("meets 4.5:1 for text on the app background", () => {
    expect(contrastRatio(colors.ink, colors.paper)).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(colors.inkSecondary, colors.paper),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("meets 4.5:1 for text on white and sunken surfaces", () => {
    expect(contrastRatio(colors.ink, colors.surface)).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(
      contrastRatio(colors.ink, colors.surfaceSunken),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("meets 4.5:1 for label text on the accent fill", () => {
    expect(
      contrastRatio(colors.onAccent, colors.accent),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(colors.onAccent, colors.accentPressed),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("meets 4.5:1 for every tag foreground on its own background", () => {
    TAG_KEYS.forEach((key) => {
      const { bg, fg } = colors[key];
      expect({
        key,
        ratio: contrastRatio(fg, bg) >= 4.5,
      }).toEqual({ key, ratio: true });
    });
  });
});

describe("spacing", () => {
  it("is a strictly ascending numeric scale", () => {
    Object.values(spacing).forEach((value) => {
      expect(Number.isFinite(value)).toEqual(true);
    });
    expect(isAscending(spacing)).toEqual(true);
  });
});

describe("radius", () => {
  it("is a strictly ascending numeric scale", () => {
    Object.values(radius).forEach((value) => {
      expect(Number.isFinite(value)).toEqual(true);
    });
    expect(isAscending(radius)).toEqual(true);
  });

  it("ends in a pill radius large enough to fully round any control", () => {
    expect(radius.pill).toBeGreaterThanOrEqual(999);
  });
});

describe("typography", () => {
  it("is a strictly ascending font size scale", () => {
    expect(isAscending(typography.fontSize)).toEqual(true);
  });

  it("resolves both font families to a usable value", () => {
    expect(typeof typography.fontFamily.display).toEqual("string");
    expect(typeof typography.fontFamily.body).toEqual("string");
  });

  it("builds each composed text style from the primitives", () => {
    const composed = [
      "itemName",
      "brand",
      "price",
      "sectionTitle",
      "screenTitle",
      "bodyText",
      "caption",
    ];
    composed.forEach((name) => {
      const style = typography[name];
      expect(Object.keys(style)).toEqual(
        expect.arrayContaining([
          "fontSize",
          "lineHeight",
          "color",
          "fontFamily",
        ]),
      );
      expect(style.lineHeight).toBeGreaterThan(style.fontSize);
      expect(Object.values(typography.fontSize)).toContain(style.fontSize);
      expect(Object.values(colors)).toContain(style.color);
    });
  });
});

describe("shadow", () => {
  it("exposes the React Native shadow keys at every level", () => {
    ["sm", "md", "lg"].forEach((level) => {
      expect(Object.keys(shadow[level])).toEqual(
        expect.arrayContaining([
          "shadowColor",
          "shadowOffset",
          "shadowOpacity",
          "shadowRadius",
          "elevation",
        ]),
      );
      expect(shadow[level].shadowColor).toMatch(HEX);
      expect(Object.keys(shadow[level].shadowOffset).sort()).toEqual([
        "height",
        "width",
      ]);
    });
  });

  it("grows in strength from sm to lg", () => {
    expect(shadow.sm.shadowOpacity).toBeLessThan(shadow.md.shadowOpacity);
    expect(shadow.md.shadowOpacity).toBeLessThan(shadow.lg.shadowOpacity);
    expect(shadow.sm.elevation).toBeLessThan(shadow.md.elevation);
    expect(shadow.md.elevation).toBeLessThan(shadow.lg.elevation);
  });

  it("tints shadows warm rather than pure black", () => {
    expect(shadow.md.shadowColor).not.toEqual("#000000");
  });
});

describe("legacy colors shim", () => {
  it("still exports every key the pre-Terrace palette exported", () => {
    expect(Object.keys(legacyColors).sort()).toEqual(
      expect.arrayContaining([...LEGACY_KEYS].sort()),
    );
  });

  it("resolves every legacy key to a valid hex", () => {
    LEGACY_KEYS.forEach((key) => {
      expect({ key, hex: HEX.test(legacyColors[key]) }).toEqual({
        key,
        hex: true,
      });
    });
  });

  it("maps legacy keys onto Terrace values rather than the old palette", () => {
    expect(legacyColors.background).toEqual(colors.paper);
    expect(legacyColors.primary).toEqual(colors.accent);
    expect(legacyColors.text).toEqual(colors.ink);
    expect(legacyColors.textSecondary).toEqual(colors.inkSecondary);
    expect(legacyColors.error).toEqual(colors.danger);
  });
});

describe("tagColorStyle", () => {
  it("sources each tag background from the Terrace tag tokens", () => {
    expect(tagColorStyle("Work")).toEqual({
      backgroundColor: colors.tagWork.bg,
    });
    expect(tagColorStyle("elegant")).toEqual({
      backgroundColor: colors.tagElegant.bg,
    });
    expect(tagColorStyle("basics")).toEqual({
      backgroundColor: colors.tagBasics.bg,
    });
    expect(tagColorStyle("basic")).toEqual({
      backgroundColor: colors.tagBasics.bg,
    });
  });

  it("falls back to the default tag token for unknown tags", () => {
    expect(tagColorStyle("nonsense")).toEqual({
      backgroundColor: colors.tagDefault.bg,
    });
  });
});
