export const isLoggedIn = (req, res, next) => {
    console.log('[AUTH] Incoming request to protected route:', req.path);
    console.log('[AUTH] Full headers:', req.headers);

    const authHeader = req.headers.authorization || req.headers.Authorization;
    console.log('[AUTH] Authorization header raw:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('[AUTH] No or invalid Bearer token');
        return res.status(401).json({ message: 'Unauthorized - No token' });
    }

    const token = authHeader.split(' ')[1];
    console.log('[AUTH] Extracted token (first 20 chars):', token.substring(0, 20) + '...');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // ← make sure secret matches login
        console.log('[AUTH] Decoded token:', decoded);

        req.user = decoded; // or fetch full user from DB if needed
        next();
    } catch (err) {
        console.error('[AUTH] JWT verification failed:', err.name, err.message);
        return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }
};