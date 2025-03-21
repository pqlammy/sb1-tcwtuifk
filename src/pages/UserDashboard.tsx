import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { LogOut, User, CreditCard, Clock, TrendingUp, AlertTriangle, Check } from 'lucide-react';
import { decrypt } from '../lib/crypto';
import type { Contribution } from '../types';

const TARGET_AMOUNT = 100; // CHF

export function UserDashboard() {
  const { user, signOut } = useAuth();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContributions() {
      try {
        if (!user) return;

        const { data, error } = await supabase
          .from('contributions')
          .select('*')
          .eq('gennervogt_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Decrypt sensitive data
        const decryptedContributions = (data || []).map(contribution => ({
          ...contribution,
          email: decrypt(contribution.email),
          address: decrypt(contribution.address),
          city: decrypt(contribution.city),
          postal_code: decrypt(contribution.postal_code),
        }));

        setContributions(decryptedContributions);
      } catch (err) {
        setError('Failed to load contributions');
        console.error('Error fetching contributions:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchContributions();
    }
  }, [user]);

  const totalAmount = contributions.reduce((sum, c) => sum + Number(c.amount), 0);
  const difference = totalAmount - TARGET_AMOUNT;
  const hasReachedTarget = totalAmount >= TARGET_AMOUNT;

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Header with Profile Summary */}
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-red-600 rounded-full">
            <User className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">{user.username}</h2>
            <p className="text-gray-300">{user.email}</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400">Total Collected</h3>
            <CreditCard className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            CHF {totalAmount.toFixed(2)}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400">Target Amount</h3>
            <TrendingUp className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            CHF {TARGET_AMOUNT.toFixed(2)}
          </p>
        </div>

        <div className={`bg-white/10 backdrop-blur-lg rounded-lg p-6 ${
          hasReachedTarget ? 'border-green-500/50' : 'border-red-500/50'
        } border-2`}>
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400">Difference</h3>
            {hasReachedTarget ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            )}
          </div>
          <p className={`text-2xl font-bold mt-2 ${
            hasReachedTarget ? 'text-green-500' : 'text-red-500'
          }`}>
            CHF {Math.abs(difference).toFixed(2)}
            {hasReachedTarget ? ' over' : ' under'}
          </p>
        </div>
      </div>

      {/* Contributions List */}
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
        <div className="flex items-center mb-6">
          <CreditCard className="w-6 h-6 text-red-500 mr-2" />
          <h2 className="text-2xl font-semibold text-white">Your Contributions</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-400 text-center py-4">{error}</div>
        ) : contributions.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No contributions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contributions.map((contribution) => (
              <div
                key={contribution.id}
                className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-white">
                      {contribution.first_name} {contribution.last_name}
                    </h3>
                    <p className="text-gray-400">{contribution.email}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {contribution.address}, {contribution.city} {contribution.postal_code}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">
                      CHF {contribution.amount.toFixed(2)}
                    </p>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded ${
                        contribution.paid
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {contribution.paid ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Created: {new Date(contribution.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}