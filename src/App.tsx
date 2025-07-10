// src/App.tsx

import SocialPostingInterface from './components/SocialPostingInterface';
import { LoginPage } from './pages/LoginPage';
import { authClient } from './clients/authClient';

//TODO: Center the chat box more vertically
//TODO: Add Threads, Notes
//TODO: Add the ad link
//TODO: Add multi-media
//TODO: Add pay differentiator
//TODO: If an app fails to post, do we clear the post area?
//TODO: Make it so in invalid connect during post, platform becomes logged out
//TODO: Don't let long email squish initial icon
//TODO: Consider visual signal for posts that worked vs. didn't
//TODO: Add the app friend url for extra characters
//TODO: Remove old env files and credentials

function App() {
  // Use Better Auth's hook to get the session
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-xl text-slate-600">Loading Session...</div>
      </div>
    );
  }

  // If we're not logged in and not on a login-related page, show the login page.
  if (!session?.session) {
    return <LoginPage />;
  }

  // If we are logged in, show the main application.
  return <SocialPostingInterface />;
}

export default App;