/**
 * Format a date string or Date object to a readable format
 * @param {string|Date} date - The date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return "N/A";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return "Invalid date";
    }

    const defaultOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      ...options,
    };

    return dateObj.toLocaleString("en-US", defaultOptions);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};

/**
 * Format a date to show only the date part
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDateOnly = (date) => {
  return formatDate(date, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: undefined,
    minute: undefined,
  });
};

/**
 * Format a date to show only the time part
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted time string
 */
export const formatTimeOnly = (date) => {
  return formatDate(date, {
    year: undefined,
    month: undefined,
    day: undefined,
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Get relative time string (e.g., "2 hours ago", "3 days ago")
 * @param {string|Date} date - The date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return "N/A";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);

    if (diffInSeconds < 60) {
      return "just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} month${months > 1 ? "s" : ""} ago`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years} year${years > 1 ? "s" : ""} ago`;
    }
  } catch (error) {
    console.error("Error calculating relative time:", error);
    return formatDate(date);
  }
};

/**
 * Check if a date is today
 * @param {string|Date} date - The date to check
 * @returns {boolean} True if the date is today
 */
export const isToday = (date) => {
  if (!date) return false;

  const dateObj = typeof date === "string" ? new Date(date) : date;
  const today = new Date();

  return dateObj.toDateString() === today.toDateString();
};

/**
 * Check if a date is within the last N days
 * @param {string|Date} date - The date to check
 * @param {number} days - Number of days to check
 * @returns {boolean} True if the date is within the last N days
 */
export const isWithinDays = (date, days) => {
  if (!date) return false;

  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInDays = (now - dateObj) / (1000 * 60 * 60 * 24);

  return diffInDays >= 0 && diffInDays <= days;
};

/**
 * Format date for API requests (ISO format)
 * @param {string|Date} date - The date to format
 * @returns {string} ISO formatted date string
 */
export const formatForAPI = (date) => {
  if (!date) return null;

  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toISOString();
};

/**
 * Parse date from various formats
 * @param {string|Date|number} date - The date to parse
 * @returns {Date|null} Parsed Date object or null
 */
export const parseDate = (date) => {
  if (!date) return null;

  if (date instanceof Date) {
    return date;
  }

  if (typeof date === "number") {
    return new Date(date);
  }

  if (typeof date === "string") {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
};
