import { useState } from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  const [language, setLanguage] = useState('en');

  return (
    <header className="bg-purple-700 text-white shadow-md">
      <div className="container mx-auto px-4">
        <nav className="flex flex-wrap justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold hover:text-purple-200 transition-colors">
            BhojanGuard
          </Link>
          
          <div className="flex items-center gap-6">
            <Link 
              to="/" 
              className="hover:text-yellow-300 font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              to="/report"
              className="hover:text-yellow-300 font-medium transition-colors"
            >
              Report
            </Link>
            <Link 
              to="/alert" 
              className="hover:text-yellow-300 font-medium transition-colors"
            >
              Local Alerts
            </Link>
            <Link 
              to="/map" 
              className="hover:text-yellow-300 font-medium transition-colors"
            >
              Alert Map
            </Link>
            
            
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-800 transition-colors border border-purple-500 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
            >
              <option value="en">English</option>
              <option value="ne">नेपाली</option>
            </select>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;