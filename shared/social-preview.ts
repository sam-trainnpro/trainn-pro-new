export const SOCIAL_PREVIEW_IMAGE = "https://trainn.pro/social-preview.jpg";
export const SOCIAL_PREVIEW_ALT = "Trainn — fitness, sports and creative classes for the whole family";

// Share crawlers need absolute HTTP(S) URLs, including for uploaded images.
export function socialPreviewImage(image?: string | null): string {
  if (!image?.trim()) return SOCIAL_PREVIEW_IMAGE;
  try {
    const url = new URL(image, "https://trainn.pro");
    if (!["https:", "http:"].includes(url.protocol) ||
        /\/default-(?:coach|package)-image\.jpg$/.test(url.pathname)) {
      return SOCIAL_PREVIEW_IMAGE;
    }
    return url.href;
  } catch {
    return SOCIAL_PREVIEW_IMAGE;
  }
}
