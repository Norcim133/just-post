const STORAGE_KEYS = {
  BLUESKY_CREDENTIALS: 'just-post-bluesky-credentials',
  TWITTER_LOCAL_CREDENTIALS: 'just-post-twitter-local-credentials',
  TWITTER_SESSION_CREDENTIALS: 'just-post-twitter-session-credentials',
  PLATFORM_ADDITIONS_KEY: 'just-post-platform-additions',
  PLATFORM_SELECTIONS_KEY: 'just-post-platform-selections'
} as const;

// ... (get/save PlatformAdditions and PlatformSelections functions remain the same) ...
export const getPlatformsAdded = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PLATFORM_ADDITIONS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to getPlatformsAdded');
    return null;
  }

}

export const savePlatformAdditions = (addedPlatforms: Record<string, boolean>) => {
  try {
    localStorage.setItem(
      STORAGE_KEYS.PLATFORM_ADDITIONS_KEY,
      JSON.stringify(addedPlatforms)
    ) 
  } catch (error) {
    console.error('Failed to savePlatformAdditions')
  }
}

export const getPlatformSelections = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PLATFORM_SELECTIONS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to getPlatformSelections');
    return null;
  }

}

export const savePlatformSelections = (platformSelections: Record<string, boolean>) => {
  try {
    localStorage.setItem(
      STORAGE_KEYS.PLATFORM_SELECTIONS_KEY,
      JSON.stringify(platformSelections)
    ) 
  } catch (error) {
    console.error('Failed to savePlatformSelections')
  }
}
