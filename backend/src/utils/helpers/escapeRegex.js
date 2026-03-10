/**
 * Escape special regex characters in a string for safe use in new RegExp().
 * Prevents regex injection (ReDoS) when building patterns from user input.
 */
function escapeRegex(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = escapeRegex;
