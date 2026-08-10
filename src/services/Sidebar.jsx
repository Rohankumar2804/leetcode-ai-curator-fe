import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, BeakerIcon, SparklesIcon, CogIcon } from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'AI Evaluator', href: '/dashboard/evaluator', icon: BeakerIcon },
  { name: 'AI Recommendations', href: '/dashboard/recommendations', icon: SparklesIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: CogIcon },
];

const Sidebar = () => {
  return (
    <div className="w-64 bg-white shadow-md">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-800">SmartPrep AI</h1>
      </div>
      <nav className="mt-5">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-gray-600 hover:bg-gray-200 ${isActive ? 'bg-blue-100 text-blue-600 font-bold' : ''}`
            }
          >
            <item.icon className="h-6 w-6 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;