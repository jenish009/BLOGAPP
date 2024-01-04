const mongoose = require('mongoose');
const { ObjectId } = require('mongodb'); // or ObjectID 

// Define the News schema
const storiesSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        metaDescription: {
            type: String,
        },
        description: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        stories: {
            type: Array,
        },
        createdAt: {
            type: String,
        },
        popularCount: {
            type: Number
        }
    },
    { versionKey: false }
);

const storiesModel = mongoose.model('stories', storiesSchema);

module.exports = storiesModel;
