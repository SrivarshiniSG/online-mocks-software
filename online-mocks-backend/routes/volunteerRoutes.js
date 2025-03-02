const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { checkRole, auth } = require("../middleware/auth");
const Student = require("../models/Student");
const HR = require("../models/HR");
const Volunteer = require("../models/Volunteer");

// Login route
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find volunteer
    const volunteer = await Volunteer.findOne({ username });
    if (!volunteer) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, volunteer.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create JWT payload
    const payload = {
      volunteer: {
        id: volunteer._id,
      },
      role: "volunteer",
    };

    // Sign and send token
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    res.json({
      token,
      volunteer: {
        id: volunteer._id,
        name: volunteer.name,
        username: volunteer.username,
      },
      role: "volunteer",
    });
  } catch (err) {
    console.error("Server error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Get volunteer profile
router.get("/profile", auth, checkRole(["volunteer"]), async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.user.volunteer.id).select(
      "-password"
    );
    if (!volunteer) {
      return res.status(404).json({ message: "Volunteer not found" });
    }
    res.json(volunteer);
  } catch (error) {
    console.error("Profile error:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// Get allocated HRs
router.get(
  "/allocated-hrs",
  auth,
  checkRole(["volunteer"]),
  async (req, res) => {
    try {
      const hrs = await HR.find({
        allocatedVolunteers: req.user.volunteer.id,
      });
      res.json(hrs);
    } catch (error) {
      console.error("Allocated HRs error:", error.message);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

// Add student
router.post(
  "/add-student",
  auth,
  checkRole(["volunteer"]),
  async (req, res) => {
    try {
      const { registerNumber, hrId } = req.body;

      console.log("Received request:", {
        registerNumber,
        hrId,
        volunteerId: req.user.volunteer.id,
      });

      if (!registerNumber || !hrId) {
        return res.status(400).json({
          message: "Register number and HR ID are required",
        });
      }

      // Check if student exists
      let student = await Student.findOne({ registerNumber });
      console.log("Found student:", student);

      if (!student) {
        return res.status(404).json({
          message: `Student with register number ${registerNumber} not found`,
        });
      }

      // Check if HR exists and is allocated to volunteer
      const hr = await HR.findOne({
        _id: hrId,
        allocatedVolunteers: req.user.volunteer.id,
      });

      if (!hr) {
        return res.status(403).json({
          message: "You are not authorized to allocate students to this HR",
        });
      }

      // Check if student is already allocated to this HR
      if (student.allocatedHRs.includes(hrId)) {
        return res.status(400).json({
          message: `Student is already allocated to ${hr.name}`,
        });
      }

      // Add HR to student's allocations
      student.allocatedHRs.push(hrId);
      await student.save();

      // Return complete student details
      const updatedStudent = await Student.findById(student._id).populate(
        "allocatedHRs",
        "name company"
      );

      console.log("Updated student:", updatedStudent);
      res.json(updatedStudent);
    } catch (error) {
      console.error("Add student error:", error);
      res.status(500).json({
        message: "Server Error",
        error: error.message,
      });
    }
  }
);

// Get students for an HR
router.get(
  "/students/:hrId",
  auth,
  checkRole(["volunteer"]),
  async (req, res) => {
    try {
      const hrId = req.params.hrId;
      const students = await Student.find({
        allocatedHRs: hrId,
      }).populate("allocatedHRs", "name company");

      // Return the complete student data including personal reports
      res.json(students);
    } catch (error) {
      console.error("Get students error:", error.message);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

// Deallocate student from specific HR
router.post(
  "/deallocate-student/:studentId/:hrId",
  auth,
  checkRole(["volunteer"]),
  async (req, res) => {
    try {
      const student = await Student.findById(req.params.studentId);

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Remove specific HR from allocations
      student.allocatedHRs = student.allocatedHRs.filter(
        (hr) => hr.toString() !== req.params.hrId
      );
      await student.save();

      res.json({ message: "Student deallocated successfully" });
    } catch (error) {
      console.error("Deallocate student error:", error.message);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

module.exports = router;
