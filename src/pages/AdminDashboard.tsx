import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Check, 
  Search, 
  Filter, 
  X,
  Eye,
  Trash2,
  Pencil,
  ListChecks,
  Download
} from 'lucide-react';
import { decrypt } from '../lib/crypto';
import type { ContributionWithUser } from '../types';
import { DeleteModal } from '../components/DeleteModal';
import { ExportModal } from '../components/ExportModal';
import { EditContributionModal } from '../components/EditContributionModal';
import { BatchActionsModal } from '../components/BatchActionsModal';
import { ViewDetailsModal } from '../components/ViewDetailsModal';

type Filters = {
  user: string;
  status: 'all' | 'paid' | 'unpaid';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  minAmount: string;
  maxAmount: string;
};

export function AdminDashboard() {
  const [contributions, setContributions] = useState<ContributionWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    user: 'all',
    status: 'all',
    dateRange: 'all',
    minAmount: '',
    maxAmount: '',
  });
  const [selectedContributions, setSelectedContributions] = useState<string[]>([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedContribution, setSelectedContribution] = useState<ContributionWithUser | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // First fetch all contributions
        const { data: contributionData, error: contributionError } = await supabase
          .from('contributions')
          .select('*')
          .order('created_at', { ascending: false });

        if (contributionError) throw contributionError;

        if (!contributionData) {
          setContributions([]);
          return;
        }

        // Fetch user data for each contribution
        const userIds = [...new Set([
          ...contributionData.map(c => c.user_id),
          ...contributionData.map(c => c.gennervogt_id).filter(Boolean)
        ])];

        const { data: userData, error: userError } = await supabase
          .from('user_data')
          .select('id, email')
          .in('id', userIds);

        if (userError) throw userError;

        // Create a map of user data
        const userMap = new Map(userData?.map(user => [user.id, user]) || []);

        // Combine contribution and user data
        const processedContributions = contributionData.map(contribution => ({
          ...contribution,
          email: decrypt(contribution.email),
          address: decrypt(contribution.address),
          city: decrypt(contribution.city),
          postal_code: decrypt(contribution.postal_code),
          user: {
            email: userMap.get(contribution.user_id)?.email || 'Unknown'
          },
          gennervogt: contribution.gennervogt_id ? {
            email: userMap.get(contribution.gennervogt_id)?.email || 'Unknown'
          } : undefined
        }));

        setContributions(processedContributions);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handlePaymentStatusChange = async (id: string, paid: boolean) => {
    try {
      setUpdateLoading(id);
      setError(null);

      const { error: updateError } = await supabase
        .from('contributions')
        .update({ paid })
        .eq('id', id);

      if (updateError) throw updateError;

      setContributions(prevContributions =>
        prevContributions.map(contribution =>
          contribution.id === id ? { ...contribution, paid } : contribution
        )
      );
    } catch (err) {
      console.error('Error updating payment status:', err);
      setError('Failed to update payment status');
    } finally {
      setUpdateLoading(null);
    }
  };

  const handleEdit = (contribution: ContributionWithUser) => {
    setSelectedContribution(contribution);
    setShowEditModal(true);
  };

  const handleViewDetails = (contribution: ContributionWithUser) => {
    setSelectedContribution(contribution);
    setShowDetailsModal(true);
  };

  const handleBatchActions = () => {
    if (selectedContributions.length === 0) return;
    
    const selectedItems = contributions.filter(c => 
      selectedContributions.includes(c.id)
    );
    setSelectedContribution(selectedItems[0]);
    setShowBatchModal(true);
  };

  const handleUpdateContribution = (updatedContribution: ContributionWithUser) => {
    setContributions(prevContributions =>
      prevContributions.map(contribution =>
        contribution.id === updatedContribution.id ? updatedContribution : contribution
      )
    );
  };

  const handleBatchUpdate = (updatedContributions: ContributionWithUser[]) => {
    setContributions(prevContributions =>
      prevContributions.map(contribution => {
        const updated = updatedContributions.find(u => u.id === contribution.id);
        return updated || contribution;
      })
    );
    setSelectedContributions([]);
  };

  const resetFilters = () => {
    setFilters({
      user: 'all',
      status: 'all',
      dateRange: 'all',
      minAmount: '',
      maxAmount: '',
    });
    setSearchTerm('');
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedContributions(checked ? filteredContributions.map(c => c.id) : []);
  };

  const handleSelectContribution = (id: string, checked: boolean) => {
    setSelectedContributions(prev => 
      checked ? [...prev, id] : prev.filter(cId => cId !== id)
    );
  };

  // Filter contributions based on search term and filters
  const filteredContributions = contributions.filter(contribution => {
    // Search term filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      contribution.first_name.toLowerCase().includes(searchLower) ||
      contribution.last_name.toLowerCase().includes(searchLower) ||
      contribution.email.toLowerCase().includes(searchLower) ||
      contribution.address.toLowerCase().includes(searchLower) ||
      contribution.city.toLowerCase().includes(searchLower) ||
      contribution.postal_code.toLowerCase().includes(searchLower);

    // User filter
    const matchesUser = filters.user === 'all' || contribution.user_id === filters.user;

    // Status filter
    const matchesStatus = filters.status === 'all' ||
      (filters.status === 'paid' && contribution.paid) ||
      (filters.status === 'unpaid' && !contribution.paid);

    // Date range filter
    const contributionDate = new Date(contribution.created_at);
    const now = new Date();
    let matchesDate = true;

    if (filters.dateRange === 'today') {
      matchesDate = contributionDate.toDateString() === now.toDateString();
    } else if (filters.dateRange === 'week') {
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      matchesDate = contributionDate >= weekAgo;
    } else if (filters.dateRange === 'month') {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      matchesDate = contributionDate >= monthAgo;
    } else if (filters.dateRange === 'year') {
      const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
      matchesDate = contributionDate >= yearAgo;
    }

    // Amount range filter
    const amount = contribution.amount;
    const matchesAmount = (filters.minAmount === '' || amount >= parseFloat(filters.minAmount)) &&
      (filters.maxAmount === '' || amount <= parseFloat(filters.maxAmount));

    return matchesSearch && matchesUser && matchesStatus && matchesDate && matchesAmount;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Users className="w-8 h-8 text-red-500 mr-3" />
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowExportModal(true)}
            disabled={filteredContributions.length === 0}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Batch Actions */}
      {selectedContributions.length > 0 && (
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-white mr-4">
              {selectedContributions.length} selected
            </span>
            <button
              onClick={() => setSelectedContributions([])}
              className="text-gray-400 hover:text-white"
            >
              Clear selection
            </button>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleBatchActions}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <ListChecks className="w-5 h-5 mr-2" />
              Batch Actions
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search contributions..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              showFilters ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </button>

          {/* Reset Filters Button */}
          {(showFilters || searchTerm || filters.user !== 'all' || filters.status !== 'all' || 
           filters.dateRange !== 'all' || filters.minAmount || filters.maxAmount) && (
            <button
              onClick={resetFilters}
              className="flex items-center px-4 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 mr-2" />
              Reset
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
            <select
              value={filters.user}
              onChange={(e) => setFilters({ ...filters, user: e.target.value })}
              className="bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Users</option>
              {contributions.map((contribution) => (
                <option key={contribution.user_id} value={contribution.user_id}>
                  {contribution.user.email}
                </option>
              )).filter((v, i, a) => a.findIndex(t => t.props.value === v.props.value) === i)}
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as 'all' | 'paid' | 'unpaid' })}
              className="bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>

            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as Filters['dateRange'] })}
              className="bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
            </select>

            <input
              type="number"
              value={filters.minAmount}
              onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
              placeholder="Min Amount (CHF)"
              className="bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <input
              type="number"
              value={filters.maxAmount}
              onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
              placeholder="Max Amount (CHF)"
              className="bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Results Summary */}
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
        <p className="text-gray-300">
          Showing {filteredContributions.length} of {contributions.length} contributions
        </p>
      </div>

      {/* Contributions Table */}
      <div className="bg-white/10 backdrop-blur-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-black/20">
                <th className="px-6 py-3">
                  <input
                    type="checkbox"
                    checked={selectedContributions.length === filteredContributions.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredContributions.map((contribution) => (
                <tr key={contribution.id} className="hover:bg-white/5">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedContributions.includes(contribution.id)}
                      onChange={(e) => handleSelectContribution(contribution.id, e.target.checked)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {contribution.first_name} {contribution.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{contribution.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {contribution.address}, {contribution.postal_code} {contribution.city}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      CHF {contribution.amount.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {contribution.gennervogt?.email || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      {new Date(contribution.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handlePaymentStatusChange(contribution.id, !contribution.paid)}
                      disabled={updateLoading === contribution.id}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        contribution.paid
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      } hover:bg-opacity-75 transition-colors`}
                    >
                      {updateLoading === contribution.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
                      ) : (
                        <>
                          {contribution.paid && <Check className="w-4 h-4 mr-1" />}
                          {contribution.paid ? 'Paid' : 'Pending'}
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDetails(contribution)}
                        className="p-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(contribution)}
                        className="p-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedContribution && (
        <>
          <ViewDetailsModal
            isOpen={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
            contribution={selectedContribution}
          />

          <EditContributionModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            contribution={selectedContribution}
            onUpdate={handleUpdateContribution}
          />

          <BatchActionsModal
            isOpen={showBatchModal}
            onClose={() => setShowBatchModal(false)}
            selectedContributions={contributions.filter(c => 
              selectedContributions.includes(c.id)
            )}
            onUpdate={handleBatchUpdate}
          />
        </>
      )}

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          // Handle delete
          setShowDeleteModal(false);
        }}
        loading={false}
        itemCount={selectedContributions.length}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        contributions={filteredContributions}
      />
    </div>
  );
}