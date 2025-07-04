import { useState } from 'react';
import LeftSidebar from './LeftSidebar';
import LoginModal from './LoginModal';
import AddPlatformModal from './AddPlatformModal'
import PreviewPanel from './PreviewPanel'
import PostingArea from './PostingArea';
import { useAuth0 } from '@auth0/auth0-react';
import { usePlatformConnections } from '../hooks/usePlatformConnections'; 


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
        blueSkyService
    } = usePlatformConnections();


  const [postText, setPostText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { isLoading: isAuth0Loading } = useAuth0(); // Destructuring with renaming
  

  const unaddedPlatforms = Object.values(platforms).filter(p => !p.isAdded);
  const addedPlatforms = Object.values(platforms).filter(p=>p.isAdded);
  const selectedPlatforms = Object.values(platforms).filter(p => p.isSelected);
  const readyToPost = selectedPlatforms.length > 0;


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