const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const HR = require("../models/HR");
const Student = require("../models/Student");
const Feedback = require("../models/Feedback");
const { checkRole, auth } = require("../middleware/auth");

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const hr = await HR.findOne({ username });

    if (!hr) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, hr.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: hr._id, role: "hr", company: hr.company, name: hr.name },
      process.env.JWT_SECRET
    );

    res.json({
      token,
      role: "hr",
      company: hr.company,
      name: hr.name,
      id: hr._id,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/getStudents", auth, checkRole(["hr"]), async (req, res) => {
  try {
    const students = await Student.find({ allocatedHRs: req.user.id });
    res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/personalReport", auth, checkRole(["hr"]), async (req, res) => {
  try {
    const { registerNumber, report, isEdit } = req.body;
    const student = await Student.findOne({ registerNumber });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    report.interviewerName = req.user.name;
    report.interviewerCompany = req.user.company;
    report.hrId = req.user.id;

    if (isEdit) {
      // Find and update the existing review by this HR
      const reviewIndex = student.personalReport.findIndex(
        (review) => review.hrId.toString() === req.user.id
      );

      if (reviewIndex !== -1) {
        // Update existing review
        student.personalReport[reviewIndex] = {
          ...student.personalReport[reviewIndex].toObject(),
          ...report,
        };
      } else {
        // If somehow the review doesn't exist, add it as new
        student.personalReport.push(report);
      }
    } else {
      // Add new review
      student.personalReport.push(report);
    }

    await student.save();
    res.status(200).json({
      message: isEdit
        ? "Personal report updated successfully"
        : "Personal report saved successfully",
    });
  } catch (error) {
    console.error("Error saving/updating personal report:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add feedback route
router.post("/feedback", auth, checkRole(["hr"]), async (req, res) => {
  try {
    const {
      companyName,
      hrName,
      technicalKnowledge,
      serviceAndCoordination,
      communicationSkills,
      futureParticipation,
      punctualityAndInterest,
      suggestions,
      issuesFaced,
      improvementSuggestions,
    } = req.body;

    // Create new feedback
    const feedback = new Feedback({
      companyName,
      hrName,
      technicalKnowledge: Number(technicalKnowledge),
      serviceAndCoordination: Number(serviceAndCoordination),
      communicationSkills: Number(communicationSkills),
      futureParticipation: Number(futureParticipation),
      punctualityAndInterest: Number(punctualityAndInterest),
      suggestions,
      issuesFaced,
      improvementSuggestions,
    });

    await feedback.save();

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback,
    });
  } catch (error) {
    console.error("Feedback submission error:", error);
    res.status(500).json({
      message: "Error submitting feedback",
      error: error.message,
    });
  }
});

// Get all feedback (for admin purposes)
router.get("/feedback", auth, checkRole(["admin"]), async (req, res) => {
  try {
    const feedback = await Feedback.find().sort({ submittedAt: -1 });
    res.json(feedback);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({ message: "Error fetching feedback" });
  }
});

module.exports = router;
