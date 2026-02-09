const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({}, 'username email');
        console.log("--- USER LIST ---");
        users.forEach(u => {
            console.log(`Username: ${u.username}, Email: ${u.email}, ID: ${u._id}`);
        });
        console.log("-----------------");
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

listUsers();
