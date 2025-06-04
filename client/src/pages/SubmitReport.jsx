import { useState, useEffect } from "react";
// Removed Firebase imports
import axios from "axios"; // Using axios for API calls

// Define the base URL for the Django API
const API_BASE_URL = "https://8000-if0myrafrxorjjuyaiha6-58b58199.manusvm.computer/api";

function SubmitReport() {
  const [vendor, setVendor] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [availableSymptoms, setAvailableSymptoms] = useState([]);
  const [reports, setReports] = useState([]);
  const [locationDetails, setLocationDetails] = useState(""); // Using a single field for location now
  const [incidentDateTime, setIncidentDateTime] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available symptoms on component mount
  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/symptoms/`);
        setAvailableSymptoms(response.data || []);
      } catch (err) {
        console.error("Error fetching symptoms:", err);
        setError("Failed to load symptoms.");
        // Provide fallback symptoms if API fails
        setAvailableSymptoms([
          { id: 1, name: "Nausea" },
          { id: 2, name: "Diarrhea" },
          { id: 3, name: "Vomiting" },
          { id: 4, name: "Fever" },
          { id: 5, name: "Headache" },
          { id: 6, name: "Something else" }, // Added a generic option
        ]);
      }
    };
    fetchSymptoms();
  }, []);

  // Fetch reports on component mount
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/reports/`);
      // Format timestamp for display
      const formattedReports = response.data.results.map(report => ({
        ...report,
        reported_datetime: report.reported_datetime ? new Date(report.reported_datetime).toLocaleString() : "N/A",
        incident_datetime: report.incident_datetime ? new Date(report.incident_datetime).toLocaleString() : "N/A",
      }));
      setReports(formattedReports || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setError("Failed to load recent reports.");
      setReports([]); // Clear reports on error
    } finally {
      setLoading(false);
    }
  };

  const handleSymptomToggle = (symptomId) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomId)
        ? prev.filter((id) => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const reportData = {
      location_details: locationDetails || vendor, // Use vendor name if specific location not given
      description: description,
      symptom_ids: selectedSymptoms,
      incident_datetime: incidentDateTime || null, // Send null if empty
      is_private: isPrivate,
      // Add tag_ids later if needed
    };

    try {
      await axios.post(`${API_BASE_URL}/reports/`, reportData);
      alert("Report submitted successfully!");
      // Clear form
      setVendor("");
      setDescription("");
      setSelectedSymptoms([]);
      setLocationDetails("");
      setIncidentDateTime("");
      setIsPrivate(false);
      fetchReports(); // Refresh report list
    } catch (err) {
      console.error("Error adding report:", err);
      setError("Failed to submit report. Please check your input.");
      alert("Failed to submit report.");
    } finally {
      setLoading(false);
    }
  };

  // --- Color Theme Variables (using hex codes from color_theme.md) ---
  const colors = {
    primary: "#2E7D32", // Green
    accent: "#4CAF50", // Lighter Green
    warning: "#D32F2F", // Red
    info: "#1976D2", // Blue
    bg: "#FFFFFF",
    bgSubtle: "#F5F5F5",
    textPrimary: "#333333",
    textSecondary: "#757575",
  };

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Report Submission Form */}
      <div className="col-span-1 bg-white shadow rounded-lg p-6 space-y-6">
        <h2 className="text-2xl font-bold" style={{ color: colors.primary }}>Report a Food Safety Issue</h2>

        {error && <p className="text-red-600 bg-red-100 p-3 rounded">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold" style={{ color: colors.textPrimary }}>I am reporting (Symptoms)</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {availableSymptoms.map((symptom) => (
                <button
                  key={symptom.id}
                  type="button"
                  className={`px-3 py-1.5 rounded-full border text-sm transition ${selectedSymptoms.includes(symptom.id) ? `bg-[${colors.primary}] text-white border-[${colors.primary}]` : `bg-white border-gray-300 text-[${colors.textPrimary}] hover:bg-gray-100`}`}
                  onClick={() => handleSymptomToggle(symptom.id)}
                >
                  {symptom.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="vendor" className="block font-semibold mb-1" style={{ color: colors.textPrimary }}>Where? (Business Name)</label>
            <input
              id="vendor"
              type="text"
              placeholder="e.g., Moe's Tavern"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="w-full p-3 border rounded focus:ring-1 focus:ring-[${colors.primary}] focus:border-[${colors.primary}]"
              required
            />
          </div>

          <div>
             <label htmlFor="locationDetails" className="block font-semibold mb-1" style={{ color: colors.textPrimary }}>Location Details (Optional)</label>
            <input
              id="locationDetails"
              type="text"
              placeholder="e.g., Address, City, Specific Area"
              value={locationDetails}
              onChange={(e) => setLocationDetails(e.target.value)}
              className="w-full p-3 border rounded focus:ring-1 focus:ring-[${colors.primary}] focus:border-[${colors.primary}]"
            />
          </div>

          <div>
            <label htmlFor="description" className="block font-semibold mb-1" style={{ color: colors.textPrimary }}>What happened and when? Describe your situation.</label>
            <textarea
              id="description"
              placeholder="Describe the incident..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border rounded h-24 focus:ring-1 focus:ring-[${colors.primary}] focus:border-[${colors.primary}]"
              required
            />
          </div>

           <div>
            <label htmlFor="incidentDateTime" className="block font-semibold mb-1" style={{ color: colors.textPrimary }}>Incident Date & Time (Optional)</label>
            <input
              id="incidentDateTime"
              type="datetime-local"
              value={incidentDateTime}
              onChange={(e) => setIncidentDateTime(e.target.value)}
              className="w-full p-3 border rounded focus:ring-1 focus:ring-[${colors.primary}] focus:border-[${colors.primary}]"
            />
          </div>

          <div className="flex items-center">
            <input
              id="isPrivate"
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[${colors.primary}] focus:ring-[${colors.primary}]"
            />
            <label htmlFor="isPrivate" className="ml-2 block text-sm" style={{ color: colors.textSecondary }}>Make this report private (not publicly visible)</label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-3 rounded transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: loading ? colors.accent : colors.primary, "&:hover": { backgroundColor: colors.accent } }}
          >
            {loading ? "Submitting..." : "Report it Now"}
          </button>
        </form>
      </div>

      {/* Recent Reports Feed */}
      <div className="col-span-2 space-y-6">
        <h2 className="text-2xl font-bold" style={{ color: colors.primary }}>Recent Reports</h2>

        {loading && <p style={{ color: colors.textSecondary }}>Loading reports...</p>}
        {/* Display error specific to report fetching if needed */}
        {/* {error && <p className="text-red-600">{error}</p>} */} 

        {reports.length === 0 && !loading && (
          <p style={{ color: colors.textSecondary }}>No public reports found.</p>
        )}

        {reports.map((report) => (
          <div key={report.id} className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg" style={{ color: colors.primary }}>{report.location_details || "Unknown Location"}</h3>
                <span className="text-xs whitespace-nowrap" style={{ color: colors.textSecondary }}>
                  Reported: {report.reported_datetime}
                </span>
              </div>
              <p className="mb-3 text-sm" style={{ color: colors.textPrimary }}>{report.description}</p>
              <div className="text-xs flex flex-col sm:flex-row sm:flex-wrap gap-x-4 gap-y-1" style={{ color: colors.textSecondary }}>
                {report.incident_datetime !== "N/A" && <span>📅 Incident: {report.incident_datetime}</span>}
                {report.symptoms && report.symptoms.length > 0 && (
                  <span>
                    🤢 Symptoms: {report.symptoms.map(s => s.name).join(", ")}
                  </span>
                )}
                 {/* Add Tags display later if implemented */}
                 {/* {report.tags && report.tags.length > 0 && (
                  <span>
                    🏷️ Tags: {report.tags.map(t => t.name).join(", ")}
                  </span>
                )} */} 
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SubmitReport;

