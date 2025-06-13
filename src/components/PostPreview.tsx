
import { Platform, PlatformConfig } from '../types';

const PlatformPreview = ({ text, platform, platformConfig }: { text: string, platform: Platform, platformConfig: PlatformConfig }) => {
    const LIMIT = platformConfig.charLimit;
    const isOverLimit = text.length > LIMIT;
    const displayText = text.slice(0, LIMIT);
    const overflowText = text.slice(LIMIT);

    return (
        <div className="relative p-4 m-6 bg-white rounded-lg border border-black">

            {/* Platform Badge */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex w-12 h-12 bg-sky-500 items-center justify-center rounded-full  shadow-slate-700/40">
                {platform.icon}
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
                <div className="flex content-start items-center gap-2 m-4 mb-3 justify-between">
                <span className="text-sky-500">{platform.icon}</span>
                <span className="font-semibold">{platform.name}</span>
                <span className={`text-sm ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
                    {text.length}/{LIMIT}
                </span>
            </div>

        </div>
    )
}

export default PlatformPreview