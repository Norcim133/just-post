import { useState, useEffect, useMemo,  } from 'react';
import { type Platforms, PLATFORM_CONFIGS } from '../types';
import { BlueSkyService } from '../services/bluesky';
import { BlueSkyStorageService } from '../services/storage';
import { BlueSkyCredentials } from '../types';
import { TwitterService } from '../services/twitter';
import { useAuth0 } from '@auth0/auth0-react';

import { getPlatformsAdded, getPlatformSelections, savePlatformAdditions, savePlatformSelections } from '../services/storage';

export interface UsePlatformConnectionsReturn {
  platforms: Platforms;
  activeModal: 'none' | 'addPlatform' | 'blueSkyLogin' | 'twitterLoginHelp';
  isAppLoading: boolean;
  togglePlatformSelect: (platformId: string) => void;
  handleOpenAddPlatformModal: () => void;
  handleUserTriggeredConnect: (platformId: string) => void;
  handleAddPlatform: (platformId: string) => void;
  handleBlueSkyLogin: (credentials: BlueSkyCredentials) => Promise<boolean>;
  handleMasterLogout: () => void;
  setActiveModal: React.Dispatch<React.SetStateAction<'none' | 'addPlatform' | 'blueSkyLogin' | 'twitterLoginHelp'>>;
  blueSkyService: BlueSkyService;
  twitterService: TwitterService;
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



export function usePlatformConnections(): UsePlatformConnectionsReturn {

     // Does init on first load (due to useState doing a function approach) to get saved selections from storage
    const [platforms, setPlatforms] = useState<Platforms>(getInitialState);

    type ModalType = 'none' | 'addPlatform' | 'blueSkyLogin' | 'twitterLoginHelp';
    const [activeModal, setActiveModal] = useState<ModalType>('none');
    const [isAppLoading, setIsAppLoading] = useState(true);

    // --- SERVICES ---
    const [blueSkyService] = useState(() => new BlueSkyService());
    const [twitterService] = useState(() => new TwitterService());



    const { logout } = useAuth0();


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
        // Check if the platformId is a valid key in our actions 
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
            if (platforms.bluesky.isAdded) {
                const storedBlueSky = BlueSkyStorageService.getBlueSkyCredentials();
                if (storedBlueSky) {
                    const success = await blueSkyService.login(storedBlueSky);
                    handleInitConnect('bluesky', success)
                }
            }

            // TWITTER
            if (platforms.twitter.isAdded) {
                // The service constructor already loaded tokens from localStorage.
                // We just need to check if it's considered authenticated. No redirect needed.
                handleInitConnect('twitter', twitterService.isAuthenticated());
            }

            setIsAppLoading(false);
        };
        initConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    

    // const handleLogoutPlatform = (platformId: string) => {
    //   if (platformId === 'bluesky') {
    //     blueSkyService.logout();
    //   } else if (platformId === 'twitter') {
    //     twitterService.logout();
    //   }
      
    //   setPlatforms(prev => ({
    //     ...prev,
    //     [platformId]: {
    //       ...prev[platformId],
    //       isConnected: false, 
    //       isSelected: false,  
    //     }
    //   }));
    // };

    const handleMasterLogout = async () => {
        const connectedPlatforms = Object.values(platforms).filter(p => p.isConnected);

        // 1. Create an array of logout promises from all connected platforms.
        const logoutPromises = connectedPlatforms.map(platform => {
            if (platform.id === 'twitter') {
                return twitterService.logout();
            }
            if (platform.id === 'bluesky') {
                return blueSkyService.logout();
            }
            // Add other platforms here in the future
            return Promise.resolve(); // Return a resolved promise for unhandled platforms
        });

        try {
            // 2. Wait for ALL platform logout operations (token revocations) to complete.
            await Promise.all(logoutPromises);
            console.log("All platform tokens revoked successfully.");
        } catch (error) {
            console.error("An error occurred during platform token revocation:", error);
            // We proceed to the main logout even if one of the revocations failed.
        }

        // 3. Now that all tokens are revoked, reset the local UI state for all platforms.
        setPlatforms(prev => {
            const newPlatforms = { ...prev };
            connectedPlatforms.forEach(p => {
                newPlatforms[p.id] = { ...newPlatforms[p.id], isConnected: false, isSelected: false };
            });
            return newPlatforms;
        });


        // Auth0 logout
        logout({ logoutParams: { returnTo: window.location.origin } })
    }


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
        const processCallback = async (platform: string, code: string, state: string) => {
            setIsAppLoading(true);
            let success = false;

            // --- ROUTER LOGIC ---
            // Delegate to the correct service based on the platform from the state token
            if (platform === 'twitter') {
                success = await twitterService.handleCallback(code, state);
                setPlatforms(prev => ({
                    ...prev,
                    twitter: {
                        ...prev.twitter,
                        isConnected: success,
                        isAdded: true,
                        isSelected: success,
                    },
                }));
            } 
            // else if (platform === 'linkedin') {
            //   success = await linkedInService.handleCallback(code, state);
            //   setPlatforms(...)
            // }

            setIsAppLoading(false);
        };

        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const prefix = 'justpost-';

        if (code && state && state.startsWith(prefix)) {
            // Clean the URL immediately to prevent re-runs
            window.history.replaceState({}, document.title, window.location.pathname);
            
            try {
                // Decode the state token to find out which platform it is
                const encodedJson = state.substring(prefix.length);
                const decodedState = JSON.parse(atob(encodedJson));
                const platform = decodedState.platform;

                if (platform) {
                    // We have a valid platform, proceed with processing
                    processCallback(platform, code, state);
                } else {
                    console.error("Callback received, but state token is missing 'platform' property.");
                }
            } catch (error) {
                console.error("Failed to parse state token from callback URL.", error);
            }
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
        handleMasterLogout,
        blueSkyService,
        twitterService
        };
}