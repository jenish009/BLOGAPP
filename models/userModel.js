const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        name: {
            type: String, // Change this to String
            required: true,
        }
    },
    { versionKey: false, timestamps: true }
);

// Define a method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;
