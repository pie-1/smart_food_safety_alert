import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";

function SubmitReport() {
  const [vendor, setVendor] = useState("");
  const [text, setText] = useState("");
  const [type, setType] = useState("contamination");
  const [severity, setSeverity] = useState("medium");
  const [reports, setReports] = useState([]);

  const symptoms = ["Nausea", "Diarrhea", "Vomiting", "Something else"];

  // Default posts that will show if no reports exist
  const defaultPosts = [
    {
      id: "default1",
      vendor: "City Cafe",
      text: "Several customers reported stomach aches after eating the chicken sandwich. Health department has been notified.",
      type: "illness",
      severity: "high",
      timestamp: Timestamp.fromDate(new Date(Date.now() - 3600000)) // 1 hour ago
    },
    {
      id: "default2",
      vendor: "Fresh Bites",
      text: "Customer found a foreign object in their salad. Manager offered replacement meal.",
      type: "contamination",
      severity: "medium",
      timestamp: Timestamp.fromDate(new Date(Date.now() - 86400000)) // 1 day ago
    },
    {
      id: "default3",
      vendor: "Ocean Seafood",
      text: "Minor hygiene issue observed in kitchen area. Staff addressed it immediately.",
      type: "hygiene",
      severity: "low",
      timestamp: Timestamp.fromDate(new Date(Date.now() - 172800000)) // 2 days ago
    }
  ];

  // Submit report handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, "reports"), {
        vendor,
        text,
        type,
        severity,
        timestamp: Timestamp.now(),
      });
      alert("Report submitted successfully!");
      setVendor("");
      setText("");
      fetchReports();
    } catch (err) {
      console.error("Error adding report:", err);
      alert("Failed to submit report.");
    }
  };

  // Fetch reports from Firestore
  const fetchReports = async () => {
    try {
      const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setReports(data);
    } catch (error) {
      console.error("Error fetching reports:", error);
      // If there's an error, show default posts
      setReports(defaultPosts);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Combine actual reports with default posts if there are no reports
  const displayPosts = reports.length > 0 ? reports : defaultPosts;

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Report Form Section - Unchanged */}
      <div className="col-span-1 bg-white shadow rounded-lg p-6 space-y-6">
        <h2 className="text-2xl font-bold text-purple-800">Report a Food Safety Issue</h2>

        <div className="space-y-2">
          <label className="block font-semibold text-gray-700">I am reporting</label>
          <div className="flex flex-wrap gap-2">
            {symptoms.map((symptom) => (
              <button
                key={symptom}
                type="button"
                className={`px-4 py-2 rounded-full border ${type === symptom.toLowerCase() ? "bg-purple-600 text-white" : "bg-white text-gray-700"}`}
                onClick={() => setType(symptom.toLowerCase())}
              >
                {symptom}
              </button>
            ))}
          </div>
        </div>

        <input
          type="text"
          placeholder="Where? e.g. Moe's Tavern"
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
          className="w-full p-3 border rounded"
          required
        />
        <textarea
          placeholder="What happened and when? Describe your situation."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-3 border rounded"
          required
        />
        <div className="flex flex-col sm:flex-row gap-4">
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="flex-1 p-3 border rounded">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <button
          onClick={handleSubmit}
          className="w-full bg-purple-600 text-white py-3 rounded hover:bg-purple-700 transition"
        >
          Report it Now
        </button>
      </div>

      {/* Recent Reports Feed Section - Now shows default posts if no reports exist */}
      <div className="col-span-2 space-y-6">
        <h2 className="text-2xl font-bold text-purple-800">Recent Reports</h2>
        {displayPosts.map((report) => (
          <div key={report.id} className="bg-white shadow-md rounded-lg p-5">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold text-purple-700">{report.vendor}</h3>
              <span className="text-sm text-gray-500">
                {report.timestamp?.toDate().toLocaleString()}
              </span>
            </div>
            <p className="mb-2 text-gray-700">{report.text}</p>
            <div className="text-sm text-gray-600 flex gap-4">
              <span>🗂️ Type: {report.type}</span>
              <span>⚠️ Severity: {report.severity}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SubmitReport;