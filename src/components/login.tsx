'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const router = useRouter();

  const handleAuthSuccess = () => {
    router.push('/');
  };

  const handleEmailPasswordSignUp = async () => {
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      handleAuthSuccess();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleEmailPasswordLogin = async () => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      handleAuthSuccess();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSigningUp) {
      handleEmailPasswordSignUp();
    } else {
      handleEmailPasswordLogin();
    }
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
            <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            {isSigningUp ? 'Create an Account' : 'Welcome Back!'}
            </h1>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="space-y-4">
                <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md"
                    required
                />
                <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md"
                    required
                />
              </div>

              {isSigningUp ? (
                  <Button type="submit" className="w-full">Sign Up</Button>
              ) : (
                  <Button type="submit" className="w-full">Login</Button>
              )}
            </form>


            <p className="text-sm text-center text-gray-600 dark:text-gray-300">
            {isSigningUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => setIsSigningUp(!isSigningUp)} className="font-medium text-blue-600 hover:underline">
                {isSigningUp ? 'Login' : 'Sign Up'}
            </button>
            </p>
      </div>
    </div>
  );
}
