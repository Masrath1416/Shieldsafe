const prisma = require("../prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");


// SIGNUP
exports.signup = async (req, res) => {
  console.log("Signup Request Received:", req.body);
  
  try {
    const { name, email, password } = req.body;

    // 1. Basic Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation Failed:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    // 2. Check if user already exists
    console.log("Checking if user exists:", email);
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log("Signup Failed: User already exists");
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // 3. Hash password
    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create User
    console.log("Creating user in database...");
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });

    console.log("Signup Successful:", user.id);
    res.status(201).json({
      message: "User created successfully ✅",
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("SIGNUP ERROR DETAILS:", error);
    
    // Check for specific Prisma errors
    if (error.code === 'P2021') {
      return res.status(500).json({ 
        error: "Database tables are missing. Please run migrations.",
        details: error.message 
      });
    }

    res.status(500).json({ 
      error: "Internal Server Error during signup", 
      details: error.message 
    });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};