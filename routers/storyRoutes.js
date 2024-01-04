const express = require("express");
const router = express.Router();
const { storiesController } = require("../controllers");

router
    .post("/addUpdateStory", storiesController.addUpdateStory)
    .get("/getStoryById", storiesController.getStoryById)











module.exports = router;
