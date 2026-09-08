declare module "cloudflare:workers" {
  /** Runtime bindings supplied by the Cloudflare Vite plugin or Sites. */
  export const env: Record<string, any>;
}
