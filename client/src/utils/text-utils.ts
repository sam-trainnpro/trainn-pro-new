/**
 * Utility functions for text processing
 */

/**
 * Convert URLs in text to clickable HTML links
 * @param text - The text containing URLs
 * @returns HTML string with clickable links
 */
export const convertUrlsToLinks = (text: string): string => {
  return text.replace(
    /(https?:\/\/[^\s]+)/g, 
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">$1</a>'
  );
};

/**
 * Component for rendering text with clickable links
 * Use this with dangerouslySetInnerHTML for displaying text with URLs
 */
export const createLinkedTextProps = (text: string) => ({
  dangerouslySetInnerHTML: { __html: convertUrlsToLinks(text) }
});