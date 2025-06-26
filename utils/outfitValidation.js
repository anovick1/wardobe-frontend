const REQUIRED_CATEGORY_RULES = [
  ["Top", "Bottom", "Shoes"],
  ["Dress", "Shoes"],
  ["One Piece", "Shoes"],
];

/**
 * Validates if an outfit meets the required category rules and has no duplicates
 * @param {Array} wardrobeItems - Array of wardrobe items in the outfit
 * @returns {Object} - { isValid: boolean, missingCategories: Array, duplicateCategories: Array, validCombinations: Array }
 */
export const validateOutfitCategories = (wardrobeItems) => {
  if (!wardrobeItems || wardrobeItems.length === 0) {
    return {
      isValid: false,
      missingCategories: ["At least one item required"],
      duplicateCategories: [],
      validCombinations: REQUIRED_CATEGORY_RULES
    };
  }

  // Get categories from wardrobe items
  const categories = wardrobeItems
    .map(item => item.category)
    .filter(category => category); // Remove null/undefined

  const presentCategories = categories.map(category => category.toLowerCase());

  // Check for duplicate categories
  const categoryCount = {};
  const duplicateCategories = [];
  
  categories.forEach(category => {
    const lowerCategory = category.toLowerCase();
    categoryCount[lowerCategory] = (categoryCount[lowerCategory] || 0) + 1;
    if (categoryCount[lowerCategory] > 1 && !duplicateCategories.includes(category)) {
      duplicateCategories.push(category);
    }
  });

  // Check subcategories for more specific duplicates
  const subcategories = wardrobeItems
    .map(item => item.subcategory)
    .filter(subcategory => subcategory);
    
  const subcategoryCount = {};
  const duplicateSubcategories = [];
  
  subcategories.forEach(subcategory => {
    const lowerSubcategory = subcategory.toLowerCase();
    subcategoryCount[lowerSubcategory] = (subcategoryCount[lowerSubcategory] || 0) + 1;
    if (subcategoryCount[lowerSubcategory] > 1 && !duplicateSubcategories.includes(subcategory)) {
      duplicateSubcategories.push(subcategory);
    }
  });

  // Combine duplicate categories and subcategories
  const allDuplicates = [...duplicateCategories, ...duplicateSubcategories];

  // Check each rule to see if any match
  let hasValidCombination = false;
  for (const rule of REQUIRED_CATEGORY_RULES) {
    const requiredCategories = rule.map(cat => cat.toLowerCase());
    const hasAllRequired = requiredCategories.every(reqCat => 
      presentCategories.includes(reqCat)
    );
    
    if (hasAllRequired) {
      hasValidCombination = true;
      break;
    }
  }

  // If there are duplicates, outfit is invalid
  if (allDuplicates.length > 0) {
    return {
      isValid: false,
      missingCategories: [],
      duplicateCategories: allDuplicates,
      validCombinations: REQUIRED_CATEGORY_RULES
    };
  }

  // If valid combination found, outfit is valid
  if (hasValidCombination) {
    return {
      isValid: true,
      missingCategories: [],
      duplicateCategories: [],
      validCombinations: REQUIRED_CATEGORY_RULES
    };
  }

  // Find the best matching rule and what's missing
  let bestMatch = null;
  let minMissing = Infinity;

  for (const rule of REQUIRED_CATEGORY_RULES) {
    const requiredCategories = rule.map(cat => cat.toLowerCase());
    const missing = requiredCategories.filter(reqCat => 
      !presentCategories.includes(reqCat)
    );
    
    if (missing.length < minMissing) {
      minMissing = missing.length;
      bestMatch = {
        rule: rule,
        missing: missing.map(cat => 
          rule.find(original => original.toLowerCase() === cat)
        )
      };
    }
  }

  return {
    isValid: false,
    missingCategories: bestMatch ? bestMatch.missing : [],
    duplicateCategories: [],
    validCombinations: REQUIRED_CATEGORY_RULES
  };
};

/**
 * Gets a user-friendly error message for outfit validation
 * @param {Object} validationResult - Result from validateOutfitCategories
 * @returns {string} - User-friendly error message
 */
export const getOutfitValidationMessage = (validationResult) => {
  if (validationResult.isValid) {
    return "";
  }

  if (validationResult.missingCategories.includes("At least one item required")) {
    return "Please add at least one item to your outfit.";
  }

  // Handle duplicate categories
  if (validationResult.duplicateCategories && validationResult.duplicateCategories.length > 0) {
    const duplicates = validationResult.duplicateCategories;
    if (duplicates.length === 1) {
      return `You can only have one ${duplicates[0]} item per outfit. Please remove the duplicate.`;
    } else {
      return `You have duplicate items: ${duplicates.join(", ")}. Please remove duplicates - only one of each type allowed per outfit.`;
    }
  }

  // Handle missing categories
  const missing = validationResult.missingCategories;
  const combinations = validationResult.validCombinations
    .map(rule => rule.join(" + "))
    .join(" OR ");

  if (missing.length === 1) {
    return `This outfit is missing a ${missing[0]}. Valid combinations: ${combinations}`;
  } else {
    return `This outfit is missing: ${missing.join(", ")}. Valid combinations: ${combinations}`;
  }
};

/**
 * Checks if removing an item would make the outfit invalid
 * @param {Array} currentItems - Current wardrobe items in outfit
 * @param {Object} itemToRemove - Item being removed
 * @returns {Object} - { wouldBeValid: boolean, message: string }
 */
export const validateItemRemoval = (currentItems, itemToRemove) => {
  const remainingItems = currentItems.filter(item => item.id !== itemToRemove.id);
  const validation = validateOutfitCategories(remainingItems);
  
  return {
    wouldBeValid: validation.isValid,
    message: validation.isValid ? "" : getOutfitValidationMessage(validation)
  };
};

/**
 * Checks if adding an item would create duplicates
 * @param {Array} currentItems - Current wardrobe items in outfit
 * @param {Object} itemToAdd - Item being added
 * @returns {Object} - { wouldBeValid: boolean, message: string }
 */
export const validateItemAddition = (currentItems, itemToAdd) => {
  const newItems = [...currentItems, itemToAdd];
  const validation = validateOutfitCategories(newItems);
  
  return {
    wouldBeValid: validation.isValid,
    message: validation.isValid ? "" : getOutfitValidationMessage(validation)
  };
};