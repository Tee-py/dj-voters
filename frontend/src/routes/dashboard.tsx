import { Link, Outlet, createFileRoute, useLocation, useNavigate } from '@tanstack/react-router';
import { Home, LogOut, type LucideProps, Menu, Users } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import Uppy from '@uppy/core';
import { Dashboard, useUppyEvent } from '@uppy/react';
import XHRUpload from '@uppy/xhr-upload';

import { UPLOAD_FILES_URL } from '@/lib/api';

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
});

const MAX_FILES = 10;
const MIN_FILE_SIZE = 10_240; // 10kB
const MAX_TOTAL_FILE_SIZE = 20_971_520; // 20MB
const ALLOWED_FILE_TYPES = ['.csv', '.xlsx', '.xls'];

function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        minFileSize: MIN_FILE_SIZE,
        maxNumberOfFiles: MAX_FILES,
        allowedFileTypes: ALLOWED_FILE_TYPES,
        maxTotalFileSize: MAX_TOTAL_FILE_SIZE,
      },
      autoProceed: false,
    }).use(XHRUpload, {
      formData: true,
      fieldName: 'file',
      endpoint: UPLOAD_FILES_URL,
      headers: {
        authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    }),
  );

  useUppyEvent(uppy, 'upload-success', (file) => {
    toast.success(`${file?.name} uploaded successfully`);
  });

  useUppyEvent(uppy, 'upload-error', (file, error) => {
    toast.error(`Failed to upload ${file?.name}: ${error}`);
  });

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    if (!accessToken || !refreshToken) {
      navigate({ to: '/authenticate' });
    } else {
      setIsAuthenticated(true);
    }
  }, [navigate]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate({ to: '/authenticate' });
  }, [navigate]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${isSidebarOpen ? 'w-72' : 'w-24'} transition-all duration-300 ease-in-out bg-gray-200 text-gray-800 flex flex-col`}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && <h1 className="text-2xl font-bold">Dashboard</h1>}
          <button onClick={toggleSidebar} className="p-2 rounded-full hover:bg-gray-300 transition-colors">
            <Menu size={28} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-2 p-4">
            <NavItem to="/dashboard" icon={<Home />} label="Home" isOpen={isSidebarOpen} />
            <NavItem to="/dashboard/voters" icon={<Users />} label="Voters" isOpen={isSidebarOpen} />
          </ul>
        </nav>
        <button
          onClick={handleLogout}
          className={`flex items-center justify-center p-6 bg-red-600 hover:bg-red-700 text-white transition-colors mt-auto text-lg font-semibold ${isSidebarOpen ? '' : 'flex-col'}`}
        >
          <LogOut size={isSidebarOpen ? 28 : 32} className={isSidebarOpen ? 'mr-3' : 'mb-1'} />
          {isSidebarOpen ? <span>Logout</span> : <span className="text-xs">Logout</span>}
        </button>
      </aside>

      {/* Main content */}
      {location.pathname === '/dashboard' ? (
        <main className="flex-1 overflow-y-auto bg-white p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">Upload Voters' Information</h2>
              <Dashboard
                uppy={uppy}
                metaFields={[{ id: 'name', name: 'Name', placeholder: 'File name' }]}
                showProgressDetails
                height={300}
                width="100%"
              />
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      )}
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
  isOpen,
}: {
  to: string;
  icon: React.ReactElement<LucideProps>;
  label: string;
  isOpen: boolean;
}) {
  return (
    <li>
      <Link
        to={to}
        className={`flex items-center ${isOpen ? 'p-4' : 'p-2'} rounded-lg hover:bg-gray-300 transition-colors text-lg font-medium`}
      >
        {React.cloneElement(icon, {
          size: isOpen ? 28 : 32,
          className: isOpen ? 'mr-4' : '',
        })}
        {isOpen && <span>{label}</span>}
      </Link>
    </li>
  );
}

export default DashboardLayout;
