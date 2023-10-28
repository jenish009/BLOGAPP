const express = require("express");
const router = express.Router();
const { blogController } = require("../controllers");

router
    .post("/createBlogPost", blogController.createBlogPost)
    .get("/getAllBlogs", blogController.getAllBlogs)
    .get("/getBlogById", blogController.getBlogById)
    .post("/addComment", blogController.addComment)




module.exports = router;
