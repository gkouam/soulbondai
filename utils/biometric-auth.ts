/**
 * Biometric authentication utilities using WebAuthn API
 */

interface BiometricCredential {
  id: string;
  publicKey: string;
  userId: string;
}

/**
 * Checks if biometric authentication is available
 */
export async function isBiometricAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }
  
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
}

/**
 * Registers biometric credentials for a user
 */
export async function registerBiometric(userId: string, userEmail: string): Promise<boolean> {
  if (!await isBiometricAvailable()) {
    throw new Error('Biometric authentication not available');
  }
  
  try {
    // Generate challenge (in production, get this from server)
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    
    // Create credential options
    const credentialOptions: CredentialCreationOptions = {
      publicKey: {
        challenge,
        rp: {
          name: 'SoulBond AI',
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userEmail,
          displayName: userEmail.split('@')[0],
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
        attestation: 'none',
      },
    };
    
    // Create credential
    const credential = await navigator.credentials.create(credentialOptions) as PublicKeyCredential;
    
    if (!credential) {
      throw new Error('Failed to create credential');
    }
    
    // Store credential ID in localStorage (in production, store on server)
    const credentialData: BiometricCredential = {
      id: credential.id,
      publicKey: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
      userId,
    };
    
    localStorage.setItem('biometric_credential', JSON.stringify(credentialData));
    localStorage.setItem('biometric_enabled', 'true');
    
    return true;
  } catch (error) {
    console.error('Biometric registration failed:', error);
    return false;
  }
}

/**
 * Authenticates user with biometric
 */
export async function authenticateWithBiometric(): Promise<{ success: boolean; userId?: string }> {
  if (!await isBiometricAvailable()) {
    return { success: false };
  }
  
  try {
    // Get stored credential
    const storedCredential = localStorage.getItem('biometric_credential');
    if (!storedCredential) {
      return { success: false };
    }
    
    const credentialData: BiometricCredential = JSON.parse(storedCredential);
    
    // Generate challenge (in production, get this from server)
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    
    // Create assertion options
    const assertionOptions: CredentialRequestOptions = {
      publicKey: {
        challenge,
        allowCredentials: [{
          id: Uint8Array.from(atob(credentialData.publicKey), c => c.charCodeAt(0)),
          type: 'public-key',
          transports: ['internal'],
        }],
        userVerification: 'required',
        timeout: 60000,
      },
    };
    
    // Get assertion
    const assertion = await navigator.credentials.get(assertionOptions) as PublicKeyCredential;
    
    if (!assertion) {
      return { success: false };
    }
    
    // In production, verify assertion on server
    // For now, just return success with user ID
    return {
      success: true,
      userId: credentialData.userId,
    };
  } catch (error) {
    console.error('Biometric authentication failed:', error);
    return { success: false };
  }
}

/**
 * Checks if biometric is enabled for current user
 */
export function isBiometricEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('biometric_enabled') === 'true';
}

/**
 * Disables biometric authentication
 */
export function disableBiometric(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('biometric_credential');
  localStorage.removeItem('biometric_enabled');
}

/**
 * Gets stored biometric email hint
 */
export function getBiometricEmailHint(): string | null {
  if (typeof window === 'undefined') return null;
  
  const credential = localStorage.getItem('biometric_credential');
  if (!credential) return null;
  
  try {
    const data = JSON.parse(credential);
    // In production, store email hint separately for privacy
    return data.userId ? '••••••@••••••' : null;
  } catch {
    return null;
  }
}