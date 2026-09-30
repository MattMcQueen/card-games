declare const __BUILD__: string;

/** Which build this is: the commit it was built from on GitHub (vite.ts), or "local". Shown on the About page. */
export const build: string = __BUILD__;
