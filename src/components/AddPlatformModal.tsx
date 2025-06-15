import React from 'react';
import { X, ChevronRight } from 'lucide-react';
import { PlatformConfig } from '../types'


interface AddPlatformModalProps {
    isOpen: Boolean;
    onClose: () => void;
    platformConfigs: Record<string, PlatformConfig>
}

const AddPlatformModal: React.FC<AddPlatformModalProps> = ({ isOpen, onClose, platformConfigs }) => {
    if (!isOpen) return null;
    return (
        // Overlay blocking app
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

        {/* Platforms Container */}
            <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
                
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Add Platforms</h2>
                <div className="flex flex-col mb-6 gap-4 ">

                    {Object.values(platformConfigs).map(platformConfig => (
                            <button
                                onClick={onClose}
                                className= {`flex items-center gap-4 rounded-xl border  hover:border-slate-200 hover:shadow-sm transition-all duration-200 cursor-pointer bg-whitep-2 ${platformConfig.color} rounded-xl transition-colors`}
                                >
                                <span></span>
                                {platformConfig.name}
                            </button>
                        ))}
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