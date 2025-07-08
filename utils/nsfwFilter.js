// NSFW URL filtering utility
// Blocks adult content from being loaded in the webview

const BLOCKED_DOMAINS = [
  // Adult content sites
  "pornhub.com",
  "xvideos.com",
  "xnxx.com",
  "redtube.com",
  "youporn.com",
  "tube8.com",
  "spankbang.com",
  "xhamster.com",
  "chaturbate.com",
  "cam4.com",
  "onlyfans.com",
  "fansly.com",

  // Dating/hookup sites with explicit content
  "adultfriendfinder.com",
  "fuckbook.com",
  "benaughty.com",

  // Gambling sites (often considered inappropriate)
  "casino.com",
  "bet365.com",
  "pokerstars.com",
  "888casino.com",

  // Add more domains as needed
];

const BLOCKED_KEYWORDS = [
  "porn",
  "xxx",
  "adult",
  "nude",
  "naked",
  "erotic",
  "casino",
  "gambling",
  "poker",
  "escort",
  "webcam",
  "hookup",
  "milf",
  "nsfw",
];

/**
 * Extracts domain from URL
 * @param {string} url - The URL to extract domain from
 * @returns {string} - The domain (without www.)
 */
const extractDomain = (url) => {
  try {
    const urlObj = new URL(url.toLowerCase());
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

/**
 * Checks if URL contains blocked keywords in path or query params
 * @param {string} url - The URL to check
 * @returns {boolean} - True if URL contains blocked keywords
 */
const containsBlockedKeywords = (url) => {
  const urlLower = url.toLowerCase();
  return BLOCKED_KEYWORDS.some((keyword) => urlLower.includes(keyword));
};

/**
 * Checks if domain is in the blocked list
 * @param {string} domain - The domain to check
 * @returns {boolean} - True if domain is blocked
 */
const isDomainBlocked = (domain) => {
  return BLOCKED_DOMAINS.some(
    (blockedDomain) =>
      domain === blockedDomain || domain.endsWith("." + blockedDomain),
  );
};

/**
 * Main filtering function to determine if URL should be blocked
 * @param {string} url - The URL to check
 * @returns {boolean} - True if URL should be allowed, false if blocked
 */
export const shouldAllowUrl = (url) => {
  if (!url || typeof url !== "string") {
    return false;
  }

  const domain = extractDomain(url);

  // Block if domain is in blocklist
  if (isDomainBlocked(domain)) {
    return false;
  }

  // Block if URL contains NSFW keywords
  if (containsBlockedKeywords(url)) {
    return false;
  }

  return true;
};

/**
 * Gets the reason why a URL was blocked (for debugging/logging)
 * @param {string} url - The blocked URL
 * @returns {string} - Reason for blocking
 */
export const getBlockReason = (url) => {
  if (!url || typeof url !== "string") {
    return "Invalid URL";
  }

  const domain = extractDomain(url);

  if (isDomainBlocked(domain)) {
    return `Blocked domain: ${domain}`;
  }

  if (containsBlockedKeywords(url)) {
    const foundKeywords = BLOCKED_KEYWORDS.filter((keyword) =>
      url.toLowerCase().includes(keyword),
    );
    return `Blocked keywords: ${foundKeywords.join(", ")}`;
  }

  return "Unknown reason";
};
