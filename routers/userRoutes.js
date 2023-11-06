const express = require("express");
const router = express.Router();
const { userController } = require("../controllers");

router
    .post("/login", userController.login)
    .post("/signup", userController.signup)
    .get("/getUserById", userController.getUserById)





module.exports = router;
