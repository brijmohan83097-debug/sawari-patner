import React, { useState } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Zap, 
  CheckCircle2, 
  Filter, 
  X, 
  Sparkles, 
  Search, 
  Plus
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  AreaChart, 
  Area 
} from 'recharts';
import confetti from 'canvas-confetti';
import { WalletTransaction, CompletedTripRecord, DailyEarningData } from '../types';
import { soundManager } from '../utils/audio';
import { AddMoneyModal } from './AddMoneyModal';

interface WalletEarningsViewProps {
  walletBalance: number;
  transactions: WalletTransaction[];
  tripHistory: CompletedTripRecord[];
  weeklyData: DailyEarningData[];
  upiId: string;
  onInstantWithdrawal: (amount: number, upiId: string) => void;
  onAddMoney?: (amount: number, paymentMethod: string) => Promise<void> | void;
  onClose: () => void;
}

export const WalletEarningsView: React.FC<WalletEarningsViewProps> = ({
  walletBalance,
  transactions,
  tripHistory,
  weeklyData,
  upiId,
  onInstantWithdrawal,
  onAddMoney,
  onClose
}) => {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [activeTab, setActiveTab] = useState<'overview' | 'trips' | 'transactions'>('overview');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addMoneyPreset, setAddMoneyPreset] = useState<number | undefined>(undefined);
  const [withdrawAmount, setWithdrawAmount] = useState('500');
  const [customUpi, setCustomUpi] = useState(upiId);
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const totalWeekly = weeklyData.reduce((acc, curr) => acc + curr.earnings, 0);
  const totalWeeklyTrips = weeklyData.reduce((acc, curr) => acc + curr.trips, 0);

  const handlePayoutSubmit = () => {
    const num = Number(withdrawAmount);
    if (isNaN(num) || num <= 0 || num > walletBalance) {
      alert(`Please enter a valid amount up to ₹${walletBalance}`);
      return;
    }

    setIsProcessingPayout(true);
    setTimeout(() => {
      setIsProcessingPayout(false);
      setPayoutSuccess(true);
      soundManager.playCashEarned();
      try {
        confetti({ particleCount: 60, spread: 55, origin: { y: 0.5 } });
      } catch {}
      onInstantWithdrawal(num, customUpi);
    }, 1400);
  };

  const filteredTrips = tripHistory.filter(t => 
    t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.dropAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.rideId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="wallet-earnings-view" className="fixed inset-0 z-40 bg-zinc-950 overflow-y-auto pb-20 animate-in fade-in duration-200">
      
      {/* Top Sticky Header */}
      <div className="sticky top-0 z-30 bg-zinc-950/95 border-b border-zinc-800 backdrop-blur-md px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-zinc-100">Captain Wallet & Passbook</h2>
              <p className="text-[11px] text-zinc-400">Instant UPI Settlements & Trip Audits</p>
            </div>
          </div>

          <button
            id="btn-close-wallet-view"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        
        {/* 1. MAIN WALLET BALANCE HERO CARD */}
        <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/30 border-2 border-amber-400/60 rounded-3xl p-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Available Withdrawable Balance</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <h1 className="text-3xl sm:text-4xl font-black text-zinc-100 tracking-tight">
                  ₹{walletBalance.toLocaleString('en-IN')}
                </h1>
                <span className="text-xs text-emerald-400 font-bold">● Live Real-Time</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Default Linked UPI: <span className="text-zinc-200 font-mono font-medium">{upiId}</span>
              </p>
            </div>

            {/* Action Buttons: Add Money & Instant Payout */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <button
                id="btn-trigger-add-money"
                onClick={() => {
                  setAddMoneyPreset(undefined);
                  setShowAddMoneyModal(true);
                }}
                className="py-3 px-4 sm:px-5 rounded-2xl font-black text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>ADD MONEY</span>
              </button>

              <button
                id="btn-trigger-instant-payout"
                onClick={() => { setShowWithdrawModal(true); setPayoutSuccess(false); }}
                disabled={walletBalance <= 0}
                className={`py-3 px-4 sm:px-5 rounded-2xl font-black text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-1.5 ${
                  walletBalance > 0 
                    ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950 shadow-amber-400/20 active:scale-95' 
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>INSTANT PAYOUT</span>
              </button>
            </div>
          </div>

          {/* Quick Preset Recharge Chips */}
          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Quick Top-Up:</span>
              {[100, 200, 500, 1000].map((preset) => (
                <button
                  key={preset}
                  id={`btn-hero-quick-recharge-${preset}`}
                  onClick={() => {
                    setAddMoneyPreset(preset);
                    setShowAddMoneyModal(true);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-zinc-950/80 hover:bg-zinc-800 text-amber-400 border border-zinc-700/80 hover:border-amber-400/60 font-mono font-bold text-xs transition-all active:scale-95"
                >
                  +₹{preset}
                </button>
              ))}
            </div>

            <span className="text-[11px] text-zinc-400 hidden sm:inline">100% Ride Fares + 0% Commission</span>
          </div>
        </div>

        {/* 2. SUB-NAVIGATION TABS */}
        <div className="flex items-center gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'overview' ? 'bg-amber-400 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Earnings Breakdown
          </button>
          <button
            onClick={() => setActiveTab('trips')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'trips' ? 'bg-amber-400 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Trip History ({tripHistory.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'transactions' ? 'bg-amber-400 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Transactions
          </button>
        </div>

        {/* 3. TAB CONTENT */}
        
        {/* OVERVIEW: CHARTS & GRAPHS */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            
            {/* Timeframe Filter (Daily / Weekly / Monthly) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-100">Performance Trends</h3>
                  <p className="text-xs text-zinc-400">Total this week: ₹{totalWeekly.toLocaleString('en-IN')} ({totalWeeklyTrips} rides)</p>
                </div>

                <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                  {(['daily', 'weekly', 'monthly'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setTimeRange(mode)}
                      className={`px-3 py-1 text-xs font-bold capitalize rounded-lg transition-all ${
                        timeRange === mode 
                          ? 'bg-amber-400 text-zinc-950 shadow-sm' 
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recharts Graphical Visualization */}
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="earningGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#facc15" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#facc15" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis 
                      dataKey="day" 
                      stroke="#71717a" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#71717a" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                      formatter={(value: any) => [`₹${value}`, 'Earnings']}
                      labelFormatter={(label) => `Day: ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="earnings" 
                      stroke="#facc15" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#earningGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Metric Highlights */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-zinc-800 text-center">
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Weekly Net</p>
                  <p className="text-sm font-extrabold text-amber-400">₹{totalWeekly}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Avg Fare / Ride</p>
                  <p className="text-sm font-extrabold text-zinc-200">
                    ₹{totalWeeklyTrips > 0 ? Math.round(totalWeekly / totalWeeklyTrips) : 0}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Peak Bonus Earned</p>
                  <p className="text-sm font-extrabold text-emerald-400">₹450</p>
                </div>
              </div>
            </div>

            {/* Quick Incentive Milestones */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Captain Incentive Club</h4>
                <span className="text-xs font-semibold text-amber-400">Level 3: Super Captain</span>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🚀</span>
                    <div>
                      <p className="text-xs font-bold text-zinc-200">Weekend 30-Ride Challenge</p>
                      <p className="text-[10px] text-zinc-400">Completed 24/30 rides</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-amber-400">+₹500 Bonus</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⭐</span>
                    <div>
                      <p className="text-xs font-bold text-zinc-200">Maintain 4.9+ Star Rating</p>
                      <p className="text-[10px] text-zinc-400">Current: 4.92 ★ (Qualified)</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-400">0% Comm 5 Rides</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TRIP HISTORY TAB */}
        {activeTab === 'trips' && (
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search trip by rider, pickup or drop..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {filteredTrips.map(trip => (
              <div
                key={trip.id}
                className="bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-3.5 transition-colors"
              >
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-zinc-800 text-xs">
                      {trip.vehicleType === 'bike' ? '🛵' : trip.vehicleType === 'auto' ? '🛺' : '🚗'}
                    </span>
                    <div>
                      <h4 className="text-xs font-extrabold text-zinc-100">{trip.customerName}</h4>
                      <p className="text-[10px] text-zinc-400">{trip.date} • {trip.time}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-amber-400 font-mono">+₹{trip.captainEarning}</span>
                    <span className="block text-[10px] text-zinc-400 uppercase">
                      {trip.paymentMode === 'CASH' ? '💵 Cash' : '⚡ UPI'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-xs space-y-1">
                  <p className="text-zinc-300 truncate">
                    <span className="text-amber-400 font-bold">Pick:</span> {trip.pickupAddress}
                  </p>
                  <p className="text-zinc-400 truncate">
                    <span className="text-sky-400 font-bold">Drop:</span> {trip.dropAddress}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                    <span>Distance: {trip.distanceKm} km ({trip.durationMin} mins)</span>
                    <span className="text-amber-400">Rider Rating: ★ {trip.customerRating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TRANSACTIONS TAB */}
        {activeTab === 'transactions' && (
          <div className="space-y-2.5">
            {transactions.length === 0 ? (
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mx-auto text-amber-400">
                  <Wallet className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-zinc-200">No Transactions Yet</h4>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                  Your wallet balance starts dynamically at ₹0.00. Add money via UPI or complete rides to see your passbook entries here.
                </p>
                <button
                  id="btn-empty-add-money"
                  onClick={() => setShowAddMoneyModal(true)}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs rounded-xl transition-all shadow-md shadow-amber-400/20 active:scale-95"
                >
                  + Add Money to Wallet
                </button>
              </div>
            ) : (
              transactions.map(txn => {
                const isRecharge = txn.type === 'wallet_recharge' || txn.type === 'add_money';
                return (
                  <div 
                    key={txn.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        isRecharge
                          ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300'
                          : txn.amount > 0 
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' 
                            : 'bg-zinc-800 border border-zinc-700 text-zinc-300'
                      }`}>
                        {isRecharge ? (
                          <Plus className="w-5 h-5 stroke-[2.5]" />
                        ) : txn.amount > 0 ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-zinc-100">{txn.title}</h4>
                          {isRecharge && (
                            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-[9px] font-black text-emerald-400 rounded uppercase">
                              UPI Top-up
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono">Ref: {txn.referenceId} • {txn.date}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-sm font-black font-mono ${
                        txn.amount > 0 ? 'text-emerald-400' : 'text-zinc-200'
                      }`}>
                        {txn.amount > 0 ? `+₹${txn.amount}` : `-₹${Math.abs(txn.amount)}`}
                      </span>
                      <span className="block text-[10px] text-emerald-400 font-semibold uppercase">
                        {txn.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>

      {/* INSTANT PAYOUT MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in">
          <div className="w-full max-w-sm bg-zinc-900 border-2 border-amber-400/80 rounded-3xl p-5 shadow-2xl">
            
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-amber-400">
                <Zap className="w-5 h-5 fill-current" />
                <h3 className="text-base font-extrabold text-zinc-100">Instant UPI Payout</h3>
              </div>
              <button onClick={() => setShowWithdrawModal(false)} className="p-1 text-zinc-400 hover:text-zinc-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!payoutSuccess ? (
              <div className="py-4 space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase">Payout Amount (₹)</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-400">₹</span>
                    <input
                      type="number"
                      max={walletBalance}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl pl-8 pr-4 py-3 text-xl font-black text-amber-400 font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
                    <span>Available: ₹{walletBalance}</span>
                    <button 
                      onClick={() => setWithdrawAmount(walletBalance.toString())}
                      className="text-amber-400 font-bold hover:underline"
                    >
                      Withdraw All
                    </button>
                  </div>
                </div>

                {/* UPI Target */}
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase">Transfer to UPI ID</label>
                  <input
                    type="text"
                    value={customUpi}
                    onChange={(e) => setCustomUpi(e.target.value)}
                    placeholder="e.g. yourname@okhdfcbank"
                    className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-400">
                    <span>Supported:</span>
                    <span className="px-1.5 py-0.5 bg-zinc-800 rounded font-semibold text-zinc-300">GPay</span>
                    <span className="px-1.5 py-0.5 bg-zinc-800 rounded font-semibold text-zinc-300">PhonePe</span>
                    <span className="px-1.5 py-0.5 bg-zinc-800 rounded font-semibold text-zinc-300">Paytm</span>
                    <span className="px-1.5 py-0.5 bg-zinc-800 rounded font-semibold text-zinc-300">BHIM</span>
                  </div>
                </div>

                <button
                  id="btn-confirm-instant-payout"
                  onClick={handlePayoutSubmit}
                  disabled={isProcessingPayout}
                  className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 active:scale-95"
                >
                  {isProcessingPayout ? (
                    <span className="animate-pulse">Transferring via IMPS / UPI...</span>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      <span>TRANSFER ₹{withdrawAmount || 0} NOW</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="py-6 text-center space-y-3 animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h4 className="text-lg font-black text-zinc-100">Payout Successful!</h4>
                <p className="text-xs text-zinc-300">
                  ₹{withdrawAmount} has been instantly credited to <span className="font-mono text-amber-400 font-bold">{customUpi}</span>.
                </p>
                <p className="text-[10px] text-zinc-500 font-mono">Bank RRN: {Math.floor(100000000000 + Math.random() * 900000000000)}</p>
                
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold rounded-xl text-xs"
                >
                  Done
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ADD MONEY / RECHARGE WALLET MODAL */}
      <AddMoneyModal
        isOpen={showAddMoneyModal}
        currentBalance={walletBalance}
        driverUpiId={upiId}
        initialAmount={addMoneyPreset}
        onAddMoney={async (amount, method) => {
          if (onAddMoney) {
            await onAddMoney(amount, method);
          }
        }}
        onClose={() => {
          setShowAddMoneyModal(false);
          setAddMoneyPreset(undefined);
        }}
      />

    </div>
  );
};
