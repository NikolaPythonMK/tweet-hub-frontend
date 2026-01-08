export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) {
    return null;
  }
  return url.startsWith("/") ? `/api${url}` : url;
}

export function validateImageFile(
  file: File,
  maxSize: number = MAX_IMAGE_BYTES,
): string | null {
  if (!file.type.startsWith("image/")) {
    return "Only image files are allowed.";
  }
  if (file.size > maxSize) {
    return "Image must be 5MB or smaller.";
  }
  return null;
}
