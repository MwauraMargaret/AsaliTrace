import api from './api';

/**
 * Handle Google OAuth authentication
 * This uses Google's OAuth2 popup flow
 */
export const handleGoogleAuth = async () => {
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || window.location.origin + '/auth/callback';

  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google Client ID not configured');
  }

  // For now, we'll use a simplified flow where frontend gets the token
  // and sends it to backend. In production, use proper OAuth2 flow.
  return new Promise((resolve, reject) => {
    // This is a simplified implementation
    // In production, use Google's OAuth2 library
    window.gapi?.load('auth2', () => {
      window.gapi.auth2.init({
        client_id: GOOGLE_CLIENT_ID,
      }).then(() => {
        const authInstance = window.gapi.auth2.getAuthInstance();
        authInstance.signIn().then((googleUser: any) => {
          const accessToken = googleUser.getAuthResponse().access_token;
          sendTokenToBackend('google', accessToken)
            .then(resolve)
            .catch(reject);
        }).catch(reject);
      }).catch(reject);
    });
  });
};

/**
 * Handle GitHub OAuth authentication
 */
export const handleGithubAuth = async () => {
  const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
  const REDIRECT_URI = import.meta.env.VITE_GITHUB_REDIRECT_URI || window.location.origin + '/auth/callback';

  if (!GITHUB_CLIENT_ID) {
    throw new Error('GitHub Client ID not configured');
  }

  // Redirect to GitHub OAuth
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user:email`;
  window.location.href = githubAuthUrl;
};

/**
 * Send OAuth token to backend for verification and JWT generation
 */
const sendTokenToBackend = async (provider: 'google' | 'github' | 'apple', accessToken: string) => {
  try {
    const response = await api.post(`/auth/social/${provider}/`, {
      access_token: accessToken,
    });

    const { access, refresh, user } = response.data;
    
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    
    return { access, refresh, user };
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Social authentication failed');
  }
};

/**
 * Handle OAuth callback (for GitHub redirect flow)
 */
export const handleOAuthCallback = async (provider: string, code?: string) => {
  if (provider === 'github' && code) {
    // Exchange code for token (this should be done server-side in production)
    // For now, we'll need the backend to handle this
    try {
      const response = await api.post(`/auth/social/${provider}/callback/`, { code });
      const { access, refresh, user } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      return { access, refresh, user };
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'OAuth callback failed');
    }
  }
};

