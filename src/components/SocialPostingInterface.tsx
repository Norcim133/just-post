import React, { useState, useEffect } from 'react';
import { Plus, Settings, Send, Check } from 'lucide-react';
import { BlueSkyService } from '../services/bluesky';
import { StorageService } from '../services/storage';
import { useTwitterService } from '../services/twitter-v2';
import { BlueSkyCredentials, PLATFORM_CONFIGS, PlatformConfig } from '../types';
import LoginModal from './LoginModal';
import AddPlatformModal from './AddPlatformModal'
import PlatformPreview from './PostPreview';
import { useAuth0 } from "@auth0/auth0-react";

const SocialPostingInterface = () => {
  const { isAuthenticated: isAuth0Authenticated, user, logout, loginWithRedirect, isLoading: isAuth0Loading } = useAuth0();
  const [postText, setPostText] = useState('');
  const [addedPlatforms, setAddedPlatforms] = useState<PlatformConfig[]>([
    PLATFORM_CONFIGS.bluesky  // Direct reference to the config object
  ]);
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    bluesky: true,
  });
  const [isPosting, setIsPosting] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [blueSkyService] = useState(new BlueSkyService());
  const twitterService = useTwitterService();
  const [showAddPlatform, setShowAddPlatform] = useState(false);
  const [twitterIsAuthenticated, setTwitterIsAuthenticated] = useState(false);


  useEffect(() => {
    const initAuth = async () => {
      const stored = StorageService.getBlueSkyCredentials();
      if (stored) {
        const success = await blueSkyService.login(stored);
        setIsAuthenticated(success);
      }
    };
    initAuth();
  }, [blueSkyService]);

  useEffect(() => {
    // Check if already authenticated with server-side tokens
    const checkTwitterAuth = async () => {
      if (isAuth0Authenticated && user?.sub) {
        const isConnected = await twitterService.checkConnection();
        setTwitterIsAuthenticated(isConnected);
        
        // If connected, ensure Twitter is in added platforms
        if (isConnected && !addedPlatforms.find(p => p.id === 'twitter')) {
          setAddedPlatforms(prev => [...prev, PLATFORM_CONFIGS.twitter]);
          setSelectedPlatforms(prev => ({ ...prev, twitter: true }));
        }
      }
    };
    checkTwitterAuth();
  }, [twitterService, isAuth0Authenticated, user]);

  useEffect(() => {
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const platform = urlParams.get('platform');
    
    // Handle Auth0 redirect with platform intent
    if (platform === 'twitter' && isAuth0Authenticated && !code) {
      // User just logged in via Auth0 and wants to connect Twitter
      setShowAddPlatform(true);
      // Clear the platform parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Handle Twitter OAuth callback
    if (code && state && isAuth0Authenticated && user?.sub) {
      // Prevent double processing
      const processed = sessionStorage.getItem('twitter-callback-processed');
      if (processed === code) {
        console.log('Twitter callback already processed');
        return;
      }
      
      // Mark as processed
      sessionStorage.setItem('twitter-callback-processed', code);
      
      // Handle the callback
      const handleTwitterCallback = async () => {
        console.log('Processing Twitter callback...');
        console.log('Auth0 authenticated:', isAuth0Authenticated);
        console.log('User:', user);
        
        try {
          const success = await twitterService.handleCallback(code, state);
          
          if (success) {
            console.log('Twitter authentication successful!');
            setTwitterIsAuthenticated(true);
            
            // Add Twitter to added platforms if not already there
            if (!addedPlatforms.find(p => p.id === 'twitter')) {
              setAddedPlatforms([...addedPlatforms, PLATFORM_CONFIGS.twitter]);
            }
            
            // Also add Twitter to selected platforms
            setSelectedPlatforms(prev => ({
              ...prev,
              twitter: true
            }));
            
            // Clear the processed flag after success
            sessionStorage.removeItem('twitter-callback-processed');
          } else {
            console.error('Twitter authentication failed');
            alert('Failed to authenticate with Twitter. Please try again.');
          }
        } catch (error) {
          console.error('Twitter callback error:', error);
          alert('Failed to authenticate with Twitter. Please try again.');
        } finally {
          // Clear the URL params
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };
      
      handleTwitterCallback();
    }
  }, [twitterService, addedPlatforms, isAuth0Authenticated, user]);


  const handleLogin = async (credentials: BlueSkyCredentials) => {
    const success = await blueSkyService.login(credentials);
    if (success) {
      StorageService.saveBlueSkyCredentials(credentials);
      setIsAuthenticated(true);
      setShowLogin(false);
    }
    return success;
  };

  const handlePost = async () => {
    if (!postText.trim() || isPosting) return;
    
    // Check if any platforms are selected
    const selectedPlatformIds = Object.entries(selectedPlatforms)
      .filter(([_, isSelected]) => isSelected)
      .map(([platformId, _]) => platformId);
    
    if (selectedPlatformIds.length === 0) {
      alert('Please select at least one platform to post to');
      return;
    }

    setIsPosting(true);
    const results = [];
    
    try {
      // Post to each selected platform
      for (const platformId of selectedPlatformIds) {
        if (platformId === 'bluesky' && isAuthenticated) {
          const result = await blueSkyService.createPost(postText);
          results.push({ platform: 'BlueSky', ...result });
        } else if (platformId === 'twitter' && twitterIsAuthenticated) {
          const result = await twitterService.createTwitterPost(postText);
          results.push({ platform: 'Twitter/X', ...result });
        }
      }
      
      // Check results
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      if (successful.length > 0) {
        setPostText('');
      }
      
      // Show results
      if (failed.length === 0) {
        alert(`Posted successfully to ${successful.map(r => r.platform).join(', ')}!`);
      } else if (successful.length > 0) {
        alert(`Posted to ${successful.map(r => r.platform).join(', ')}. Failed: ${failed.map(r => r.platform).join(', ')}`);
      } else {
        alert('All posts failed');
      }
    } catch (error) {
      alert('Post failed: Unknown error');
    }
    setIsPosting(false);
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => ({
      ...prev,
      [platformId]: !prev[platformId as keyof typeof prev]
    }));
  };


  const toggleAddPlatform = () => {
    setShowAddPlatform(true)
  }
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Show loading state while Auth0 initializes
  if (isAuth0Loading) {
    return (
      <div className="flex h-screen bg-slate-50 items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">

      {/* Left Sidebar */}
      <div className="w-72 bg-white shadow-sm border-r border-slate-100 flex flex-col" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' }}>
        
        {/* Add Account Button */}
        <div className="p-6 pb-4">
          <button
            onClick={toggleAddPlatform}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 font-medium shadow-sm"
            >
            <Plus size={18} />
            Add Account
          </button>
        </div>

        {/* Connected Platforms */}
        <div className="flex-1 px-6 pb-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 tracking-wide uppercase">Connected Accounts</h3>

          <div className="space-y-3">

            {addedPlatforms.map(platformConfig => (
              <div 
                key={platformConfig.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-200 cursor-pointer bg-white"
              >
                <div className={`w-10 h-10 ${platformConfig.color} rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-sm`}>
                  {platformConfig.icon}
                </div>
                <span className="flex-1 font-medium text-slate-700" style={{ fontSize: '15px', fontWeight: '500' }}>{platformConfig.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlatform(platformConfig.id);
                  }}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                    selectedPlatforms[platformConfig.id as keyof typeof selectedPlatforms]
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' 
                      : 'border-slate-300 hover:border-slate-400 bg-white'
                  }`}
                >
                  {selectedPlatforms[platformConfig.id as keyof typeof selectedPlatforms] && <Check size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* User Account */}
        <div className="p-6 pt-4 border-t border-slate-100 bg-slate-50 relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-200 bg-white"
          >
            <div className="w-10 h-10 bg-slate-400 rounded-xl flex items-center justify-center text-white font-semibold shadow-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-slate-700" style={{ fontSize: '15px', fontWeight: '600' }}>
                {user?.name || 'User'}
              </div>
              <div className="text-sm text-slate-500" style={{ fontSize: '13px', fontWeight: '400' }}>
                {user?.email || 'Not logged in'}
              </div>
            </div>
            <Settings size={18} className="text-slate-400" />
          </button>

          {/* User Menu Popup */}
          {showUserMenu && (
            <div className="absolute bottom-full left-6 right-6 mb-2 bg-white rounded-xl shadow-lg border border-slate-200 p-4 space-y-3">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Auth0 Status:</span>
                  <span className={`font-medium ${isAuth0Authenticated ? 'text-green-600' : 'text-red-600'}`}>
                    {isAuth0Authenticated ? 'Authenticated' : 'Not Authenticated'}
                  </span>
                </div>
                {user && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600">User ID:</span>
                      <span className="font-mono text-xs text-slate-700">{user.sub}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Provider:</span>
                      <span className="text-slate-700">{user.sub?.split('|')[0]}</span>
                    </div>
                  </>
                )}
              </div>
              <hr className="border-slate-200" />
              {isAuth0Authenticated ? (
                <button
                  onClick={() => {
                    logout({ logoutParams: { returnTo: window.location.origin } });
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => {
                    loginWithRedirect();
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  Login with Auth0
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      

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
                  disabled={!postText.trim() || isPosting}
                >
                  <Send size={18} />
                  {isPosting ? 'Posting...' : isAuthenticated ? 'Post To All' : 'Login & Post'}
                </button>
              </div>
            </div>
          </div>

          {/* Platform Status */}
          <div className="mt-6 flex flex-wrap gap-3">
            {addedPlatforms.map(platformConfig => (
              selectedPlatforms[platformConfig.id as keyof typeof selectedPlatforms] && (
                <div key={platformConfig.id} className="flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-medium shadow-sm">
                  <div className={`w-5 h-5 ${platformConfig.color} rounded-lg flex items-center justify-center text-white text-xs font-semibold`}>
                    {platformConfig.icon}
                  </div>
                  {platformConfig.name}
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

        {addedPlatforms
          .filter(platformConfig => selectedPlatforms[platformConfig.id as keyof typeof selectedPlatforms])
          .map(platformConfig => (
            <PlatformPreview
              key={platformConfig.id}
              text={postText}
              platformConfig={platformConfig}
            />
          ))}

    </div>
      </div>
    
      <AddPlatformModal
        isOpen={showAddPlatform}
        onClose={() => setShowAddPlatform(false)}
        platformConfigs={PLATFORM_CONFIGS}
        addedPlatforms={addedPlatforms}
      />

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={handleLogin}
      />
    </div>
  );
};

export default SocialPostingInterface;