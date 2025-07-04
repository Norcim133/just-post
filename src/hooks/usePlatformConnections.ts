import { useState, useEffect, useMemo,  } from 'react';
import { type Platforms, PLATFORM_CONFIGS } from '../types';
import { BlueSkyService } from '../services/bluesky';
import { BlueSkyStorageService } from '../services/storage';
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



    // This map links a platform ID to the function that starts its connection process.
    const platformConnectActions = useMemo(() => ({
        bluesky: () => {
            setActiveModal('blueSkyLogin');
        },
        twitter: () => {
        // For Twitter, "connecting" means starting the OAuth redirect flow.
        twitterService.login();
        },

        // linkedin: () => { linkedinService.login(); }
    }), [twitterService]); // Dependency array ensures this object is stable.


    const handleUserTriggeredConnect = (platformId: string) => {
        // Check if the platformId is a valid key in our actions map
        if (platformId in platformConnectActions) {
            const connectAction = platformConnectActions[platformId as keyof typeof platformConnectActions];            
            connectAction();
        }
    };


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
                const storedBlueSky = BlueSkyStorageService.getBlueSkyCredentials();
                if (storedBlueSky) {
                    const success = await blueSkyService.login(storedBlueSky);
                    handleInitConnect('bluesky', success)
                }
            }

            // TWITTER
            if (getInitialState().twitter.isAdded) {
                if (!twitterService.isAuthenticated()) {
                    await twitterService.login()
                }
                handleInitConnect('twitter', twitterService.isAuthenticated())
            }

            setIsAppLoading(false);
        };
        initConnections();
    }, [blueSkyService, twitterService]);


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
        setIsAppLoading(true);
        const success = await blueSkyService.login(credentials);
        if (success) {
            BlueSkyStorageService.saveBlueSkyCredentials(credentials);    
        }
            // NOW we update the state, because we know it succeeded.
        setPlatforms(prev => ({
            ...prev,
            bluesky: { ...prev.bluesky, isConnected: success, isSelected: success }
        }));
        setActiveModal('none');
        setIsAppLoading(false);
        return success;
    };

    useEffect(() => {
        // This function will be called if we find the right URL parameters.
        const processTwitterCallback = async (code: string, state: string) => {
            setIsAppLoading(true);

            // Tell the TwitterService expert to handle the complex callback logic.
            const success = await twitterService.handleCallback(code, state);

            // Based on the result, update the application state.
            setPlatforms(prev => ({
            ...prev,
            twitter: {
                ...prev.twitter,
                isConnected: success,
                isAdded: true, // If we're handling a callback, it must have been added.
                isSelected: success // Select it if the connection was successful.
            }
            }));
            
            // Clean up the URL in the browser's address bar so the user doesn't
            // see the code and state anymore. This also prevents re-processing on refresh.
            window.history.replaceState({}, document.title, window.location.pathname);

            setIsAppLoading(false);
        };

        // Check the current URL for the parameters that Twitter sends on redirect.
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');

        // If both `code` and `state` exist, we know we're on the callback redirect.
        if (code && state) {
            processTwitterCallback(code, state);
        }
    }, [twitterService]);

    return {
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
        };
}