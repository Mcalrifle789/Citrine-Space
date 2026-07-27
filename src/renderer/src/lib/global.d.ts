export {};

declare global {
  interface Window {
    citrine: {
      bootstrap: () => Promise<{ port: number | null; token: string | null; platform: string; version: string }>;
      window: { minimize: () => void; maximize: () => void; close: () => void };
    };
  }
}
