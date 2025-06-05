import { useState, useEffect } from "react";
import axios from "axios"; // Using axios for API calls

// Define the base URL for the Django API (running locally)
const API_BASE_URL = "http://127.0.0.1:8000/api";

function SubmitReport() {
  const [businessName, setBusinessName] = useState(""); // Renamed from vendor
  const [location, setLocation] = useState(""); // Added location field
  const [description, setDescription] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState([]); // Stores symptom IDs
  const [availableSymptoms, setAvailableSymptoms] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null); // to use in alert map
  
  // Added severity selection
  const [severity, setSeverity] = useState("medium"); // Default to medium severity
  
  // Added media upload states
  const [images, setImages] = useState([]);
  const [audio, setAudio] = useState(null);
  const [video, setVideo] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [loadingSymptoms, setLoadingSymptoms] = useState(true); // Added explicit loading state
  const [commentText, setCommentText] = useState(""); // For comment input

  // Function to fetch location suggestions based on user input
  useEffect(() => {
    const fetchLocationSuggestions = async () => {
      if (location.length < 3) {
        setLocationSuggestions([]);
        return;
      }
  
      try {
        const response = await axios.get("https://nominatim.openstreetmap.org/search", {
          params: {
            q: location,
            format: "json",
            addressdetails: 1,
            limit: 5,
          },
        });
  
        setLocationSuggestions(response.data);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      }
    };
  
    const debounceTimeout = setTimeout(() => {
      fetchLocationSuggestions();
    }, 300); // debounce for smoother UX
  
    return () => clearTimeout(debounceTimeout);
  }, [location]);
  
  // Fetch available symptoms on component mount
  useEffect(() => {
    const fetchSymptoms = async () => {
      setLoadingSymptoms(true); // Set loading state to true when starting fetch
      try {
        // Use the correct local API endpoint
        const response = await axios.get(`${API_BASE_URL}/symptoms/`);
        setAvailableSymptoms(response.data || []);
        setLoadingSymptoms(false); // Set loading to false on successful fetch
      } catch (err) {
        console.error("Error fetching symptoms:", err);
        setError("Failed to load symptoms. Please ensure the backend server is running.");
        // Provide fallback symptoms if API fails
        setAvailableSymptoms([
          { id: 1, name: "Nausea" },
          { id: 2, name: "Diarrhea" },
          { id: 3, name: "Vomiting" },
          { id: 4, name: "Fever" },
          { id: 5, name: "Headache" },
          { id: 6, name: "Stomach cramps" },
          { id: 7, name: "Dizziness" },
          { id: 8, name: "Bloating" },
        ]);
        setLoadingSymptoms(false); // Set loading to false even on error, since we have fallbacks
      }
    };
    fetchSymptoms();
  }, []);

  // Fetch reports on component mount
  useEffect(() => {
    fetchReports();
  }, []);

  // Helper function to safely get a string ID
  const safeGetStringId = (id) => {
    if (id === undefined || id === null) return "unknown";
    return String(id);
  };

  // Helper function to generate a random user ID
  const generateUserId = (id) => {
    if (!id) return "user-unknown";
    const stringId = safeGetStringId(id);
    return `user-${stringId.substring(0, Math.min(8, stringId.length))}`;
  };

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the correct local API endpoint
      const response = await axios.get(`${API_BASE_URL}/reports/`);
      // Format timestamp for display (using created_at from the final model)
      const formattedReports = (response.data.results || []).map(report => ({
        ...report,
        created_at: report.created_at ? new Date(report.created_at).toLocaleString() : "N/A",
        // Use symptoms_read and tags_read provided by the serializer
        symptoms_display: report.symptoms_read?.map(s => s.name).join(", ") || "None",
        tags_display: report.tags_read?.map(t => t.name).join(", ") || "None",
        // Generate random likes count for demo
        likes: Math.floor(Math.random() * 100),
        // Generate user avatar initial
        avatar_initial: (report.business_name || "A")[0].toUpperCase(),
        // Generate user ID safely
        user_id: generateUserId(report.id),
        // Generate hashtags from location and business name
        hashtags: [
          report.business_name ? `#${report.business_name.toLowerCase().replace(/\s+/g, '')}` : null,
          report.location ? `#${report.location.split(',')[0].toLowerCase().replace(/\s+/g, '')}` : null,
          "#foodsafety"
        ].filter(Boolean)
      }));
      setReports(formattedReports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setError("Failed to load recent reports. Please ensure the backend server is running.");
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

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImages(prevImages => [...prevImages, ...files]);
      
      // Preview the first image
      const firstImage = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview({
          type: 'image',
          src: reader.result,
          name: firstImage.name
        });
      };
      reader.readAsDataURL(firstImage);
    }
  };

  // Handle audio upload
  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudio(file);
      setMediaPreview({
        type: 'audio',
        src: URL.createObjectURL(file),
        name: file.name
      });
    }
  };

  // Handle video upload
  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideo(file);
      setMediaPreview({
        type: 'video',
        src: URL.createObjectURL(file),
        name: file.name
      });
    }
  };

  // Remove media preview
  const handleRemoveMedia = () => {
    setMediaPreview(null);
    // Don't clear the actual files here, just the preview
  };

  // Handle like button click
  const handleLike = (reportId) => {
    // In a real app, you would send this to the backend
    console.log(`Liked report ${reportId}`);
    // For demo, just update the UI
    setReports(reports.map(report => 
      report.id === reportId 
        ? {...report, likes: report.likes + 1, userLiked: true} 
        : report
    ));
  };

  // Handle follow button click
  const handleFollow = (reportId) => {
    // In a real app, you would send this to the backend
    console.log(`Following report ${reportId}`);
    // For demo, just update the UI
    setReports(reports.map(report => 
      report.id === reportId 
        ? {...report, userFollowing: !report.userFollowing} 
        : report
    ));
  };

  // Handle comment submission
  const handleCommentSubmit = (reportId, e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    // In a real app, you would send this to the backend
    console.log(`Comment on report ${reportId}: ${commentText}`);
    // Clear the input
    setCommentText("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSubmitSuccess(false);

    // Create FormData for file uploads
    const formData = new FormData();
    formData.append('title', description.substring(0, 50) + (description.length > 50 ? "..." : ""));
    formData.append('description', description);
    formData.append('location', location);
    formData.append('business_name', businessName);
    formData.append('severity', severity);
    
    // Add coordinates if available
    if (selectedCoordinates) {
      formData.append('latitude', selectedCoordinates.lat);
      formData.append('longitude', selectedCoordinates.lon);
    }
    
    // Add symptoms
    selectedSymptoms.forEach(symptomId => {
      formData.append('symptoms', symptomId);
    });
    
    // Add media files
    images.forEach(image => {
      formData.append('images', image);
    });
    
    if (audio) {
      formData.append('audio', audio);
    }
    
    if (video) {
      formData.append('video', video);
    }

    try {
      // Use the correct local API endpoint
      await axios.post(`${API_BASE_URL}/reports/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSubmitSuccess(true);
      // Clear form
      setBusinessName("");
      setLocation("");
      setDescription("");
      setSelectedSymptoms([]);
      setSeverity("medium");
      setImages([]);
      setAudio(null);
      setVideo(null);
      setMediaPreview(null);
      setSelectedCoordinates(null);
      fetchReports(); // Refresh report list
      // Hide success message after a few seconds
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      console.error("Error adding report:", err.response?.data || err.message);
      setError(`Failed to submit report. ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
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

  // Severity color mapping
  const severityColors = {
    high: "#D32F2F", // Red
    medium: "#FF9800", // Orange
    low: "#1976D2", // Blue
  };

  // Function to truncate text with "See more" link
  const TruncatedText = ({ text, maxLength = 150 }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    if (!text || text.length <= maxLength) return <p className="mb-3 text-sm">{text || ""}</p>;
    
    return (
      <p className="mb-3 text-sm">
        {isExpanded ? text : `${text.substring(0, maxLength)}...`}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-purple-600 hover:text-purple-800 ml-1 font-medium"
        >
          {isExpanded ? "See less" : "See more"}
        </button>
      </p>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Report Submission Form */}
      <div className="lg:col-span-1 bg-white shadow rounded-lg p-6 space-y-6">
        <h2 className="text-2xl font-bold" style={{ color: colors.primary }}>Report a Food Safety Issue</h2>

        {error && <p className="text-red-600 bg-red-100 p-3 rounded text-sm">Error: {error}</p>}
        {submitSuccess && <p className="text-green-700 bg-green-100 p-3 rounded text-sm">Report submitted successfully!</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold mb-1" style={{ color: colors.textPrimary }}>Symptoms Experienced</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {loadingSymptoms ? (
                <p className="text-sm text-gray-500">Loading symptoms...</p>
              ) : availableSymptoms.length > 0 ? (
                availableSymptoms.map((symptom) => (
                  <button
                    key={symptom.id}
                    type="button"
                    // Use inline styles for dynamic background/text color based on selection
                    style={{
                      backgroundColor: selectedSymptoms.includes(symptom.id) ? colors.primary : colors.bg,
                      color: selectedSymptoms.includes(symptom.id) ? colors.bg : colors.textPrimary,
                      borderColor: selectedSymptoms.includes(symptom.id) ? colors.primary : "#D1D5DB", // gray-300
                    }}
                    className={`px-3 py-1.5 rounded-full border text-sm transition hover:bg-gray-100`}
                    onClick={() => handleSymptomToggle(symptom.id)}
                  >
                    {symptom.name}
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500">No symptoms available. Please try refreshing.</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="businessName" className="block font-semibold mb-1" style={{ color: colors.textPrimary }}>Where? (Business Name)</label>
            <input
              id="businessName"
              type="text"
              placeholder="e.g., Red Robin Gourmet Burgers"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full p-3 border rounded focus:ring-1 focus:ring-green-700 focus:border-green-700"
              required
            />
          </div>

          <div className="relative">
            <label
              htmlFor="location"
              className="block font-semibold mb-1"
              style={{ color: colors.textPrimary }}
            >
              Location Details
            </label>
            <input
              id="location"
              type="text"
              placeholder="e.g., Bloomington Street, Colorado Springs, CO, USA"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-3 border rounded focus:ring-1 focus:ring-green-700 focus:border-green-700"
              required
            />
            
            {locationSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded mt-1 max-h-48 overflow-y-auto shadow-lg">
                {locationSuggestions.map((suggestion) => (
                  <li
                    key={suggestion.place_id}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setLocation(suggestion.display_name);
                      setLocationSuggestions([]);
                      setSelectedCoordinates({
                        lat: parseFloat(suggestion.lat),
                        lon: parseFloat(suggestion.lon),
                      });
                    }}
                  >
                    {suggestion.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Added Severity Selection */}
          <div>
            <label htmlFor="severity" className="block font-semibold mb-1" style={{ color: colors.textPrimary }}>
              Severity Level
            </label>
            <div className="flex gap-3">
              {["low", "medium", "high"].map((level) => (
                <button
                  key={level}
                  type="button"
                  className={`flex-1 py-2 rounded-md border transition-colors text-white font-medium`}
                  style={{
                    backgroundColor: severity === level ? severityColors[level] : "#e5e7eb",
                    color: severity === level ? "white" : "#4b5563",
                    borderColor: severity === level ? severityColors[level] : "#e5e7eb",
                  }}
                  onClick={() => setSeverity(level)}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block font-semibold mb-1" style={{ color: colors.textPrimary }}>What happened? Describe your situation.</label>
            <textarea
              id="description"
              placeholder="e.g., ate at the restaurant around 6:30ish 7 pm, got sick after eating..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border rounded h-24 focus:ring-1 focus:ring-green-700 focus:border-green-700"
              required
            />
          </div>

          {/* Media Upload Section */}
          <div className="space-y-3">
            <label className="block font-semibold mb-1" style={{ color: colors.textPrimary }}>
              Add Media (Optional)
            </label>
            
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                <span>📷 Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="sr-only"
                  multiple
                />
              </label>
              
              <label className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                <span>🎤 Audio</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="sr-only"
                />
              </label>
              
              <label className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                <span>🎥 Video</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="sr-only"
                />
              </label>
            </div>
            
            {/* Media Preview */}
            {mediaPreview && (
              <div className="mt-3 border rounded-md p-3 relative">
                <button
                  type="button"
                  onClick={handleRemoveMedia}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                >
                  ×
                </button>
                
                <p className="text-sm text-gray-500 mb-2">{mediaPreview.name}</p>
                
                {mediaPreview.type === 'image' && (
                  <img src={mediaPreview.src} alt="Preview" className="max-h-40 rounded" />
                )}
                
                {mediaPreview.type === 'audio' && (
                  <audio controls className="w-full">
                    <source src={mediaPreview.src} />
                    Your browser does not support the audio element.
                  </audio>
                )}
                
                {mediaPreview.type === 'video' && (
                  <video controls className="max-h-40 w-full">
                    <source src={mediaPreview.src} />
                    Your browser does not support the video element.
                  </video>
                )}
                
                {images.length > 1 && (
                  <p className="mt-2 text-sm text-gray-500">
                    +{images.length - 1} more {images.length === 2 ? 'image' : 'images'}
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            // Use inline styles for dynamic background color
            style={{
              backgroundColor: loading ? colors.accent : colors.primary,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            className="w-full text-white py-3 rounded transition duration-150 ease-in-out disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Report it Now"}
          </button>
        </form>
      </div>

      {/* Recent Reports Feed - Updated to match screenshot */}
      <div className="lg:col-span-2 space-y-6">
        <h2 className="text-2xl font-bold" style={{ color: colors.primary }}>Recent Reports</h2>

        {loading && <p style={{ color: colors.textSecondary }}>Loading reports...</p>}

        {reports.length === 0 && !loading && (
          <p style={{ color: colors.textSecondary }}>No public reports found.</p>
        )}

        {reports.map((report) => (
          <div key={report.id || Math.random()} className="bg-white shadow-md rounded-lg overflow-hidden">
            {/* Report Header */}
            <div className="p-5">
              <div className="flex items-start gap-3">
                {/* Avatar Circle */}
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold text-xl">
                  {report.avatar_initial || "D"}
                </div>
                
                <div className="flex-1">
                  {/* Business Name and Location */}
                  <h3 className="font-bold text-lg text-gray-800">
                    {report.business_name || "Unknown Business"}, {report.location?.split(',').slice(0, 2).join(',')}
                  </h3>
                  
                  {/* Timestamp and User */}
                  <p className="text-sm text-gray-500">
                    {new Date(report.created_at).toRelative || "1 day ago"} • reported by {report.user_id || "user-unknown"}
                    <span className="mx-1">•</span>
                    <button className="text-purple-600 hover:underline">details</button>
                  </p>
                </div>
                
                {/* Options Menu */}
                <button className="text-gray-400 hover:text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
              
              {/* Report Content */}
              <div className="mt-3">
                <TruncatedText text={report.description} />
                
                {/* Hashtags */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {report.hashtags && report.hashtags.map((tag, index) => (
                    <span key={index} className="text-purple-600 hover:underline cursor-pointer text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Media Content */}
              {report.images && report.images.length > 0 && (
                <div className="mt-3 rounded overflow-hidden">
                  <img 
                    src={report.images[0]} 
                    alt="Report image" 
                    className="w-full object-cover max-h-80"
                  />
                </div>
              )}
              
              {report.audio && (
                <div className="mt-3">
                  <audio controls className="w-full">
                    <source src={report.audio} />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
              
              {report.video && (
                <div className="mt-3">
                  <video controls className="w-full max-h-80">
                    <source src={report.video} />
                    Your browser does not support the video element.
                  </video>
                </div>
              )}
              
              {/* Like Counter - Only show for existing reports */}
              {report.id && (
                <div className="mt-3 flex items-center">
                  <div className="flex items-center justify-center bg-red-100 text-red-500 rounded-full h-7 w-7">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="ml-2 text-gray-600">{report.likes || 42}</span>
                </div>
              )}
            </div>
            
            {/* Action Buttons - Only show for existing reports */}
            {report.id && (
              <>
                <div className="border-t border-gray-100 flex divide-x">
                  <button 
                    onClick={() => handleLike(report.id)}
                    className={`flex-1 py-3 flex items-center justify-center gap-2 text-gray-500 hover:bg-gray-50 ${report.userLiked ? 'text-red-500' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={report.userLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>Helpful</span>
                  </button>
                  
                  <button 
                    onClick={() => handleFollow(report.id)}
                    className={`flex-1 py-3 flex items-center justify-center gap-2 text-gray-500 hover:bg-gray-50 ${report.userFollowing ? 'text-purple-600' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span>Follow</span>
                  </button>
                  
                  <button className="flex-1 py-3 flex items-center justify-center gap-2 text-gray-500 hover:bg-gray-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add my report</span>
                  </button>
                  
                  <button className="flex-1 py-3 flex items-center justify-center gap-2 text-gray-500 hover:bg-gray-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span>Share</span>
                  </button>
                </div>
                
                {/* Comment Section */}
                <div className="border-t border-gray-100 p-3 flex items-center">
                  <form onSubmit={(e) => handleCommentSubmit(report.id, e)} className="flex w-full">
                    <input
                      type="text"
                      placeholder="Comment"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 border-0 focus:ring-0 text-gray-600 placeholder-gray-400"
                    />
                    <button type="submit" className="text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SubmitReport;
