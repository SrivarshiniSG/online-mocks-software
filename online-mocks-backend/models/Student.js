const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  registerNumber: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  aptitudeScore: {
    type: Number,
    required: true,
  },
  gdScore: {
    type: Number,
    required: true,
  },
  resumeLink: {
    type: String,
    required: true,
  },
  allocatedHRs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HR",
    },
  ],
  personalReport: [
    {
      professionalAppearanceAndAttitude: {
        type: Number,
      },
      managerialAptitude: {
        type: Number,
      },
      generalIntelligenceAndAwareness: {
        type: Number,
      },
      technicalKnowledge: {
        type: Number,
      },
      communicationSkills: {
        type: Number,
      },
      achievementsAndAmbition: {
        type: Number,
      },
      selfConfidence: {
        type: Number,
      },
      overallScore: {
        type: Number,
      },
      strengths: {
        type: String,
      },
      pointsToImproveOn: {
        type: String,
      },
      comments: {
        type: String,
      },
      interviewerName: {
        type: String,
      },
      interviewerCompany: {
        type: String,
      },
      hrId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HR",
      },
    },
  ],
});

// Add validation to ensure only one personal report per HR ID
studentSchema.path("personalReport").validate(function (personalReports) {
  if (!personalReports || personalReports.length === 0) return true;

  const hrIds = personalReports.map((report) =>
    report.hrId ? report.hrId.toString() : null
  );
  const uniqueHrIds = [...new Set(hrIds)];

  // If the length of unique HR IDs is less than the total, there are duplicates
  return uniqueHrIds.length === hrIds.length;
}, "A student can have only one personal report per HR");

module.exports = mongoose.model("Student", studentSchema);
