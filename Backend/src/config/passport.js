import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { config } from "./config.js";

passport.use(new GoogleStrategy({
    clientID: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    callbackURL: `${config.BACKEND_URL}/api/auth/google/callback`,
    proxy: true
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

export default passport;
