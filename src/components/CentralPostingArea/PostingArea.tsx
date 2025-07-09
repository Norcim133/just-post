import { PlatformState } from '../../types'
import { Send, Check } from 'lucide-react';

interface PostingAreaProps {
    selectedPlatforms: PlatformState[]
    postText: string;
    isPosting: boolean;
    readyToPost: boolean;
    onTextChange: (newText: string) => void;
    onPostClick: () => void;
}

const PostingArea = ({ selectedPlatforms, postText, isPosting, readyToPost, onTextChange, onPostClick }: PostingAreaProps) => {

    return (
    // Main Content Area
      <div className="flex-1 flex flex-col max-w-3xl mx-auto">
        <div className="flex-1 p-8">
          {/* Post Composer */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/20">
            <div className="p-8">
              <textarea
                value={postText}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder="What's happening?"
                className="w-full h-40 resize-none border-0 outline-none text-lg placeholder-slate-400 leading-relaxed"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
              />
              
              {/* Chat Area */}
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-6">
                  <span className="text-sm font-medium text-slate-500">
                    {postText.length}/300
                  </span>
                </div>
                
                <button 
                  onClick={onPostClick}
                  className="px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 font-medium shadow-lg shadow-slate-900/10"
                  disabled={!postText.trim() || isPosting || !readyToPost}
                >
                  <Send size={18} />
                  {isPosting ? 'Posting...' : readyToPost ? 'Post To All' : 'Add/Select Account'}
                </button>
              </div>
            </div>
          </div>

          {/* Platform Status */}
          <div className="mt-6 flex flex-wrap gap-3">
            {selectedPlatforms.map(platformState => (
                <div key={platformState.id} className="flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-medium shadow-sm">
                  <div className={`w-5 h-5 ${platformState.config.color} rounded-lg flex items-center justify-center text-white text-xs font-semibold`}>
                    {platformState.config.icon}
                  </div>
                  {platformState.config.name}
                  <Check size={14} />
                </div>
            ))}
          </div>
        </div>
      </div>
    )
}

export default PostingArea;