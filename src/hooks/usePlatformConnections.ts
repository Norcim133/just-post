import { useState, useEffect } from 'react';
import { type Platforms, PLATFORM_CONFIGS } from '../types';
import { BlueSkyService } from '../services/bluesky';
import { StorageService } from '../services/storage';
import { BlueSkyCredentials } from '../types';
import { TwitterService } from '../services/twitter';

import { getPlatformsAdded, getPlatformSelections, savePlatformAdditions, savePlatformSelections } from '../services/storage';

export interface UsePlatformConnectionsReturn {
  platforms: Platforms;
  activeModal: 'none' | 'blueSkyLogin';
  isAppLoading: boolean;
  //connectPlatform: (platformId: string, credentials?: any) => Promise<void>;
  //addPlatform: (platformId: string) => void;
  //selectPlatform: (platformId: string) => void;
  //disconnectPlatform: (platformId: string) => void;
  //closeModal: () => void;
}

const getInitialState = (): Platforms => {
    {
        
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
    }
}

export function usePlatformConnections() {

     // Does init on first load (due to useState doing a function approach) to get saved selections from storage
    const [platforms, setPlatforms] = useState<Platforms>(getInitialState);

    type ModalType = 'none' | 'addPlatform' | 'blueSkyLogin' | 'twitterLoginHelp';
    const [activeModal, setActiveModal] = useState<ModalType>('none');
    const [isAppLoading, setIsAppLoading] = useState(true);

    // --- SERVICES ---
    const [blueSkyService] = useState(() => new BlueSkyService());
    const [twitterService] = useState(() => new TwitterService());

    // --- MOUNTING AUTH ---

    useEffect(() => {

        const handleInitConnect = (platformId: string, isConnected: boolean) => {
            setPlatforms(prev => ({
                ...prev,
                [platformId]: {
                    ...prev[platformId],
                    isConnected: isConnected,
                }
            }));
        }
        const initConnections = async () => {
        
            // BLUESKY
            if (getInitialState().bluesky.isAdded) {
                const storedBlueSky = StorageService.getBlueSkyCredentials();
                if (storedBlueSky) {
                const success = await blueSkyService.login(storedBlueSky);

                handleInitConnect('bluesky', success)
                }
            }

            // TWITTER



            setIsAppLoading(false);
        };
        initConnections();
    }, [blueSkyService]);


    // SAVE ADDED PLATFORMS
    useEffect(() => {
        const addedPlatformsToSave: Record<string, boolean> = {};
        Object.keys(platforms).forEach(platformId => {
        addedPlatformsToSave[platformId] = platforms[platformId].isAdded;
        });
        savePlatformAdditions(addedPlatformsToSave);

        const platformSelectionsToSave: Record<string, boolean> = {};
        Object.keys(platforms).forEach(platformId => {
        platformSelectionsToSave[platformId] = platforms[platformId].isSelected;
        });
        savePlatformSelections(platformSelectionsToSave);
    }, [platforms]);
    

    // TOGGLE SELECTED PLATFORMS
    const togglePlatformSelect = (platformId: string) => {
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

    // When user triggeres connection automatically select platform as a default
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
          isConnected: false, 
          isSelected: false,  
        }
      }));
    };


    const handleOpenAddPlatformModal = () => {
        setActiveModal('addPlatform')
    }
    


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

    return {
        platforms,
        activeModal,
        setActiveModal,
        isAppLoading,
        togglePlatformSelect,
        handleOpenAddPlatformModal,
        handleConnect,
        handleAddPlatform,
        handleBlueSkyLogin,
        blueSkyService
        };
}