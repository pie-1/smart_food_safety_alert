import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

const iconColors = {
  high: "red",
  medium: "orange",
  low: "blue",
  default: "purple",
};

const createCustomIcon = (severity) => {
  return L.divIcon({
    className: "custom-icon",
    html: `<div style="background-color: ${iconColors[severity] || iconColors.default}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
  });
};

const MapPage = () => {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({ type: "all", severity: "all", radius: 5, source: "all" });
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (err) => {
        console.error("Geolocation error:", err);
        setUserLocation({ lat: 27.7172, lng: 85.324 });
      }
    );
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        let q = collection(db, "reports");
        const conditions = [];
        if (filters.type !== "all") conditions.push(where("type", "==", filters.type));
        if (filters.severity !== "all") conditions.push(where("severity", "==", filters.severity));
        if (conditions.length > 0) q = query(q, ...conditions);
        const snapshot = await getDocs(q);
        setReports(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching reports:", err);
        setReports([]);
      }
    };
    fetchReports();
  }, [filters]);

  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

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
        </div>

        <div className="lg:col-span-3">
          {userLocation && (
            <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={13} scrollWheelZoom className="h-[70vh] w-full rounded shadow">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              <Marker position={[userLocation.lat, userLocation.lng]} icon={L.divIcon({ className: "", html: `<div style='background:#3b82f6;width:12px;height:12px;border-radius:50%;border:2px solid white'></div>` })}>
                <Popup>You are here</Popup>
              </Marker>

              {reports.map((report) => {
                const { lat, lng } = report.location || {};
                if (!lat || !lng) return null;
                const distance = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, lat, lng);
                if (distance > filters.radius) return null;
                return (
                  <Marker
                    key={report.id}
                    position={[lat, lng]}
                    icon={createCustomIcon(report.severity)}
                  >
                    <Popup>
                      <strong>{report.vendor || "Vendor"}</strong><br />
                      {report.text}<br />
                      <span className="text-xs text-gray-500">{report.timestamp?.toDate().toLocaleString()}</span>
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
