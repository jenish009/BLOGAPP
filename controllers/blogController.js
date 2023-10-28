const { blogModel } = require("../models");
const { google } = require("googleapis");
const path = require("path");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const keyFile = path.join(__dirname + "/credential.json"); // Replace with the path to your downloaded JSON key file
const { Readable } = require("stream"); // Import the stream module
const sharp = require("sharp");
const RSS = require("rss");

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
            const news = await blogModel.find(query).sort({ _id: -1 }).exec();
            res.status(200).json({ data: news });
        } else {
            const news = await blogModel
                .find(query)
                .sort({ _id: -1 })
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
        const blogs = await blogModel.findById(req.query.id).exec();
        if (!blogs) {
            return res.status(404).json({ error: "News not found" });
        }
        res.json(blogs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { getAllBlogs, createBlogPost, getBlogById };
