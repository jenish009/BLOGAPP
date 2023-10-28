const mongoose = require('mongoose');

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
            type: Array
        }
    },
    { versionKey: false }
);

const blogModel = mongoose.model('blog', blogSchema);

module.exports = blogModel;
