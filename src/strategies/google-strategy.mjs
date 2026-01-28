import passport from "passport";
import User from '../models/user.mjs'
import GoogleStrategy from 'passport-google-oauth20'

const GOOGLE_CLIENT_ID = '1010614156857-atfkhgj1ie7v4d08rq84dt680oregsd3.apps.googleusercontent.com'
const GOOGLE_CLIENT_SECRET = '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'


passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3003/homepage"
},
    async function (accessToken, refreshToken, profile, cb) {
        try {
            let user = await User.findOne({ googleId: profile.id });
            if (!user) {
                user = await User.create({
                    googleId: profile.id,
                    username: profile.displayName,
                    email: profile.emails?.[0]?.value,
                    authType: 'google'
                });
            }
            return cb(null, user);
        } catch (err) {
            return cb(err);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id)
})
passport.deserializeUser(async (id, done) => {
    try {
        const findUser = await User.findById(id)
        if (!findUser) throw new Error("User not found");
        done(null, findUser)

    } catch (err) {
        done(err, null)
    }
})