import { useState } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    // TODO: Implement subscription logic with Firebase
  };

  return (
    <div className="min-h-screen bg-purple-50 py-10 px-6">
      <div className="container mx-auto max-w-7xl">
        {/* Hero Section */}
        <section className="text-center mb-20 px-4 py-10">
          <h1 className="text-5xl font-bold mb-6 text-purple-800">BhojanGuard</h1>
          <p className="text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
            An AI-powered platform to detect, report, and visualize food safety incidents across Nepal.
            Protect your community by sharing and tracking unsafe food vendors.
          </p>
          <div className="flex justify-center gap-6 flex-wrap">
            <Link
              to="/report"
              className="bg-purple-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Report an Incident
            </Link>
            <Link
              to="/alerts"
              className="bg-white text-purple-600 px-8 py-3 rounded-lg text-lg font-semibold border-2 border-yellow-400 hover:bg-purple-50 transition-colors"
            >
              View Local Alerts
            </Link>
            <Link
              to="/map"
              className="bg-yellow-400 text-purple-800 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-yellow-500 transition-colors"
            >
              View Alert Map
            </Link>
          </div>
        </section>

        {/* Recent Alerts Section */}
        <section className="mb-20 bg-white rounded-xl shadow-lg p-8 ">
          <h2 className="text-2xl font-bold mb-8 text-center text-purple-800">Recent Food Safety Alerts</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* This will be populated with actual data from Firebase */}
            <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-purple-700">Hotel Everest</h3>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              <p className="text-gray-600 mb-2">Issue: Contamination (Expired Meat)</p>
              <p className="text-sm text-gray-500">Location: Kathmandu, Nepal</p>
            </div>
            {/* Add more alert cards here */}
          </div>
        </section>

        {/* Alert Subscription Section */}
        
      </div>
    </div>
  );
};

export default Home;
