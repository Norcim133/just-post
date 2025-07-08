import { PlatformState } from '../types';
import { Plus } from 'lucide-react';
import UserAccountButton from './UserAccountButton';
import PlatformCard from './PlatformCard'; 
import { authClient } from '../clients/authClient';
import { cn } from '../lib/utils';


interface LeftSidebarProps {
  addedPlatforms: PlatformState[];
  onAddAccountClick: () => void;
  onTogglePlatform: (id: string) => void;
  onConnectPlatform: (id: string) => void; 
}

const LeftSidebar = ({ addedPlatforms, onAddAccountClick, onTogglePlatform, onConnectPlatform }: LeftSidebarProps) => {
  
  const { data: isAuthenticated } = authClient.useSession();

  return (
      <div className="w-72 bg-white shadow-sm border-r border-slate-100 flex flex-col" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' }}>
        
        {/* Add Account Button */}
        <div className="p-6 pb-4">
          <button
            onClick={onAddAccountClick}
            className={cn(
              'w-full flex items-center justify-center gap-3 px-4 py-3  rounded-xl hover:bg-slate-800 transition-all duration-200 font-medium shadow-sm',
              isAuthenticated
              ? 'bg-slate-900 text-white'
              : 'bg-slate-500 text-white'
            )}
              disabled={!isAuthenticated}
              >
            <Plus size={18} />
            Add Account
          </button>
        </div>

      {/* Added Platforms */}
      <div className="flex-1 px-6 pb-4">
        <h3 className="text-sm font-semibold text-slate-700 mt-6 mb-4 tracking-wide uppercase">
          Added Accounts
        </h3>

        <div className="space-y-3">
            {isAuthenticated && (
                addedPlatforms.map((platformState) => (
                  <PlatformCard
                  key={platformState.id}
                  platform={platformState}
                  onToggleSelect={onTogglePlatform}
                  onConnect={onConnectPlatform} 
                  />
                ))
            )}
        </div>
      </div>

      <UserAccountButton/>
    </div>
  );
};

export default LeftSidebar;