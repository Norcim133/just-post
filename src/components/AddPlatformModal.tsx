import React from 'react';
import { X, ChevronRight } from 'lucide-react';
import { PlatformConfig } from '../types'


interface AddPlatformModalProps {
    isOpen: Boolean;
    onClose: () => void;
    platformConfigs: Record<string, PlatformConfig>
    addedPlatforms: PlatformConfig[]
}

const AddPlatformModal: React.FC<AddPlatformModalProps> = ({ isOpen, onClose, platformConfigs, addedPlatforms }) => {
    if (!isOpen) return null;

    const addedPlatformIds = new Set(addedPlatforms.map(p => p.id));

    return (
        // Overlay blocking app
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">

        {/* Platforms Container */}
            <div className="bg-white rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl shadow-black/20 ring-1 ring-black/5 backdrop-blur-xl">
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors -mr-2 -mt-2"
                        >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Connect Your Accounts</h2>
                    <p className="text-slate-600 text-sm">Choose platforms to share your content</p>
                </div>
                <div className="flex flex-col gap-3">
                    {Object.values(platformConfigs).map(platformConfig => (
                        !addedPlatformIds.has(platformConfig.id) && (
                            <button
                                onClick={onClose}
                                className={`w-full flex items-center gap-3 px-6 py-4 ${platformConfig.color} text-white rounded-xl hover:opacity-90 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-medium text-base`}
                                >
                                <span className="text-2xl">{platformConfig.icon}</span>
                                <span className="flex-1 text-left">Continue with {platformConfig.name}</span>
                                <ChevronRight size={20} />
                            </button>
                        )))}

                </div>
                </div>
        </div>
    )
};

export default AddPlatformModal;