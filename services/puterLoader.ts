/**
 * Dynamic Puter.js Loader
 * Ensures Puter.js is loaded before making AI calls
 */

let puterLoadPromise: Promise<void> | null = null;

export async function ensurePuterLoaded(): Promise<void> {
    // If already loaded, return immediately
    if ((window as any).puter) {
        return Promise.resolve();
    }

    // If loading is in progress, wait for it
    if (puterLoadPromise) {
        return puterLoadPromise;
    }

    // Start loading
    puterLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://js.puter.com/v2/';
        script.async = true;

        script.onload = () => {
            console.log('[Puter Loader] ✅ Puter.js loaded successfully');
            resolve();
        };

        script.onerror = (error) => {
            console.error('[Puter Loader] ❌ Failed to load Puter.js', error);
            puterLoadPromise = null; // Allow retry
            reject(new Error('Failed to load Puter.js from CDN'));
        };

        document.head.appendChild(script);
    });

    return puterLoadPromise;
}

export function isPuterAvailable(): boolean {
    return typeof (window as any).puter !== 'undefined';
}
