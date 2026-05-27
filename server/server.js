import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("./.env") }); 

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB connect
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// ✅ User Schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

// ✅ Signup API
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  const user = new User({ email, password });
  await user.save();

  res.send("User created");
});

// ✅ Login API
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, password });

  if (user) {
    res.send(user);
  } else {
    res.status(401).send("Invalid credentials");
  }
});

app.listen(5000, () => console.log("Server running"));