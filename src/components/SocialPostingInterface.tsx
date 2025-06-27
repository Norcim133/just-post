import { useState, useEffect } from 'react';
import LeftSidebar from './LeftSidebar';
import { BlueSkyService } from '../services/bluesky';
import { savePlatformSelections, getPlatformSelections, StorageService } from '../services/storage';
import { BlueSkyCredentials, Platforms, PLATFORM_CONFIGS } from '../types';
import LoginModal from './LoginModal';
import AddPlatformModal from './AddPlatformModal'
import PreviewPanel from './PreviewPanel'
import PostingArea from './PostingArea';
import { useAuth0 } from '@auth0/auth0-react';

const SocialPostingInterface = () => {
  const [postText, setPostText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { isLoading: isAuth0Loading } = useAuth0(); // Destructuring with renaming
  const [isAppLoading, setIsAppLoading] = useState(true);

  type ModalType = 'none' | 'addPlatform' | 'blueSkyLogin' | 'twitterLoginHelp';
  const [activeModal, setActiveModal] = useState<ModalType>('none');


  // Does init on first loard (due to useState doing a function approach) to get saved selections from storage
  const [platforms, setPlatforms] = useState(() => {
    
    const initialConfigs: Platforms = {
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
      threads: {
        id: 'threads',
        isAdded: false,
        isConnected: false,
        isSelected: false,
        config: PLATFORM_CONFIGS.threads
      },
      linkedin: {
        id: 'linkedin',
        isAdded: false,
        isConnected: false,
        isSelected: false,
        config: PLATFORM_CONFIGS.linkedin
      }
    };

    const savedSelections = getPlatformSelections();

    if (savedSelections) {

      Object.keys(initialConfigs).forEach(platformId => {
        if (savedSelections[platformId] !== undefined) {
          initialConfigs[platformId].isSelected = savedSelections[platformId]
        }
      });
    }
    return initialConfigs;
  });

  // Maintain user's selected platform across sessions
  useEffect(() => {
    const platformSelections: Record<string, boolean> = {};
    Object.keys(platforms).forEach(
      platformId => {
        platformSelections[platformId] = platforms[platformId].isSelected 
      }
    )

    savePlatformSelections(platformSelections)
    
  }, [platforms]);

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
    setActiveModal('none')
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
      setIsAppLoading(false);
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
    setIsAppLoading(false);
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

  if (isAuth0Loading || isAppLoading ) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-xl text-slate-600">Loading...</div>
        {/* Or a fancy spinner component */}
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50">

        {/* Sidebar + Platforms + Account */}
        <LeftSidebar
          addedPlatforms={addedPlatforms}
          onAddAccountClick={handleOpenAddPlatformModal}
          onTogglePlatform={togglePlatform}
        />

        {/* Main Posting Area */}
        <PostingArea
          selectedPlatforms={selectedPlatforms}
          postText={postText}
          isPosting={isPosting}
          readyToPost={readyToPost}
          onTextChange={setPostText}
          onPostClick={handlePost}
        />
      
      {/* Preview Panel */}
      <PreviewPanel
          selectedPlatforms={selectedPlatforms}
          postText={postText}
      />
      
      {/* AddPlatform Modal */}
      {activeModal === 'addPlatform' && (
        <AddPlatformModal
        availablePlatforms={unaddedPlatforms}
        onAdd={handleAddPlatform}
        onClose={() => setActiveModal('none')}
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