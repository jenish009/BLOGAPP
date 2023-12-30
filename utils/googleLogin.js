const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const { userModel } = require("../models");

passport.use(
    new GoogleStrategy(
        {
            clientID: "570913667059-o5m2es0c9tbg4vcmsin0osef7b17inl5.apps.googleusercontent.com",
            clientSecret: "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",
            callbackURL: "http://localhost:4000/auth/google/callback",
            passReqToCallback: true,
        },
        async function (request, accessToken, refreshToken, profile, done) {
            try {
                // Check if the user already exists in your database
                let user = await userModel.findOne({ email: profile.email });
                if (user) {
                    console.log("dddd", user)

                    return done(null, user);
                } else {

                    // If the user does not exist, create a new user in the database
                    user = await userModel.create({
                        email: profile.email,
                        name: profile.given_name,
                        isGoogleId: true
                    });
                    console.log("{user}", user)
                    return done(null, user);
                }
            } catch (err) {
                // Handle errors
                console.error("Error during Google authentication:", err);
                return done(err, null);
            }
        }
    )
);

module.exports = { passport };
