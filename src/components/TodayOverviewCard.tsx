import React from 'react';
import { 
  TrendingUp, 
  Clock, 
  Award, 
  ChevronRight, 
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface TodayOverviewCardProps {
  todayEarnings: number;
  completedTripsCount: number;
  onlineHours: number;
  targetTrips: number;
  targetReward: number;
  onOpenWallet: () => void;
}

export const TodayOverviewCard: React.FC<TodayOverviewCardProps> = ({
  todayEarnings,
  completedTripsCount,
  onlineHours,
  targetTrips,
  targetReward,
  onOpenWallet
}) => {
  const { t } = useLanguage();
  const targetProgress = Math.min(100, Math.round((completedTripsCount / targetTrips) * 100));

  return (
    <div id="today-overview-card" className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-lg">
      {/* Top Banner with Today Earnings and Quick Link */}
      <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">{t('today_earnings')}</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-tight">
              ₹{todayEarnings.toLocaleString('en-IN')}
            </h2>
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14% vs avg
            </span>
          </div>
        </div>

        <button
          id="btn-view-detailed-earnings"
          onClick={onOpenWallet}
          className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/60 rounded-xl text-xs font-bold text-zinc-200 transition-colors"
        >
          <span>{t('wallet')}</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      </div>

      {/* 3 Metric Pills */}
      <div className="grid grid-cols-3 gap-2.5 py-3">
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 text-zinc-400 text-[11px] font-medium mb-1">
            <TrendingUp className="w-3 h-3 text-amber-400" />
            <span>{t('completed_trips')}</span>
          </div>
          <p className="text-base sm:text-lg font-extrabold text-zinc-100">{completedTripsCount}</p>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 text-zinc-400 text-[11px] font-medium mb-1">
            <Clock className="w-3 h-3 text-sky-400" />
            <span>{t('online_hours')}</span>
          </div>
          <p className="text-base sm:text-lg font-extrabold text-zinc-100">{onlineHours} hrs</p>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 text-zinc-400 text-[11px] font-medium mb-1">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>Avg/Hr</span>
          </div>
          <p className="text-base sm:text-lg font-extrabold text-zinc-100">
            ₹{onlineHours > 0 ? Math.round(todayEarnings / onlineHours) : 0}
          </p>
        </div>
      </div>

      {/* Daily Incentive Goal Tracker */}
      <div className="mt-1 bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 border border-amber-500/30 rounded-xl p-3">
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <div className="flex items-center gap-1.5 text-amber-300">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Daily Quest Bonus</span>
          </div>
          <span className="text-amber-400 font-extrabold">+₹{targetReward} Extra</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-800 mb-1.5">
          <div 
            className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500" 
            style={{ width: `${targetProgress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span>{completedTripsCount} of {targetTrips} trips completed</span>
          <span className="font-semibold text-zinc-300">
            {completedTripsCount >= targetTrips ? '🎉 Goal Achieved!' : `${targetTrips - completedTripsCount} more rides to unlock`}
          </span>
        </div>
      </div>
    </div>
  );
};
