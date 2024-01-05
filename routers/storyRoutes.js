const express = require("express");
const router = express.Router();
const { storiesController } = require("../controllers");

router
    .post("/addUpdateStory", storiesController.addUpdateStory)
    .get("/getStoryById", storiesController.getStoryById)
    .get("/getAllStories", storiesController.getAllStories)












module.exports = router;
