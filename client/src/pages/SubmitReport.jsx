import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import img1 from '../assets/img1.jpg';
import img2 from '../assets/img2.jpg';
import img3 from '../assets/img3.jpg';

function SubmitReport() {
  const [vendor, setVendor] = useState("");
  const [text, setText] = useState("");
  const [type, setType] = useState("contamination");
  const [severity, setSeverity] = useState("medium");
  const [reports, setReports] = useState([]);
  const [location, setLocation] = useState(null);
  const [manualLocation, setManualLocation] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const symptoms = ["Nausea", "Diarrhea", "Vomiting", "Something else"];

  const defaultPosts = [
    {
      id: "default1",
      vendor: "City Cafe",
      text: "Several customers reported stomach aches after eating the chicken sandwich. Health department has been notified.",
      type: "illness",
      severity: "high",
      image: img1,
      timestamp: Timestamp.fromDate(new Date(Date.now() - 3600000))
    },
    {
      id: "default2",
      vendor: "Fresh Bites",
      text: "Customer found a foreign object in their salad. Manager offered replacement meal.",
      type: "contamination",
      severity: "medium",
      image: img2,
      timestamp: Timestamp.fromDate(new Date(Date.now() - 86400000))
    },
    {
      id: "default3",
      vendor: "Ocean Seafood",
      text: "Minor hygiene issue observed in kitchen area. Staff addressed it immediately.",
      type: "hygiene",
      severity: "low",
      image: img3,
      timestamp: Timestamp.fromDate(new Date(Date.now() - 172800000))
    }
  ];

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setReports(data);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setReports(defaultPosts);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const reportData = {
        vendor,
        text,
        type,
        severity,
        timestamp: Timestamp.now(),
        manualLocation,
      };

      if (location) {
        reportData.location = location;
      }

      await addDoc(collection(db, "reports"), reportData);
      alert("Report submitted successfully!");
      setVendor("");
      setText("");
      setManualLocation("");
      setLocation(null);
      setSuggestions([]);
      fetchReports();
    } catch (err) {
      console.error("Error adding report:", err);
      alert("Failed to submit report.");
    }
  };

  const handleLocationInput = async (value) => {
    setManualLocation(value);
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&addressdetails=1&limit=5`, {
        headers: {
          'User-Agent': 'FoodSafetyApp/1.0 (your@email.com)'
        }
      });
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.error("Nominatim fetch error:", err);
      setSuggestions([]);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    setManualLocation(suggestion.display_name);
    setLocation({ lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) });
    setSuggestions([]);
  };

  const displayPosts = reports.length > 0 ? reports : defaultPosts;

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
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

        <div className="relative">
          <input
            type="text"
            placeholder="City or Place Name"
            value={manualLocation}
            onChange={(e) => handleLocationInput(e.target.value)}
            className="w-full p-3 border rounded"
          />
          {suggestions.length > 0 && (
            <ul className="absolute z-10 bg-white border w-full max-h-40 overflow-y-auto mt-1 rounded shadow-md">
              {suggestions.map((s, index) => (
                <li
                  key={index}
                  onClick={() => handleSuggestionSelect(s)}
                  className="p-2 hover:bg-purple-100 cursor-pointer text-sm"
                >
                  {s.display_name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <textarea
          placeholder="What happened and when? Describe your situation."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-3 border rounded"
          required
        />

        <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-full p-3 border rounded">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <button
          onClick={handleSubmit}
          className="w-full bg-purple-600 text-white py-3 rounded hover:bg-purple-700 transition"
        >
          Report it Now
        </button>
      </div>

      <div className="col-span-2 space-y-6">
        <h2 className="text-2xl font-bold text-purple-800">Recent Reports</h2>

        {displayPosts.map((report) => (
          <div key={report.id} className="bg-white shadow-md rounded-lg overflow-hidden">
            {report.image && (
              <img src={report.image} alt="Report" className="w-full h-48 object-cover" />
            )}
            <div className="p-5">
              <div className="flex justify-between mb-2">
                <h3 className="font-semibold text-purple-700">{report.vendor}</h3>
                <span className="text-sm text-gray-500">
                  {report.timestamp?.toDate().toLocaleString()}
                </span>
              </div>
              <p className="mb-2 text-gray-700">{report.text}</p>
              <div className="text-sm text-gray-600 flex flex-wrap gap-4">
                <span>🗂️ Type: {report.type}</span>
                <span>⚠️ Severity: {report.severity}</span>
                {report.manualLocation && <span>📌 {report.manualLocation}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SubmitReport;
