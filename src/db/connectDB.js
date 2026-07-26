const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `mongodb+srv://zia:Pakistan@cluster0.50kk6vj.mongodb.net/fyp`
    );
    console.log(
      `\n MongoDB connected! DB Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("MongoDB connection FAILED:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
