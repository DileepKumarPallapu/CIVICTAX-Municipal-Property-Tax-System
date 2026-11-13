import crypto from 'crypto';

export class PKCEUtils {
  // Generate high-entropy cryptographic random string (43 to 128 characters)
  public static generateCodeVerifier(length: number = 64): string {
    return crypto
      .randomBytes(length)
      .toString('base64url')
      .slice(0, length);
  }

  // Generate SHA-256 base64url-encoded code challenge from verifier
  public static generateCodeChallenge(verifier: string): string {
    return crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');
  }

  // Generate secure random state token to prevent CSRF attacks during OAuth dance
  public static generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
