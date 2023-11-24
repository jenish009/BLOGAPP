const express = require("express");
require("dotenv").config();
require('./config/dbConnection');
const cors = require("cors"); // Import the cors middleware

const app = express();
app.use(express.json());

// Use the cors middleware to allow all origins
app.use(cors());

const { blogRoutes, userRoutes } = require("./routers");
app.use("/blog", blogRoutes);
app.use("/user", userRoutes);


const port = process.env.PORT

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});