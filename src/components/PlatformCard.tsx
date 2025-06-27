import { Check, Power } from 'lucide-react';
import { PlatformState } from '../types';
import { cn } from '../lib/utils'; 

interface PlatformCardProps {
  platform: PlatformState;
  onToggleSelect: (id: string) => void;
  onConnect: (id: string) => void;
}

const PlatformCard = ({ platform, onToggleSelect, onConnect }: PlatformCardProps) => {
  const { id, isConnected, isSelected, config } = platform;
  const { name, color, icon } = config;
  

  return (
    <div
      key={id}
      className={cn(
        'flex items-center gap-4 p-3 rounded-xl border bg-white transition-all duration-200',
        isConnected
          ? 'border-slate-300 hover:border-slate-500 hover:shadow-sm cursor-pointer'
          : 'opacity-70 border-slate-300 ' // Dim the card when not connected
      )}
      // Only make the whole card clickable for selection if connected
      onClick={() => isConnected && onToggleSelect(id)}
    >
      {/* Icon */}
      <div
        className={cn(
          `w-10 h-10 ${color} rounded-lg flex items-center justify-center text-white text-xl font-semibold shadow-inner shadow-black/10 transition-all`,
          !isConnected && 'grayscale w-6 h-6 text-xs mt-2 mb-2' // Desaturate the icon when not connected
        )}
      >
        {icon}
      </div>

      {/* Platform Name */}
      <span
      className={cn(`flex-1 flex-shrink-0 font-medium text-slate-800`,
        !isConnected && 'font-small text-xs'
      )}
      >{name}</span>

      {/* Conditional Button: Connect or Select */}
      {isConnected ? (
        // --- CONNECTED STATE ---
        <button
          // Prevent the card's onClick from firing when this button is clicked
          onClick={(e) => {
            e.stopPropagation(); 
            onToggleSelect(id);
          }}
          className={cn(
            'w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200',
            isSelected
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
              : 'border-slate-300 hover:border-slate-400 bg-white'
          )}
          aria-label={`Select ${name}`}
        >
          {isSelected && <Check size={14} strokeWidth={3} />}
        </button>
      ) : (
        // --- DISCONNECTED STATE ---
        <button
          onClick={(e) => {
            e.stopPropagation();
            onConnect(id); // Use the new onConnect prop
          }}
          className="flex-shrink-0 flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
          aria-label={`Connect ${name}`}
        >
          <Power size={12} />
          Connect
        </button>
      )}
    </div>
  );
};

export default PlatformCard;