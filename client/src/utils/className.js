/**
 * Utility function to combine CSS class names
 * Similar to clsx/classnames but simpler implementation
 *
 * @param {...(string|object|array)} classes - Classes to combine
 * @returns {string} Combined class string
 *
 * Usage examples:
 * cn('btn', 'btn-primary') // 'btn btn-primary'
 * cn('btn', isActive && 'active') // 'btn active' (if isActive is true)
 * cn('btn', { active: isActive, disabled: isDisabled }) // 'btn active' (if isActive is true)
 * cn(['btn', 'btn-primary']) // 'btn btn-primary'
 */
export function cn(...classes) {
  return classes
    .flat() // Handle arrays
    .filter(Boolean) // Remove falsy values
    .map((cls) => {
      if (typeof cls === "string") {
        return cls;
      }
      if (typeof cls === "object" && cls !== null) {
        // Handle objects like { active: true, disabled: false }
        return Object.entries(cls)
          .filter(([, value]) => Boolean(value))
          .map(([key]) => key)
          .join(" ");
      }
      return "";
    })
    .filter(Boolean) // Remove empty strings
    .join(" ") // Join all classes with spaces
    .trim(); // Remove leading/trailing spaces
}

// Alternative shorter name (commonly used)
export const clsx = cn;
