import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import SubmitReport from "./pages/SubmitReport";
import MapPage from "./pages/MapPage.jsx";
import VendorProfile from "./pages/VendorProfile";
import Alert from "./pages/alert.jsx";



function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/report" element={<SubmitReport />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/vendor/:vendorId" element={<VendorProfile />} />
          <Route path="/alert" element={<Alert />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
