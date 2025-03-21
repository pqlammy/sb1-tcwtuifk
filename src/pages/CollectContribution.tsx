import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { CreditCard, ChevronRight, Check } from 'lucide-react';
import { encrypt } from '../lib/crypto';

type UserData = {
  id: string;
  email: string;
};

const contributionSchema = z.object({
  amount: z.number().min(1, 'Amount must be greater than 0'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  postal_code: z.string().min(4, 'Valid postal code required'),
  gennervogt_id: z.string().uuid('Invalid Gennervogt selection'),
  acceptPrivacy: z.boolean().refine((val) => val, 'You must accept the privacy policy'),
});

type ContributionFormData = z.infer<typeof contributionSchema>;

const FIXED_AMOUNTS = [20, 40];

export function CollectContribution() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<ContributionFormData>({
    resolver: zodResolver(contributionSchema),
  });

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoadingUsers(true);
        
        // Fetch users from the user_data view
        const { data, error } = await supabase
          .from('user_data')
          .select('id, email')
          .order('email');

        if (error) throw error;

        const validUsers = (data || [])
          .filter(u => u.email)
          .map(u => ({
            id: u.id,
            email: u.email
          }));

        setUsers(validUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
        // If we can't fetch users, at least show the current user
        if (user) {
          setUsers([{
            id: user.id,
            email: user.email || 'Unknown'
          }]);
        }
      } finally {
        setLoadingUsers(false);
      }
    }

    fetchUsers();
  }, [user]);

  useEffect(() => {
    if (user) {
      setValue('gennervogt_id', user.id);
    }
  }, [user, setValue]);

  const handleAmountSelection = (amount: number | null) => {
    setSelectedAmount(amount);
    if (amount !== null) {
      setValue('amount', amount);
      setCustomAmount('');
    }
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomAmount(value);
    setSelectedAmount(null);
    setValue('amount', parseFloat(value) || 0);
  };

  const onSubmit = async (data: ContributionFormData) => {
    try {
      setError(null);
      
      if (!user) {
        throw new Error('You must be logged in to submit a contribution');
      }

      // Remove acceptPrivacy field before submission
      const { acceptPrivacy, ...contributionData } = data;

      // Validate amount
      if (!contributionData.amount || contributionData.amount <= 0) {
        throw new Error('Please select or enter a valid amount');
      }
      
      // Encrypt sensitive data
      const encryptedData = {
        ...contributionData,
        user_id: user.id,
        email: encrypt(contributionData.email),
        address: encrypt(contributionData.address),
        city: encrypt(contributionData.city),
        postal_code: encrypt(contributionData.postal_code),
        paid: false,
        created_at: new Date().toISOString()
      };

      // Insert contribution
      const { error: insertError } = await supabase
        .from('contributions')
        .insert([encryptedData]);

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error('Failed to submit contribution');
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Error submitting contribution:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit contribution');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Beitrag Sammeln</h1>

      {step === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {FIXED_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => handleAmountSelection(amount)}
                className={`p-6 rounded-lg text-center transition-colors ${
                  selectedAmount === amount
                    ? 'bg-red-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                <CreditCard className="w-6 h-6 mx-auto mb-2" />
                <div className="text-2xl font-bold">CHF {amount}</div>
                {selectedAmount === amount && (
                  <Check className="w-5 h-5 mx-auto mt-2 text-white" />
                )}
              </button>
            ))}
            <div className={`p-6 rounded-lg ${
              selectedAmount === null && customAmount
                ? 'bg-red-600'
                : 'bg-white/10'
            }`}>
              <label className="block text-center mb-2 text-gray-300">
                Custom Amount
              </label>
              <input
                type="number"
                value={customAmount}
                onChange={handleCustomAmountChange}
                className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white text-center"
                placeholder="CHF"
              />
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!selectedAmount && !customAmount}
            className="w-full mt-6 px-6 py-3 bg-red-600 text-white rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      )}

      {step === 2 && (
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
              Gennervogt
            </label>
            <select
              {...register('gennervogt_id')}
              className="mt-1 block w-full rounded-md bg-white/5 border border-white/20 text-white px-3 py-2"
              disabled={loadingUsers}
            >
              {loadingUsers ? (
                <option value="">Loading users...</option>
              ) : (
                users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.email}
                  </option>
                ))
              )}
            </select>
            {errors.gennervogt_id && (
              <p className="mt-1 text-sm text-red-500">{errors.gennervogt_id.message}</p>
            )}
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              {...register('acceptPrivacy')}
              className="mt-1 h-4 w-4 rounded border-gray-300"
            />
            <label className="ml-2 block text-sm text-gray-300">
              I accept the{' '}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:text-red-300"
              >
                privacy policy
              </a>
            </label>
            {errors.acceptPrivacy && (
              <p className="mt-1 text-sm text-red-500">{errors.acceptPrivacy.message}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-md p-3">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Contribution'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}