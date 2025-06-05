import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api";

function SubmitReport() {
  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [availableSymptoms, setAvailableSymptoms] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  
  const [severity, setSeverity] = useState("medium");
  
  const [images, setImages] = useState([]);
  const [audio, setAudio] = useState(null);
  const [video, setVideo] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [loadingSymptoms, setLoadingSymptoms] = useState(true);
  const [commentText, setCommentText] = useState("");

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
    }, 300);
  
    return () => clearTimeout(debounceTimeout);
  }, [location]);
  
  useEffect(() => {
    const fetchSymptoms = async () => {
      setLoadingSymptoms(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/symptoms/`);
        setAvailableSymptoms(response.data || []);
        setLoadingSymptoms(false);
      } catch (err) {
        console.error("Error fetching symptoms:", err);
        setError("Failed to load symptoms. Please ensure the backend server is running.");
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
        setLoadingSymptoms(false);
      }
    };
    fetchSymptoms();
  }, []);

  useEffect(() => {
    fetchReports();
  }, []);

  const safeGetStringId = (id) => {
    if (id === undefined || id === null) return "unknown";
    return String(id);
  };

  const generateUserId = (id) => {
    if (!id) return "user-unknown";
    const stringId = safeGetStringId(id);
    return `user-${stringId.substring(0, Math.min(8, stringId.length))}`;
  };

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/reports/`);
      const formattedReports = (response.data.results || []).map(report => ({
        ...report,
        created_at: report.created_at ? new Date(report.created_at).toLocaleString() : "N/A",
        symptoms_display: report.symptoms_read?.map(s => s.name).join(", ") || "None",
        tags_display: report.tags_read?.map(t => t.name).join(", ") || "None",
        likes: Math.floor(Math.random() * 100),
        avatar_initial: (report.business_name || "A")[0].toUpperCase(),
        user_id: generateUserId(report.id),
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
      setReports([]);
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

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImages(prevImages => [...prevImages, ...files]);
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

  const handleRemoveMedia = () => {
    setMediaPreview(null);
  };

  const handleLike = (reportId) => {
    console.log(`Liked report ${reportId}`);
    setReports(reports.map(report => 
      report.id === reportId 
        ? {...report, likes: report.likes + 1, userLiked: true} 
        : report
    ));
  };

  const handleFollow = (reportId) => {
    console.log(`Following report ${reportId}`);
    setReports(reports.map(report => 
      report.id === reportId 
        ? {...report, userFollowing: !report.userFollowing} 
        : report
    ));
  };

  const handleCommentSubmit = (reportId, e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    console.log(`Comment on report ${reportId}: ${commentText}`);
    setCommentText("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSubmitSuccess(false);

    const formData = new FormData();
    formData.append('title', description.substring(0, 50) + (description.length > 50 ? "..." : ""));
    formData.append('description', description);
    formData.append('location', location);
    formData.append('business_name', businessName);
    formData.append('severity', severity);
    
    if (selectedCoordinates) {
      formData.append('latitude', selectedCoordinates.lat);
      formData.append('longitude', selectedCoordinates.lon);
    }
    
    selectedSymptoms.forEach(symptomId => {
      formData.append('symptoms', symptomId);
    });
    
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
      await axios.post(`${API_BASE_URL}/reports/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSubmitSuccess(true);
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
      fetchReports();
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      console.error("Error adding report:", err.response?.data || err.message);
      setError(`Failed to submit report. ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const TruncatedText = ({ text, maxLength = 150 }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    if (!text || text.length <= maxLength) return <p className="mb-3 text-base">{text || ""}</p>;
    return (
      <p className="mb-3 text-base">
        {isExpanded ? text : `${text.substring(0, maxLength)}...`}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[#F28C38] hover:underline ml-1 font-medium"
        >
          {isExpanded ? "See less" : "See more"}
        </button>
      </p>
    );
  };

  return (
    <div className="bg-[#FFFFFF] min-h-screen font-['Noto_Sans_JP']">
      <section className="bg-[#F3EDE1] min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="container mx-auto px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-8 space-y-6" style={{ height: '600px', overflowY: 'auto' }}>
            <h2 className="text-4xl font-bold text-[#1C2526] mb-8 font-['HIRO_MISAKE']">
              Report a Food Safety Issue
            </h2>
            {error && <p className="text-red-600 bg-red-100 p-4 rounded text-base">{error}</p>}
            {submitSuccess && <p className="text-green-700 bg-green-100 p-4 rounded text-base">Report submitted successfully!</p>}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[#1C2526] text-base font-medium mb-2">Symptoms Experienced</label>
                <div className="flex flex-wrap gap-2">
                  {loadingSymptoms ? (
                    <p className="text-[#1C2526] text-base">Loading symptoms...</p>
                  ) : availableSymptoms.length > 0 ? (
                    availableSymptoms.map((symptom) => (
                      <button
                        key={symptom.id}
                        type="button"
                        style={{
                          backgroundColor: selectedSymptoms.includes(symptom.id) ? "#F28C38" : "#F3EDE1",
                          color: selectedSymptoms.includes(symptom.id) ? "#FFFFFF" : "#1C2526",
                          borderColor: selectedSymptoms.includes(symptom.id) ? "#F28C38" : "#D1D5DB",
                        }}
                        className="px-3 py-1.5 rounded-full border text-base transition hover:bg-gray-100"
                        onClick={() => handleSymptomToggle(symptom.id)}
                      >
                        {symptom.name}
                      </button>
                    ))
                  ) : (
                    <p className="text-[#1C2526] text-base">No symptoms available. Please try refreshing.</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="businessName" className="block text-[#1C2526] text-base font-medium mb-2">Business Name</label>
                <input
                  id="businessName"
                  type="text"
                  placeholder="e.g., Red Robin Gourmet Burgers"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-[#F28C38] focus:outline-none focus:ring-2 focus:ring-[#F28C38] text-[#1C2526] text-base"
                  required
                />
              </div>

              <div className="relative">
                <label htmlFor="location" className="block text-[#1C2526] text-base font-medium mb-2">Location Details</label>
                <input
                  id="location"
                  type="text"
                  placeholder="e.g., Bloomington Street, Colorado Springs, CO, USA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-[#F28C38] focus:outline-none focus:ring-2 focus:ring-[#F28C38] text-[#1C2526] text-base"
                  required
                />
                {locationSuggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded mt-1 max-h-48 overflow-y-auto shadow-lg">
                    {locationSuggestions.map((suggestion) => (
                      <li
                        key={suggestion.place_id}
                        className="p-2 hover:bg-gray-100 cursor-pointer text-base"
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

              <div>
                <label htmlFor="severity" className="block text-[#1C2526] text-base font-medium mb-2">Severity Level</label>
                <div className="flex gap-3">
                  {["low", "medium", "high"].map((level) => (
                    <button
                      key={level}
                      type="button"
                      className="flex-1 py-2 rounded-md border transition-colors text-white font-medium text-base"
                      style={{
                        backgroundColor: severity === level ? "#F28C38" : "#F3EDE1",
                        color: severity === level ? "#FFFFFF" : "#1C2526",
                        borderColor: severity === level ? "#F28C38" : "#D1D5DB",
                      }}
                      onClick={() => setSeverity(level)}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-[#1C2526] text-base font-medium mb-2">What happened? Describe your situation.</label>
                <textarea
                  id="description"
                  placeholder="e.g., ate at the restaurant around 6:30ish 7 pm, got sick after eating..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-[#F28C38] h-24 focus:outline-none focus:ring-2 focus:ring-[#F28C38] text-[#1C2526] text-base"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="block text-[#1C2526] text-base font-medium mb-2">Add Media (Optional)</label>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-base font-medium text-[#1C2526] hover:bg-gray-50 cursor-pointer">
                    <span>📷 Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="sr-only"
                      multiple
                    />
                  </label>
                  <label className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-base font-medium text-[#1C2526] hover:bg-gray-50 cursor-pointer">
                    <span>🎤 Audio</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioUpload}
                      className="sr-only"
                    />
                  </label>
                  <label className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-base font-medium text-[#1C2526] hover:bg-gray-50 cursor-pointer">
                    <span>🎥 Video</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="sr-only"
                    />
                  </label>
                </div>
                {mediaPreview && (
                  <div className="mt-3 border rounded-md p-4 relative">
                    <button
                      type="button"
                      onClick={handleRemoveMedia}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-base"
                    >
                      ×
                    </button>
                    <p className="text-[#1C2526] text-base mb-2">{mediaPreview.name}</p>
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
                      <p className="mt-2 text-[#1C2526] text-base">
                        +{images.length - 1} more {images.length === 2 ? 'image' : 'images'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: loading ? "#4CAF50" : "#F28C38",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
                className="w-full text-white py-3 rounded-lg transition duration-150 ease-in-out disabled:opacity-50 text-base"
              >
                {loading ? "Submitting..." : "Report it Now"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-4xl font-bold text-[#1C2526] mb-8 font-['HIRO_MISAKE']">
              Recent Reports
            </h2>
            {loading && <p className="text-[#1C2526] text-base">Loading reports...</p>}
            {reports.length === 0 && !loading && (
              <p className="text-[#1C2526] text-base">No public reports found.</p>
            )}
            {reports.map((report) => (
              <div key={report.id || Math.random()} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-[#1C2526] font-bold text-xl">
                      {report.avatar_initial || "D"}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-[#1C2526]">
                        {report.business_name || "Unknown Business"}, {report.location?.split(',').slice(0, 2).join(',')}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(report.created_at).toLocaleString()} • reported by {report.user_id || "user-unknown"}
                        <span className="mx-1">•</span>
                        <button className="text-[#F28C38] hover:underline">details</button>
                      </p>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-4">
                    <TruncatedText text={report.description} />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {report.hashtags && report.hashtags.map((tag, index) => (
                        <span key={index} className="text-[#F28C38] hover:underline cursor-pointer text-base">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  {report.images && report.images.length > 0 && (
                    <div className="mt-4 rounded overflow-hidden">
                      <img 
                        src={report.images[0]} 
                        alt="Report image" 
                        className="w-full object-cover max-h-80"
                      />
                    </div>
                  )}
                  {report.audio && (
                    <div className="mt-4">
                      <audio controls className="w-full">
                        <source src={report.audio} />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                  {report.video && (
                    <div className="mt-4">
                      <video controls className="w-full max-h-80">
                        <source src={report.video} />
                        Your browser does not support the video element.
                      </video>
                    </div>
                  )}
                  {report.id && (
                    <div className="mt-4 flex items-center">
                      <div className="flex items-center justify-center bg-red-100 text-red-500 rounded-full h-7 w-7">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="ml-2 text-[#1C2526] text-base">{report.likes || 42}</span>
                    </div>
                  )}
                </div>
                {report.id && (
                  <>
                    <div className="border-t border-gray-200 flex divide-x">
                      <button 
                        onClick={() => handleLike(report.id)}
                        className={`flex-1 py-3 flex items-center justify-center gap-2 text-[#1C2526] hover:bg-gray-50 ${report.userLiked ? 'text-red-500' : ''} text-base`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={report.userLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>Helpful</span>
                      </button>
                      <button 
                        onClick={() => handleFollow(report.id)}
                        className={`flex-1 py-3 flex items-center justify-center gap-2 text-[#1C2526] hover:bg-gray-50 ${report.userFollowing ? 'text-[#F28C38]' : ''} text-base`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span>Follow</span>
                      </button>
                      <button className="flex-1 py-3 flex items-center justify-center gap-2 text-[#1C2526] hover:bg-gray-50 text-base">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add my report</span>
                      </button>
                      <button className="flex-1 py-3 flex items-center justify-center gap-2 text-[#1C2526] hover:bg-gray-50 text-base">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        <span>Share</span>
                      </button>
                    </div>
                    <div className="border-t border-gray-200 p-4 flex items-center">
                      <form onSubmit={(e) => handleCommentSubmit(report.id, e)} className="flex w-full">
                        <input
                          type="text"
                          placeholder="Comment"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="flex-1 border-0 focus:ring-0 text-[#1C2526] placeholder-gray-400 text-base"
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
      </section>
    </div>
  );
}

export default SubmitReport;