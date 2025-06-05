import { useState } from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState('en');

  return (
    <header className="bg-[#1C2526] text-white py-4 shadow-lg">
      <div className="container mx-auto px-4 flex flex-col items-center gap-2 font-['Noto_Sans_JP']">
        <div className="flex justify-center items-center w-full">
          <Link to="/" className="text-4xl font-bold tracking-tight text-[#F5E9D6]">
            BhojanGuard
          </Link>
        </div>
        <div className="flex items-center gap-4 w-full justify-center">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search incidents or vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-1 rounded-full bg-[#F5E9D6] text-[#1C2526] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F28C38] font-medium text-base"
            />
          </div>
          <nav className="flex items-center gap-3">
            <Link to="/" className="text-lg font-medium text-[#F5E9D6] hover:text-[#F28C38] transition-colors">
              Home
            </Link>
            <Link to="/report" className="text-lg font-medium text-[#F5E9D6] hover:text-[#F28C38] transition-colors">
              Report
            </Link>
            <Link to="/alert" className="text-lg font-medium text-[#F5E9D6] hover:text-[#F28C38] transition-colors">
              Local Alerts
            </Link>
            <Link to="/map" className="text-lg font-medium text-[#F5E9D6] hover:text-[#F28C38] transition-colors">
              Alert Map
            </Link>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-[#F5E9D6] text-[#1C2526] px-3 py-1 rounded-lg hover:bg-[#F28C38] hover:text-white transition-colors border border-[#F5E9D6] focus:ring-2 focus:ring-[#F28C38] focus:outline-none font-medium text-base"
            >
              <option value="en">English</option>
              <option value="ne">Nepali</option>
            </select>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;