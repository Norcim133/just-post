import { useState, useEffect, useMemo,  } from 'react';
import { type Platforms, PLATFORM_CONFIGS } from '../types';
import { BlueSkyService } from '../clients/bluesky';
import { BlueSkyCredentials } from '../types';
import { TwitterService } from '../clients/twitter';
import { LinkedInService } from '../clients/linkedin'
import { ThreadsService } from '../clients/threads';
import { authClient } from '../clients/authClient';

import { getPlatformsAdded, getPlatformSelections, savePlatformAdditions, savePlatformSelections } from '../clients/storage';

export interface UsePlatformConnectionsReturn {
  platforms: Platforms;
  activeModal: 'none' | 'addPlatform' | 'blueSkyLogin' | 'twitterLoginHelp';
  isAppLoading: boolean;
  togglePlatformSelect: (platformId: string) => void;
  handleOpenAddPlatformModal: () => void;
  handleUserTriggeredConnect: (platformId: string) => void;
  handleAddPlatform: (platformId: string) => void;
  handleBlueSkyLogin: (credentials: BlueSkyCredentials) => Promise<boolean>;
  setActiveModal: React.Dispatch<React.SetStateAction<'none' | 'addPlatform' | 'blueSkyLogin' | 'twitterLoginHelp'>>;
  blueSkyService: BlueSkyService;
  twitterService: TwitterService;
  linkedInService: LinkedInService;
  threadsService: ThreadsService;
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
    const { isPending } = authClient.useSession();

     // Does init on first load (due to useState doing a function approach) to get saved selections from storage
    const [platforms, setPlatforms] = useState<Platforms>(getInitialState);

    type ModalType = 'none' | 'addPlatform' | 'blueSkyLogin' | 'twitterLoginHelp';
    const [activeModal, setActiveModal] = useState<ModalType>('none');
    const [isAppLoading, setIsAppLoading] = useState(true);

    // --- SERVICES ---
    const [blueSkyService] = useState(() => new BlueSkyService());
    const [twitterService] = useState(() => new TwitterService());
    const [linkedInService] = useState(() => new LinkedInService());
    const [threadsService] = useState(() => new ThreadsService());


    // This map links a platform ID to the function that starts its connection process.
    const platformConnectActions = useMemo(() => ({
        bluesky: () => {
            setActiveModal('blueSkyLogin');
        },
        twitter: async () => {
        // For Twitter, "connecting" means starting the PKCE redirect flow.
            const url = await twitterService.getLoginUrl();
            if (url) {
                window.location.href = url;
            } else {
                // Handle the error gracefully, e.g., show an alert
                alert("Could not connect to Twitter at this time. Please try again later.");
            }

        },
        linkedin: async () => {
            const url = await linkedInService.getLoginUrl();
            if(url) {
                window.location.href = url;
            } else {
                alert("Could not connect to LinkedIn at this time. Please try again later.");
            }
        },

        threads: async () => {
            const url = await threadsService.getLoginUrl();
            if(url) {
                window.location.href = url;
            } else {
                alert("Could not connect to Threads at this time. Please try again later.");
            }
        }

    }), [linkedInService, twitterService, threadsService]); // Dependency array ensures this object is stable.


    const handleUserTriggeredConnect = (platformId: string) => {
        // Check if the platformId is a valid key in our actions 
        if (platformId in platformConnectActions) {
            const connectAction = platformConnectActions[platformId as keyof typeof platformConnectActions];            
            connectAction();
        }
    };


    // --- MOUNTING AUTH ---
    useEffect(() => {

        if (isPending) {
            return; // Exit early if auth is still working.
        }

        const initConnections = async () => {
            
            const statusChecks = Object.values(platforms)
                .filter(p => p.isAdded)
                .map(async p => {
                    switch (p.id) {
                        case 'bluesky': return blueSkyService.getStatus().then(res => ({ id: 'bluesky', ...res }));
                        case 'twitter': return twitterService.getStatus().then(res => ({ id: 'twitter', ...res }));
                        case 'linkedin': return linkedInService.getStatus().then(res => ({ id: 'linkedin', ...res }));
                        case 'threads': return threadsService.getStatus().then(res => ({ id: 'threads', ...res }));
                        default: return Promise.resolve(null);
                    }
                });

            // 2. Run all the network requests in parallel.
            const results = await Promise.all(statusChecks);

            setPlatforms(prev => {
                const newPlatforms = { ...prev };
                results.forEach(result => {
                    if (result) {
                        newPlatforms[result.id].isConnected = result.isConnected;
                    }
                });
                return newPlatforms;
            });
            
            setIsAppLoading(false);
        };
        initConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPending, blueSkyService, twitterService, linkedInService, threadsService]);


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


    const handleOpenAddPlatformModal = () => {
        setActiveModal('addPlatform')
    }
    
    const handleBlueSkyLogin = async (credentials: BlueSkyCredentials) => {
        setIsAppLoading(true);

        const success = await blueSkyService.login(credentials);
        
        setPlatforms(prev => ({
            ...prev,
            bluesky: { ...prev.bluesky, isConnected: success, isSelected: success }
        }));

        setActiveModal('none');
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
        handleUserTriggeredConnect,
        handleAddPlatform,
        handleBlueSkyLogin,
        blueSkyService,
        twitterService,
        linkedInService,
        threadsService
        };
}