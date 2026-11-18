/**
 * The theme boot script, kept apart from the hooks in theme.ts so the root
 * layout (a server component) can import it as a plain string.
 */
export const THEME_KEY = 'aura_theme_v1';
export const LIGHT_QUERY = '(prefers-color-scheme: light)';

/** Runs in <head> before the first paint, so a Daylight page never flashes dark. */
export const THEME_BOOT_SCRIPT = `(function(){try{var c=localStorage.getItem('${THEME_KEY}');var l=c==='light'||(c==='system'&&window.matchMedia('${LIGHT_QUERY}').matches);if(l)document.documentElement.setAttribute('data-theme','light');}catch(e){}})();`;
