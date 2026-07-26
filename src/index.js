const dotenv = require("dotenv");
const connectDB = require("./db/connectDB");
const app = require("./app");

dotenv.config();

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed !!!", err);
    process.exit(1);
  });
