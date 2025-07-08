import { useState } from 'react';
import { authClient } from '../clients/authClient';

export const LoginPage = (): JSX.Element => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const { error } = await authClient.signIn.email({
            email,
            password,
            callbackURL: "/"
        }, {
            onSuccess: () => { window.location.href = '/'; }
        });

        if (error && error.message)
            { setError(error.message); }
        setIsSubmitting(false);
    };
    
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);
        const { error } = await authClient.signUp.email({
            email,
            password,
            name: email,
            callbackURL: "/"
        }, {
            onSuccess: () => {
                window.location.href = '/';
                setIsSubmitting(false);
            },
            onError: (ctx) => {
                alert(ctx.error.message);
                console.log(error)
                setIsSubmitting(true);
            }

        });

    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Welcome
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Sign in or create an account to continue
                    </p>
                </div>
                <form className="mt-8 space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                            Email address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-4 pt-4">
                        <button
                            type="submit"
                            onClick={handleSignIn}
                            disabled={isSubmitting}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Working...' : 'Sign In'}
                        </button>
                        <button
                            type="submit"
                            onClick={handleSignUp}
                            disabled={isSubmitting}
                            className="w-full flex justify-center py-2 px-4 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50"
                        >
                            {isSubmitting ? '...' : 'Sign Up'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};