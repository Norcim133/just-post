import { useState, useEffect, useCallback } from 'react';
import { BlueSkyService } from '../services/bluesky';
import { TwitterService } from '../services/twitter';
import { StorageService } from '../services/storage';
import { type Platforms, type PlatformState, PLATFORM_CONFIGS } from '../types';

// Define the initial state for all platforms
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

    const savedAdditions = getPlatformsAdded();
    const savedSelections = getPlatformSelections();


    Object.keys(initialConfigs).forEach(platformId => {
        if (savedAdditions && savedAdditions[platformId] !== undefined) {
          initialConfigs[platformId].isAdded = savedAdditions[platformId];
        }

        if (savedSelections && initialConfigs[platformId].isAdded && savedSelections[platformId] !== undefined) {
          initialConfigs[platformId].isSelected = savedSelections[platformId];
        }

      });
    
    return initialConfigs;
  });

export function usePlatformConnections() {
  const [platforms, setPlatforms] = useState<Platforms>(initialState);
  const [activeModal, setActiveModal] = useState<'none' | 'blueSkyLogin'>('none');

  // Instantiate services only once
  const [blueSkyService] = useState(() => new BlueSkyService());
  const [twitterService] = useState(() => new TwitterService());

  // --- REFRESH/INITIAL AUTH LOGIC ---
  useEffect(() => {
    const initConnections = async () => {
      // Check BlueSky
      const storedBlueSky = StorageService.getBlueSkyCredentials();
      if (storedBlueSky) {
        const success = await blueSkyService.login(storedBlueSky);
        if (success) {
          setPlatforms(p => ({ ...p, bluesky: { ...p.bluesky, isConnected: true, isAdded: true } }));
        }
      }
      
      // TODO: Check Twitter (this will involve its own service method)
      // const twitterConnected = await twitterService.checkInitialAuth();
      // if (twitterConnected) { ... }
    };
    initConnections();
  }, [blueSkyService, twitterService]); // Dependencies

  // --- HANDLER FUNCTIONS ---
  const connectPlatform = useCallback(async (platformId: string, credentials?: any) => {
    let success = false;
    switch (platformId) {
      case 'bluesky':
        // If we need credentials, we open the modal.
        if (!credentials) {
            setActiveModal('blueSkyLogin');
            return; // Stop here, the modal will call this function again with credentials
        }
        success = await blueSkyService.login(credentials);
        if (success) StorageService.saveBlueSkyCredentials(credentials);
        break;

      case 'twitter':
        // Twitter's login is a redirect, it doesn't need a modal or credentials up front.
        twitterService.login();
        // The callback logic will handle setting the connection state.
        return; 
        
      default:
        console.warn(`Connection for ${platformId} not implemented.`);
        return;
    }

    if (success) {
      setPlatforms(p => ({ ...p, [platformId]: { ...p[platformId], isConnected: true, isAdded: true, isSelected: true } }));
      setActiveModal('none'); // Close modal on success
    } else {
        // Handle login failure (e.g., show an error)
    }
  }, [blueSkyService, twitterService]); // Dependencies for useCallback

  const selectPlatform = useCallback((platformId: string) => {
      setPlatforms(p => ({
          ...p,
          [platformId]: { ...p[platformId], isSelected: !p[platformId].isSelected }
      }));
  }, []);

  // Return a clean API for the UI component to use
  return { 
      platforms, 
      connectPlatform, 
      selectPlatform,
      activeModal,
      setActiveModal
  };
}