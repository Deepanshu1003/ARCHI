/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ARCHI_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
