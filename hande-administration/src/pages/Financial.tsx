import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FinancialOverview {
  total_revenue: number;
  total_payouts: number;
  platform_earnings: number;
  active_subscriptions: number;
  subscription_revenue: number;
  refunded_amount: number;
  average_trip_fare: number;
  total_trips: number;
  period_days: number;
}

interface RevenueTrend {
  date: string;
  revenue: number;
  driver_payouts: number;
  platform_earnings: number;
  trip_count: number;
}

interface Transaction {
  id: number;
  type: string;
  description: string;
  amount: number;
  created_at: string;
  user_name: string;
}

interface DriverPayout {
  driver_id: number;
  name: string;
  email: string;
  total_earnings: number;
  total_trips: number;
  last_trip_date: string;
}

export default function Financial() {
  const [period, setPeriod] = useState('30');
  const [trendDays, setTrendDays] = useState('30');
  const [transactionType, setTransactionType] = useState('all');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverPayout | null>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const queryClient = useQueryClient();

  const { data: overview } = useQuery<FinancialOverview>({
    queryKey: ['financial-overview', period],
    queryFn: async () => {
      const response = await apiClient.get('/admin/financial/overview', {
        params: { period },
      });
      return response.data;
    },
  });

  const { data: trends } = useQuery<RevenueTrend[]>({
    queryKey: ['revenue-trends', trendDays],
    queryFn: async () => {
      const response = await apiClient.get('/admin/financial/revenue-trends', {
        params: { days: trendDays },
      });
      return response.data;
    },
  });

  const { data: transactions } = useQuery<{ data: Transaction[] }>({
    queryKey: ['transactions', transactionType],
    queryFn: async () => {
      const response = await apiClient.get('/admin/financial/transactions', {
        params: { type: transactionType },
      });
      return response.data;
    },
  });

  const { data: pendingPayouts } = useQuery<{ data: DriverPayout[] }>({
    queryKey: ['driver-payouts'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/financial/driver-payouts', {
        params: { status: 'pending' },
      });
      return response.data;
    },
  });

  const processPayoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/admin/financial/payout', {
        driver_id: selectedDriver?.driver_id,
        amount: parseFloat(payoutAmount),
        payment_method: paymentMethod,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['financial-overview'] });
      setShowPayoutModal(false);
      setSelectedDriver(null);
      setPayoutAmount('');
    },
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">Track revenue, payouts, and transactions</p>
          </div>
          <div className="flex gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Financial Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${(overview?.total_revenue || 0).toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">{overview?.total_trips || 0} trips</p>
              </div>
              <DollarSign className="h-8 w-8 text-[#7ED957]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Driver Payouts</p>
                <p className="text-2xl font-bold text-gray-900">${(overview?.total_payouts || 0).toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">To drivers</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Platform Earnings</p>
                <p className="text-2xl font-bold text-gray-900">${(overview?.platform_earnings || 0).toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Net profit</p>
              </div>
              <TrendingUp className="h-8 w-8 text-[#7ED957]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900">${(overview?.subscription_revenue || 0).toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">{overview?.active_subscriptions || 0} active</p>
              </div>
              <Users className="h-8 w-8 text-[#FFB800]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends Chart */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Revenue Trends</h2>
            <select
              value={trendDays}
              onChange={(e) => setTrendDays(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
            >
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {trends && trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#7ED957" name="Revenue" strokeWidth={2} />
                <Line type="monotone" dataKey="driver_payouts" stroke="#FF4C4C" name="Driver Payouts" strokeWidth={2} />
                <Line type="monotone" dataKey="platform_earnings" stroke="#FFB800" name="Platform Earnings" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center py-8 text-gray-500">No trend data available</div>
          )}
        </CardContent>
      </Card>

      {/* Pending Driver Payouts */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold">Pending Driver Payouts</h2>
        </CardHeader>
        <CardContent>
          {pendingPayouts && pendingPayouts.data && pendingPayouts.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Earnings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trips</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Trip</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingPayouts.data.map((driver: DriverPayout) => (
                    <tr key={driver.driver_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{driver.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{driver.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-[#7ED957]">
                        ${driver.total_earnings.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{driver.total_trips}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {driver.last_trip_date ? new Date(driver.last_trip_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          variant="primary"
                          onClick={() => {
                            setSelectedDriver(driver);
                            setPayoutAmount(driver.total_earnings.toString());
                            setShowPayoutModal(true);
                          }}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay Out
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No pending payouts</div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
            >
              <option value="all">All Transactions</option>
              <option value="trip">Trip Payments</option>
              <option value="subscription">Subscriptions</option>
              <option value="refund">Refunds</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {transactions && transactions.data && transactions.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.data.map((transaction: Transaction) => (
                    <tr key={`${transaction.type}-${transaction.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.type === 'trip'
                              ? 'bg-green-100 text-green-800'
                              : transaction.type === 'subscription'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{transaction.description}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{transaction.user_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            transaction.amount >= 0 ? 'text-[#7ED957]' : 'text-red-600'
                          }`}
                        >
                          {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No transactions found</div>
          )}
        </CardContent>
      </Card>

      {/* Payout Modal */}
      {showPayoutModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Process Driver Payout</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Driver</p>
                <p className="font-medium text-gray-900">{selectedDriver.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowPayoutModal(false);
                    setSelectedDriver(null);
                    setPayoutAmount('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => processPayoutMutation.mutate()}
                  disabled={!payoutAmount || parseFloat(payoutAmount) <= 0}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Process Payout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
