const { blogModel, userModel } = require("../models");
const { google } = require("googleapis");
const path = require("path");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const keyFile = path.join(__dirname + "/credential.json"); // Replace with the path to your downloaded JSON key file
const { Readable } = require("stream"); // Import the stream module
const sharp = require("sharp");
const mongoose = require('mongoose');


const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/drive"], // Adjust the scope as needed
});

const drive = google.drive({ version: "v3", auth });

const getAllBlogs = async (req, res) => {
    try {
        const searchFilter = req.query.searchFilter || "";
        const categoryFilter = req.query.categoryFilter || "";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10; // Set a default limit if not provided
        const skip = (page - 1) * limit; // Calculate the number of documents to skip

        const query = {
            $or: [
                { title: { $regex: searchFilter, $options: "i" } },
                { content: { $regex: searchFilter, $options: "i" } },
                { author: { $regex: searchFilter, $options: "i" } },
            ],
        };

        if (categoryFilter) {
            query.category = { $in: categoryFilter.split(',') };
        }

        // Check if page and limit are not provided, and if so, don't use pagination
        if (!req.query.page && !req.query.limit) {
            const sortField = req.query.isPopularpost === "true" ? { popularCount: -1 } : { _id: -1 };
            const news = await blogModel.find(query).sort(sortField).exec();
            res.status(200).json({ data: news });
        } else {
            const sortField = req.query.isPopularpost === "true" ? { popularCount: -1 } : { _id: -1 };
            const news = await blogModel
                .find(query)
                .sort(sortField)
                .skip(skip)
                .limit(limit)
                .exec();
            const totalDocs = await blogModel.countDocuments(query);
            const totalPages = Math.ceil(totalDocs / limit);
            res.status(200).json({ data: news, totalPages });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const createBlogPost = async (req, res) => {
    try {
        upload.single("cover")(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: "File upload failed" });
            }
            try {
                const imageBuffer = req.file.buffer;

                const compressedImageBuffer = await sharp(imageBuffer)
                    .resize({ width: 800, height: 600 })
                    .jpeg({ quality: 80 })
                    .toBuffer();

                const imageStream = Readable.from(compressedImageBuffer);

                const { title, content, description, category, createdAt } = JSON.parse(
                    req.body.data
                );

                const fileExtension = req.file.originalname.split(".").pop();
                const filename = `image_${Date.now()}.${fileExtension}`;

                const driveResponse = await drive.files.create({
                    resource: {
                        name: filename,
                        mimeType: req.file.mimetype,
                        parents: ["1zHrMQg0efUnNL2wohvvWmrqjJIx4iONU"],
                    },
                    media: {
                        mimeType: req.file.mimetype,
                        body: imageStream,
                    },
                });

                const imageLink = `https://drive.google.com/uc?id=${driveResponse.data.id}`;

                const newBlog = new blogModel({
                    title,
                    content,
                    description,
                    category,
                    createdAt,
                    coverImage: imageLink,
                });

                await newBlog.save();
                res.status(201).send({ message: "upload" });
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: "Error uploading to Google Drive" });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Internal Server Error" });
    }
};

const getBlogById = async (req, res) => {
    try {
        const blogId = req.query.id;
        const pipeline = [
            {
                $match: { _id: new mongoose.Types.ObjectId(blogId) },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userComment.userId',
                    foreignField: '_id',
                    as: 'userData',
                },
            },
            {
                $addFields: {
                    userComment: {
                        $filter: {
                            input: '$userComment',
                            as: 'comment',
                            cond: { $ne: ['$$comment', []] },
                        },
                    },
                },
            },
            {
                $unwind: {
                    path: '$userComment',
                    preserveNullAndEmptyArrays: true, // Preserve documents with empty userComment array
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userComment.userId',
                    foreignField: '_id',
                    as: 'userComment.userData',
                },
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    coverImage: 1,
                    content: 1,
                    description: 1,
                    category: 1,
                    createdAt: 1,
                    popularCount: 1,
                    userComment: {
                        $cond: {
                            if: { $eq: ['$userData', []] },
                            then: {},
                            else: {
                                _id: '$userComment._id',
                                userId: '$userComment.userId',
                                name: {
                                    $arrayElemAt: ['$userComment.userData.name', 0]
                                },
                                text: '$userComment.text'
                            }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: '$_id',
                    title: { $first: '$title' },
                    coverImage: { $first: '$coverImage' },
                    content: { $first: '$content' },
                    description: { $first: '$description' },
                    category: { $first: '$category' },
                    createdAt: { $first: '$createdAt' },
                    popularCount: { $first: '$popularCount' },
                    userComment: { $push: '$userComment' }
                }
            }
        ];



        const blog = await blogModel.aggregate(pipeline);

        if (blog.length === 0) {
            return res.status(404).send({ error: "News not found" });
        }

        res.json(blog);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
    }
};



const addComment = async (req, res) => {
    try {
        const { blogId, text, userId } = req.body;

        const blogPost = await blogModel.findById(blogId);

        if (!blogPost) {
            return res.status(404).json({ message: 'Blog post not found' });
        }

        // Create a new comment
        const newComment = {
            userId,
            text,
        };

        // Add the comment to the blog post
        blogPost.userComment.push(newComment);
        console.log(blogPost)
        // Save the updated blog post
        await blogPost.save();

        return res.status(201).json({ message: 'Comment added successfully', comment: newComment });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
}

module.exports = { getAllBlogs, createBlogPost, getBlogById, addComment };
