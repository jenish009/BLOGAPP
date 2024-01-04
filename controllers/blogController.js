const { blogModel } = require("../models");
const { google } = require("googleapis");
const path = require("path");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const keyFile = path.join(__dirname + "/credential.json");
const { Readable } = require("stream");
const mongoose = require('mongoose');
const RSS = require('rss');




const generateRssFeed = async (req, res) => {
    try {
        let { category } = req.query;
        let query = {};
        if (category) {
            query = { category: { $in: category } };
        }

        const blogs = await blogModel.find(query).sort({ createdAt: -1 }); // Change the query as needed

        const feed = new RSS({
            title: "Bloggers Ground",
            description:
                "Get expert insights on finance, style inspiration, coding techniques, technology and travel tips from bloggersGround. Explore endless possibilities with us.",
            feed_url: "https://blogapp-q8b0.onrender.com/blog/generateRssFeed",
            site_url: "https://www.bloggersground.com",
            image_url: "https://drive.google.com/uc?id=1mFTAHt1IRc4OSqKRMbqIsRzO93kYJ5LB",
            custom_namespaces: {
                media: "https://drive.google.com/uc?id=1mFTAHt1IRc4OSqKRMbqIsRzO93kYJ5LB",
            },
        });

        blogs.forEach((blog) => {
            feed.item({
                title: blog.title,
                description: blog.description,
                url: `https://www.bloggersground.com/blog/${blog.title.toLowerCase().replace(/[^\w\s]/gi, "").replace(/\s+/g, "-")}?id=${blog._id}`, // Update with your blog post URL
                date: blog.createdAt,
                categories: blog.category,
                custom_elements: [
                    {
                        "media:thumbnail": {
                            _attr: {
                                url: blog.coverImage,
                                width: "300",
                                height: "200",
                            },
                        },
                    },
                ],
            });
        });

        const xml = feed.xml({ indent: true });
        res.type("application/xml");
        res.send(xml);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

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
        const isPopularpost = req.query.isPopularpost

        const query = {
            $or: [
                { title: { $regex: searchFilter, $options: "i" } },
                { content: { $regex: searchFilter, $options: "i" } },
                { description: { $regex: searchFilter, $options: "i" } },
                { category: { $regex: searchFilter, $options: "i" } },
            ],
        };

        if (categoryFilter) {
            query.category = { $in: categoryFilter.split(',') };
        }

        // Check if page and limit are not provided, and if so, don't use pagination
        if (!req.query.page && !req.query.limit) {
            const sortField = req.query.isPopularpost === "true" ? { popularCount: -1 } : { _id: -1 };
            const blods = await blogModel.find(query).sort(sortField).exec();
            res.status(200).json({ data: blods });
        } else {
            const sortField = req.query.isPopularpost === "true" ? { popularCount: -1 } : { _id: -1 };
            const blods = await blogModel
                .find(query)
                .sort(sortField)
                .skip(skip)
                .limit(limit)
                .exec();
            const totalDocs = await blogModel.countDocuments(query);
            const totalPages = Math.ceil(totalDocs / limit);
            res.status(200).json({ data: blods, totalPages });
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
                const imageStream = Readable.from(imageBuffer);

                const { _id, title, content, description, category, createdAt, keywords, metaDescription, relatedArtical } = JSON.parse(
                    req.body.data
                );

                const fileExtension = req.file.originalname.split(".").pop();
                const filename = `image_${Date.now()}.${fileExtension}`;

                let imageLink;

                if (_id) {
                    // If _id is provided, update the existing blog post
                    const existingBlog = await blogModel.findOne({ _id });
                    console.log("existingBlog", existingBlog, _id)
                    if (!existingBlog) {
                        return res.status(404).json({ error: "Blog not found" });
                    }

                    // Update only the fields that are provided in the request
                    existingBlog.title = title || existingBlog.title;
                    existingBlog.content = content || existingBlog.content;
                    existingBlog.description = description || existingBlog.description;
                    existingBlog.category = category || existingBlog.category;
                    existingBlog.createdAt = createdAt || existingBlog.createdAt;
                    existingBlog.keywords = keywords || existingBlog.keywords;
                    existingBlog.metaDescription = metaDescription || existingBlog.metaDescription;
                    existingBlog.relatedArtical = relatedArtical || existingBlog.relatedArtical;


                    await existingBlog.save();
                    res.status(200).send({ message: "Blog updated successfully" });
                } else {
                    // If _id is not provided, create a new blog post
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

                    imageLink = `https://drive.google.com/uc?id=${driveResponse.data.id}`;

                    const newBlog = new blogModel({
                        title,
                        content,
                        description,
                        category,
                        createdAt,
                        coverImage: imageLink,
                        keywords,
                        metaDescription,
                        relatedArtical,
                    });

                    await newBlog.save();
                    res.status(201).send({ message: "Blog created successfully" });
                }
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

const uploadImage = async (req, res) => {
    try {
        upload.single("image")(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: "File upload failed" });
            }
            try {
                const imageBuffer = req.file.buffer;

                // No image size reduction logic here

                const imageStream = Readable.from(imageBuffer);

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

                res.status(201).send({ URL: imageLink });
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
                $lookup: {
                    from: 'blogs', // Assuming the related articles are in the 'blogs' collection
                    localField: 'relatedArtical',
                    foreignField: '_id',
                    as: 'relatedArticles',
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
                    keywords: 1,
                    createdAt: 1,
                    popularCount: 1,
                    metaDescription: 1,
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
                    },
                    relatedArticles: {
                        $map: {
                            input: '$relatedArticles',
                            as: 'article',
                            in: {
                                _id: '$$article._id',
                                title: '$$article.title',
                            },
                        },
                    },
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
                    keywords: { $first: '$keywords' },
                    userComment: { $push: '$userComment' },
                    relatedArticles: { $first: '$relatedArticles' },
                    metaDescription: { $first: '$metaDescription' },
                }
            }
        ];

        const [blog] = await blogModel.aggregate(pipeline);
        if (!blog) {
            return res.status(404).send({ error: "News not found" });
        }

        // Increase popularCount by 1 in the database
        await blogModel.updateOne(
            { _id: blogId },
            { $inc: { popularCount: 1 } }
        );


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

const resetCount = async (req, res) => {
    try {
        await blogModel.updateMany({}, { $set: { popularCount: 0 } });

        res.status(200).json({ message: 'PopularCount reset successfully for all blog posts.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const updateContentWithLinks = async (req, res) => {
    try {
        const { url, keyword } = req.body;

        // Replace keyword with link in the content of all blog entries
        let data = await blogModel.find();
        let updatedBlogIds = [];  // List to store updated blog entry IDs

        // Use for...of loop to handle asynchronous operations
        for (const obj of data) {
            const regex = new RegExp(keyword, 'g');
            const updatedContent = obj.content[0].replace(regex, `<a href="${url}">${keyword}</a>`);

            // Check if content was updated
            if (updatedContent !== obj.content[0]) {
                obj.content[0] = updatedContent;
                delete obj._id;
                await blogModel.updateOne({ _id: obj._id }, obj);
                updatedBlogIds.push(obj._id);  // Add the updated blog ID to the list
            }
        }

        res.status(200).json({ data, updatedBlogIds });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const removeLinksFromContent = async (req, res) => {
    try {
        const { keyword } = req.body;

        // Remove <a> tags from the content of all blog entries
        let data = await blogModel.find();
        data.forEach(async (obj) => {
            // Using new RegExp to create a dynamic regular expression with the 'g' flag
            const regex = new RegExp(`<a href=[^>]*>${keyword}</a>`, 'g');
            obj.content[0] = obj.content[0].replace(regex, keyword);
            delete obj._id;
            await blogModel.updateOne({ _id: obj._id }, { content: [obj.content[0]] });
        });

        res.status(200).json({ message: 'Links removed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const linkJson = async (req, res) => {
    try {
        // Retrieve all blogs from the database
        const blogs = await blogModel.find();

        let data = blogs.map(obj => obj.title)

        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getBlogCategories = async (req, res) => {
    try {
        const distinctCategories = await blogModel.distinct('category');
        res.status(200).json({ categories: distinctCategories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
module.exports = { getBlogCategories, linkJson, removeLinksFromContent, getAllBlogs, createBlogPost, getBlogById, addComment, uploadImage, generateRssFeed, resetCount, updateContentWithLinks };
