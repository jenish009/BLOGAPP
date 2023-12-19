const express = require("express");
const router = express.Router();
const { blogController } = require("../controllers");

router
    .post("/createBlogPost", blogController.createBlogPost)
    .get("/getAllBlogs", blogController.getAllBlogs)
    .get("/getBlogById", blogController.getBlogById)
    .post("/addComment", blogController.addComment)
    .post("/uploadImage", blogController.uploadImage)
    .get("/generateRssFeed", blogController.generateRssFeed)
    .get("/resetCount", blogController.resetCount)
    .get("/updateContentWithLinks", blogController.updateContentWithLinks)
    .get("/removeLinksFromContent", blogController.removeLinksFromContent)
    .get("/linkJson", blogController.linkJson)










module.exports = router;
