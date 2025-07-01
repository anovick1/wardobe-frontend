/**
 * Search utility functions for wardrobe items
 */

/**
 * Search wardrobe items based on query string
 * Searches across title, brand, category, subcategory, color, tags, and description
 * @param {Array} items - Array of wardrobe items to search
 * @param {string} query - Search query string
 * @returns {Array} Filtered array of items matching the search query
 */
export const searchWardrobeItems = (items, query) => {
  if (!query || query.trim() === "" || !Array.isArray(items)) {
    return items;
  }

  const searchTerm = query.toLowerCase().trim();
  
  return items.filter((item) => {
    // Search in title/name
    const title = (item.title || item.name || "").toLowerCase();
    if (title.includes(searchTerm)) return true;
    
    // Search in brand
    const brand = (item.brand || "").toLowerCase();
    if (brand.includes(searchTerm)) return true;
    
    // Search in category
    const category = (item.category || "").toLowerCase();
    if (category.includes(searchTerm)) return true;
    
    // Search in subcategory
    const subcategory = (item.subcategory || "").toLowerCase();
    if (subcategory.includes(searchTerm)) return true;
    
    // Search in color
    const color = (item.primary_color || item.color || "").toLowerCase();
    if (color.includes(searchTerm)) return true;
    
    // Search in tags
    if (item.tags && Array.isArray(item.tags)) {
      const tagMatch = item.tags.some(tag => 
        tag.toLowerCase().includes(searchTerm)
      );
      if (tagMatch) return true;
    }
    
    // Search in description
    const description = (item.description || "").toLowerCase();
    if (description.includes(searchTerm)) return true;
    
    return false;
  });
};

/**
 * Debounce function to limit search frequency for better performance
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};