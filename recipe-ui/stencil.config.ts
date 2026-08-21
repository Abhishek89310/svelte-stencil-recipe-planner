import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'recipe-ui',
  globalStyle: 'src/global/theme.css',
  outputTargets: [
    // Lazy-loaded distribution: the entry point consumed by the SvelteKit app.
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    // Unbundled components, so consumers can tree-shake or re-compile them.
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
      generateTypeDeclarations: true,
    },
    // Auto-generated API reference, kept in the repo as living documentation.
    {
      type: 'docs-readme',
      footer: '',
    },
    {
      type: 'docs-json',
      file: 'docs/components.json',
    },
    // Local demo harness (npm start) - not published.
    {
      type: 'www',
      serviceWorker: null,
      copy: [{ src: 'demo', dest: '.', warn: false }],
    },
  ],
  testing: {
    browserHeadless: 'shell',
  },
  extras: {
    enableImportInjection: true,
  },
  buildEs5: false,
  sourceMap: true,
};
