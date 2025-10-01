/**
 * Utility functions for text processing
 */
import DOMPurify from 'dompurify';

/**
 * Convert URLs in text to clickable HTML links
 * @param text - The text containing URLs
 * @returns Sanitized HTML string with clickable links
 */
export const convertUrlsToLinks = (text: string): string => {
  // First escape HTML to prevent XSS, then convert URLs to links
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  // Now convert URLs to links (safe because all HTML is escaped)
  const withLinks = escapedText.replace(
    /(https?:\/\/[^\s]+)/g, 
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">$1</a>'
  );
  
  // Sanitize the output with DOMPurify as an extra security layer
  return DOMPurify.sanitize(withLinks, {
    ALLOWED_TAGS: ['a', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class']
  });
};

/**
 * Component for rendering text with clickable links
 * Use this with dangerouslySetInnerHTML for displaying text with URLs
 */
export const createLinkedTextProps = (text: string) => ({
  dangerouslySetInnerHTML: { __html: convertUrlsToLinks(text) }
});