import { useState } from 'react';
import LeftSidebar from './LeftSidebar';
import LoginModal from './LoginModal';
import AddPlatformModal from './AddPlatformModal'
import PreviewPanel from './PreviewPanel'
import PostingArea from './PostingArea';
import { useAuth0 } from '@auth0/auth0-react';
import { usePlatformConnections } from '../hooks/usePlatformConnections'; 
import { PostResult } from '../types';


const SocialPostingInterface = () => {

    const {
        platforms,
        activeModal,
        setActiveModal,
        isAppLoading,
        togglePlatformSelect,
        handleOpenAddPlatformModal,
        handleUserTriggeredConnect,
        handleAddPlatform,
        handleBlueSkyLogin,
        blueSkyService,
        twitterService
    } = usePlatformConnections();


  const [postText, setPostText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { isLoading: isAuth0Loading } = useAuth0(); // Destructuring with renaming
  

  const unaddedPlatforms = Object.values(platforms).filter(p => !p.isAdded);
  const addedPlatforms = Object.values(platforms).filter(p=>p.isAdded);
  const selectedPlatforms = Object.values(platforms).filter(p => p.isSelected);
  const readyToPost = selectedPlatforms.length > 0;


  const handlePost = async () => {
    if (!postText.trim() || isPosting || !readyToPost) return;

    setIsPosting(true);

    const services: { [key: string]: { createPost: (text: string) => Promise<PostResult> } } = {
        bluesky: blueSkyService,
        twitter: twitterService,
        // Map other services here
    };

    const postPromises = selectedPlatforms
        .filter(p => services[p.id]) // Ensure we have a service for the platform
        .map(p => 
            services[p.id]
                .createPost(postText)
                .then(result => ({ ...result, platformName: p.config.name })) // Add name for reporting
        );

    const results = await Promise.allSettled(postPromises);

    const successMessages: string[] = [];
    const errorMessages: string[] = [];
    let allSucceeded = true;

    results.forEach(res => {
        if (res.status === 'fulfilled') {
            const postResult = res.value;
            if (postResult.success) {
                successMessages.push(postResult.platformName);
            } else {
                allSucceeded = false;
                errorMessages.push(`${postResult.platformName}: ${postResult.error || 'Failed'}`);
            }
        } else {
            allSucceeded = false;
            // res.reason contains the error for a rejected promise
            errorMessages.push(`A platform failed unexpectedly: ${res.reason?.message || 'Unknown error'}`);
        }
    });
    
    let alertMessage = '';
    if (successMessages.length > 0) {
      alertMessage += `Posted to: ${successMessages.join(', ')}\n`;
    }
    if (errorMessages.length > 0) {
      alertMessage += `Failed: ${errorMessages.join(', ')}`;
    }

    alert(alertMessage.trim() || 'No platforms were selected or an unknown error occurred.');

    if (allSucceeded) {
      setPostText('');
    }

    setIsPosting(false);
  };

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
          onTogglePlatform={togglePlatformSelect}
          onConnectPlatform={handleUserTriggeredConnect}
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

      {/* BlueSky Login Modal */}
      <LoginModal
        isOpen={activeModal === 'blueSkyLogin'}
        onClose={() => setActiveModal('none')}
        onLogin={handleBlueSkyLogin}
      />
    </div>
  );
};

export default SocialPostingInterface;