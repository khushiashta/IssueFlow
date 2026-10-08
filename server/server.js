const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "IssueFlow API is running",
  });
});

const PORT = process.env.PORT || 5001;

connectDB();
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});