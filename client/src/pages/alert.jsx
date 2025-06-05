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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Local Food Safety Alerts</h1>

      <form onSubmit={handleSubscription} className="mb-4 max-w-md">
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            className="border p-2 w-full rounded"
            value={subscription.username}
            onChange={(e) => setSubscription({ ...subscription, username: e.target.value })}
            required
          />
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700">Email (optional)</label>
          <input
            type="email"
            className="border p-2 w-full rounded"
            value={subscription.email}
            onChange={(e) => setSubscription({ ...subscription, email: e.target.value })}
          />
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700">Phone (optional)</label>
          <input
            type="tel"
            className="border p-2 w-full rounded"
            value={subscription.phone}
            onChange={(e) => setSubscription({ ...subscription, phone: e.target.value })}
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Subscribe to Alerts
        </button>
        {message && <p className="mt-2 text-sm text-red-500">{message}</p>}
      </form>

      {alerts.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Nearby Alerts</h2>
          <ul className="list-disc pl-5">
            {alerts.map((alert, index) => (
              <li key={index} className="mb-1">
                <strong>{alert.title}</strong>: {alert.description} <br />
                Business: {alert.business_name || 'N/A'} <br />
                Location: {alert.latitude}, {alert.longitude} <br />
                Symptoms: {alert.symptoms.map(s => s.name).join(', ') || 'None'} <br />
                Tags: {alert.tags.map(t => t.name).join(', ') || 'None'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Alert;