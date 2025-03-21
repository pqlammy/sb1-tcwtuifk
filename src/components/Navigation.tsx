import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, PlusCircle, User, LogOut, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';

export function Navigation() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'service_role';

  const navItems = isAdmin
    ? [
        { to: '/admin', icon: Home, label: 'Übersicht' },
        { to: '/admin/stats', icon: BarChart3, label: 'Auswertung' },
        { to: '/admin/profile', icon: User, label: 'Profil' },
      ]
    : [
        { to: '/dashboard', icon: Home, label: 'Übersicht' },
        { to: '/dashboard/collect', icon: PlusCircle, label: 'Beitrag Sammeln' },
        { to: '/dashboard/profile', icon: User, label: 'Profil' },
      ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <nav className="bg-black/50 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center">
              <Logo className="w-16 h-16" />
              <h1 className="text-xl font-bold text-white ml-4">
                Genner Gibelguuger
              </h1>
            </div>
            <div className="hidden sm:flex sm:space-x-4 ml-8">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-red-600 text-white'
                        : 'text-gray-300 hover:bg-red-600/20 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-gray-300 hidden sm:block">
              Hallo, {user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-red-600/20 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:block">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="sm:hidden">
        <div className="flex justify-around px-2 pt-2 pb-3 space-x-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:bg-red-600/20 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 mb-1" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}