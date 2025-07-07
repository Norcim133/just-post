// src/App.tsx

import SocialPostingInterface from './components/SocialPostingInterface';
import { LoginPage } from './pages/LoginPage';
import { authClient } from './lib/authClient';

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