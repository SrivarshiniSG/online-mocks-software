import { useState, useEffect, useMemo } from "react";
import api from "../axios/axios";
import { useNavigate } from "react-router-dom";
import logo from "../assets/foresebluelogo.png";

function HRDashboard() {
  const [hr, setHR] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [reviewData, setReviewData] = useState({
    professionalAppearanceAndAttitude: "",
    managerialAptitude: "",
    generalIntelligenceAndAwareness: "",
    technicalKnowledge: "",
    communicationSkills: "",
    achievementsAndAmbition: "",
    selfConfidence: "",
    overallScore: "",
    strengths: "",
    pointsToImproveOn: "",
    comments: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [filterOption, setFilterOption] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch HR details
        const hrName = localStorage.getItem("hrName");
        const hrCompany = localStorage.getItem("hrCompany");
        const hrId = localStorage.getItem("hrId");
        setHR({ name: hrName, company: hrCompany, id: hrId });

        // Fetch allocated students
        const studentsResponse = await api.get("/api/hr/getStudents");
        setStudents(studentsResponse.data);
        console.log(studentsResponse.data);

        setLoading(false);
      } catch (error) {
        console.error("Error:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Add event listener for Escape key to close the review modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape" && showReviewModal) {
        setShowReviewModal(false);
      }
    };

    document.addEventListener("keydown", handleEscapeKey);

    // Clean up the event listener when component unmounts or modal state changes
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [showReviewModal]);

  // Add click outside handler for the logout dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the logout dropdown is open
      if (showLogout) {
        // Get the dropdown container element
        const dropdownContainer = document.getElementById(
          "logout-dropdown-container"
        );

        // If the click is outside the dropdown container, close the dropdown
        if (dropdownContainer && !dropdownContainer.contains(event.target)) {
          setShowLogout(false);
        }
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLogout]);

  const handleReviewStudent = (student) => {
    setSelectedStudent(student);

    // Check if the HR has already reviewed this student
    const hrId = localStorage.getItem("hrId");
    const existingReview = student.personalReport?.find((report) => {
      return report.hrId === hrId;
    });

    if (existingReview) {
      // If there's an existing review, load it for editing
      setIsEditMode(true);
      setReviewData({
        professionalAppearanceAndAttitude:
          existingReview.professionalAppearanceAndAttitude || "",
        managerialAptitude: existingReview.managerialAptitude || "",
        generalIntelligenceAndAwareness:
          existingReview.generalIntelligenceAndAwareness || "",
        technicalKnowledge: existingReview.technicalKnowledge || "",
        communicationSkills: existingReview.communicationSkills || "",
        achievementsAndAmbition: existingReview.achievementsAndAmbition || "",
        selfConfidence: existingReview.selfConfidence || "",
        overallScore: existingReview.overallScore || "",
        strengths: existingReview.strengths || "",
        pointsToImproveOn: existingReview.pointsToImproveOn || "",
        comments: existingReview.comments || "",
      });
    } else {
      // If there's no existing review, reset the form
      setIsEditMode(false);
      setReviewData({
        professionalAppearanceAndAttitude: "",
        managerialAptitude: "",
        generalIntelligenceAndAwareness: "",
        technicalKnowledge: "",
        communicationSkills: "",
        achievementsAndAmbition: "",
        selfConfidence: "",
        overallScore: "",
        strengths: "",
        pointsToImproveOn: "",
        comments: "",
      });
    }

    setShowReviewModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReviewData({
      ...reviewData,
      [name]:
        name.includes("Score") ||
        name === "professionalAppearanceAndAttitude" ||
        name === "managerialAptitude" ||
        name === "generalIntelligenceAndAwareness" ||
        name === "technicalKnowledge" ||
        name === "communicationSkills" ||
        name === "achievementsAndAmbition" ||
        name === "selfConfidence" ||
        name === "overallScore"
          ? Number(value)
          : value,
    });
  };

  const handleSubmitReview = async () => {
    try {
      setSubmitting(true);
      await api.post("/api/hr/personalReport", {
        registerNumber: selectedStudent.registerNumber,
        report: reviewData,
        isEdit: isEditMode,
      });
      setShowReviewModal(false);
      setSubmitting(false);
      // Refresh student data
      const studentsResponse = await api.get("/api/hr/getStudents");
      setStudents(studentsResponse.data);
    } catch (error) {
      console.error("Error submitting review:", error);
      setErrorMessage(
        error.response?.data?.message || "Failed to submit review"
      );
      setShowErrorModal(true);
      setSubmitting(false);
    }
  };

  // Function to check if the HR has already reviewed a student
  const hasReviewedStudent = (student) => {
    const hrId = localStorage.getItem("hrId");
    return student.personalReport?.some((report) => report.hrId === hrId);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/hr-login");
  };

  // Filter students based on the selected filter option
  const filteredStudents = () => {
    const hrId = localStorage.getItem("hrId");

    switch (filterOption) {
      case "reviewed":
        return students.filter((student) =>
          student.personalReport?.some((report) => report.hrId === hrId)
        );
      case "notReviewed":
        return students.filter(
          (student) =>
            !student.personalReport?.some((report) => report.hrId === hrId)
        );
      default:
        return students;
    }
  };

  // Sort students based on the sort configuration
  const sortedStudents = useMemo(() => {
    let sortableStudents = [...filteredStudents()];
    if (sortConfig.key) {
      sortableStudents.sort((a, b) => {
        // Handle null or undefined values
        if (!a[sortConfig.key] && !b[sortConfig.key]) return 0;
        if (!a[sortConfig.key]) return 1;
        if (!b[sortConfig.key]) return -1;

        // Compare values based on their type
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "ascending"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        } else {
          return sortConfig.direction === "ascending"
            ? aValue - bValue
            : bValue - aValue;
        }
      });
    }
    return sortableStudents;
  }, [filteredStudents, sortConfig]);

  // Request sort function
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Get the sort direction indicator
  const getSortDirectionIndicator = (key) => {
    if (sortConfig.key !== key) {
      return (
        <svg
          className="w-4 h-4 inline-block ml-1 text-gray-400 opacity-0 group-hover:opacity-100"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }

    if (sortConfig.direction === "ascending") {
      return (
        <svg
          className="w-4 h-4 inline-block ml-1 text-blue-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 15l7-7 7 7"
          />
        </svg>
      );
    } else {
      return (
        <svg
          className="w-4 h-4 inline-block ml-1 text-blue-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="mt-4 text-xl text-gray-700 font-medium">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Enhanced Modern Navbar */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md border-b border-gray-200 z-10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo and Company Section */}
            <div className="flex items-center space-x-3">
              <img
                src={logo}
                alt="Forese Logo"
                className="h-10 md:h-12 w-auto transform hover:scale-105 transition-transform duration-200"
              />
              <div className="hidden md:block h-8 w-px bg-gray-200"></div>
              <div className="hidden md:flex flex-col justify-center">
                <span className="text-xs text-gray-500 font-medium">
                  HR DASHBOARD
                </span>
                <span className="text-sm text-blue-600 font-semibold">
                  {hr?.company || ""}
                </span>
              </div>
            </div>

            {/* Center section - can be used for navigation or search in future */}
            <div className="hidden lg:flex items-center space-x-4">
              {/* Placeholder for future navigation items */}
            </div>

            {/* User Profile and Actions */}
            <div className="relative" id="logout-dropdown-container">
              <button
                onClick={() => setShowLogout(!showLogout)}
                className="flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-full hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center">
                  {/* User Avatar Circle */}
                  <div className="w-7 h-7 rounded-full bg-blue-400 flex items-center justify-center text-white font-medium mr-2 border-2 border-white">
                    {hr?.name ? hr.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm md:text-base leading-tight">
                      {hr?.name || "Loading..."}
                    </span>
                    <span className="text-xs text-blue-100 leading-tight md:hidden">
                      {hr?.company || ""}
                    </span>
                  </div>
                </div>
                <svg
                  className="w-4 h-4 transition-transform duration-200 transform text-blue-100"
                  style={{
                    transform: showLogout ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {showLogout && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 border border-gray-100 transform transition-all duration-200 z-20">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {hr?.name}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - adjusted top padding to account for new navbar height */}
      <main className="container mx-auto px-6 pt-24 md:pt-28 pb-8">
        <div className="bg-white rounded-2xl shadow-xl shadow-black/10 border border-gray-200 p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                Allocated Students
              </h2>
              <div className="mt-1 text-sm text-gray-500">
                {(() => {
                  const reviewedCount = students.filter((student) =>
                    hasReviewedStudent(student)
                  ).length;

                  return `Showing ${sortedStudents.length} of ${
                    students.length
                  } students (${reviewedCount} reviewed, ${
                    students.length - reviewedCount
                  } pending)`;
                })()}
              </div>
            </div>

            <div className="w-72">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter Students
              </label>
              <div className="relative">
                <select
                  value={filterOption}
                  onChange={(e) => setFilterOption(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 pr-10"
                >
                  <option value="all">All Students</option>
                  <option value="reviewed">Reviewed Students</option>
                  <option value="notReviewed">Not Reviewed Students</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Students Table */}
          <div className="overflow-x-auto">
            <div className="md:hidden">
              {/* Mobile Card View */}
              {sortedStudents.length > 0 ? (
                <div className="space-y-4">
                  {sortedStudents.map((student, index) => (
                    <div
                      key={student._id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-500">
                          #{index + 1}
                        </span>
                        <span
                          className={`text-sm px-2 py-1 rounded-full ${
                            hasReviewedStudent(student)
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {hasReviewedStudent(student)
                            ? "Reviewed"
                            : "Not Reviewed"}
                        </span>
                      </div>

                      <h3 className="text-lg font-medium text-gray-800 mb-1">
                        {student.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {student.registerNumber}
                      </p>

                      <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                        <div>
                          <span className="text-gray-500">Department:</span>
                          <p className="font-medium">{student.department}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Aptitude:</span>
                          <p className="font-medium">
                            {student.aptitudeScore}/50
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">GD Score:</span>
                          <p className="font-medium">{student.gdScore}/50</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {student.resumeLink ? (
                          <a
                            href={student.resumeLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transform hover:-translate-y-0.5 transition-all duration-200 text-center"
                          >
                            Resume
                            <svg
                              className="w-3 h-3 inline-block ml-1 mb-0.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        ) : (
                          <button
                            disabled
                            className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed opacity-60"
                          >
                            No Resume
                          </button>
                        )}
                        <button
                          onClick={() => handleReviewStudent(student)}
                          className={`flex-1 ${
                            hasReviewedStudent(student)
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-blue-500 hover:bg-blue-600"
                          } text-white px-4 py-2 rounded-lg transform hover:-translate-y-0.5 transition-all duration-200`}
                        >
                          {hasReviewedStudent(student)
                            ? "Edit Review"
                            : "Review"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-gray-500">
                  {filterOption === "reviewed"
                    ? "No reviewed students found."
                    : filterOption === "notReviewed"
                    ? "All students have been reviewed."
                    : "No students allocated yet."}
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              {/* Scroll Controls for non-touch devices */}
              <div
                id="scroll-controls"
                className="flex justify-between mb-2 md:px-2 hidden"
              >
                <button
                  className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-1.5 rounded-lg text-sm flex items-center shadow-md shadow-black/10 border border-gray-100 transition-all duration-200"
                  onClick={() => {
                    const tableContainer =
                      document.getElementById("table-container");
                    if (tableContainer) {
                      tableContainer.scrollLeft -= 200;
                    }
                  }}
                >
                  <svg
                    className="w-4 h-4 mr-1 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Scroll Left
                </button>
                <button
                  className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-1.5 rounded-lg text-sm flex items-center shadow-md shadow-black/10 border border-gray-100 transition-all duration-200"
                  onClick={() => {
                    const tableContainer =
                      document.getElementById("table-container");
                    if (tableContainer) {
                      tableContainer.scrollLeft += 200;
                    }
                  }}
                >
                  Scroll Right
                  <svg
                    className="w-4 h-4 ml-1 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
              <div
                id="table-container"
                className="overflow-x-auto rounded-xl border border-gray-200"
                onScroll={(e) => {
                  const container = e.currentTarget;
                  const scrollControls =
                    document.getElementById("scroll-controls");

                  // Show scroll controls only if content is wider than container
                  if (container.scrollWidth > container.clientWidth) {
                    scrollControls.classList.remove("hidden");
                  } else {
                    scrollControls.classList.add("hidden");
                  }
                }}
                ref={(el) => {
                  // Check on initial render if scrolling is needed
                  if (el) {
                    setTimeout(() => {
                      const scrollControls =
                        document.getElementById("scroll-controls");
                      if (el.scrollWidth > el.clientWidth) {
                        scrollControls.classList.remove("hidden");
                      } else {
                        scrollControls.classList.add("hidden");
                      }
                    }, 100); // Small delay to ensure accurate measurements
                  }
                }}
              >
                <table className="min-w-full divide-y divide-gray-200 table-fixed">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <th className="w-[5%] px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        S.No
                      </th>
                      <th
                        className="w-[15%] px-2 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-150 group"
                        onClick={() => requestSort("registerNumber")}
                        title="Click to sort by Register Number"
                      >
                        <div className="flex items-center justify-center">
                          <span className="truncate">Register Number</span>{" "}
                          {getSortDirectionIndicator("registerNumber")}
                        </div>
                      </th>
                      <th
                        className="w-[15%] px-2 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-150 group"
                        onClick={() => requestSort("name")}
                        title="Click to sort by Name"
                      >
                        <div className="flex items-center justify-center">
                          <span className="truncate">Name</span>{" "}
                          {getSortDirectionIndicator("name")}
                        </div>
                      </th>
                      <th
                        className="w-[20%] px-2 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-150 group"
                        onClick={() => requestSort("department")}
                        title="Click to sort by Department"
                      >
                        <div className="flex items-center justify-center">
                          <span className="truncate">Department</span>{" "}
                          {getSortDirectionIndicator("department")}
                        </div>
                      </th>
                      <th
                        className="w-[10%] px-2 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-150 group"
                        onClick={() => requestSort("aptitudeScore")}
                        title="Click to sort by Aptitude Score"
                      >
                        <div className="flex items-center justify-center">
                          <span className="truncate">Aptitude Score</span>{" "}
                          {getSortDirectionIndicator("aptitudeScore")}
                        </div>
                      </th>
                      <th
                        className="w-[10%] px-2 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-150 group"
                        onClick={() => requestSort("gdScore")}
                        title="Click to sort by GD Score"
                      >
                        <div className="flex items-center justify-center">
                          <span className="truncate">GD Score</span>{" "}
                          {getSortDirectionIndicator("gdScore")}
                        </div>
                      </th>
                      <th className="w-[10%] px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Resume
                      </th>
                      <th className="w-[10%] px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedStudents.length > 0 ? (
                      sortedStudents.map((student, index) => (
                        <tr
                          key={student._id}
                          className="hover:bg-gray-50 transition-colors duration-150 group"
                        >
                          <td className="px-2 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                            {index + 1}
                          </td>
                          <td className="px-2 py-3 text-sm text-gray-600 text-center">
                            <div className="truncate">
                              {student.registerNumber}
                            </div>
                          </td>
                          <td className="px-2 py-3 text-sm text-gray-600 text-center">
                            <div className="truncate">{student.name}</div>
                          </td>
                          <td className="px-2 py-3 text-sm text-gray-600 text-center">
                            <div className="truncate">{student.department}</div>
                          </td>
                          <td className="px-2 py-3 text-sm text-gray-600 text-center">
                            {student.aptitudeScore}/50
                          </td>
                          <td className="px-2 py-3 text-sm text-gray-600 text-center">
                            {student.gdScore}/50
                          </td>
                          <td className="px-2 py-3 text-sm text-center">
                            {student.resumeLink ? (
                              <a
                                href={student.resumeLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1.5 rounded-lg transform hover:-translate-y-0.5 transition-all duration-200 w-full text-xs md:text-sm inline-block"
                              >
                                Resume
                                <svg
                                  className="w-3 h-3 inline-block ml-1 mb-0.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                              </a>
                            ) : (
                              <button
                                disabled
                                className="bg-gray-400 text-white px-2 py-1.5 rounded-lg w-full text-xs md:text-sm inline-block cursor-not-allowed opacity-60"
                              >
                                No Resume
                              </button>
                            )}
                          </td>
                          <td className="px-2 py-3 text-sm text-center">
                            <button
                              onClick={() => handleReviewStudent(student)}
                              className={`${
                                hasReviewedStudent(student)
                                  ? "bg-green-500 hover:bg-green-600"
                                  : "bg-blue-500 hover:bg-blue-600"
                              } text-white px-2 py-1.5 rounded-lg transform hover:-translate-y-0.5 transition-all duration-200 w-full text-xs md:text-sm`}
                            >
                              {hasReviewedStudent(student)
                                ? "Edit Review"
                                : "Review"}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="8"
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          {filterOption === "reviewed"
                            ? "No reviewed students found."
                            : filterOption === "notReviewed"
                            ? "All students have been reviewed."
                            : "No students allocated yet."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Review Student Modal */}
      {showReviewModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-4 md:p-8 w-full max-w-[800px] max-h-[90vh] overflow-y-auto transform transition-all duration-200 mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              {isEditMode ? "Edit Review: " : "Review Student: "}
              {selectedStudent.name}
            </h3>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Register Number
                  </p>
                  <p className="text-base text-gray-800">
                    {selectedStudent.registerNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Department
                  </p>
                  <p className="text-base text-gray-800">
                    {selectedStudent.department}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Aptitude Score
                  </p>
                  <p className="text-base text-gray-800">
                    {selectedStudent.aptitudeScore} / 50
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">GD Score</p>
                  <p className="text-base text-gray-800">
                    {selectedStudent.gdScore} / 50
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-medium text-gray-800 mb-4">
                  Student Interview Rating
                </h4>

                {/* Rating Fields */}
                <div className="space-y-6">
                  {/* Professional Appearance */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Professional Appearance & Attitude
                      </label>
                    </div>
                    <select
                      name="professionalAppearanceAndAttitude"
                      value={reviewData.professionalAppearanceAndAttitude}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select Rating --</option>
                      <option value={10}>10 - Outstanding</option>
                      <option value={9}>9 - Outstanding</option>
                      <option value={8}>8 - Above Average</option>
                      <option value={7}>7 - Above Average</option>
                      <option value={6}>6 - Above Average</option>
                      <option value={5}>5 - Average</option>
                      <option value={4}>4 - All Others</option>
                      <option value={3}>3 - All Others</option>
                      <option value={2}>2 - All Others</option>
                      <option value={1}>1 - All Others</option>
                    </select>
                  </div>

                  {/* Managerial Aptitude */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Managerial Aptitude
                      </label>
                    </div>
                    <select
                      name="managerialAptitude"
                      value={reviewData.managerialAptitude}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select Rating --</option>
                      <option value={10}>10 - Outstanding</option>
                      <option value={9}>9 - Outstanding</option>
                      <option value={8}>8 - Above Average</option>
                      <option value={7}>7 - Above Average</option>
                      <option value={6}>6 - Above Average</option>
                      <option value={5}>5 - Average</option>
                      <option value={4}>4 - Below Average</option>
                      <option value={3}>3 - Below Average</option>
                      <option value={2}>2 - Below Average</option>
                      <option value={1}>1 - Below Average</option>
                    </select>
                  </div>

                  {/* General Intelligence */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        General Intelligence & Awareness
                      </label>
                    </div>
                    <select
                      name="generalIntelligenceAndAwareness"
                      value={reviewData.generalIntelligenceAndAwareness}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select Rating --</option>
                      <option value={10}>10 - Outstanding</option>
                      <option value={9}>9 - Outstanding</option>
                      <option value={8}>8 - Above Average</option>
                      <option value={7}>7 - Above Average</option>
                      <option value={6}>6 - Above Average</option>
                      <option value={5}>5 - Average</option>
                      <option value={4}>4 - Below Average</option>
                      <option value={3}>3 - Below Average</option>
                      <option value={2}>2 - Below Average</option>
                      <option value={1}>1 - Below Average</option>
                    </select>
                  </div>

                  {/* Technical Knowledge */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Technical Knowledge
                      </label>
                    </div>
                    <select
                      name="technicalKnowledge"
                      value={reviewData.technicalKnowledge}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select Rating --</option>
                      <option value={10}>10 - Outstanding</option>
                      <option value={9}>9 - Outstanding</option>
                      <option value={8}>8 - Above Average</option>
                      <option value={7}>7 - Above Average</option>
                      <option value={6}>6 - Above Average</option>
                      <option value={5}>5 - Average</option>
                      <option value={4}>4 - Below Average</option>
                      <option value={3}>3 - Below Average</option>
                      <option value={2}>2 - Below Average</option>
                      <option value={1}>1 - Below Average</option>
                    </select>
                  </div>

                  {/* Communication Skills */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Communication Skills
                      </label>
                    </div>
                    <select
                      name="communicationSkills"
                      value={reviewData.communicationSkills}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select Rating --</option>
                      <option value={10}>10 - Outstanding</option>
                      <option value={9}>9 - Outstanding</option>
                      <option value={8}>8 - Above Average</option>
                      <option value={7}>7 - Above Average</option>
                      <option value={6}>6 - Above Average</option>
                      <option value={5}>5 - Average</option>
                      <option value={4}>4 - Below Average</option>
                      <option value={3}>3 - Below Average</option>
                      <option value={2}>2 - Below Average</option>
                      <option value={1}>1 - Below Average</option>
                    </select>
                  </div>

                  {/* Achievements & Ambition */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Achievements & Ambition
                      </label>
                    </div>
                    <select
                      name="achievementsAndAmbition"
                      value={reviewData.achievementsAndAmbition}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select Rating --</option>
                      <option value={10}>10 - Outstanding</option>
                      <option value={9}>9 - Outstanding</option>
                      <option value={8}>8 - Above Average</option>
                      <option value={7}>7 - Above Average</option>
                      <option value={6}>6 - Above Average</option>
                      <option value={5}>5 - Average</option>
                      <option value={4}>4 - Below Average</option>
                      <option value={3}>3 - Below Average</option>
                      <option value={2}>2 - Below Average</option>
                      <option value={1}>1 - Below Average</option>
                    </select>
                  </div>

                  {/* Self Confidence */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Self Confidence
                      </label>
                    </div>
                    <select
                      name="selfConfidence"
                      value={reviewData.selfConfidence}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select Rating --</option>
                      <option value={10}>10 - Outstanding</option>
                      <option value={9}>9 - Outstanding</option>
                      <option value={8}>8 - Above Average</option>
                      <option value={7}>7 - Above Average</option>
                      <option value={6}>6 - Above Average</option>
                      <option value={5}>5 - Average</option>
                      <option value={4}>4 - Below Average</option>
                      <option value={3}>3 - Below Average</option>
                      <option value={2}>2 - Below Average</option>
                      <option value={1}>1 - Below Average</option>
                    </select>
                  </div>

                  {/* Overall Score */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Overall Score
                      </label>
                    </div>
                    <select
                      name="overallScore"
                      value={reviewData.overallScore}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select Rating --</option>
                      <option value={10}>10 - Outstanding</option>
                      <option value={9}>9 - Outstanding</option>
                      <option value={8}>8 - Above Average</option>
                      <option value={7}>7 - Above Average</option>
                      <option value={6}>6 - Above Average</option>
                      <option value={5}>5 - Average</option>
                      <option value={4}>4 - Below Average</option>
                      <option value={3}>3 - Below Average</option>
                      <option value={2}>2 - Below Average</option>
                      <option value={1}>1 - Below Average</option>
                    </select>
                  </div>

                  {/* Text Fields */}
                  <div className="space-y-4 mt-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Strengths
                      </label>
                      <textarea
                        name="strengths"
                        value={reviewData.strengths}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Student's strengths..."
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Points to Improve On
                      </label>
                      <textarea
                        name="pointsToImproveOn"
                        value={reviewData.pointsToImproveOn}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Areas for improvement..."
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Comments
                      </label>
                      <textarea
                        name="comments"
                        value={reviewData.comments}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Any additional comments..."
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-6 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                className="px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200 flex items-center"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  "Submit Review"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-96 transform transition-all duration-200">
            <div className="flex items-center justify-center mb-4 text-red-500">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2 text-center">
              Error
            </h3>
            <p className="text-gray-600 text-center mb-6">{errorMessage}</p>
            <div className="flex justify-center">
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-6 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HRDashboard;
