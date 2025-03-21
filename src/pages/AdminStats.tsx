import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { BarChart3, PieChart, TrendingUp, CreditCard, Users, Wallet } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

type StatsData = {
  totalContributions: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  uniqueContributors: number;
  averageContribution: number;
  contributionsByMonth: {
    month: string;
    count: number;
    amount: number;
  }[];
  paymentStatus: {
    paid: number;
    unpaid: number;
  };
  userPerformance: {
    username: string;
    count: number;
    amount: number;
  }[];
};

export function AdminStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'all' | '6m' | '1y'>('all');

  useEffect(() => {
    async function fetchStats() {
      try {
        // Get the date range
        const now = new Date();
        let startDate: Date | null = null;
        
        if (timeRange === '6m') {
          startDate = new Date(now.setMonth(now.getMonth() - 6));
        } else if (timeRange === '1y') {
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        }

        // Fetch all contributions
        let query = supabase
          .from('contributions')
          .select('*');

        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }

        const { data: contributions, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        if (!contributions) {
          setStats(null);
          return;
        }

        // Fetch user data for each unique user_id
        const uniqueUserIds = [...new Set(contributions.map(c => c.user_id))];
        const userDataPromises = uniqueUserIds.map(async (userId) => {
          const { data: { user }, error } = await supabase.auth.getUser(userId);
          return error ? null : { id: userId, email: user?.email };
        });

        const userData = await Promise.all(userDataPromises);
        const userMap = new Map(
          userData
            .filter((data): data is NonNullable<typeof data> => data !== null)
            .map(data => [data.id, data.email || 'Unknown'])
        );

        // Process the data
        const totalAmount = contributions.reduce((sum, c) => sum + Number(c.amount), 0);
        const paidContributions = contributions.filter(c => c.paid);
        const paidAmount = paidContributions.reduce((sum, c) => sum + Number(c.amount), 0);
        const uniqueContributors = new Set(contributions.map(c => c.email)).size;

        // Group by month
        const byMonth = contributions.reduce((acc: Record<string, { count: number; amount: number }>, c) => {
          const month = new Date(c.created_at).toLocaleString('default', { month: 'long' });
          if (!acc[month]) {
            acc[month] = { count: 0, amount: 0 };
          }
          acc[month].count++;
          acc[month].amount += Number(c.amount);
          return acc;
        }, {});

        // Group by user
        const byUser = contributions.reduce((acc: Record<string, { count: number; amount: number }>, c) => {
          const username = userMap.get(c.user_id) || 'Unknown';
          if (!acc[username]) {
            acc[username] = { count: 0, amount: 0 };
          }
          acc[username].count++;
          acc[username].amount += Number(c.amount);
          return acc;
        }, {});

        setStats({
          totalContributions: contributions.length,
          totalAmount,
          paidAmount,
          unpaidAmount: totalAmount - paidAmount,
          uniqueContributors,
          averageContribution: totalAmount / contributions.length,
          contributionsByMonth: Object.entries(byMonth).map(([month, data]) => ({
            month,
            ...data,
          })),
          paymentStatus: {
            paid: paidContributions.length,
            unpaid: contributions.length - paidContributions.length,
          },
          userPerformance: Object.entries(byUser)
            .map(([username, data]) => ({
              username,
              ...data,
            }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5), // Top 5 users
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center text-red-500 py-8">
        {error || 'No data available'}
      </div>
    );
  }

  const timeRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: '6m', label: 'Last 6 Months' },
    { value: '1y', label: 'Last Year' },
  ];

  // Chart configurations
  const contributionsChart = {
    labels: stats.contributionsByMonth.map(item => item.month),
    datasets: [
      {
        label: 'Number of Contributions',
        data: stats.contributionsByMonth.map(item => item.count),
        backgroundColor: 'rgba(220, 38, 38, 0.5)',
        borderColor: 'rgb(220, 38, 38)',
        borderWidth: 1,
      },
    ],
  };

  const amountTrendChart = {
    labels: stats.contributionsByMonth.map(item => item.month),
    datasets: [
      {
        label: 'Total Amount (CHF)',
        data: stats.contributionsByMonth.map(item => item.amount),
        fill: true,
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        borderColor: 'rgb(220, 38, 38)',
        tension: 0.4,
      },
    ],
  };

  const paymentStatusChart = {
    labels: ['Paid', 'Unpaid'],
    datasets: [
      {
        data: [stats.paymentStatus.paid, stats.paymentStatus.unpaid],
        backgroundColor: [
          'rgba(34, 197, 94, 0.5)',
          'rgba(220, 38, 38, 0.5)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(220, 38, 38)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const userPerformanceChart = {
    labels: stats.userPerformance.map(user => user.username),
    datasets: [
      {
        label: 'Total Amount Collected (CHF)',
        data: stats.userPerformance.map(user => user.amount),
        backgroundColor: 'rgba(220, 38, 38, 0.5)',
        borderColor: 'rgb(220, 38, 38)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <BarChart3 className="w-8 h-8 text-red-500 mr-3" />
          <h1 className="text-3xl font-bold text-white">Statistics</h1>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
          className="bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {timeRangeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400">Total Amount</h3>
            <Wallet className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-white">
            CHF {stats.totalAmount.toFixed(2)}
          </p>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-green-400">
              Paid: CHF {stats.paidAmount.toFixed(2)}
            </span>
            <span className="text-red-400">
              Unpaid: CHF {stats.unpaidAmount.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400">Contributions</h3>
            <CreditCard className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-white">
            {stats.totalContributions}
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Average: CHF {stats.averageContribution.toFixed(2)}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400">Contributors</h3>
            <Users className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-white">
            {stats.uniqueContributors}
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Unique contributors
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-5 h-5 text-red-500 mr-2" />
            <h2 className="text-xl font-semibold text-white">
              Contributions by Month
            </h2>
          </div>
          <Bar
            data={contributionsChart}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                  },
                },
                x: {
                  ticks: {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  grid: {
                    display: false,
                  },
                },
              },
            }}
          />
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-5 h-5 text-red-500 mr-2" />
            <h2 className="text-xl font-semibold text-white">
              Amount Trend
            </h2>
          </div>
          <Line
            data={amountTrendChart}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    callback: (value) => `CHF ${value}`,
                  },
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                  },
                },
                x: {
                  ticks: {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  grid: {
                    display: false,
                  },
                },
              },
            }}
          />
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <div className="flex items-center mb-4">
            <PieChart className="w-5 h-5 text-red-500 mr-2" />
            <h2 className="text-xl font-semibold text-white">
              Payment Status
            </h2>
          </div>
          <div className="aspect-square max-w-[400px] mx-auto">
            <Pie
              data={paymentStatusChart}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Users className="w-5 h-5 text-red-500 mr-2" />
            <h2 className="text-xl font-semibold text-white">
              Top Collectors
            </h2>
          </div>
          <Bar
            data={userPerformanceChart}
            options={{
              indexAxis: 'y',
              responsive: true,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                x: {
                  beginAtZero: true,
                  ticks: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    callback: (value) => `CHF ${value}`,
                  },
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                  },
                },
                y: {
                  ticks: {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  grid: {
                    display: false,
                  },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}