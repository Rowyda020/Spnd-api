import User from '../models/user.mjs'
import passport from "passport";
import { Strategy } from "passport-local";
import { comparePass } from "../utils/helper.mjs";

passport.serializeUser((user, done) => {
    done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
    try {
        const registeredUser = await User.findById(id)
        if (!registeredUser) throw new Error("User not found")
        done(null, registeredUser)

    } catch (error) {
        done(error, null)

    }
})

passport.use(new Strategy(async (username, password, done) => {
    try {
        const registeredUser = await User.findOne({ username })
        if (!registeredUser) throw new Error("User not found")
        if (!comparePass(password, registeredUser.password)) throw new Error("Bad credintials")
        done(null, registeredUser)

    } catch (error) {
        done(error, null)
    }
}))