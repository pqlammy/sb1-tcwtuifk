import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ContributionWithUser } from '../types';

type BatchActionsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedContributions: ContributionWithUser[];
  onUpdate: (contributions: ContributionWithUser[]) => void;
};

export function BatchActionsModal({
  isOpen,
  onClose,
  selectedContributions,
  onUpdate,
}: BatchActionsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMarkAsPaid = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: updatedContributions, error: updateError } = await supabase
        .from('contributions')
        .update({ paid: true })
        .in('id', selectedContributions.map(c => c.id))
        .select(`
          *,
          user:user_id (
            email
          )
        `);

      if (updateError) throw updateError;

      onUpdate(updatedContributions as ContributionWithUser[]);
      onClose();
    } catch (err) {
      console.error('Error updating contributions:', err);
      setError('Failed to update contributions');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsUnpaid = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: updatedContributions, error: updateError } = await supabase
        .from('contributions')
        .update({ paid: false })
        .in('id', selectedContributions.map(c => c.id))
        .select(`
          *,
          user:user_id (
            email
          )
        `);

      if (updateError) throw updateError;

      onUpdate(updatedContributions as ContributionWithUser[]);
      onClose();
    } catch (err) {
      console.error('Error updating contributions:', err);
      setError('Failed to update contributions');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg w-full max-w-md mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Batch Actions ({selectedContributions.length} selected)
          </h2>

          <div className="space-y-4">
            <button
              onClick={handleMarkAsPaid}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              Mark as Paid
            </button>

            <button
              onClick={handleMarkAsUnpaid}
              disabled={loading}
              className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
            >
              Mark as Unpaid
            </button>

            {error && (
              <div className="bg-red-500/10 border border-red-500 rounded-md p-3">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            <button
              onClick={onClose}
              disabled={loading}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}