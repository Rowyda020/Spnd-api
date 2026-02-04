import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.mjs'
import User from '../models/user.mjs';
import { hashPass } from '../utils/helper.mjs';

describe('POST /register - integration tests', () => {
    beforeAll(async () => {
        const testMongoUri = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/budget-app-test';
        await mongoose.connect(testMongoUri);

    });
    beforeEach(async () => {
        await User.deleteMany({});
    });
    afterAll(async () => {
        await mongoose.connection.close();
    });
    test('should register a new user successfully with valid data', async () => {
        // Arrange
        const newUser = {
            email: 'newuser@example.com',
            username: 'newuser123',
            password: 'SecurePass123!'
        };
        // Act
        const response = await request(app)
            .post('/register')
            .send(newUser)
            .expect(201); // Assert HTTP status
        // Assert - Response structure
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('message', 'User registered successfully');

        // Assert - User data in response
        expect(response.body.user.email).toBe('newuser@example.com');
        expect(response.body.user.username).toBe('newuser123');
        expect(response.body.user).not.toHaveProperty('password'); // Security: no password in response

        // Assert - JWT token format
        expect(response.body.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/); // JWT format

        // Assert - Database state
        const userInDb = await User.findOne({ email: 'newuser@example.com' });
        expect(userInDb).toBeTruthy();
        expect(userInDb.username).toBe('newuser123');
        expect(userInDb.password).not.toBe('SecurePass123!'); // Password should be hashed
        expect(userInDb.password).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });
    test('should return 409 conflict for duplicate email', async () => {
        // Arrange - Create first user
        await request(app)
            .post('/register')
            .send({
                email: 'duplicate@example.com',
                username: 'user1',
                password: 'Password123!'
            });

        // Act - Try to register with same email
        const response = await request(app)
            .post('/register')
            .send({
                email: 'duplicate@example.com',
                username: 'user2',
                password: 'DifferentPass123!'
            })
            .expect(409);

        // Assert
        expect(response.body.error).toContain('already exists');

        // Verify only one user exists in database
        const userCount = await User.countDocuments({ email: 'duplicate@example.com' });
        expect(userCount).toBe(1);
    });
    test('should return 400 validation error for missing required fields', async () => {
        // Act - Missing password
        const response = await request(app)
            .post('/register')
            .send({
                email: 'incomplete@example.com',
                username: 'incompleteuser'
                // password missing
            })
            .expect(400);

        // Assert
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors).toBeInstanceOf(Array);

        // Verify no user was created
        const userInDb = await User.findOne({ email: 'incomplete@example.com' });
        expect(userInDb).toBeNull();
    });
    test('should return 400 for invalid email format', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                email: 'not-an-email',
                username: 'testuser',
                password: 'Password123!'
            })
            .expect(400);

        expect(response.body.errors).toBeDefined();
    });
    test('should return 400 for weak password', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                email: 'test@example.com',
                username: 'testuser',
                password: '123' // Too weak
            })
            .expect(400);

        expect(response.body.errors).toBeDefined();
    });

});

describe('POST /login/jwt - Integration Tests', () => {

    let testUser;
    const validPassword = 'TestPassword123!';

    // Setup: Create a test user before each test
    beforeEach(async () => {
        await User.deleteMany({});

        testUser = await User.create({
            email: 'testlogin@example.com',
            username: 'testloginuser',
            password: hashPass(validPassword)
        });
    });

    test('should login successfully with valid credentials', async () => {
        // Act
        const response = await request(app)
            .post('/login/jwt')
            .send({
                email: 'testlogin@example.com',
                password: validPassword
            })
            .expect(200);

        // Assert
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
        expect(response.body.message).toBe('Login successful');
        expect(response.body.user.email).toBe('testlogin@example.com');
        expect(response.body.user).not.toHaveProperty('password');
    });
    test('should reject login with wrong password', async () => {
        const response = await request(app)
            .post('/login/jwt')
            .send({
                email: 'testlogin@example.com',
                password: 'WrongPassword123!'
            })
            .expect(401);

        expect(response.body.error).toBe('Invalid credentials');
        expect(response.body).not.toHaveProperty('token');
    });
    test('should reject login for non-existent user', async () => {
        const response = await request(app)
            .post('/login/jwt')
            .send({
                email: 'nonexistent@example.com',
                password: validPassword
            })
            .expect(401);

        expect(response.body.error).toBe('Invalid credentials');
    });
    test('should return 400 for missing email', async () => {
        const response = await request(app)
            .post('/login/jwt')
            .send({
                password: validPassword
            })
            .expect(400);

        expect(response.body.error).toContain('required');
    });
    test('should return 400 for missing password', async () => {
        const response = await request(app)
            .post('/login/jwt')
            .send({
                email: 'testlogin@example.com'
            })
            .expect(400);

        expect(response.body.error).toContain('required');
    });
    test('should handle Google OAuth user trying to login with password', async () => {
        // Arrange - Create OAuth-only user (no password)
        await User.create({
            email: 'googleuser@example.com',
            username: 'googleuser',
            googleId: 'google-id-123'
            // No password field
        });

        // Act
        const response = await request(app)
            .post('/login/jwt')
            .send({
                email: 'googleuser@example.com',
                password: 'SomePassword123!'
            })
            .expect(401);

        // Assert
        expect(response.body.error).toContain('Google login');
    });
});

describe('GET /me - Protected Route Integration Tests', () => {

    let authToken;
    let testUser;

    // Setup: Create user and get auth token
    beforeEach(async () => {
        await User.deleteMany({});

        // Register a user
        const registerResponse = await request(app)
            .post('/register')
            .send({
                email: 'protected@example.com',
                username: 'protecteduser',
                password: 'Password123!'
            });

        authToken = registerResponse.body.token;
        testUser = registerResponse.body.user;
    });

    test('should access protected route with valid token', async () => {
        const response = await request(app)
            .get('/me')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(response.body.email).toBe('protected@example.com');
        expect(response.body).not.toHaveProperty('password');
    });

    test('should reject access without token', async () => {
        const response = await request(app)
            .get('/me')
            .expect(401);

        expect(response.body.error).toBeDefined();
    });

    test('should reject access with invalid token', async () => {
        const response = await request(app)
            .get('/me')
            .set('Authorization', 'Bearer invalid-token-here')
            .expect(401);

        expect(response.body.error).toBeDefined();
    });

    test('should reject access with expired token', async () => {
        // This would require mocking time or using a token with short expiry
        // Example implementation depends on your JWT setup
    });
});

// Test suite for complete user journey
describe('Complete User Journey - Registration to Protected Access', () => {

    beforeEach(async () => {
        await User.deleteMany({});
    });

    test('complete flow: register -> login -> access protected route', async () => {
        // Step 1: Register
        const registerResponse = await request(app)
            .post('/register')
            .send({
                email: 'journey@example.com',
                username: 'journeyuser',
                password: 'JourneyPass123!'
            })
            .expect(201);

        const firstToken = registerResponse.body.token;

        // Step 2: Login (simulating returning user)
        const loginResponse = await request(app)
            .post('/login/jwt')
            .send({
                email: 'journey@example.com',
                password: 'JourneyPass123!'
            })
            .expect(200);

        const secondToken = loginResponse.body.token;

        // Step 3: Access protected route with login token
        const meResponse = await request(app)
            .get('/me')
            .set('Authorization', `Bearer ${secondToken}`)
            .expect(200);

        expect(meResponse.body.email).toBe('journey@example.com');
        expect(meResponse.body.username).toBe('journeyuser');

        // Verify database has only one user
        const userCount = await User.countDocuments();
        expect(userCount).toBe(1);
    });
});