import React, { useState, useEffect } from 'react';
import LeftSidebar from './LeftSidebar';
import { Send, Check } from 'lucide-react';
import { BlueSkyService } from '../services/bluesky';
import { StorageService } from '../services/storage';
import { BlueSkyCredentials, PlatformState, PLATFORM_CONFIGS } from '../types';
import LoginModal from './LoginModal';
import AddPlatformModal from './AddPlatformModal'
import PlatformPreview from './PostPreview';

const SocialPostingInterface = () => {

  const [platforms, setPlatforms] = useState<Record<string, PlatformState>>({
    bluesky: {
      id: 'bluesky',
      isAdded: false,
      isConnected: false,
      isSelected: false,
      config: PLATFORM_CONFIGS.bluesky
    },
    twitter: {
      id: 'twitter',
      isAdded: false,
      isConnected: false,
      isSelected: false,
      config: PLATFORM_CONFIGS.twitter
    },
  })

  const [postText, setPostText] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  type ModalType = 'none' | 'addPlatform' | 'blueSkyLogin' | 'twitterLoginHelp';

  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const unaddedPlatforms = Object.values(platforms).filter(p => !p.isAdded);
  const addedPlatforms = Object.values(platforms).filter(p=>p.isAdded);
  const selectedPlatforms = Object.values(platforms).filter(p => p.isSelected);
  const readyToPost = selectedPlatforms.length > 0;

  // When user triggeres connection automatically select platform
  const handleUserTriggeredConnect = (platformId: string) => {
    setPlatforms(prev => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        isAdded: true,
        isConnected: true,
        isSelected: true
      }
    }));
  }

    const handleConnect = (platformId: string) => {
    setPlatforms(prev => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        isAdded: true,
        isConnected: true,
      }
    }));
  }

  const handleAddPlatform = (platformId: string) => {
    setPlatforms(prev => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        isAdded: true,
        isConnected: false, 
        isSelected: false,
      }
    }));
  };

  const handleDisconnect = (platformId: string) => {
  setPlatforms(prev => ({
    ...prev,
    [platformId]: {
      ...prev[platformId],
      isConnected: false, // The primary change
      isSelected: false,  // <--- Enforce this rule
    }
  }));
};

  const [blueSkyService] = useState(new BlueSkyService());

  useEffect(() => {
    const initAuth = async () => {
      const stored = StorageService.getBlueSkyCredentials();
      if (stored) {
        const success = await blueSkyService.login(stored);
        success ? handleConnect('bluesky') : handleDisconnect('bluesky');
      }
    };
    initAuth();
  }, [blueSkyService]);

  const handleBlueSkyLogin = async (credentials: BlueSkyCredentials) => {
    const success = await blueSkyService.login(credentials);
    if (success) {
      StorageService.saveBlueSkyCredentials(credentials);
      setActiveModal('none');
      success ? handleUserTriggeredConnect('bluesky') : handleDisconnect('bluesky');

    }
    return success;
  };


  const handlePost = async () => {
    if (!postText.trim() || isPosting) return;
    
    if (!readyToPost) return;

    setIsPosting(true);
    try {
      const result = await blueSkyService.createPost(postText);
      if (result.success) {
        setPostText('');
        alert('Posted successfully!');
      } else {
        alert(`Post failed: ${result.error}`);
      }
    } catch (error) {
      alert('Post failed: Unknown error');
    }
    setIsPosting(false);
  };

  const togglePlatform = (platformId: string) => {
    const platform = platforms[platformId];
    // Rule: Don't do anything if the platform is not connected.
    if (!platform.isConnected) {
      return; 
    }

    setPlatforms(prev => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        isSelected: !prev[platformId].isSelected
      }
    }));
  };


  const handleOpenAddPlatformModal = () => {
    setActiveModal('addPlatform')
  }


  return (
    <div className="flex h-screen bg-slate-50">

        <LeftSidebar
          addedPlatforms={addedPlatforms}
          onAddAccountClick={handleOpenAddPlatformModal}
          onTogglePlatform={togglePlatform}
        />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto">
        <div className="flex-1 p-8">
          {/* Post Composer */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/20">
            <div className="p-8">
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="What's happening?"
                className="w-full h-40 resize-none border-0 outline-none text-lg placeholder-slate-400 leading-relaxed"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
              />
              
              {/* Actions */}
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-6">
                  <span className="text-sm font-medium text-slate-500">
                    {postText.length}/300
                  </span>
                </div>
                
                <button 
                  onClick={handlePost}
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
            {addedPlatforms.map(platformState => (
              selectedPlatforms[platformState.id as keyof typeof selectedPlatforms] && (
                <div key={platformState.id} className="flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-medium shadow-sm">
                  <div className={`w-5 h-5 ${platformState.config.color} rounded-lg flex items-center justify-center text-white text-xs font-semibold`}>
                    {platformState.config.icon}
                  </div>
                  {platformState.config.name}
                  <Check size={14} />
                </div>
              )
            ))}
          </div>
        </div>
      </div>
      
      {/* Preview Panel */}
      <div className="w-96 bg-white shadow-sm border-r border-slate-100 flex flex-col" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'}}>
        <div className="flex-1 px-6 pb-4">

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
      
      {activeModal === 'addPlatform' && (
        <AddPlatformModal
        availablePlatforms={unaddedPlatforms}
        onAdd={handleAddPlatform}
        />
      )}

      {/* BlueSky Login??? */}
      <LoginModal
        isOpen={activeModal === 'blueSkyLogin'}
        onClose={() => setActiveModal('none')}
        onLogin={handleBlueSkyLogin}
      />
    </div>
  );
};

export default SocialPostingInterface;