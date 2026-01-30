import { Router } from "express";
import passport from "passport";
import '../strategies/local-strategy.mjs'
import '../strategies/google-strategy.mjs'
import { createUserValidationSchema } from "../utils/validationSchema.mjs";
import { authenticateJWT } from "../middleware/jwtAuth.mjs";
import { generateToken } from "../utils/jwt.mjs";
import { comparePass } from "../utils/helper.mjs";
import { verifyGoogleToken } from "../utils/googleAuth.mjs";
import {
    query,
    validationResult,
    checkSchema,
    matchedData,
} from "express-validator";
import User from "../models/user.mjs";
import { hashPass } from "../utils/helper.mjs";

const router = Router();

router.get('/', (req, res) => {
    res.send("Logged in successfully")
    console.log("Logged in successfully")
})
router.post('/register', checkSchema(createUserValidationSchema), async (req, res) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
        return res.status(400).json({ errors: result.array() });
    }

    const data = matchedData(req);
    data.password = hashPass(data.password);

    const newUser = new User(data);

    try {
        const savedUser = await newUser.save();

        // Generate JWT token
        const token = generateToken(savedUser._id);

        // Return user without password + token
        const userResponse = savedUser.toObject();
        delete userResponse.password;

        return res.status(201).json({
            message: 'User registered successfully',
            token,
            user: userResponse
        });
    } catch (error) {
        console.error("Save error:", error);

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({
                error: `${field} already exists`
            });
        }

        return res.status(400).json({ error: error.message });
    }
});

// ✅ NEW: JWT-based login endpoint
router.post('/login/jwt', async (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
        return res.status(400).json({
            error: 'Email and password are required'
        });
    }

    try {
        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        // Check if user has a password (not OAuth-only user)
        if (!user.password) {
            return res.status(401).json({
                error: 'This account uses Google login. Please sign in with Google.'
            });
        }

        // Verify password
        const isValidPassword = comparePass(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        // Generate token
        const token = generateToken(user._id);

        // Return user without password
        const userResponse = user.toObject();
        delete userResponse.password;

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: userResponse
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            error: 'Server error during login'
        });
    }
});
// ✅ NEW: Google OAuth endpoint for mobile (JWT-based)
router.post('/login/google/mobile', async (req, res) => {
    const { idToken, accessToken } = req.body;

    if (!idToken && !accessToken) {
        return res.status(400).json({
            error: 'Google token is required'
        });
    }

    try {
        // Verify the Google token and get user info
        const googleUser = await verifyGoogleToken(idToken || accessToken);

        if (!googleUser) {
            return res.status(401).json({
                error: 'Invalid Google token'
            });
        }

        // Find or create user
        let user = await User.findOne({ googleId: googleUser.sub });

        if (!user) {
            // Check if user exists with this email
            user = await User.findOne({ email: googleUser.email });

            if (user) {
                // Link Google account to existing user
                user.googleId = googleUser.sub;
                await user.save();
            } else {
                // Create new user
                user = new User({
                    googleId: googleUser.sub,
                    email: googleUser.email,
                    username: googleUser.email.split('@')[0], // or use googleUser.name
                    // No password - OAuth only user
                });
                await user.save();
            }
        }

        // Generate JWT
        const token = generateToken(user._id);

        // Return user without password
        const userResponse = user.toObject();
        delete userResponse.password;

        return res.status(200).json({
            message: 'Google login successful',
            token,
            user: userResponse
        });
    } catch (error) {
        console.error('Google OAuth error:', error);
        return res.status(500).json({
            error: 'Google authentication failed',
            details: error.message
        });
    }
});

// routes/user.js or auth.js
router.get('/me', authenticateJWT, async (req, res) => {
    try {
        // req.user already has the authenticated user from middleware
        const user = await User.findById(req.user._id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Keep your existing session-based routes for web
router.post('/login',
    passport.authenticate('local', { failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/');
    }
);

router.get('/login/google', passport.authenticate('google', { scope: ['email', 'profile'] }));

router.get('/homepage', passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/auth/failure'
}));

router.get('/auth/failure', (req, res) => {
    res.send("something went wrong");
});

export default router