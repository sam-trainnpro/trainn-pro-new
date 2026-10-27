// Keep crawler discovery and document rendering aligned with public browsing.
export function isPublicClass(item: { status: string }): boolean {
  return item.status !== "cancelled" && item.status !== "deleted";
}
