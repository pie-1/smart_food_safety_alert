import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = "http://127.0.0.1:8000/api";

const Home = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
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
          user_id: `user-${report.id || 'unknown'}`.substring(0, 14),
          hashtags: [
            report.business_name ? `#${report.business_name.toLowerCase().replace(/\s+/g, '')}` : null,
            report.location ? `#${report.location.split(',')[0].toLowerCase().replace(/\s+/g, '')}` : null,
            "#foodsafety"
          ].filter(Boolean)
        }));
        setReports(formattedReports);
      } catch (error) {
        console.error("Error fetching reports:", error);
        setError("Failed to load recent reports.");
        setReports([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const TruncatedText = ({ text, maxLength = 150 }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    if (!text || text.length <= maxLength) return <p className="text-[#1C2526] text-base">{text || ""}</p>;
    return (
      <p className="text-[#1C2526] text-base">
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

  const stats = {
    totalIncidents: reports.length,
    districtsCovered: [...new Set(reports.map(report => report.location?.split(',')[0]))].length,
    verifiedReports: reports.filter(report => report.severity === 'high').length,
    mostCommonIssues: ["Contamination", "Hygiene", "Expired Ingredients"]
  };

  return (
    <div className="bg-[#FFFFFF] min-h-screen font-['Noto_Sans_JP']">
      {/* Hero Section */}
      <section className="bg-[#F3EDE1] min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="container mx-auto px-8 text-center">
          <h1 className="text-5xl font-bold text-[#1C2526] mb-6 leading-tight font-['HIRO_MISAKE']">
            BhojanGuard
          </h1>
          <p className="text-lg text-[#1C2526] max-w-2xl mx-auto mb-8 leading-relaxed">
            An AI-powered platform to detect, report, and visualize food safety incidents across Nepal. Protect your community by sharing and tracking unsafe food vendors.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              to="/report"
              className="bg-[#F28C38] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#e07b30] transition-colors shadow-md text-base"
            >
              Report an Incident
            </Link>
            <Link
              to="/alerts"
              className="bg-[#F3EDE1] text-[#1C2526] px-6 py-3 rounded-lg font-semibold border-2 border-[#F28C38] hover:bg-[#e7d9c4] transition-colors shadow-md text-base"
            >
              View Local Alerts
            </Link>
            <Link
              to="/map"
              className="bg-[#F28C38] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#e07b30] transition-colors shadow-md text-base"
            >
              View Alert Map
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Food Safety Alerts (Top 3 Reports) */}
      <section className="bg-[#F3EDE1] py-6 flex items-center justify-center">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-[#1C2526] mb-4 text-center font-['HIRO_MISAKE']">
            Recent Food Safety Alerts
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <p className="text-[#1C2526] text-center col-span-3 text-base">Loading reports...</p>
            ) : error ? (
              <p className="text-red-600 text-center col-span-3 text-base">{error}</p>
            ) : reports.length === 0 ? (
              <p className="text-[#1C2526] text-center col-span-3 text-base">No recent reports found.</p>
            ) : (
              reports.slice(0, 3).map(report => (
                <div key={report.id || Math.random()} className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-[#1C2526]">
                      {report.business_name || "Unknown Business"}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {new Date(report.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[#1C2526] mb-1 text-base">
                    Issue: {report.symptoms_display || "Unknown Issue"}
                  </p>
                  <p className="text-sm text-gray-500 mb-2">
                    Location: {report.location || "Unknown Location"}
                  </p>
                  <TruncatedText text={report.description} maxLength={100} />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {report.hashtags.map((tag, index) => (
                      <span key={index} className="text-[#F28C38] text-sm bg-[#F3EDE1] px-2 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-[#F3EDE1] py-12 flex items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-[#1C2526] mb-4 font-['HIRO_MISAKE']">
            How It Works
          </h2>
          <p className="text-lg text-[#1C2526] mb-6">
            Scan. Report. Stay Safe.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="text-4xl mb-2">📝</div>
              <h3 className="text-lg font-semibold text-[#1C2526] mb-1">Report</h3>
              <p className="text-[#1C2526] text-base">
                Submit a food safety issue with details like location, business name, and symptoms.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="text-lg font-semibold text-[#1C2526] mb-1">Verify</h3>
              <p className="text-[#1C2526] text-base">
                Our AI verifies the report for accuracy and relevance.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="text-4xl mb-2">🗺️</div>
              <h3 className="text-lg font-semibold text-[#1C2526] mb-1">Visualize & Alert</h3>
              <p className="text-[#1C2526] text-base">
                View incidents on a map and get real-time alerts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Real-Time Alert Stats */}
      <section className="bg-[#F3EDE1] py-12 flex items-center justify-center">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-[#1C2526] mb-6 text-center font-['HIRO_MISAKE']">
            Real-Time Alert Stats
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-lg p-4 text-center">
              <h3 className="text-2xl font-bold text-[#F28C38]">{stats.totalIncidents}</h3>
              <p className="text-[#1C2526] mt-1 text-base">Total Incidents Reported</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4 text-center">
              <h3 className="text-2xl font-bold text-[#F28C38]">{stats.districtsCovered}</h3>
              <p className="text-[#1C2526] mt-1 text-base">Districts Covered</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4 text-center">
              <h3 className="text-2xl font-bold text-[#F28C38]">{stats.verifiedReports}</h3>
              <p className="text-[#1C2526] mt-1 text-base">Verified Reports</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4 text-center">
              <h3 className="text-2xl font-bold text-[#F28C38]">{stats.mostCommonIssues.join(", ")}</h3>
              <p className="text-[#1C2526] mt-1 text-base">Most Common Issues</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Matters Section */}
      <section className="bg-[#F3EDE1] py-12 flex items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-[#1C2526] mb-4 font-['HIRO_MISAKE']">
            Why This Matters
          </h2>
          <p className="text-xl text-[#1C2526] mb-6 max-w-2xl mx-auto">
            Nepal loses 1,000 lives yearly to unsafe food. We're changing that.
          </p>
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <p className="text-[#1C2526] italic text-base">
                "Food safety is a critical public health issue. Platforms like BhojanGuard empower communities to take action."
              </p>
              <p className="mt-2 font-semibold text-[#1C2526] text-base">- Dr. Ramesh K., Public Health Expert</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4">
              <p className="text-[#1C2526] italic text-base">
                "I never realized how common food safety issues were until I started using BhojanGuard."
              </p>
              <p className="mt-2 font-semibold text-[#1C2526] text-base">- A user from Kathmandu</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials / Community Stories */}
      <section className="bg-[#F3EDE1] py-20 flex items-center justify-center">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-[#1C2526] mb-6 text-center font-['HIRO_MISAKE']">
            Testimonials / Community Stories
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <p className="text-[#1C2526] italic text-base">
                "Thanks to BhojanGuard, I avoided a foodborne illness by checking alerts before dining out."
              </p>
              <p className="mt-2 font-semibold text-[#1C2526] text-base">- Priya S., Kathmandu</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4">
              <p className="text-[#1C2526] italic text-base">
                "Reporting an issue was so easy, and now my community is safer!"
              </p>
              <p className="mt-2 font-semibold text-[#1C2526] text-base">- Anil K., Pokhara</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4">
              <p className="text-[#1C2526] italic text-base">
                "The alert map helped me identify risky vendors in my area."
              </p>
              <p className="mt-2 font-semibold text-[#1C2526] text-base">- Sunita M., Lalitpur</p>
            </div>
          </div>
        </div>
      </section>

      {/* New Safety Tips Section */}
      <section className="bg-[#F3EDE1] py-18 flex items-center justify-center mb-4">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-[#1C2526] mb-4 font-['HIRO_MISAKE']">
            Safety Tips
          </h2>
          <p className="text-lg text-[#1C2526] mb-6">
            Stay informed and protect yourself with these food safety tips.
          </p>
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <p className="text-[#1C2526] text-base">
                Check expiration dates before purchasing food.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4">
              <p className="text-[#1C2526] text-base">
                Wash hands and surfaces often to prevent contamination.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4">
              <p className="text-[#1C2526] text-base">
                Report suspicious food vendors immediately via BhojanGuard.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4">
              <p className="text-[#1C2526] text-base">
                Avoid eating at places with poor hygiene practices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1C2526] text-[#F3EDE1] py-8 mt-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <h3 className="text-lg font-bold mb-2">BhojanGuard</h3>
              <p className="text-[#F3EDE1] text-base">
                An AI-powered platform to ensure food safety across Nepal.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">Quick Links</h3>
              <ul className="space-y-1">
                <li><Link to="/" className="hover:text-[#F28C38] transition-colors text-base">Home</Link></li>
                <li><Link to="/report" className="hover:text-[#F28C38] transition-colors text-base">Report</Link></li>
                <li><Link to="/alert" className="hover:text-[#F28C38] transition-colors text-base">Local Alerts</Link></li>
                <li><Link to="/map" className="hover:text-[#F28C38] transition-colors text-base">Alert Map</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">Contact Us</h3>
              <p className="text-[#F3EDE1] text-base">Email: support@bhojanguard.com</p>
              <p className="text-[#F3EDE1] text-base">Phone: +977-123-456-7890</p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">Follow Us</h3>
              <div className="flex gap-2">
                <a href="#" className="text-[#F3EDE1] hover:text-[#F28C38] transition-colors text-base">Facebook</a>
                <a href="#" className="text-[#F3EDE1] hover:text-[#F28C38] transition-colors text-base">Twitter</a>
                <a href="#" className="text-[#F3EDE1] hover:text-[#F28C38] transition-colors text-base">Instagram</a>
              </div>
            </div>
          </div>
          <div className="mt-4 text-center text-[#F3EDE1] text-base">
            <p>© 2025 BhojanGuard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;