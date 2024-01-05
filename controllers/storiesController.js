const express = require('express');
const { storiesModel } = require("../models");
const mongoose = require('mongoose');

// Add or Update Story
const addUpdateStory = async (req, res) => {
    try {
        const { _id, title, metaDescription, description, category, stories, createdAt, popularCount } = req.body;

        if (_id) {
            const existingStory = await storiesModel.findById(_id);

            if (!existingStory) {
                return res.status(404).json({ error: "Story not found" });
            }

            // Update only the fields that are provided in the request
            existingStory.title = title || existingStory.title;
            existingStory.metaDescription = metaDescription || existingStory.metaDescription;
            existingStory.description = description || existingStory.description;
            existingStory.category = category || existingStory.category;
            console.log("iffffff", stories)

            if (stories.storyTitle && stories.storyDescription && stories.url) {
                // Add a new element to the stories array
                existingStory.stories.push({
                    storyTitle: stories.storyTitle,
                    storyDescription: stories.storyDescription,
                    url: stories.url,
                    type: stories.type
                });
            }

            existingStory.createdAt = createdAt || existingStory.createdAt;
            existingStory.popularCount = popularCount || existingStory.popularCount;
            console.log("existingStory", existingStory)
            await existingStory.save();
            res.status(200).send({ message: "Story updated successfully" });
        } else {
            // If _id is not provided, create a new story
            const newStory = new storiesModel({
                title,
                metaDescription,
                description,
                category,
                stories: [{
                    storyTitle: stories.storyTitle,
                    storyDescription: stories.storyDescription,
                    url: stories.url,
                    type: stories.type
                }], // Initialize with an empty array
                createdAt,
                popularCount,
            });

            if (req.body.storyTitle && req.body.storyDescription && req.body.storyUrl) {
                // Add a new element to the stories array
                newStory.stories.push({
                    storyTitle: req.body.storyTitle,
                    storyDescription: req.body.storyDescription,
                    url: req.body.storyUrl,
                });
            }

            await newStory.save();
            res.status(201).send({ message: "Story created successfully" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Internal Server Error" });
    }
}

// Get Story by ID
const getStoryById = async (req, res) => {
    try {
        const storyId = req.query.id;

        const story = await storiesModel.findOne({ _id: storyId });

        if (!story) {
            return res.status(404).json({ error: "Story not found" });
        }

        res.json(story);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Internal Server Error" });
    }
};
const getAllStories = async (req, res) => {
    try {

        const story = await storiesModel.find();

        if (!story) {
            return res.status(404).json({ error: "Story not found" });
        }

        res.json(story);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Internal Server Error" });
    }
};

module.exports = { getStoryById, addUpdateStory, getAllStories };
