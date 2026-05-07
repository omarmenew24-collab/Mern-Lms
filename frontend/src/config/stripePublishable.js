/**
 * Prefer VITE_STRIPE_PUBLISHABLE_KEY. In dev only, falls back so checkout works without .env;
 * production must set the env var (never commit live keys).
 */
const DEV_FALLBACK_PUBLISHABLE_KEY =
  "pk_test_51S4KZSBiu0YNe79tH8owEYRj5FiJkp4OuV48AxirNSnO63d635fMWE7sUJKCPnQ897Lr1BP53pnuckQlqsQzXrVa0098hw6Qkt";

export function getStripePublishableKey() {
  const fromEnv = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim();
  if (fromEnv) return fromEnv;
  if (import.meta.env.DEV) {
    console.warn(
      "[stripe] VITE_STRIPE_PUBLISHABLE_KEY is unset — using bundled test key for local dev only.",
    );
    return DEV_FALLBACK_PUBLISHABLE_KEY;
  }
  return "";
}
