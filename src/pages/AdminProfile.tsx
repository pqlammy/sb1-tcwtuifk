import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { decrypt } from '../lib/crypto';
import { Key, User, Clock, Shield, AlertTriangle } from 'lucide-react';
import type { LoginLog } from '../types';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export function AdminProfile() {
  const { user } = useAuth();
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema)
  });

  useEffect(() => {
    async function fetchLoginLogs() {
      try {
        if (!user) return;

        const { data, error: logsError } = await supabase
          .from('login_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (logsError) throw logsError;

        // Decrypt IP addresses
        const decryptedLogs = (data || []).map(log => ({
          ...log,
          ip_address: decrypt(log.ip_address),
        }));

        setLoginLogs(decryptedLogs);
      } catch (err) {
        console.error('Error fetching login logs:', err);
        setError('Failed to load login history');
      } finally {
        setLoading(false);
      }
    }

    fetchLoginLogs();
  }, [user]);

  const onSubmit = async (data: PasswordFormData) => {
    try {
      setError(null);
      setSuccess(null);

      // First verify the current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: data.currentPassword
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (updateError) throw updateError;

      setSuccess('Password updated successfully');
      reset();
    } catch (err) {
      console.error('Error updating password:', err);
      setError(err instanceof Error ? err.message : 'Failed to update password');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center">
        <Shield className="w-8 h-8 text-red-500 mr-3" />
        <h1 className="text-3xl font-bold text-white">Admin Profile</h1>
      </div>

      {/* Admin Info Card */}
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-red-600 rounded-full">
            <User className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">{user.email}</h2>
            <p className="text-gray-300">Administrator</p>
          </div>
          <div className="px-4 py-2 bg-red-600/20 rounded-full">
            <span className="text-red-400 font-medium">Administrator</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/5 p-4 rounded-lg">
            <p className="text-gray-400">Member Since</p>
            <p className="text-lg font-medium text-white">
              {new Date(user.created_at!).toLocaleDateString()}
            </p>
          </div>
          <div className="bg-white/5 p-4 rounded-lg">
            <p className="text-gray-400">Last Sign In</p>
            <p className="text-lg font-medium text-white">
              {user.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleDateString()
                : 'Never'}
            </p>
          </div>
          <div className="bg-white/5 p-4 rounded-lg">
            <p className="text-gray-400">Role</p>
            <p className="text-lg font-medium text-white">
              Administrator
            </p>
          </div>
        </div>
      </div>

      {/* Password Change Form */}
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
        <div className="flex items-center mb-6">
          <Key className="w-6 h-6 text-red-500 mr-2" />
          <h2 className="text-2xl font-semibold text-white">Change Password</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Current Password
            </label>
            <input
              type="password"
              {...register('currentPassword')}
              className="mt-1 block w-full rounded-md bg-white/5 border border-white/20 text-white px-3 py-2"
            />
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              New Password
            </label>
            <input
              type="password"
              {...register('newPassword')}
              className="mt-1 block w-full rounded-md bg-white/5 border border-white/20 text-white px-3 py-2"
            />
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Confirm New Password
            </label>
            <input
              type="password"
              {...register('confirmPassword')}
              className="mt-1 block w-full rounded-md bg-white/5 border border-white/20 text-white px-3 py-2"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-md p-3">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500 rounded-md p-3">
              <p className="text-sm text-green-500">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-red-600 text-white rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Login History */}
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
        <div className="flex items-center mb-6">
          <Clock className="w-6 h-6 text-red-500 mr-2" />
          <h2 className="text-2xl font-semibold text-white">Login History</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : loginLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No login history available
          </div>
        ) : (
          <div className="space-y-4">
            {loginLogs.map((log) => (
              <div
                key={log.id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  log.success ? 'bg-green-500/10' : 'bg-red-500/10'
                }`}
              >
                <div className="flex items-center">
                  {log.success ? (
                    <Shield className="w-5 h-5 text-green-500 mr-3" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
                  )}
                  <div>
                    <p className="text-white">
                      {log.success ? 'Successful login' : 'Failed login attempt'}
                    </p>
                    <p className="text-sm text-gray-400">
                      IP: {log.ip_address}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  {new Date(log.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}