import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRequestOTP, useVerifyOTP } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Link, createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, Loader2, Mail } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const Route = createLazyFileRoute('/authenticate')({
  component: EmailVerification,
});

function EmailVerification() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isValidEmail, setIsValidEmail] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const navigate = useNavigate();

  const requestOTP = useRequestOTP();
  const verifyOTP = useVerifyOTP();

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValidEmail(emailRegex.test(email));
  }, [email]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail) return;
    try {
      await requestOTP.mutateAsync({ email });
      toast.success('Code Sent', { description: 'Check your email for the 6-digit code.' });
      setShowOtpInput(true);
    } catch (err) {
      console.error('handleEmailSubmit:: ', err);
      toast.error('Error', { description: 'Failed to send code. Please try again.' });
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.some((digit) => digit === '')) return;
    try {
      await verifyOTP.mutateAsync({ email, otp: otp.join('') });
      toast.success('Verified', { description: 'Email verified successfully.' });
      navigate({ to: '/dashboard' });
    } catch (err) {
      console.error('handleOtpSubmit:: ', err);
      toast.error('Error', { description: 'Invalid code. Please try again.' });
    }
  };

  const resetStates = () => {
    setEmail('');
    setOtp(['', '', '', '', '', '']);
    setIsValidEmail(false);
    setShowOtpInput(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md mx-4 shadow-lg">
        <CardHeader className="space-y-1">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
            onClick={resetStates}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {showOtpInput ? 'Verify Email' : 'Sign In'}
          </CardTitle>
          <CardDescription>
            {showOtpInput ? `Enter the 6-digit code sent to ${email}` : 'Verify your email to continue'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showOtpInput ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className={cn(
                      'absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors duration-200',
                      email ? (isValidEmail ? 'text-green-500' : 'text-red-500') : 'text-gray-400',
                    )}
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={cn(
                      'w-full pl-10',
                      email &&
                        (isValidEmail ? 'border-green-500 focus:ring-green-500' : 'border-red-500 focus:ring-red-500'),
                    )}
                    disabled={requestOTP.isPending}
                  />
                </div>
                {email && !isValidEmail && <p className="text-sm text-red-500">Enter a valid email</p>}
              </div>
              <Button
                type="submit"
                className="w-full bg-gray-800 hover:bg-gray-700"
                disabled={requestOTP.isPending || !isValidEmail}
              >
                {requestOTP.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    Send Code
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="otp-0" className="text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <div className="flex justify-between space-x-2">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      pattern="\d{1}"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      className="w-12 h-12 text-center text-lg"
                      disabled={verifyOTP.isPending}
                    />
                  ))}
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-gray-800 hover:bg-gray-700"
                disabled={verifyOTP.isPending || otp.some((digit) => digit === '')}
              >
                {verifyOTP.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
              <p className="text-center text-sm text-gray-500 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpInput(false);
                    resetStates();
                  }}
                  className="text-gray-600 hover:text-gray-800 underline"
                >
                  Wrong email? Change it
                </button>
              </p>
              <p className="text-center text-xs text-gray-400 mt-2">
                No code yet? Check your spam folder or try again in a few minutes.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
