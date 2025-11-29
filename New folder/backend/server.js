const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const fabricRoutes = require("./routes/fabricRoutes");
const cors = require("cors");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to DB
connectDB();

// Routes
app.use("/api/fabrics", fabricRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`Server listening on http://localhost:${PORT}`)
);
