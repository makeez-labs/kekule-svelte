import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * Configuration for building a library package.
 * This config is used by svelte-package to build the distributable.
 */
export default {
  preprocess: vitePreprocess(),
};
