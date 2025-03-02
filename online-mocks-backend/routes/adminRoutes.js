const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const HR = require("../models/HR");
const Volunteer = require("../models/Volunteer");
const jwt = require("jsonwebtoken");
const { checkRole, auth } = require("../middleware/auth");
// Get all volunteers
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const isPasswordValid =
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD;
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Invalid credentials" });
  }
  const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET);
  res.json({ token, role: "admin" });
});

router.get("/volunteers", auth, checkRole(["admin"]), async (req, res) => {
  try {
    const volunteers = await Volunteer.find().select("-password");
    res.json(volunteers);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// Get all HRs with populated volunteer data
router.get("/hrs", auth, checkRole(["admin"]), async (req, res) => {
  try {
    const hrs = await HR.find().populate(
      "allocatedVolunteers",
      "name username _id"
    );
    res.json(hrs);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// Add new volunteer
router.post("/add-volunteer", auth, checkRole(["admin"]), async (req, res) => {
  try {
    const { name, username, password } = req.body;

    // Check if volunteer exists
    let volunteer = await Volunteer.findOne({ username });
    if (volunteer) {
      return res.status(400).json({ message: "Volunteer already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new volunteer
    volunteer = new Volunteer({
      name,
      username,
      password: hashedPassword,
    });

    await volunteer.save();
    res.json({ message: "Volunteer added successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// Update the add HR route to include username and password
router.post("/add-hr", auth, checkRole(["admin"]), async (req, res) => {
  try {
    const { name, username, password, company } = req.body;

    // Check if HR already exists
    let hr = await HR.findOne({ username });
    if (hr) {
      return res.status(400).json({ message: "HR already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new HR
    hr = new HR({
      name,
      username,
      password: hashedPassword,
      company,
      allocatedVolunteers: [],
    });

    await hr.save();
    res.json({ message: "HR added successfully" });
  } catch (error) {
    console.error("Error adding HR:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Allocate volunteer to HR
router.post("/allocate", auth, checkRole(["admin"]), async (req, res) => {
  try {
    const { volunteerId, hrId } = req.body;

    const hr = await HR.findById(hrId);
    if (!hr) {
      return res.status(404).json({ message: "HR not found" });
    }

    if (hr.allocatedVolunteers.includes(volunteerId)) {
      return res
        .status(400)
        .json({ message: "Volunteer already allocated to this HR" });
    }

    hr.allocatedVolunteers.push(volunteerId);
    await hr.save();

    res.json({ message: "Volunteer allocated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// Add these new routes
router.delete("/delete-volunteer/:id", auth, checkRole(["admin"]), async (req, res) => {
  try {
    await Volunteer.findByIdAndDelete(req.params.id);
    res.json({ message: "Volunteer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

router.delete("/delete-hr/:id", auth, checkRole(["admin"]), async (req, res) => {
  try {
    await HR.findByIdAndDelete(req.params.id);
    res.json({ message: "HR deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/deallocate", auth, checkRole(["admin"]), async (req, res) => {
  try {
    const { hrId, volunteerId } = req.body;
    console.log("Deallocate request:", { hrId, volunteerId }); // Debug log

    if (!hrId || !volunteerId) {
      return res.status(400).json({
        message: "Both HR ID and Volunteer ID are required",
      });
    }

    const hr = await HR.findById(hrId);
    if (!hr) {
      return res.status(404).json({ message: "HR not found" });
    }

    // Remove the volunteer ID from the allocatedVolunteers array
    hr.allocatedVolunteers = hr.allocatedVolunteers.filter(
      (allocatedId) => allocatedId.toString() !== volunteerId.toString()
    );

    await hr.save();
    console.log("Updated HR:", hr); // Debug log

    res.json({
      message: "Volunteer deallocated successfully",
      updatedHR: hr,
    });
  } catch (error) {
    console.error("Deallocate error:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
});

module.exports = router;
