// Google Identity Services (loaded on demand by lib/google.ts)
interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

interface GoogleButtonConfig {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  width?: number;
  locale?: string;
}

interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: GoogleCredentialResponse) => void;
          auto_select?: boolean;
        }) => void;
        renderButton: (element: HTMLElement, config: GoogleButtonConfig) => void;
        prompt: () => void;
      };
    };
  };
}
