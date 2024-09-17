import { useMutation, useQuery } from '@tanstack/react-query';

export const API_URL = import.meta.env.VITE_API_URL;
export const VOTERS_URL = `${API_URL}/voters`;
export const AUTH_URL = `${API_URL}/auth`;

export const UPLOAD_FILES_URL = `${VOTERS_URL}/uploads`;

interface RequestOTPData {
  email: string;
}

interface VerifyOTPData {
  email: string;
  otp: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

interface Voter {
  id: string;
  email: string;
  gender: string;
  full_name: string;
  department: string;
  matriculation_number: string;
}

interface VoterUpload {
  id: string;
  file: string;
  status: string;
  reason?: string;
  created_at: string;
  updated_at: string;
  total_records: number;
  processed_records: number;
}

const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const useRequestOTP = () => {
  return useMutation({
    mutationFn: (data: RequestOTPData) =>
      apiFetch(`${AUTH_URL}/request-otp`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
};

export const useVerifyOTP = () => {
  return useMutation({
    mutationFn: (data: VerifyOTPData) =>
      apiFetch(`${AUTH_URL}/verify-otp`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (data: { success: boolean; data: TokenResponse }) => {
      if (data.success && data.data) {
        localStorage.setItem('access_token', data.data.access_token);
        localStorage.setItem('refresh_token', data.data.refresh_token);
      }
    },
  });
};

export const useVoters = () => {
  return useQuery<{ success: boolean; data: Voter[] }>({
    queryKey: ['voters'],
    queryFn: () => apiFetch(`${VOTERS_URL}`),
  });
};

export const useVoterUploads = () => {
  return useQuery<{ success: boolean; data: VoterUpload[] }>({
    queryKey: ['voterUploads'],
    queryFn: () => apiFetch(`${VOTERS_URL}/uploads/status`),
  });
};
