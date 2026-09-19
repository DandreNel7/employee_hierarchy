import axios from "axios";

// Same origin as the site.
export const api = axios.create({ baseURL: "/api", withCredentials: true });

export function errorMessage(
  error: unknown,
  fallback = "Something went wrong.",
) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
}
