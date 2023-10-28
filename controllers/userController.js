const { userModel } = require("../models");
const bcrypt = require('bcrypt');

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }


        const isPasswordValid = await user.comparePassword(password);
        console.log(isPasswordValid)
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        return res.status(200).send({ message: "Login successful", data: user });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: "Internal Server Error" });
    }
};

const signup = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        if (!email || !isValidEmail(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        const userExist = await userModel.findOne({ email });

        if (userExist) {
            return res.status(409).json({ message: "This email is already registered." });
        }

        // Hash the password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await userModel.create({
            email,
            password: hashedPassword, // Store the hashed password
            name,
        });

        // You can send an OTP to the user's email here

        return res.status(200).json({ data: newUser, message: 'User registered successfully' });
    } catch (error) {
        console.error("error>>", error);
        return res.status(500).json({ message: error.message });
    }
};

const isValidEmail = () => {
    return true
}
module.exports = {
    login,
    signup,
};
