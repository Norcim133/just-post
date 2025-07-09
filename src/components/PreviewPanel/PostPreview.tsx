
import { PlatformConfig } from '../../types';
import { cn } from '../../lib/utils';
import { authClient } from '../../clients/authClient';

const PlatformPreview = ({ text, platformConfig }: { text: string, platformConfig: PlatformConfig }) => {
    const LIMIT = platformConfig.charLimit;
    const isOverLimit = text.length > LIMIT;
    const displayText = text.slice(0, LIMIT);
    const overflowText = text.slice(LIMIT);

    const { data: session } = authClient.useSession();
    const isAuthenticated = session

    return (
        isAuthenticated && (

            <div className="relative p-4 m-2 mt-4 mb-12 bg-white rounded-lg border border-black">
            
            {/* Platform Badge */}
            <div className={cn(
                "absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex w-12 h-12 items-center justify-center rounded-full shadow-slate-700/40 text-white text-xl font-semibold",
                platformConfig.color
            )}>
            {platformConfig.icon}
            </div>
            
            {/* Text Box */}
            <div className="p-2 text-gray-800">
            {displayText}
            {isOverLimit && (
                <span className="text-red-400 line-through opacity-50">
                {overflowText}
                </span>
            )}
            </div>
            
            <div className="flex content-start items-end gap-2 m-4 mb-1 justify-between">
            <span className="text-sky-500">{platformConfig.icon}</span>
            <span className="font-semibold">{platformConfig.name}</span>
            <span className={`text-sm ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
            {text.length}/{LIMIT}
            </span>
            </div>
            
            </div>
        )
    )
}

export default PlatformPreview