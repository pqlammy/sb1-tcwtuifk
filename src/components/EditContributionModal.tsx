import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';
import { encrypt } from '../lib/crypto';
import type { ContributionWithUser } from '../types';

const editSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  postal_code: z.string().min(4, 'Valid postal code required'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
});

type EditFormData = z.infer<typeof editSchema>;

type EditContributionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  contribution: ContributionWithUser;
  onUpdate: (contribution: ContributionWithUser) => void;
};

export function EditContributionModal({
  isOpen,
  onClose,
  contribution,
  onUpdate,
}: EditContributionModalProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      first_name: contribution.first_name,
      last_name: contribution.last_name,
      email: contribution.email,
      address: contribution.address,
      city: contribution.city,
      postal_code: contribution.postal_code,
      amount: contribution.amount,
    }
  });

  const onSubmit = async (data: EditFormData) => {
    try {
      setError(null);

      // Encrypt sensitive data
      const encryptedData = {
        ...data,
        email: encrypt(data.email),
        address: encrypt(data.address),
        city: encrypt(data.city),
        postal_code: encrypt(data.postal_code),
      };

      // Update the contribution
      const { error: updateError } = await supabase
        .from('contributions')
        .update(encryptedData)
        .eq('id', contribution.id);

      if (updateError) throw updateError;

      // Fetch the updated contribution to ensure we have the latest data
      const { data: updatedContribution, error: fetchError } = await supabase
        .from('contributions')
        .select(`
          *,
          users!contributions_user_id_fkey (
            username
          )
        `)
        .eq('id', contribution.id)
        .single();

      if (fetchError) throw fetchError;

      if (!updatedContribution) {
        throw new Error('Failed to fetch updated contribution');
      }

      // Create decrypted version for the UI
      const decryptedContribution = {
        ...updatedContribution,
        email: data.email,
        address: data.address,
        city: data.city,
        postal_code: data.postal_code,
      };

      onUpdate(decryptedContribution as ContributionWithUser);
      onClose();
    } catch (err) {
      console.error('Error updating contribution:', err);
      setError('Failed to update contribution');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg w-full max-w-2xl mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Edit Contribution</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  First Name
                </label>
                <input
                  type="text"
                  {...register('first_name')}
                  className="mt-1 block w-full rounded-md bg-white/5 border border-white/20 text-white px-3 py-2"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-500">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Last Name
                </label>
                <input
                  type="text"
                  {...register('last_name')}
                  className="mt-1 block w-full rounded-md bg-white/5 border border-white/20 text-white px-3 py-2"
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-500">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Email
              </label>
              <input
                type="email"
                {...register('email')}
                className="mt-1 block w-full rounded-md bg-white/5 border border-white/20 text-white px-3 py-2"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Address
              </label>
              <input
                type="text"
                {...register('address')}
                className="mt-1 block w-full rounded-md bg-white/5 border border-white/20 text-white px-3 py-2"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  City
                </label>
                <input
                  type="text"
                  {...register('city')}
                  className="mt-1 block w-full rounded-md bg-white/5 border border-white/20 text-white px-3 py-2"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-500">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Postal Code
                </label>
                <input
                  type="text"
                  {...register('postal_code')}
                  className="mt-1 block w-full rounded-md bg-white/5 border border-white/20 text-white px-3 py-2"
                />
                {errors.postal_code && (
                  <p className="mt-1 text-sm text-red-500">{errors.postal_code.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Amount (CHF)
              </label>
              <input
                type="number"
                step="0.01"
                {...register('amount', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md bg-white/5 border border-white/20 text-white px-3 py-2"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-500">{errors.amount.message}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500 rounded-md p-3">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}