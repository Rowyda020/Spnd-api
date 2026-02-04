import express from 'express'
import dotenv from 'dotenv'
import mongoose, { Mongoose } from 'mongoose';
import indexRoute from './src/routes/index.mjs';
import passport from "passport"
import MongoStore from "connect-mongo"
import cors from "cors";
import session from "express-session"
dotenv.config();

const app = express();
app.use(express.json());  // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));  // Parse URL-encoded bodies

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("connected to db"))
    .catch((err) => console.log(err))

const port = process.env.PORT || 3003;
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
    store: MongoStore.create({ client: mongoose.connection.getClient() })
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(cors({
    origin: '*', // or your app's URL/IP
    credentials: true
}));
app.use(indexRoute)

app.listen(port, () => {
    console.log(`listening on port: ${port}`)
})