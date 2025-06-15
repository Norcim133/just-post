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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

        {/* Platforms Container */}
            <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
                
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Add Platforms</h2>
                <div className="flex flex-col mb-6 gap-4 ">

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
                        <button
                            onClick={onClose}
                            className= "p-2 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                            Close modal
                        </button>
                </div>
                </div>
        </div>
    )
};

export default AddPlatformModal;