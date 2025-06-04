import { useState, useEffect, useRef } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

const MapPage = () => {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({
    type: "all",
    severity: "all",
    radius: 5,
    source: "all" // Added source filter
  });
  const [userLocation, setUserLocation] = useState(null);
  const [galliPlaces, setGalliPlaces] = useState([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  // Load Galli Maps script dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://gallimaps.com/dist/gallimaps.vector.min.latest.js';
    script.onload = () => {
      window.GalliMap.accessToken = "984a7cb9-efda-4a61-afe9-8865ba539321";
      setIsMapLoaded(true);
    };
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Initialize map when script is loaded
  useEffect(() => {
    if (!isMapLoaded) return;

    const defaultCenter = userLocation ? [userLocation.lng, userLocation.lat] : [85.324, 27.7172];
    
    mapInstance.current = new window.GalliMap.Map({
      container: mapRef.current,
      style: 'https://map.gallimaps.com/style.json',
      center: defaultCenter,
      zoom: 12,
      attributionControl: false
    });

    // Add Galli Maps attribution
    mapInstance.current.addControl(
      new window.GalliMap.AttributionControl({
        compact: true
      }),
      'bottom-right'
    );

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(pos);
          mapInstance.current.flyTo({
            center: [pos.lng, pos.lat],
            essential: true
          });
          
          // Add user location marker
          new window.GalliMap.Marker({
            color: "#3b82f6"
          })
            .setLngLat([pos.lng, pos.lat])
            .addTo(mapInstance.current);
        },
        () => console.log("Geolocation permission denied")
      );
    }

    // Fetch Galli places data
    fetchGalliPlaces();

    return () => {
      if (mapInstance.current) mapInstance.current.remove();
    };
  }, [isMapLoaded]);

  // Fetch GalliMaps places data
  const fetchGalliPlaces = async () => {
    try {
      const response = await fetch('https://api.gallimaps.com/v1/places', {
        headers: {
          'Authorization': 'Bearer 984a7cb9-efda-4a61-afe9-8865ba539321'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch Galli places');
      
      const data = await response.json();
      setGalliPlaces(data.features || []);
    } catch (error) {
      console.error("Error fetching Galli places:", error);
    }
  };

  // Fetch reports from Firestore
  useEffect(() => {
    const fetchReports = async () => {
      let q = collection(db, "reports");
      if (filters.type !== "all") q = query(q, where("type", "==", filters.type));
      if (filters.severity !== "all") q = query(q, where("severity", "==", filters.severity));
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setReports(data);
    };
    
    fetchReports();
  }, [filters.type, filters.severity]);

  // Update markers on map
  useEffect(() => {
    if (!mapInstance.current || !isMapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add user reports markers
    if (filters.source === "all" || filters.source === "reports") {
      reports.forEach((report) => {
        if (!report.location) return;
        
        const { lat, lng } = report.location;
        const distance = userLocation
          ? getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, lat, lng)
          : 0;

        if (userLocation && distance > filters.radius) return;

        const el = document.createElement("div");
        el.className = `marker ${getSeverityColor(report.severity)} rounded-full w-4 h-4 border-2 border-white`;

        const popup = new window.GalliMap.Popup({ offset: 25 })
          .setHTML(`
            <div class="p-2 max-w-xs">
              <h3 class="font-bold text-purple-800">${report.vendor}</h3>
              <div class="flex gap-2 text-sm mb-1">
                <span class="px-2 py-1 rounded ${getSeverityBadgeColor(report.severity)}">
                  ${report.severity}
                </span>
                <span class="px-2 py-1 rounded bg-gray-100">${report.type}</span>
              </div>
              <p class="text-gray-700 text-sm">${report.text}</p>
              <p class="text-gray-500 text-xs mt-2">
                ${report.timestamp?.toDate().toLocaleString()}
              </p>
            </div>
          `);

        const marker = new window.GalliMap.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(mapInstance.current);

        markersRef.current.push(marker);
      });
    }

    // Add Galli places markers
    if (filters.source === "all" || filters.source === "galli") {
      galliPlaces.forEach((place) => {
        const [lng, lat] = place.geometry.coordinates;
        const distance = userLocation
          ? getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, lat, lng)
          : 0;

        if (userLocation && distance > filters.radius) return;

        const el = document.createElement("div");
        el.className = "marker bg-green-500 rounded-full w-4 h-4 border-2 border-white";

        const popup = new window.GalliMap.Popup({ offset: 25 })
          .setHTML(`
            <div class="p-2 max-w-xs">
              <h3 class="font-bold text-green-800">${place.properties.name}</h3>
              <p class="text-gray-700 text-sm">Verified food establishment</p>
              ${place.properties.address ? `
                <p class="text-gray-500 text-sm mt-1">
                  <i class="fas fa-map-marker-alt mr-1"></i>
                  ${place.properties.address}
                </p>
              ` : ''}
              <div class="mt-2 text-xs text-gray-400">
                <i class="fas fa-check-circle text-green-500 mr-1"></i>
                GalliMaps Verified
              </div>
            </div>
          `);

        const marker = new window.GalliMap.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(mapInstance.current);

        markersRef.current.push(marker);
      });
    }
  }, [reports, galliPlaces, filters, userLocation, isMapLoaded]);

  // Helper functions
  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const deg2rad = (deg) => deg * (Math.PI / 180);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-purple-500';
    }
  };

  const getSeverityBadgeColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-purple-100 text-purple-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-bold text-purple-800">Filter Reports</h2>

          <div>
            <label className="block mb-1 font-medium text-gray-700">Data Source</label>
            <select
              value={filters.source}
              onChange={(e) => setFilters({...filters, source: e.target.value})}
              className="w-full p-2 border rounded"
            >
              <option value="all">All Sources</option>
              <option value="reports">User Reports</option>
              <option value="galli">GalliMaps Verified</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">Report Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="w-full p-2 border rounded"
              disabled={filters.source === "galli"}
            >
              <option value="all">All Types</option>
              <option value="contamination">Contamination</option>
              <option value="illness">Foodborne Illness</option>
              <option value="hygiene">Poor Hygiene</option>
              <option value="raid">Regulatory Raid</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">Severity</label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({...filters, severity: e.target.value})}
              className="w-full p-2 border rounded"
              disabled={filters.source === "galli"}
            >
              <option value="all">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {userLocation && (
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Radius: {filters.radius} km
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={filters.radius}
                onChange={(e) => setFilters({...filters, radius: parseInt(e.target.value)})}
                className="w-full"
              />
            </div>
          )}

          <div className="pt-4 space-y-2">
            <div className="flex items-center text-sm">
              <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
              <span>User Reports</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              <span>Verified Places</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              <span>Your Location</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {!isMapLoaded ? (
              <div className="h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading map...</p>
                </div>
              </div>
            ) : (
              <div ref={mapRef} style={{ height: "600px", width: "100%" }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;