import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Search, 
  Filter, 
  MapPin, 
  Bike, 
  Car, 
  Sparkles, 
  Award, 
  Eye, 
  RefreshCw, 
  Send,
  AlertTriangle,
  CreditCard,
  Settings
} from 'lucide-react';
import { DriverProfile, AdminStats, CompletedTripRecord, KycDoc } from '../types';
import { soundManager } from '../utils/audio';
import { useLanguage } from '../context/LanguageContext';

interface AdminDashboardProps {
  drivers: DriverProfile[];
  onApproveDriver: (driverId: string) => void;
  onRejectDriver: (driverId: string, reason: string) => void;
  onSwitchToDriverApp: (selectedDriver?: DriverProfile) => void;
  onViewDriverIdCard: (driver: DriverProfile) => void;
  onOpenSettings?: () => void;
  stats: AdminStats;
  completedTrips: CompletedTripRecord[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  drivers,
  onApproveDriver,
  onRejectDriver,
  onSwitchToDriverApp,
  onViewDriverIdCard,
  onOpenSettings,
  stats,
  completedTrips
}) => {
  const { t, currentLanguageInfo } = useLanguage();
  const [activeTab, setActiveTab] = useState<'kyc_queue' | 'pass_subscriptions' | 'fleet_map'>('kyc_queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [rejectionModalDriver, setRejectionModalDriver] = useState<DriverProfile | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('Document image is blurry or expired. Please upload a clear valid copy.');
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState('');
  const [inspectingDoc, setInspectingDoc] = useState<{ driver: DriverProfile; doc: KycDoc } | null>(null);

  // Filtered drivers list
  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = 
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.badgeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone.includes(searchQuery) ||
      driver.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' ? true : driver.kycStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = drivers.filter(d => d.kycStatus === 'pending').length;

  const handleProcessPayouts = () => {
    soundManager.playCashEarned();
    setPayoutSuccessMsg('Successfully processed ₹18,450 driver earnings via Instant UPI Payouts!');
    setTimeout(() => setPayoutSuccessMsg(''), 4000);
  };

  return (
    <div id="admin-management-panel" className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans pb-12">
      
      {/* Admin Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-zinc-950 font-black flex items-center justify-center text-lg shadow-lg shadow-amber-400/20">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-zinc-100">Sawari Admin Operations</h1>
                <span className="px-2 py-0.5 bg-amber-400/20 border border-amber-400/40 rounded-full text-[10px] font-black text-amber-300 uppercase">
                  Central Admin
                </span>
              </div>
              <p className="text-xs text-zinc-400">Driver Verification • 0% Commission & Daily Pass Subscriptions • Fleet Operations</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSettings && (
              <button
                id="btn-admin-settings"
                onClick={onOpenSettings}
                title="Settings / भाषा (Language)"
                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 rounded-xl text-xs font-bold text-zinc-200 flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Settings className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">{t('settings')}</span>
                <span className="px-1.5 py-0.5 bg-amber-400/20 text-amber-300 text-[10px] font-bold rounded">
                  {currentLanguageInfo.nativeName}
                </span>
              </button>
            )}

            <button
              id="btn-switch-to-driver-view"
              onClick={() => onSwitchToDriverApp()}
              className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{t('switch_to_captain')}</span>
              <span className="sm:hidden">Captain App</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 pt-5 space-y-5">

        {/* 1. Global Metrics KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* Gross Ride Volume */}
          <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Gross Ride Volume</span>
            <div className="text-base sm:text-lg font-black text-zinc-100 mt-0.5 font-mono">
              ₹{(stats.totalGrossVolume).toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-0.5">
              <TrendingUp className="w-3 h-3" /> +14.2% this week
            </span>
          </div>

          {/* Daily Pass Subscription Revenue */}
          <div className="bg-zinc-900/80 border border-amber-400/40 p-3.5 rounded-2xl bg-gradient-to-br from-zinc-900 to-amber-950/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-amber-300">Daily Pass Revenue</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-base sm:text-lg font-black text-amber-400 mt-0.5 font-mono">
              ₹{(stats.totalPassRevenue || 48650).toLocaleString()}
            </div>
            <span className="text-[10px] text-amber-300/80 font-medium">₹15/₹20/₹40 passes</span>
          </div>

          {/* Total Passes Sold */}
          <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Passes Sold</span>
            <div className="text-base sm:text-lg font-black text-zinc-100 mt-0.5 font-mono">
              {(stats.totalPassesSold || 2640).toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">0% ride commission</span>
          </div>

          {/* Active Drivers */}
          <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Online Captains</span>
            <div className="text-base sm:text-lg font-black text-emerald-400 mt-0.5 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {stats.activeOnlineDrivers}
            </div>
            <span className="text-[10px] text-zinc-400">Bike, Auto, Cab</span>
          </div>

          {/* Pending KYC Approvals */}
          <div className={`border p-3.5 rounded-2xl transition-all ${
            pendingCount > 0 
              ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' 
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-400'
          }`}>
            <span className="text-[10px] uppercase font-bold block">Pending KYC</span>
            <div className="text-base sm:text-lg font-black text-amber-400 mt-0.5 font-mono">
              {pendingCount} Captains
            </div>
            <span className="text-[10px] text-amber-300 font-medium">Needs Document QC</span>
          </div>

          {/* Driver Payouts */}
          <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Captains Take-Home (100%)</span>
            <div className="text-base sm:text-lg font-black text-emerald-400 mt-0.5 font-mono">
              ₹{(stats.totalGrossVolume).toLocaleString()}
            </div>
            <button
              onClick={handleProcessPayouts}
              className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline mt-0.5 block text-left"
            >
              Instant UPI Payouts →
            </button>
          </div>

        </div>

        {payoutSuccessMsg && (
          <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{payoutSuccessMsg}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('kyc_queue')}
            className={`pb-2.5 px-4 text-xs font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'kyc_queue'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Driver Verification Queue</span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-zinc-950 text-[10px] font-black font-mono">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('pass_subscriptions')}
            className={`pb-2.5 px-4 text-xs font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'pass_subscriptions'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Daily Pass Subscriptions & Revenue</span>
          </button>

          <button
            onClick={() => setActiveTab('fleet_map')}
            className={`pb-2.5 px-4 text-xs font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'fleet_map'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Active Drivers & Fleet View</span>
          </button>
        </div>

        {/* TAB 1: DRIVER VERIFICATION QUEUE */}
        {activeTab === 'kyc_queue' && (
          <div className="space-y-4 animate-in fade-in">
            
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Name, Driver ID, Phone..."
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                <span className="text-[10px] font-bold text-zinc-500 uppercase mr-1 flex-shrink-0">Filter:</span>
                {[
                  { id: 'all', label: 'All Captains' },
                  { id: 'pending', label: `Pending (${pendingCount})` },
                  { id: 'approved', label: 'Approved' },
                  { id: 'rejected', label: 'Rejected' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      statusFilter === f.id
                        ? 'bg-amber-400 text-zinc-950 font-black shadow-sm'
                        : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Drivers List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredDrivers.map(driver => {
                const isApproved = driver.kycStatus === 'approved';
                const isPending = driver.kycStatus === 'pending';
                const isRejected = driver.kycStatus === 'rejected';

                return (
                  <div
                    key={driver.id}
                    className={`bg-zinc-900/90 border rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all ${
                      isPending
                        ? 'border-amber-500/60 shadow-lg shadow-amber-500/5'
                        : isRejected
                          ? 'border-rose-500/30'
                          : 'border-zinc-800'
                    }`}
                  >
                    <div>
                      {/* Driver Top Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={driver.avatar}
                            alt={driver.name}
                            className="w-13 h-13 rounded-2xl object-cover border-2 border-amber-400 shadow-md flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-black text-zinc-100 truncate">{driver.name}</h3>
                              <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-amber-400 font-mono font-black text-[10px] rounded-md flex-shrink-0">
                                {driver.badgeId}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                              <span>{driver.phone}</span>
                              <span>•</span>
                              <span className="capitalize text-zinc-300 font-semibold">{driver.vehicleType}</span>
                              <span>•</span>
                              <span>{driver.city}</span>
                            </p>
                          </div>
                        </div>

                        {/* Status Chip */}
                        <div className="flex-shrink-0">
                          {isApproved && (
                            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl text-[10px] font-black uppercase flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" /> Approved
                            </span>
                          )}
                          {isPending && (
                            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 animate-pulse">
                              <Clock className="w-3.5 h-3.5" /> Needs Review
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2.5 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-xl text-[10px] font-black uppercase flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5" /> Rejected
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Vehicle & Blood Group Info */}
                      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3 grid grid-cols-2 gap-2 text-xs my-3">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-zinc-500 block">Vehicle Model & Plate</span>
                          <span className="font-mono font-black text-amber-300 text-xs">{driver.vehicleNumber}</span>
                          <span className="text-[10px] text-zinc-400 block truncate">{driver.vehicleModel}</span>
                        </div>

                        <div>
                          <span className="text-[9px] uppercase font-bold text-zinc-500 block">Emergency & Joined</span>
                          <span className="text-zinc-300 text-xs">{driver.emergencyContact || 'Emergency Configured'}</span>
                          <span className="text-[10px] text-zinc-500 block">Joined: {driver.joinedDate}</span>
                        </div>
                      </div>

                      {/* Documents Checklist */}
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase block">Uploaded Documents (Click to View Photo)</span>
                          <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Inspect Photos
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {driver.kycDocs?.map(doc => (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => setInspectingDoc({ driver, doc })}
                              className="p-2 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800/80 hover:border-amber-400/60 rounded-xl text-[11px] flex items-center justify-between transition-all text-left group"
                            >
                              <div className="truncate mr-1">
                                <p className="font-bold text-zinc-300 group-hover:text-amber-300 truncate">{doc.title.replace('Commercial ', '')}</p>
                                <p className="text-[9px] font-mono text-zinc-500 truncate">{doc.docNumber || 'Photo Attached'}</p>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  doc.status === 'verified'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : doc.status === 'pending'
                                      ? 'bg-amber-500/20 text-amber-400'
                                      : 'bg-rose-500/20 text-rose-400'
                                }`}>
                                  {doc.status === 'verified' ? '✓ Valid' : doc.status === 'pending' ? '⏳ Review' : '✗ Invalid'}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Rejection notice if any */}
                      {driver.rejectionReason && (
                        <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 mb-3 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <span><strong>Rejection Note:</strong> {driver.rejectionReason}</span>
                        </div>
                      )}
                    </div>

                    {/* Admin Action Buttons */}
                    <div className="pt-3 border-t border-zinc-800 flex flex-wrap items-center gap-2">
                      {isPending && (
                        <>
                          <button
                            onClick={() => {
                              onApproveDriver(driver.id);
                              soundManager.playCashEarned();
                            }}
                            className="flex-1 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Approve KYC</span>
                          </button>

                          <button
                            onClick={() => setRejectionModalDriver(driver)}
                            className="py-2.5 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {isApproved && (
                        <button
                          onClick={() => onSwitchToDriverApp(driver)}
                          className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Login as this Captain</span>
                        </button>
                      )}

                      {isRejected && (
                        <button
                          onClick={() => {
                            onApproveDriver(driver.id);
                            soundManager.playCashEarned();
                          }}
                          className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Re-Approve Captain</span>
                        </button>
                      )}

                      <button
                        onClick={() => onViewDriverIdCard(driver)}
                        className="py-2 px-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>ID Card</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

            {filteredDrivers.length === 0 && (
              <div className="p-8 text-center bg-zinc-900/50 rounded-3xl border border-zinc-800 text-zinc-400">
                <Users className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                <p className="text-sm font-bold text-zinc-300">No driver registrations found</p>
                <p className="text-xs text-zinc-500">Try changing your search keywords or filter tab</p>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: DAILY PASS SUBSCRIPTIONS & REVENUE TRACKER */}
        {activeTab === 'pass_subscriptions' && (
          <div className="space-y-5 animate-in fade-in">
            
            {/* 0% Commission & Pass Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Bike Pass Card */}
              <div className="bg-zinc-900/90 border-2 border-amber-400/50 rounded-3xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🛵</span>
                    <div>
                      <h4 className="text-sm font-black text-zinc-100">Bike Taxi Pass</h4>
                      <p className="text-[10px] text-zinc-400">24-Hr Unlimited Access</p>
                    </div>
                  </div>
                  <span className="text-xl font-black text-amber-400 font-mono">₹15/day</span>
                </div>
                
                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Passes Active Today:</span>
                  <span className="font-mono font-bold text-emerald-400">{stats.passSalesByVehicle?.bike || 1480} sold</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Total Subscription Rev:</span>
                  <span className="font-mono font-bold text-amber-400">₹{(stats.passSalesByVehicle?.bike || 1480) * 15}</span>
                </div>
              </div>

              {/* Auto Pass Card */}
              <div className="bg-zinc-900/90 border-2 border-amber-400/50 rounded-3xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🛺</span>
                    <div>
                      <h4 className="text-sm font-black text-zinc-100">Auto Rickshaw Pass</h4>
                      <p className="text-[10px] text-zinc-400">24-Hr Unlimited Access</p>
                    </div>
                  </div>
                  <span className="text-xl font-black text-amber-400 font-mono">₹20/day</span>
                </div>
                
                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Passes Active Today:</span>
                  <span className="font-mono font-bold text-emerald-400">{stats.passSalesByVehicle?.auto || 720} sold</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Total Subscription Rev:</span>
                  <span className="font-mono font-bold text-amber-400">₹{(stats.passSalesByVehicle?.auto || 720) * 20}</span>
                </div>
              </div>

              {/* Cab Pass Card */}
              <div className="bg-zinc-900/90 border-2 border-amber-400/50 rounded-3xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🚗</span>
                    <div>
                      <h4 className="text-sm font-black text-zinc-100">Car / Cab Pass</h4>
                      <p className="text-[10px] text-zinc-400">24-Hr Unlimited Access</p>
                    </div>
                  </div>
                  <span className="text-xl font-black text-amber-400 font-mono">₹40/day</span>
                </div>
                
                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Passes Active Today:</span>
                  <span className="font-mono font-bold text-emerald-400">{stats.passSalesByVehicle?.cab || 440} sold</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Total Subscription Rev:</span>
                  <span className="font-mono font-bold text-amber-400">₹{(stats.passSalesByVehicle?.cab || 440) * 40}</span>
                </div>
              </div>

            </div>

            {/* 0% Model Comparison Banner */}
            <div className="bg-gradient-to-br from-amber-500/15 via-zinc-900 to-zinc-900 border border-amber-500/40 rounded-3xl p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-amber-400 text-zinc-950 rounded-md font-black text-xs uppercase">
                      0% Commission + Flat Daily Pass Model
                    </span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-black text-zinc-100 mt-2">
                    Predictable Fixed Subscriptions for Drivers
                  </h3>
                  <p className="text-xs text-zinc-300 max-w-xl mt-1">
                    Instead of losing ₹300-₹500 daily to high 25-30% platform commissions, Sawari captains pay a nominal flat daily pass (₹15/₹20/₹40) and keep 100% of their ride fares and customer tips.
                  </p>
                </div>

                {/* Comparison Card */}
                <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-3.5 text-xs space-y-2 min-w-[260px]">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>On ₹1,200 Daily Gross Earnings:</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                    <span className="text-rose-400 font-semibold">Competitor (25% cut):</span>
                    <span className="font-mono text-rose-300 font-bold">-₹300 lost</span>
                  </div>
                  <div className="flex items-center justify-between text-amber-400 font-black">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Sawari (Daily Pass):
                    </span>
                    <span className="font-mono text-emerald-400 text-sm">Only ₹15 (Saves ₹285)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Ledger (Itemized 0% commission trip list) */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-zinc-100">Live 0% Commission Trip Audit</h4>
                  <p className="text-xs text-zinc-400">All ride fares go 100% directly to captains with active passes</p>
                </div>

                <span className="text-xs font-mono font-black text-emerald-400">
                  Total Passes Revenue: ₹{(stats.totalPassRevenue || 48650).toLocaleString()}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 uppercase text-[10px]">
                      <th className="py-2.5 px-3">Trip ID</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Gross Bill</th>
                      <th className="py-2.5 px-3 text-amber-400 font-black">Platform Comm</th>
                      <th className="py-2.5 px-3 text-emerald-400 font-black">Captain 100% Take-Home</th>
                      <th className="py-2.5 px-3">Pass Status</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {completedTrips.map(trip => (
                      <tr key={trip.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3 px-3 font-bold text-zinc-300">{trip.rideId}</td>
                        <td className="py-3 px-3 text-zinc-200 font-sans">{trip.customerName}</td>
                        <td className="py-3 px-3 font-bold text-zinc-100">₹{trip.grossFare}</td>
                        <td className="py-3 px-3 font-black text-emerald-400">₹0 (0%)</td>
                        <td className="py-3 px-3 font-black text-emerald-400">₹{trip.captainEarning}</td>
                        <td className="py-3 px-3">
                          <span className="px-1.5 py-0.5 bg-amber-400/20 text-amber-300 rounded text-[9px] font-bold font-sans">
                            Active Pass
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md text-[10px] font-black uppercase font-sans">
                            Settled ✓
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: ACTIVE DRIVERS & FLEET VIEW */}
        {activeTab === 'fleet_map' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Fleet status summary list */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-zinc-100">Active Fleet ({drivers.length})</h4>
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Live
                  </span>
                </div>

                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {drivers.map(d => (
                    <div
                      key={d.id}
                      className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between text-xs hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={d.avatar} alt={d.name} className="w-9 h-9 rounded-full object-cover border border-amber-400" />
                        <div className="min-w-0">
                          <p className="font-black text-zinc-200 truncate">{d.name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">{d.badgeId} • {d.vehicleNumber}</p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          d.currentDutyStatus === 'online'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}>
                          {d.currentDutyStatus || 'Online'}
                        </span>
                        <p className="text-[10px] text-amber-400 font-mono mt-0.5">★ {d.rating}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Fleet Hotspots Map Visualization */}
              <div className="lg:col-span-2 bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden min-h-[400px]">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-amber-400" />
                      <h4 className="text-sm font-black text-zinc-100">Live Driver GPS Hub (Bengaluru Metro)</h4>
                    </div>
                    <span className="text-xs font-mono text-zinc-400">142 Drivers Online</span>
                  </div>
                  <p className="text-xs text-zinc-400">Real-time captain locations and high surge demand zones</p>
                </div>

                {/* Map Mock Simulation Canvas */}
                <div className="my-4 relative h-64 bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden flex items-center justify-center">
                  
                  {/* Grid lines */}
                  <div className="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

                  {/* Hotspots */}
                  <div className="absolute top-10 left-16 p-3 rounded-full bg-amber-400/20 border border-amber-400/60 animate-pulse flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="absolute -bottom-5 text-[10px] font-bold text-amber-300 whitespace-nowrap bg-zinc-950/80 px-1.5 py-0.5 rounded">
                      Koramangala (42 Bikes)
                    </span>
                  </div>

                  <div className="absolute top-20 right-20 p-3 rounded-full bg-amber-400/20 border border-amber-400/60 animate-pulse flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="absolute -bottom-5 text-[10px] font-bold text-amber-300 whitespace-nowrap bg-zinc-950/80 px-1.5 py-0.5 rounded">
                      Indiranagar (35 Drivers)
                    </span>
                  </div>

                  <div className="absolute bottom-12 left-1/3 p-3 rounded-full bg-rose-500/20 border border-rose-500/60 animate-pulse flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="absolute -bottom-5 text-[10px] font-bold text-rose-300 whitespace-nowrap bg-zinc-950/80 px-1.5 py-0.5 rounded">
                      Tech Village Outer Ring (58 Drivers)
                    </span>
                  </div>

                  <div className="text-center z-10 bg-zinc-900/90 border border-zinc-800 px-4 py-2 rounded-2xl shadow-xl">
                    <p className="text-xs font-black text-amber-400">Bengaluru Core Region Active</p>
                    <p className="text-[10px] text-zinc-400">Average Driver ETA to Customer: 2.4 Mins</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800">
                  <span>Demand Surge Multiplier: <strong className="text-amber-400 font-mono">1.2x – 2.2x</strong></span>
                  <button
                    onClick={() => onSwitchToDriverApp()}
                    className="text-amber-400 font-bold hover:underline"
                  >
                    Open Live Driver Dispatcher →
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

      </main>

      {/* KYC Document Photo Inspector Modal */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img 
                  src={inspectingDoc.driver.avatar} 
                  alt={inspectingDoc.driver.name} 
                  className="w-10 h-10 rounded-xl object-cover border border-amber-400" 
                />
                <div>
                  <h3 className="text-xs font-black text-zinc-100">{inspectingDoc.driver.name}</h3>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    {inspectingDoc.doc.title} • {inspectingDoc.doc.docNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingDoc(null)}
                className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
              >
                ✕
              </button>
            </div>

            {/* Photos Scroll Body */}
            <div className="p-4 overflow-y-auto space-y-4">
              {/* Front Photo */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-300">Document Front Photo</span>
                  {inspectingDoc.doc.frontImage && (
                    <span className="text-[10px] text-emerald-400 font-bold">Uploaded ✓</span>
                  )}
                </div>
                {inspectingDoc.doc.frontImage ? (
                  <div className="relative rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-950 max-h-64 flex items-center justify-center">
                    <img 
                      src={inspectingDoc.doc.frontImage} 
                      alt="Front Document" 
                      className="w-full h-auto max-h-64 object-contain" 
                    />
                  </div>
                ) : (
                  <div className="py-8 bg-zinc-950 border border-zinc-800 rounded-2xl text-center text-zinc-500 text-xs">
                    No Front Photo Provided
                  </div>
                )}
              </div>

              {/* Back Photo */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-300">Document Back Photo</span>
                  {inspectingDoc.doc.backImage ? (
                    <span className="text-[10px] text-emerald-400 font-bold">Uploaded ✓</span>
                  ) : (
                    <span className="text-[10px] text-zinc-500">Not Applicable / Not Uploaded</span>
                  )}
                </div>
                {inspectingDoc.doc.backImage ? (
                  <div className="relative rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-950 max-h-64 flex items-center justify-center">
                    <img 
                      src={inspectingDoc.doc.backImage} 
                      alt="Back Document" 
                      className="w-full h-auto max-h-64 object-contain" 
                    />
                  </div>
                ) : (
                  <div className="py-6 bg-zinc-950 border border-zinc-800 rounded-2xl text-center text-zinc-500 text-xs">
                    No Back Photo Required or Uploaded
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-3.5 bg-zinc-950 border-t border-zinc-800 flex gap-2">
              <button
                type="button"
                onClick={() => setInspectingDoc(null)}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 font-bold rounded-xl text-xs transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
      {rejectionModalDriver && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-rose-400 flex items-center gap-1.5">
                <XCircle className="w-4 h-4" /> Reject Driver KYC Application
              </h3>
              <button
                onClick={() => setRejectionModalDriver(null)}
                className="p-1 text-zinc-400 hover:text-zinc-100"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              Provide feedback for <strong>{rejectionModalDriver.name}</strong> ({rejectionModalDriver.badgeId}). The captain will be asked to re-upload the corrected documents.
            </p>

            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Rejection Reason</label>
              <textarea
                rows={3}
                value={rejectionReasonText}
                onChange={(e) => setRejectionReasonText(e.target.value)}
                className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setRejectionModalDriver(null)}
                className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onRejectDriver(rejectionModalDriver.id, rejectionReasonText);
                  setRejectionModalDriver(null);
                }}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-400 text-zinc-950 font-black rounded-xl text-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
