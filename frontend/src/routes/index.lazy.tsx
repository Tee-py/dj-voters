import { Button } from '@/components/ui/button';
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowRight, CheckCircle, UserPlus, VoteIcon } from 'lucide-react';
import { type ReactNode, useEffect } from 'react';

export const Route = createLazyFileRoute('/')({
  component: Index,
});

function FeatureItem({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center space-x-3">
      {icon}
      <span className="text-lg">{title}</span>
    </div>
  );
}

function Index() {
  const navigate = useNavigate({ from: '/' });

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    if (accessToken && refreshToken) {
      navigate({ to: '/dashboard' });
    }
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4 py-16">
      <div className="text-center mb-16 max-w-2xl">
        <h1 className="text-4xl font-bold mb-6 text-black">Student Voter Management</h1>
        <p className="text-xl text-gray-600">Secure, efficient, and user-friendly student voting system.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <FeatureItem icon={<VoteIcon className="w-6 h-6 text-gray-800" />} title="Easy Registration" />
        <FeatureItem icon={<CheckCircle className="w-6 h-6 text-gray-800" />} title="Instant Verification" />
        <FeatureItem icon={<UserPlus className="w-6 h-6 text-gray-800" />} title="Data Management" />
      </div>

      <Button
        onClick={() => navigate({ to: '/authenticate', viewTransition: true })}
        className="group relative inline-flex items-center justify-center overflow-hidden rounded-md bg-black px-12 py-6 text-2xl font-bold text-white transition-all duration-300 ease-out hover:bg-gray-800"
      >
        <span className="mr-12">Start Now</span>
        <span className="absolute right-0 translate-x-full transition-transform duration-300 group-hover:-translate-x-full">
          <ArrowRight className="w-8 h-8" />
        </span>
      </Button>
    </div>
  );
}
