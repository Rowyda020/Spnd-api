import { authenticateJWT } from './jwtAuth.mjs';
import { isLoggedIn } from './isLoggedIn.mjs';

// This middleware tries JWT first, then falls back to session
export const authenticate = async (req, res, next) => {
    // Check if JWT token exists
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        // Use JWT authentication
        return authenticateJWT(req, res, next);
    }

    // Fall back to session authentication
    return isLoggedIn(req, res, next);
};