import { PlatformState } from '../../types'
import PlatformPreview from './PostPreview';

interface PreviewPanelProps {
    selectedPlatforms: PlatformState[];
    postText: string;
}

const PreviewPanel = ({ selectedPlatforms, postText }: PreviewPanelProps ) => {
    return (
        <div className="w-96 bg-white shadow-sm border-r border-slate-100 flex flex-col" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'}}>
            <div className="flex-1 px-6 pb-4 overflow-y-auto">

                <h3 className="pt-10 text-sm font-semibold text-slate-700 mb-4 tracking-wide uppercase">Post Previews</h3>
                <hr className="pt-5 border-gray-300" />

                {selectedPlatforms.map(platformState => (
                    <PlatformPreview
                    key={platformState.id}
                    text={postText}
                    platformConfig={platformState.config}
                    />
                ))}

            </div>
        </div>

    )
}

export default PreviewPanel