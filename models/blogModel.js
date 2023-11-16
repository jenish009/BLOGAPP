const mongoose = require('mongoose');
const { ObjectId } = require('mongodb'); // or ObjectID 

// Define the News schema
const blogSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        coverImage: {
            type: String,
            required: true,
        },
        keywords: {
            type: Array,
        },
        content: {
            type: Array,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        category: {
            type: Array,
            required: true,
        },
        createdAt: {
            type: String,
        },
        userComment: {
            type: [
                {
                    userId: { type: ObjectId },
                    text: { type: String }
                }
            ]
        },
        popularCount: {
            type: Number
        }
    },
    { versionKey: false }
);

const blogModel = mongoose.model('blog', blogSchema);

module.exports = blogModel;
