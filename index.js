const express = require("express");
require("dotenv").config();
require('./config/dbConnection');
const cors = require("cors"); // Import the cors middleware
const { passport } = require("./utils/googleLogin"); // Require the googleAuth module


const app = express();
app.use(express.json());

// Use the cors middleware to allow all origins
app.use(cors());

const { blogRoutes, userRoutes, storyRoutes } = require("./routers");
app.use("/blog", blogRoutes);
app.use("/user", userRoutes);
app.use("/story", storyRoutes);

app.get(
    "/auth/google",
    passport.authenticate("google", {
        scope: ["email", "profile"],
    })
);

app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
        successRedirect: "/auth/google/success",
        failureRedirect: "/auth/google/failure",
    })
);
const port = process.env.PORT

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
