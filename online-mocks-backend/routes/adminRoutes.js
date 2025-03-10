const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const HR = require("../models/HR");
const Volunteer = require("../models/Volunteer");
const Student = require("../models/Student");
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
    // First get all volunteers
    const volunteers = await Volunteer.find().select("-password");

    // Then get all HRs and create a map of volunteer IDs to their assigned HRs
    const hrs = await HR.find().populate(
      "allocatedVolunteers",
      "name username _id"
    );

    // Create a map of volunteer ID to their assigned HRs
    const volunteerToHRMap = new Map();
    hrs.forEach((hr) => {
      hr.allocatedVolunteers.forEach((volunteer) => {
        if (!volunteerToHRMap.has(volunteer._id.toString())) {
          volunteerToHRMap.set(volunteer._id.toString(), []);
        }
        volunteerToHRMap.get(volunteer._id.toString()).push({
          _id: hr._id,
          name: hr.name,
          company: hr.company,
        });
      });
    });

    // Add assignedHRs to each volunteer
    const volunteersWithHRs = volunteers.map((volunteer) => {
      const volunteerObj = volunteer.toObject();
      volunteerObj.assignedHRs =
        volunteerToHRMap.get(volunteer._id.toString()) || [];
      return volunteerObj;
    });

    res.json(volunteersWithHRs);
  } catch (error) {
    console.error("Error fetching volunteers:", error);
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
router.delete(
  "/delete-volunteer/:id",
  auth,
  checkRole(["admin"]),
  async (req, res) => {
    try {
      await Volunteer.findByIdAndDelete(req.params.id);
      res.json({ message: "Volunteer deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server Error" });
    }
  }
);

router.delete(
  "/delete-hr/:id",
  auth,
  checkRole(["admin"]),
  async (req, res) => {
    try {
      await HR.findByIdAndDelete(req.params.id);
      res.json({ message: "HR deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server Error" });
    }
  }
);

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

// Get paginated students with allocated HRs
router.get("/students", auth, checkRole(["admin"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;
    const searchTerm = req.query.search || "";
    const sortField = req.query.sortField || "name";
    const sortOrder = req.query.sortOrder || "asc";

    // First, if searching for HR name, find matching HR IDs
    let matchingHrIds = [];
    if (searchTerm) {
      const matchingHrs = await HR.find({
        name: { $regex: searchTerm, $options: "i" },
      }).select("_id");
      matchingHrIds = matchingHrs.map((hr) => hr._id);
    }

    // Create search query
    const searchQuery = {
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { registerNumber: { $regex: searchTerm, $options: "i" } },
        { allocatedHRs: { $in: matchingHrIds } },
      ],
    };

    // Get total count for pagination
    const totalStudents = await Student.countDocuments(searchQuery);

    // Create sort object
    let sortObj = {};
    if (sortField === "aptitudeScore" || sortField === "gdScore") {
      // For numeric fields, convert to numbers for proper sorting
      sortObj[sortField] = sortOrder === "asc" ? 1 : -1;
    } else {
      // For string fields, use case-insensitive collation
      sortObj[sortField] = sortOrder === "asc" ? 1 : -1;
    }

    // Get students with populated HR data
    const students = await Student.find(searchQuery)
      .populate({
        path: "allocatedHRs",
        select: "name company _id",
      })
      .select(
        "name registerNumber department aptitudeScore gdScore allocatedHRs personalReport"
      )
      .skip(skip)
      .limit(limit)
      .sort(sortObj)
      .collation({ locale: "en", strength: 2 }); // Case-insensitive sorting

    res.json({
      students,
      totalPages: Math.ceil(totalStudents / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Deallocate HR from student
router.post(
  "/deallocate-hr-from-student",
  auth,
  checkRole(["admin"]),
  async (req, res) => {
    try {
      const { studentId, hrId } = req.body;

      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Check if HR has submitted a review
      const hasReview = student.personalReport.some(
        (report) => report.hrId.toString() === hrId
      );
      if (hasReview) {
        return res.status(400).json({
          message:
            "Cannot deallocate HR as they have already submitted a review",
        });
      }

      // Remove HR from student's allocatedHRs
      student.allocatedHRs = student.allocatedHRs.filter(
        (allocatedHrId) => allocatedHrId.toString() !== hrId
      );

      await student.save();

      res.json({ message: "HR deallocated successfully from student" });
    } catch (error) {
      console.error("Error deallocating HR from student:", error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

// Update student route
router.put(
  "/update-student/:id",
  auth,
  checkRole(["admin"]),
  async (req, res) => {
    try {
      const { resumeLink } = req.body;
      const student = await Student.findById(req.params.id);

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Only update the resume link
      student.resumeLink = resumeLink;
      await student.save();

      res.json(student);
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

module.exports = router;
