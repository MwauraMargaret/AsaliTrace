export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Blockchain configuration
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
export const CHAIN_ID = import.meta.env.VITE_CHAIN_ID || '31337'; // Hardhat default

// OAuth clients
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
export const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID;

// Redirect URIs
export const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
export const GITHUB_REDIRECT_URI = import.meta.env.VITE_GITHUB_REDIRECT_URI;
export const APPLE_REDIRECT_URI = import.meta.env.VITE_APPLE_REDIRECT_URI;
