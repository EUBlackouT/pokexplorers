/**
 * Firebase ID token verification using Google's public JWKS.
 *
 * We intentionally do NOT use the firebase-admin SDK here -- that SDK requires
 * a service-account credential (GOOGLE_APPLICATION_CREDENTIALS) which couples
 * the project to a private key file. Firebase ID tokens are RS256-signed JWTs
 * whose public keys are served at a well-known Google URL, so we can verify
 * them with the tiny `jose` library and only need to know the project ID.
 *
 * See https://firebase.google.com/docs/auth/admin/verify-id-tokens#web for the
 * reference spec; we duplicate its required-claim checks (iss, aud, sub, exp,
 * iat, auth_time) locally.
 */

import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import fs from 'fs/promises';
import path from 'path';

export interface VerifiedToken {
    uid: string;
    issuedAt: number;    // seconds-since-epoch from the `iat` claim
    authTime: number;    // seconds-since-epoch of the actual sign-in event
    email?: string;
    emailVerified?: boolean;
    isAnonymous: boolean;
    claims: JWTPayload;
}

export class AuthVerificationError extends Error {
    constructor(message: string, public readonly reason: string) {
        super(message);
        this.name = 'AuthVerificationError';
    }
}

const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/[email protected]';

let projectIdPromise: Promise<string | null> | null = null;

const resolveProjectId = async (): Promise<string | null> => {
    const fromEnv = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    if (fromEnv) return fromEnv;
    try {
        const raw = await fs.readFile(
            path.join(process.cwd(), 'firebase-applet-config.json'),
            'utf-8'
        );
        const parsed = JSON.parse(raw) as { projectId?: string };
        return parsed.projectId ?? null;
    } catch {
        return null;
    }
};

const getProjectId = (): Promise<string | null> => {
    if (!projectIdPromise) projectIdPromise = resolveProjectId();
    return projectIdPromise;
};

// `createRemoteJWKSet` caches keys for us (with automatic rotation). We only
// need to construct it once per process.
const jwks = createRemoteJWKSet(new URL(JWKS_URL), {
    cooldownDuration: 30_000,
    cacheMaxAge: 60 * 60 * 1000, // 1h
});

/**
 * Verifies a Firebase Auth ID token, throwing AuthVerificationError on failure.
 * On success returns the trusted UID and a subset of useful claims.
 */
export const verifyFirebaseIdToken = async (token: string): Promise<VerifiedToken> => {
    const projectId = await getProjectId();
    if (!projectId) {
        throw new AuthVerificationError(
            'Server cannot determine Firebase projectId; set VITE_FIREBASE_PROJECT_ID.',
            'no-project-id'
        );
    }

    let payload: JWTPayload;
    try {
        const verified = await jwtVerify(token, jwks, {
            issuer: `https://securetoken.google.com/${projectId}`,
            audience: projectId,
            algorithms: ['RS256'],
        });
        payload = verified.payload;
    } catch (err) {
        throw new AuthVerificationError(
            `ID token failed cryptographic verification: ${(err as Error).message}`,
            'jwt-invalid'
        );
    }

    const uid = typeof payload.sub === 'string' ? payload.sub : null;
    if (!uid) throw new AuthVerificationError('Missing sub/uid claim.', 'no-sub');

    const authTime = typeof payload.auth_time === 'number' ? payload.auth_time : 0;
    if (!authTime || authTime > Math.floor(Date.now() / 1000)) {
        throw new AuthVerificationError('Missing or future auth_time.', 'bad-auth-time');
    }

    const firebaseClaims = (payload as { firebase?: { sign_in_provider?: string } }).firebase;
    const isAnonymous = firebaseClaims?.sign_in_provider === 'anonymous';

    return {
        uid,
        issuedAt: typeof payload.iat === 'number' ? payload.iat : 0,
        authTime,
        email: typeof payload.email === 'string' ? payload.email : undefined,
        emailVerified: typeof payload.email_verified === 'boolean' ? payload.email_verified : undefined,
        isAnonymous,
        claims: payload,
    };
};
