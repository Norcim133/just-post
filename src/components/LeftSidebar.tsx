import React, { useState } from 'react';
import { PlatformConfig } from '../types'
import { Plus, Settings, Check } from 'lucide-react';
import { User } from '@auth0/auth0-react'; 
import UserAccountButton from './UserAccountButton';


interface LeftSidebarProps {
    addedPlatforms: PlatformConfig[];
    selectedPlatforms: Record<string, boolean>;
    onTogglePlatform: (id: string) => void;
    onAddAccountClick: () => void;

}


const LeftSidebar = ( { addedPlatforms, selectedPlatforms, onTogglePlatform, onAddAccountClick, } : LeftSidebarProps) => {


    return (
      <div className="w-72 bg-white shadow-sm border-r border-slate-100 flex flex-col" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' }}>
        
        {/* Add Account Button */}
        <div className="p-6 pb-4">
          <button
            onClick={onAddAccountClick}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 font-medium shadow-sm"
            >
            <Plus size={18} />
            Add Account
          </button>
        </div>

        {/* Connected Platforms */}
        <div className="flex-1 px-6 pb-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 tracking-wide uppercase">Connected Accounts</h3>

          <div className="space-y-3">

            {addedPlatforms.map(platformConfig => (
              <div 
                key={platformConfig.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-200 cursor-pointer bg-white"
              >
                <div className={`w-10 h-10 ${platformConfig.color} rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-sm`}>
                  {platformConfig.icon}
                </div>
                <span className="flex-1 font-medium text-slate-700" style={{ fontSize: '15px', fontWeight: '500' }}>{platformConfig.name}</span>
                <button
                  onClick={() => onTogglePlatform(platformConfig.id)}
                  
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                    selectedPlatforms[platformConfig.id as keyof typeof selectedPlatforms]
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' 
                      : 'border-slate-300 hover:border-slate-400 bg-white'
                  }`}
                >
                  {selectedPlatforms[platformConfig.id as keyof typeof selectedPlatforms] && <Check size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>

        <UserAccountButton/>

      </div>
      )
};

export default LeftSidebar