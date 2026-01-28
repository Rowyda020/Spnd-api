import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose';
import indexRoute from '../Spnd/src/routes/index.mjs'
import passport from "passport"

import session from "express-session"
dotenv.config();

const app = express();
app.use(express.json());  // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));  // Parse URL-encoded bodies

mongoose.connect('mongodb://localhost/Spnd')
    .then(() => console.log("connected to db"))
    .catch((err) => console.log(err))

const port = process.env.PORT || 3003;
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}))
app.use(passport.initialize())
app.use(passport.session())

app.use(indexRoute)

app.listen(port, () => {
    console.log(`listening on port: ${port}`)
})