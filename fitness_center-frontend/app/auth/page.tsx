'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page
    router.push('/auth/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <div className="text-2xl text-white">Redirecting to login...</div>
    </div>
  );
};

export default AuthPage;
