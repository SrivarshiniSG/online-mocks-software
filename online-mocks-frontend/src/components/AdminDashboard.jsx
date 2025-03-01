import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../axios/axios";
import logo from "../assets/foresebluelogo.png";

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("volunteers");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [volunteers, setVolunteers] = useState([]);
  const [hrs, setHRs] = useState([]);
  const [newEntry, setNewEntry] = useState({
    name: "",
    username: "",
    password: "",
    company: "", // for HR only
  });
  const [selectedVolunteer, setSelectedVolunteer] = useState("");
  const [selectedHR, setSelectedHR] = useState("");
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'allocated', 'not-allocated'
  const [volunteerSearch, setVolunteerSearch] = useState("");
  const [hrSearch, setHrSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [volunteersRes, hrsRes] = await Promise.all([
        api.get("/api/admin/volunteers"),
        api.get("/api/admin/hrs"),
      ]);
      setVolunteers(volunteersRes.data);
      console.log("HRs data:", hrsRes.data);
      setHRs(hrsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleAddEntry = async () => {
    try {
      const endpoint =
        activeTab === "volunteers"
          ? "/api/admin/add-volunteer"
          : "/api/admin/add-hr";

      await api.post(endpoint, newEntry);
      setShowAddModal(false);
      setNewEntry({ name: "", username: "", password: "", company: "" });
      fetchData();
    } catch (error) {
      console.error("Error adding entry:", error);
      alert(error.response?.data?.message || "Error adding entry");
    }
  };

  const handleAllocate = async () => {
    try {
      await api.post("/api/admin/allocate", {
        volunteerId: selectedVolunteer,
        hrId: selectedHR,
      });
      setShowAllocationModal(false);
      fetchData();
    } catch (error) {
      console.error("Error allocating:", error);
      alert(error.response?.data?.message || "Error allocating");
    }
  };

  const handleDelete = async (id, name) => {
    // Show confirmation dialog
    const isConfirmed = window.confirm(
      `Are you sure you want to delete ${
        activeTab === "volunteers" ? "volunteer" : "HR"
      } "${name}"? This action cannot be undone.`
    );

    if (isConfirmed) {
      try {
        const endpoint =
          activeTab === "volunteers"
            ? `/api/admin/delete-volunteer/${id}`
            : `/api/admin/delete-hr/${id}`;

        await api.delete(endpoint);
        fetchData();
      } catch (error) {
        console.error("Error deleting:", error);
        alert(error.response?.data?.message || "Error deleting entry");
      }
    }
  };

  const handleDeallocate = async (hrId, volunteerId, volunteerName, hrName) => {
    if (!volunteerId) {
      console.error("No volunteer ID provided");
      alert("Error: Volunteer ID is missing");
      return;
    }

    const isConfirmed = window.confirm(
      `Are you sure you want to deallocate volunteer "${volunteerName}" from HR "${hrName}"?`
    );

    if (isConfirmed) {
      try {
        console.log("Sending deallocate request:", { hrId, volunteerId }); // Debug log
        const response = await api.post("/api/admin/deallocate", {
          hrId,
          volunteerId,
        });

        console.log("Deallocate response:", response.data); // Debug log
        fetchData(); // Refresh the data
      } catch (error) {
        console.error("Error deallocating:", error);
        alert(error.response?.data?.message || "Error deallocating volunteer");
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/admin-login");
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredAndSortedHRs = hrs
    .filter((hr) => {
      const matchesSearch =
        hr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hr.company.toLowerCase().includes(searchTerm.toLowerCase());

      if (filterStatus === "all") return matchesSearch;
      if (filterStatus === "allocated")
        return matchesSearch && hr.allocatedVolunteers.length > 0;
      if (filterStatus === "not-allocated")
        return matchesSearch && hr.allocatedVolunteers.length === 0;
      return matchesSearch;
    })
    .sort((a, b) => {
      const aValue = a[sortField]?.toLowerCase() || "";
      const bValue = b[sortField]?.toLowerCase() || "";
      return sortOrder === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

  const filteredAndSortedVolunteers = volunteers
    .filter(
      (volunteer) =>
        volunteer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        volunteer.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField]?.toLowerCase() || "";
      const bValue = b[sortField]?.toLowerCase() || "";
      return sortOrder === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <img src={logo} alt="Logo" className="h-12" />
          <div className="relative">
            <button
              onClick={() => setShowLogout(!showLogout)}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg"
            >
              <span>Admin</span>
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
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {showLogout && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Tab Buttons */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab("volunteers")}
            className={`px-6 py-3 rounded-xl transition-all duration-200 ${
              activeTab === "volunteers"
                ? "bg-purple-500 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Volunteers
          </button>
          <button
            onClick={() => setActiveTab("hrs")}
            className={`px-6 py-3 rounded-xl transition-all duration-200 ${
              activeTab === "hrs"
                ? "bg-purple-500 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            HRs
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mb-8">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200"
          >
            Add {activeTab === "volunteers" ? "Volunteer" : "HR"}
          </button>
          <button
            onClick={() => setShowAllocationModal(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200"
          >
            Allocate Volunteer to HR
          </button>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {activeTab === "hrs" && (
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All HRs</option>
              <option value="allocated">Allocated</option>
              <option value="not-allocated">Not Allocated</option>
            </select>
          )}
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-purple-500 to-purple-600">
              <tr>
                {activeTab === "volunteers" ? (
                  <>
                    <th
                      onClick={() => handleSort("name")}
                      className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-purple-700"
                    >
                      Name{" "}
                      {sortField === "name" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("username")}
                      className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-purple-700"
                    >
                      Username{" "}
                      {sortField === "username" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-white uppercase tracking-wider">
                      Actions
                    </th>
                  </>
                ) : (
                  <>
                    <th
                      onClick={() => handleSort("name")}
                      className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-purple-700"
                    >
                      Name{" "}
                      {sortField === "name" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("company")}
                      className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-purple-700"
                    >
                      Company{" "}
                      {sortField === "company" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Allocated Volunteers
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-white uppercase tracking-wider">
                      Actions
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeTab === "volunteers"
                ? filteredAndSortedVolunteers.map((volunteer) => (
                    <tr
                      key={volunteer._id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {volunteer.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {volunteer.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() =>
                            handleDelete(volunteer._id, volunteer.name)
                          }
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-colors duration-150"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                : filteredAndSortedHRs.map((hr) => (
                    <tr
                      key={hr._id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {hr.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {hr.company}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {hr.allocatedVolunteers &&
                        hr.allocatedVolunteers.length > 0 ? (
                          <div className="space-y-2">
                            {hr.allocatedVolunteers.map((volunteer) => (
                              <div
                                key={volunteer._id}
                                className="flex items-center justify-between bg-gray-50 p-2 rounded-lg"
                              >
                                <span>
                                  {volunteer.name} ({volunteer.username})
                                </span>
                                <button
                                  onClick={() => {
                                    console.log("Volunteer data:", volunteer); // Debug log
                                    handleDeallocate(
                                      hr._id,
                                      volunteer._id || volunteer, // If volunteer is just an ID, use it directly
                                      volunteer.name,
                                      hr.name
                                    );
                                  }}
                                  className="text-orange-600 hover:text-orange-900 bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded-md text-xs transition-colors duration-150"
                                >
                                  Deallocate
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">
                            No volunteers allocated
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDelete(hr._id, hr.name)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-colors duration-150"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-96 transform transition-all duration-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              Add {activeTab === "volunteers" ? "Volunteer" : "HR"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newEntry.name}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={`Enter ${
                    activeTab === "volunteers" ? "volunteer" : "HR"
                  } name`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={newEntry.username}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, username: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={`Enter ${
                    activeTab === "volunteers" ? "volunteer" : "HR"
                  } username`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={newEntry.password}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter password"
                />
              </div>
              {activeTab === "hrs" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={newEntry.company}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, company: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter company name"
                  />
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewEntry({
                    name: "",
                    username: "",
                    password: "",
                    company: "",
                  });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEntry}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Add {activeTab === "volunteers" ? "Volunteer" : "HR"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Allocation Modal */}
      {showAllocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 w-[500px]">
            <h3 className="text-xl font-semibold mb-6">
              Allocate Volunteer to HR
            </h3>
            <div className="space-y-4">
              {/* Volunteer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search and Select Volunteer
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type to search volunteers..."
                    onChange={(e) => {
                      const searchTerm = e.target.value.toLowerCase();
                      // Update volunteer search term but don't auto-select
                      setVolunteerSearch(searchTerm);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {/* Filtered Volunteer Dropdown */}
                  {volunteerSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {volunteers
                        .filter(
                          (v) =>
                            v.name.toLowerCase().includes(volunteerSearch) ||
                            v.username.toLowerCase().includes(volunteerSearch)
                        )
                        .map((volunteer) => (
                          <div
                            key={volunteer._id}
                            onClick={() => {
                              setSelectedVolunteer(volunteer._id);
                              setVolunteerSearch("");
                            }}
                            className={`px-4 py-2 cursor-pointer hover:bg-purple-50 ${
                              selectedVolunteer === volunteer._id
                                ? "bg-purple-100"
                                : ""
                            }`}
                          >
                            {volunteer.name} ({volunteer.username})
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                {/* Selected Volunteer Display */}
                {selectedVolunteer && (
                  <div className="mt-2 p-2 bg-purple-50 rounded-lg flex justify-between items-center">
                    <span className="text-sm text-purple-700">
                      Selected:{" "}
                      {
                        volunteers.find((v) => v._id === selectedVolunteer)
                          ?.name
                      }
                    </span>
                    <button
                      onClick={() => setSelectedVolunteer("")}
                      className="text-purple-700 hover:text-purple-900"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* HR Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search and Select HR
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type to search HRs..."
                    onChange={(e) => {
                      const searchTerm = e.target.value.toLowerCase();
                      // Update HR search term but don't auto-select
                      setHrSearch(searchTerm);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {/* Filtered HR Dropdown */}
                  {hrSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {hrs
                        .filter(
                          (hr) =>
                            hr.name.toLowerCase().includes(hrSearch) ||
                            hr.company.toLowerCase().includes(hrSearch)
                        )
                        .map((hr) => (
                          <div
                            key={hr._id}
                            onClick={() => {
                              setSelectedHR(hr._id);
                              setHrSearch("");
                            }}
                            className={`px-4 py-2 cursor-pointer hover:bg-purple-50 ${
                              selectedHR === hr._id ? "bg-purple-100" : ""
                            }`}
                          >
                            {hr.name} - {hr.company}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                {/* Selected HR Display */}
                {selectedHR && (
                  <div className="mt-2 p-2 bg-purple-50 rounded-lg flex justify-between items-center">
                    <span className="text-sm text-purple-700">
                      Selected: {hrs.find((h) => h._id === selectedHR)?.name}
                    </span>
                    <button
                      onClick={() => setSelectedHR("")}
                      className="text-purple-700 hover:text-purple-900"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAllocationModal(false);
                  setSelectedVolunteer("");
                  setSelectedHR("");
                  setVolunteerSearch("");
                  setHrSearch("");
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAllocate}
                disabled={!selectedVolunteer || !selectedHR}
                className={`px-4 py-2 text-white rounded-lg ${
                  !selectedVolunteer || !selectedHR
                    ? "bg-purple-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                Allocate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
