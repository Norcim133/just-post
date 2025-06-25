import React, { useState } from 'react';
import { Plus, Settings, Check } from 'lucide-react';
import { User } from '@auth0/auth0-react'; 

interface UserAccountButtonProps {
    user: User | undefined;
    isAuthenticated: boolean;
    onLogout: () => void;
}

const UserAccountButton = ({ user, isAuthenticated, onLogout } : UserAccountButtonProps) => {

    const [showUserMenu, setShowUserMenu] = useState(false);

    return (
        //User Account
        <div className="p-6 pt-4 border-t border-slate-100 bg-slate-50 relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-200 bg-white"
          >
            <div className="w-10 h-10 bg-slate-400 rounded-xl flex items-center justify-center text-white font-semibold shadow-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-slate-700" style={{ fontSize: '15px', fontWeight: '600' }}>
                {user?.name || 'User'}
              </div>
              <div className="text-sm text-slate-500" style={{ fontSize: '13px', fontWeight: '400' }}>
                {user?.email || 'Not logged in'}
              </div>
            </div>
            <Settings size={18} className="text-slate-400" />
          </button>

          {/* User Menu Popup */}
          {showUserMenu && (
            <div className="absolute bottom-full left-6 right-6 mb-2 bg-white rounded-xl shadow-lg border border-slate-200 p-4 space-y-3">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Auth0 Status:</span>
                  <span className={`font-medium ${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
                    {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                  </span>
                </div>
                {user && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600">User ID:</span>
                      <span className="font-mono text-xs text-slate-700">{user.sub}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Provider:</span>
                      <span className="text-slate-700">{user.sub?.split('|')[0]}</span>
                    </div>
                  </>
                )}
              </div>
              <hr className="border-slate-200" />
              <button
                onClick={() => {
                  onLogout({ logoutParams: { returnTo: window.location.origin } });
                  setShowUserMenu(false);
                }}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
              >
                Logout
              </button>
            </div>
          )}
        </div>
        )

}

export default UserAccountButton;