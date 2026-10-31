/// <reference types="vite/client" />

declare global {
  interface Window {
    __AF_WATCHDOG__: number;
  }
}

export {};

declare module "*.jpg" {
  const src: string;
  export default src;
}
declare module "*.png" {
  const src: string;
  export default src;
}
