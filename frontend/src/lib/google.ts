import { useEffect, useState, type RefObject } from 'react';

const GSI_SRC = 'https://accounts.google.com/gsi/client';

export const GOOGLE_CLIENT_ID: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID || undefined;

let loader: Promise<void> | null = null;

/** Loads the Google Identity Services script once, only on pages that need it. */
export function loadGoogleIdentity(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!loader) {
    loader = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        loader = null;
        reject(new Error('Falha ao carregar o Google Sign-In'));
      };
      document.head.appendChild(script);
    });
  }
  return loader;
}

/**
 * Renders the official Google button into `buttonRef` and calls `onCredential` with the
 * ID token. Returns false when Google login is not configured or the script failed to load,
 * so the page can hide the section. `onCredential` must be memoized (useCallback).
 */
export function useGoogleSignIn(
  buttonRef: RefObject<HTMLDivElement>,
  onCredential: (idToken: string) => void,
  text: GoogleButtonConfig['text'] = 'continue_with',
): boolean {
  const [available, setAvailable] = useState(!!GOOGLE_CLIENT_ID);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;

    loadGoogleIdentity()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => onCredential(response.credential),
        });
        buttonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'filled_black',
          size: 'large',
          width: 320,
          text,
          shape: 'pill',
          locale: 'pt-BR',
        });
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });

    return () => {
      cancelled = true;
    };
  }, [buttonRef, onCredential, text]);

  return available;
}
