import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'tailwindcss/tailwind.css';

const Alert = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [subscription, setSubscription] = useState({
    username: '',
    email: '',
    phone: '',
    latitude: null,
    longitude: null,
  });
  const [message, setMessage] = useState('');
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setSubscription({ ...subscription, latitude, longitude });
      },
      () => setMessage('Location access denied. Please enable location services.')
    );
  }, []);

  useEffect(() => {
    if (userLocation) {
      axios
        .get('http://localhost:8000/api/alerts/nearby-reports/', {
          params: { latitude: userLocation[0], longitude: userLocation[1] },
        })
        .then((response) => setAlerts(response.data))
        .catch((error) => {
          console.error('Error fetching alerts:', error);
          setMessage('Failed to fetch nearby alerts. Check console for details.');
        });
    }
  }, [userLocation]);

  const handleSubscription = async (e) => {
    e.preventDefault();
    if (!subscription.username || (!subscription.email && !subscription.phone)) {
      setMessage('Please provide a username and either an email or phone number.');
      return;
    }
    try {
      const response = await axios.post('http://localhost:8000/api/alerts/subscribe/', subscription);
      setMessage('Subscription successful! You will receive alerts for nearby reports.');
      setSubscription({ username: '', email: '', phone: '', latitude: userLocation[0], longitude: userLocation[1] });
    } catch (error) {
      setMessage('Error subscribing. Please try again.');
      console.error('Subscription error:', error);
    }
  };

  return (
    <div className="bg-[#FFFFFF] min-h-screen font-['Noto_Sans_JP']">
      <section className="bg-[#F3EDE1] min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="container mx-auto px-8">
          <h1 className="text-4xl font-bold text-[#1C2526] mb-8 font-['HIRO_MISAKE'] text-center">
            Local Food Safety Alerts
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Subscription Form */}
            <div className="bg-white rounded-xl shadow-lg p-8 space-y-6" style={{ height: '600px', overflowY: 'auto' }}>
              <h2 className="text-2xl font-semibold text-[#1C2526] mb-4 font-['HIRO_MISAKE']">
                Subscribe to Alerts
              </h2>
              <form onSubmit={handleSubscription} className="space-y-6">
                <div>
                  <label className="block text-[#1C2526] text-base font-medium mb-2">Username</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-[#F28C38] focus:outline-none focus:ring-2 focus:ring-[#F28C38] text-[#1C2526] text-base"
                    value={subscription.username}
                    onChange={(e) => setSubscription({ ...subscription, username: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#1C2526] text-base font-medium mb-2">Email (optional)</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 rounded-lg border border-[#F28C38] focus:outline-none focus:ring-2 focus:ring-[#F28C38] text-[#1C2526] text-base"
                    value={subscription.email}
                    onChange={(e) => setSubscription({ ...subscription, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[#1C2526] text-base font-medium mb-2">Phone (optional)</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2 rounded-lg border border-[#F28C38] focus:outline-none focus:ring-2 focus:ring-[#F28C38] text-[#1C2526] text-base"
                    value={subscription.phone}
                    onChange={(e) => setSubscription({ ...subscription, phone: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full text-white py-3 rounded-lg transition duration-150 ease-in-out text-base"
                  style={{ backgroundColor: '#F28C38' }}
                >
                  Subscribe to Alerts
                </button>
                {message && <p className="text-red-600 bg-red-100 p-4 rounded text-base">{message}</p>}
              </form>
            </div>

            {/* Nearby Alerts */}
            {alerts.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-[#1C2526] mb-4 font-['HIRO_MISAKE']">
                  Nearby Alerts
                </h2>
                {alerts.map((alert, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="font-semibold text-lg text-[#1C2526] mb-2">
                      {alert.title}
                    </h3>
                    <p className="text-base text-[#1C2526] mb-2">{alert.description}</p>
                    <p className="text-base text-[#1C2526]"><strong>Business:</strong> {alert.business_name || 'N/A'}</p>
                    <p className="text-base text-[#1C2526]"><strong>Location:</strong> {alert.latitude}, {alert.longitude}</p>
                    <p className="text-base text-[#1C2526]"><strong>Symptoms:</strong> {alert.symptoms.map(s => s.name).join(', ') || 'None'}</p>
                    <p className="text-base text-[#1C2526]"><strong>Tags:</strong> {alert.tags.map(t => t.name).join(', ') || 'None'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Alert;