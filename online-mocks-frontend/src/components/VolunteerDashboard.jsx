import { useState, useEffect } from "react";
import api from "../axios/axios";
import { useNavigate } from "react-router-dom";
import logo from "../assets/foresebluelogo.png";

function VolunteerDashboard() {
  const [volunteer, setVolunteer] = useState(null);
  const [allocatedHRs, setAllocatedHRs] = useState([]);
  const [selectedHR, setSelectedHR] = useState("");
  const [students, setStudents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [registerNumber, setRegisterNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const [showDeallocateModal, setShowDeallocateModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [filterOption, setFilterOption] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // const token = sessionStorage.getItem("token");
        // if (!token) {
        //   navigate("/volunteer-login");
        //   return;
        // }

        // Create axios instance with default headers
        // const axiosInstance = axios.create({
        //   headers: { Authorization: `Bearer ${token}` },
        // });

        // Fetch volunteer details
        const volunteerResponse = await api.get("/api/volunteer/profile");
        console.log("Volunteer data:", volunteerResponse.data); // Debug log
        setVolunteer(volunteerResponse.data);

        // Fetch allocated HRs
        const hrsResponse = await api.get("/api/volunteer/allocated-hrs");
        setAllocatedHRs(hrsResponse.data);

        setLoading(false);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedHR) {
        setStudents([]);
        return;
      }

      try {
        const response = await api.get(`/api/volunteer/students/${selectedHR}`);
        console.log("Fetched students:", response.data);
        setStudents(response.data);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    fetchStudents();
  }, [selectedHR]);

  const handleAddStudent = async (studentData) => {
    try {
      if (!selectedHR) {
        alert("Please select an HR first");
        return;
      }
      console.log("Sending request with:", {
        registerNumber,
        hrId: selectedHR,
      });

      const response = await api.post("/api/volunteer/add-student", {
        registerNumber,
        hrId: selectedHR,
      });

      console.log("Add student response:", response.data);
      setStudents((prevStudents) => [...prevStudents, response.data]);
      setShowAddModal(false);
      setRegisterNumber("");
    } catch (error) {
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      alert(
        error.response?.data?.message ||
          "Error adding student. Please check the register number."
      );
    }
  };

  const handleDeallocateStudent = async (student) => {
    // Find the student in the students array
    const studentObj = students.find((s) => s._id === student._id);

    // Check if the student has a personal report from the selected HR
    if (hasPersonalReport(studentObj)) {
      setErrorMessage(
        "Cannot deallocate a student with a completed interview."
      );
      setShowErrorModal(true);
      return;
    }

    setSelectedStudent({ id: student._id, regNumber: student.registerNumber });
    setShowDeallocateModal(true);
  };

  const confirmDeallocation = async () => {
    try {
      await api.post(
        `/api/volunteer/deallocate-student/${selectedStudent.id}/${selectedHR}`,
        {}
      );

      setStudents((prevStudents) =>
        prevStudents.filter((student) => student._id !== selectedStudent.id)
      );
      setShowDeallocateModal(false);
    } catch (error) {
      console.error("Error deallocating student:", error);
      setErrorMessage("Error deallocating student. Please try again.");
      setShowErrorModal(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/volunteer-login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Check if student has a personal report from the selected HR
  const hasPersonalReport = (student) => {
    if (!student.personalReport || student.personalReport.length === 0) {
      return false;
    }

    return student.personalReport.some((report) => {
      // Handle both object ID and string formats
      const reportHrId = report.hrId
        ? typeof report.hrId === "object"
          ? report.hrId.toString()
          : report.hrId
        : null;

      return reportHrId === selectedHR;
    });
  };

  // Filter students based on the selected filter option
  const filteredStudents = () => {
    if (!selectedHR) return [];

    switch (filterOption) {
      case "completed":
        return students.filter((student) => hasPersonalReport(student));
      case "notCompleted":
        return students.filter((student) => !hasPersonalReport(student));
      default:
        return students;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Header with Gradient */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-lg z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img
              src={logo}
              alt="Logo"
              className="h-12 w-auto transform hover:scale-105 transition-transform duration-200"
              onClick={() => navigate("/")}
              style={{ cursor: "pointer" }}
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowLogout(!showLogout)}
              className="flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-full hover:shadow-md transition-all duration-200"
            >
              <span className="font-medium">
                {volunteer?.name || "Loading..."}
              </span>
              <svg
                className="w-5 h-5 transition-transform duration-200 transform"
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
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 border border-gray-100 transform transition-all duration-200">
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50"
                >
                  <svg
                    className="w-5 h-5"
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
      </header>

      {/* Enhanced Main Content */}
      <main className="container mx-auto px-6 pt-28 pb-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* HR Selection and Add Student Button */}
          <div className="flex justify-between items-center mb-8">
            <div className="w-1/3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select HR
              </label>
              <div className="relative">
                <select
                  value={selectedHR}
                  onChange={(e) => setSelectedHR(e.target.value)}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select an HR</option>
                  {allocatedHRs.map((hr) => (
                    <option key={hr._id} value={hr._id}>
                      {hr.name} - {hr.company}
                    </option>
                  ))}
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
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center space-x-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Add Student</span>
            </button>
          </div>

          {/* Filter Options */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="text-sm text-gray-500">
                {selectedHR
                  ? (() => {
                      const completedCount = students.filter((student) =>
                        hasPersonalReport(student)
                      ).length;

                      return `Showing ${filteredStudents().length} of ${
                        students.length
                      } students (${completedCount} completed, ${
                        students.length - completedCount
                      } pending)`;
                    })()
                  : "Please select an HR to view students"}
              </div>
            </div>

            {selectedHR && students.length > 0 && (
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
                    <option value="completed">Completed Students</option>
                    <option value="notCompleted">Pending Students</option>
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
            )}
          </div>

          {/* Enhanced Students Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    S.No
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Registration Number
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Aptitude Score
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    GD Score
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents().length > 0 ? (
                  filteredStudents().map((student, index) => (
                    <tr
                      key={student._id}
                      className="hover:bg-gray-50 transition-colors duration-150 group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                        {student.registerNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                        {student.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                        {student.aptitudeScore} / 50
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                        {student.gdScore} / 50
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        {hasPersonalReport(student) ? (
                          <span className="bg-green-100 text-green-800 px-4 py-1.5 rounded-lg font-medium">
                            Completed
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDeallocateStudent(student)}
                            className="bg-red-500 text-white px-4 py-1.5 rounded-lg hover:bg-red-600 transform hover:-translate-y-0.5 transition-all duration-200"
                          >
                            Deallocate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      {!selectedHR
                        ? "Please select an HR to view students"
                        : filterOption === "completed"
                        ? "No completed students found."
                        : filterOption === "notCompleted"
                        ? "All students have been completed."
                        : "No students allocated to this HR yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Enhanced Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-96 transform transition-all duration-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              Add Student
            </h3>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Register Number
              </label>
              <input
                type="text"
                value={registerNumber}
                onChange={(e) => setRegisterNumber(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter register number"
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStudent}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deallocate Confirmation Modal */}
      {showDeallocateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-96 transform transition-all duration-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Confirm Deallocation
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to deallocate student with register number "
              {selectedStudent?.regNumber}"?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeallocateModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeallocation}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                Deallocate
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

export default VolunteerDashboard;
