import { X, ChevronRight } from 'lucide-react';
import { PlatformState } from '../../types'


interface AddPlatformModalProps {
    availablePlatforms: PlatformState[];
    onAdd: (newPlatformId: string) => void; 
    onClose: () => void;
}

const AddPlatformModal = ({ availablePlatforms, onAdd, onClose }: AddPlatformModalProps )=> {

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
                    { availablePlatforms.map(platformState => (
                        <button
                            key={platformState.id}
                            onClick={() => onAdd(platformState.id)}
                            className={`w-full flex items-center gap-3 px-6 py-4 ${platformState.config.color} text-white rounded-xl hover:opacity-90 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-medium text-base`}
                            >
                            <span className="text-2xl">{platformState.config.icon}</span>
                            <span className="flex-1 text-left">Continue with {platformState.config.name}</span>
                            <ChevronRight size={20} />
                        </button>
                    ))}

                </div>
                </div>
        </div>
    )
};

export default AddPlatformModal;