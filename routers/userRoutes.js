const express = require("express");
const router = express.Router();
const { userController } = require("../controllers");

router
    .post("/login", userController.login)
    .post("/signup", userController.signup)




module.exports = router;
