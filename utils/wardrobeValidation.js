export const REQUIRED_OUTFIT_RULES = [
  ["Top", "Bottom", "Shoes"],
  ["Dress", "Shoes"],
  ["One Piece", "Shoes"],
];

export const MIN_WARDROBE_ITEMS = 10;

export const canCreateDailyOutfit = (wardrobeItems) => {
  if (!wardrobeItems || wardrobeItems.length < MIN_WARDROBE_ITEMS) {
    return {
      canCreate: false,
      reason: "insufficient_items",
      itemCount: wardrobeItems?.length || 0,
      minRequired: MIN_WARDROBE_ITEMS,
    };
  }

  const categories = wardrobeItems
    .map((item) => item.category)
    .filter((category) => category);

  const uniqueCategories = [...new Set(categories.map((c) => c.toLowerCase()))];

  const hasValidCombination = REQUIRED_OUTFIT_RULES.some((rule) => {
    const requiredCategories = rule.map((cat) => cat.toLowerCase());
    return requiredCategories.every((reqCat) =>
      uniqueCategories.includes(reqCat),
    );
  });

  if (!hasValidCombination) {
    const missingForEachRule = REQUIRED_OUTFIT_RULES.map((rule) => {
      const requiredCategories = rule.map((cat) => cat.toLowerCase());
      const missing = requiredCategories.filter(
        (reqCat) => !uniqueCategories.includes(reqCat),
      );
      return { rule, missing };
    });

    return {
      canCreate: false,
      reason: "missing_categories",
      missingCombinations: missingForEachRule,
      currentCategories: uniqueCategories,
    };
  }

  return {
    canCreate: true,
  };
};

export const getWardrobeValidationMessage = (validationResult) => {
  if (validationResult.canCreate) return null;

  if (validationResult.reason === "insufficient_items") {
    const remaining = MIN_WARDROBE_ITEMS - validationResult.itemCount;
    return {
      title: "Build Your Wardrobe",
      message: `Add ${remaining} more ${
        remaining === 1 ? "item" : "items"
      } to unlock daily outfit suggestions`,
      subMessage: `${validationResult.itemCount}/${MIN_WARDROBE_ITEMS} items`,
      rules: REQUIRED_OUTFIT_RULES,
    };
  }

  if (validationResult.reason === "missing_categories") {
    const simplestMissing = validationResult.missingCombinations.reduce(
      (shortest, current) =>
        current.missing.length < shortest.missing.length ? current : shortest,
    );

    return {
      title: "Complete Your Wardrobe",
      message: `Add ${simplestMissing.missing.join(
        " and ",
      )} to start getting outfit suggestions`,
      subMessage: "You need at least one complete outfit combination:",
      rules: REQUIRED_OUTFIT_RULES,
    };
  }

  return null;
};

