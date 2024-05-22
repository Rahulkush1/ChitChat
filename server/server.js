import { app } from "./app.js";
import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});
import connectDB from "./db/connectDB.js";

const port = process.env.PORT || 3000;

connectDB()
  .then(() => [
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server is running on port ${port}`);
    }),
  ])
  .catch((err) => console.log("MongoDB connection failed !!!", err));
