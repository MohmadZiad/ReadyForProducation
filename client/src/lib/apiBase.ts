const envBase = import.meta.env.VITE_API_URL as string | undefined;

const normalizedBase = envBase
  ? envBase.replace(/\/$/, "")
  : "";

export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (!normalizedBase) {
    return path;
  }

  if (path.startsWith("/")) {
    return `${normalizedBase}${path}`;
  }

  return `${normalizedBase}/${path}`;
}
