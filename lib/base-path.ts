export const BASE_PATH = "/content-pipeline";

export function apiPath(path: string): string {
  if (!path.startsWith("/")) path = "/" + path;
  return `${BASE_PATH}${path}`;
}
