import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import axios from "axios";

// Define the base URL for the Django API (running locally)
const API_BASE_URL = "http://127.0.0.1:8000/api";

// Custom marker icon for severity levels with improved styling
const createCustomIcon = (severity) => {
  const color = severity === 'high' ? '#D32F2F' : 
                severity === 'medium' ? '#FF9800' : 
                severity === 'low' ? '#1976D2' : '#9C27B0';
  
  return L.divIcon({
    className: "custom-icon",
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="14" height="14">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24]
  });
};

// Component to auto-center map when selectedCoordinates changes
const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 13, {
        animate: true,
      });
    }
  }, [lat, lng, map]);
  return null;
};

const MapPage = () => {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({ type: "all", severity: "all", radius: 5, source: "all" });
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [geocodingQueue, setGeocodingQueue] = useState([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  // This will hold the selected location coordinates from your location input/autocomplete
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);

  // Add this function to geocode locations without coordinates
  const geocodeLocation = async (locationText, reportId) => {
    if (!locationText) return;
    
    try {
      const response = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: {
          q: locationText,
          format: "json",
          limit: 1,
        }
      });
      
      if (response.data && response.data.length > 0) {
        const { lat, lon } = response.data[0];
        // Update the report with coordinates
        setReports(prevReports => 
          prevReports.map(report => 
            report.id === reportId 
              ? {
                  ...report, 
                  location: { 
                    lat: parseFloat(lat), 
                    lng: parseFloat(lon) 
                  }
                }
              : report
          )
        );
        console.log(`Geocoded location for report ${reportId}: ${lat}, ${lon}`);
      } else {
        console.warn(`No geocoding results for location: ${locationText}`);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  };

  // Process geocoding queue with rate limiting
  useEffect(() => {
    const processQueue = async () => {
      if (geocodingQueue.length === 0 || isGeocoding) return;
      
      setIsGeocoding(true);
      const item = geocodingQueue[0];
      
      await geocodeLocation(item.location, item.id);
      
      // Remove the processed item from queue
      setGeocodingQueue(prev => prev.slice(1));
      
      // Add delay to respect Nominatim usage policy (1 request per second)
      setTimeout(() => {
        setIsGeocoding(false);
      }, 1100);
    };
    
    processQueue();
  }, [geocodingQueue, isGeocoding]);

  useEffect(() => {
    // Get user location or fallback
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (err) => {
        console.error("Geolocation error:", err);
        // Fallback to North America view
        setUserLocation({ lat: 39.8283, lng: -98.5795 });
      }
    );
  }, []);

  useEffect(() => {
    // Fetch reports from API with filters
    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // First try to fetch from Django API
        const response = await axios.get(`${API_BASE_URL}/reports/`, {
          params: {
            severity: filters.severity !== 'all' ? filters.severity : undefined,
            type: filters.type !== 'all' ? filters.type : undefined,
          }
        });
        
        // Transform API response to match expected format
        const apiReports = (response.data.results || []).map(report => ({
          id: report.id,
          business_name: report.business_name,
          location: {
            lat: report.latitude || null,
            lng: report.longitude || null,
          },
          text: report.description,
          severity: report.severity || 'medium',
          timestamp: new Date(report.created_at),
          // Include media if available
          images: report.images || [],
          audio: report.audio || null,
          video: report.video || null,
          symptoms: report.symptoms_read || [],
          // Generate user info for display
          user: `user-${String(report.id).substring(0, 8)}`,
          // Store original location text
          locationDisplay: report.location
        }));
        
        setReports(apiReports);
        
        // Queue reports that need geocoding
        const geocodingNeeded = apiReports.filter(report => 
          (!report.location?.lat || !report.location?.lng) && report.locationDisplay
        );
        
        if (geocodingNeeded.length > 0) {
          console.log(`Queueing ${geocodingNeeded.length} reports for geocoding`);
          setGeocodingQueue(geocodingNeeded.map(report => ({
            id: report.id,
            location: report.locationDisplay
          })));
        }
      } catch (apiErr) {
        console.error("Error fetching reports from API:", apiErr);
        
        // Fallback to Firebase if API fails
        try {
          let q = collection(db, "reports");
          const conditions = [];
          if (filters.type !== "all") conditions.push(where("type", "==", filters.type));
          if (filters.severity !== "all") conditions.push(where("severity", "==", filters.severity));
          if (conditions.length > 0) q = query(q, ...conditions);
          const snapshot = await getDocs(q);
          
          // Generate demo data for map display
          const demoReports = snapshot.docs.map((doc) => {
            const data = doc.data();
            return { 
              id: doc.id, 
              ...data,
              // Generate random coordinates across North America if not provided
              location: data.location || {
                lat: 35 + Math.random() * 15,
                lng: -120 + Math.random() * 40
              },
              // Generate severity if not provided
              severity: data.severity || ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
              // Generate timestamp if not provided
              timestamp: data.timestamp || new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
              // Generate user info for display
              user: `user-${String(doc.id).substring(0, 8)}`,
              // Generate symptoms if not provided
              symptoms: data.symptoms || []
            };
          });
          
          setReports(demoReports);
        } catch (fbErr) {
          console.error("Error fetching reports from Firebase:", fbErr);
          setError("Failed to load reports. Please try again later.");
          setReports([]);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchReports();
  }, [filters]);

  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  // Generate relative time string for display
  const getRelativeTime = (date) => {
    if (!date) return "Unknown time";
    
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return '1 day ago';
    } else if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Count reports with valid coordinates
  const reportsWithCoordinates = reports.filter(report => 
    report.location?.lat && report.location?.lng
  ).length;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <h2 className="text-xl font-bold mb-4 text-purple-700">Live Food Safety Alert Map</h2>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-semibold">Filters</h3>
          <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="w-full p-2 border rounded">
            <option value="all">All Types</option>
            <option value="illness">Illness</option>
            <option value="contamination">Contamination</option>
            <option value="hygiene">Hygiene</option>
            <option value="raid">Raid</option>
          </select>
          <select value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })} className="w-full p-2 border rounded">
            <option value="all">All Severity</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          {userLocation && (
            <div>
              <label className="block text-sm font-medium mb-1">Radius: {filters.radius} km</label>
              <input type="range" min="1" max="20" step="1" value={filters.radius} onChange={(e) => setFilters({ ...filters, radius: parseInt(e.target.value) })} className="w-full" />
            </div>
          )}
          
          {loading && <p className="text-sm text-gray-500">Loading reports...</p>}
          {geocodingQueue.length > 0 && <p className="text-sm text-blue-500">Geocoding locations: {geocodingQueue.length} remaining...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          
          <div className="text-sm text-gray-600">
            Showing {reportsWithCoordinates} of {reports.length} reports on map
          </div>
        </div>

        <div className="lg:col-span-3">
          {userLocation && (
            <MapContainer
              center={[userLocation.lat, userLocation.lng]}
              zoom={4}
              scrollWheelZoom
              className="h-[70vh] w-full rounded shadow"
              zoomControl={false}
            >
              <ZoomControl position="bottomright" />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {/* Recenter map when selectedCoordinates changes */}
              {selectedCoordinates && <RecenterMap lat={selectedCoordinates.lat} lng={selectedCoordinates.lng} />}

              {/* Current User Location */}
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={L.divIcon({
                  className: "",
                  html: `<div style='background:#3b82f6;width:12px;height:12px;border-radius:50%;border:2px solid white'></div>`,
                })}
              >
                <Popup>You are here</Popup>
              </Marker>

              {/* Custom Selected Location */}
              {selectedCoordinates && (
                <Marker
                  position={[selectedCoordinates.lat, selectedCoordinates.lng]}
                  icon={L.divIcon({
                    className: "",
                    html: `<div style='background:#10b981;width:14px;height:14px;border-radius:50%;border:2px solid white'></div>`,
                  })}
                >
                  <Popup>Selected Location</Popup>
                </Marker>
              )}

              {/* Report Markers */}
              {reports.map((report) => {
                const { lat, lng } = report.location || {};
                if (!lat || !lng) return null;
                
                // Filter by distance if user location is available
                if (userLocation) {
                  const distance = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, lat, lng);
                  if (distance > filters.radius) return null;
                }
                
                return (
                  <Marker key={report.id} position={[lat, lng]} icon={createCustomIcon(report.severity)}>
                    <Popup>
                      <div className="popup-content" style={{ minWidth: '250px', maxWidth: '300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                          <div style={{ 
                            width: '30px', 
                            height: '30px', 
                            borderRadius: '50%', 
                            backgroundColor: '#e0e0e0', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            marginRight: '10px', 
                            fontWeight: 'bold' 
                          }}>
                            {report.business_name?.[0]?.toUpperCase() || 'D'}
                          </div>
                          <div>
                            <h3 style={{ fontWeight: 'bold', margin: 0, fontSize: '16px' }}>
                              {report.business_name}, {report.locationDisplay?.split(',').slice(0, 2).join(',') || 'Unknown Location'}
                            </h3>
                            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                              {getRelativeTime(report.timestamp)} • reported by {report.user || `user-unknown`} • 
                              <a href="#" style={{ color: '#9c27b0', textDecoration: 'none', marginLeft: '3px' }}>details</a>
                            </p>
                          </div>
                        </div>
                        
                        <div style={{ margin: '10px 0' }}>
                          <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
                            <strong>Suspected food poisoning. Symptoms:</strong> {report.symptoms?.map(s => s.name).join(', ') || 'Diarrhea, Nausea, Vomiting, Stomach Pain'}
                          </p>
                          <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
                            <strong>Suspected source:</strong> {report.business_name} {report.locationDisplay ? `on ${report.locationDisplay.split(',')[0]}` : ''}
                          </p>
                          <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
                            <strong>Onset:</strong> 4 to 12 hours
                          </p>
                          <p style={{ margin: '0', fontSize: '14px' }}>
                            <strong>Duration:</strong> 12 to 24 hours
                          </p>
                        </div>
                        
                        {report.images && report.images.length > 0 && (
                          <div style={{ marginTop: '10px' }}>
                            <img 
                              src={report.images[0]} 
                              alt="Report image" 
                              style={{ width: '100%', borderRadius: '4px', maxHeight: '150px', objectFit: 'cover' }}
                            />
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapPage;
