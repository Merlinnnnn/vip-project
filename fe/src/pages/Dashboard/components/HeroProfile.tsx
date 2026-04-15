import React from "react";
import { Award, Shield, Zap, TrendingUp } from "lucide-react";
import type { SkillStats } from "../../types/skill";

interface HeroProfileProps {
  stats: SkillStats;
}

const HeroProfile: React.FC<HeroProfileProps> = ({ stats }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-1 shadow-xl">
      <div className="rounded-xl bg-white/10 backdrop-blur-md p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-4 border-white/30 bg-white/20 flex items-center justify-center shadow-lg">
                <Award className="h-10 w-10 text-yellow-300" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-indigo-900 text-xs font-bold px-2 py-1 rounded-full border-2 border-indigo-600">
                LVL {stats.totalLevel}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight uppercase italic flex items-center gap-2">
                {stats.globalRank}
                <Shield className="h-5 w-5 text-blue-300" />
              </h2>
              <p className="text-white/80 text-sm font-medium">Mastering {stats.skillsCount} Domains</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 flex-1 max-w-2xl">
            <div className="bg-white/10 rounded-lg p-3 border border-white/10 hover:bg-white/20 transition-colors">
              <div className="flex items-center gap-2 text-white/70 mb-1">
                <Zap className="h-4 w-4 text-yellow-300" />
                <span className="text-xs font-bold uppercase tracking-wider">Total Power</span>
              </div>
              <p className="text-xl font-bold">{Math.floor(stats.totalMinutes / 60)}h <span className="text-sm font-normal text-white/60">{stats.totalMinutes % 60}m</span></p>
            </div>

            <div className="bg-white/10 rounded-lg p-3 border border-white/10 hover:bg-white/20 transition-colors hidden lg:block">
              <div className="flex items-center gap-2 text-white/70 mb-1">
                <TrendingUp className="h-4 w-4 text-emerald-300" />
                <span className="text-xs font-bold uppercase tracking-wider">Core Strength</span>
              </div>
              <p className="text-xl font-bold truncate max-w-[150px]">{stats.topSkills[0]?.name || "None"}</p>
            </div>

            <div className="col-span-2 lg:col-span-1 bg-yellow-400/20 rounded-lg p-3 border border-yellow-400/30">
              <div className="text-xs font-bold uppercase text-yellow-200 mb-2">Journey Progress</div>
              <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse" 
                  style={{ width: `${Math.min(100, (stats.totalLevel / 100) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {stats.topSkills.map((skill, idx) => (
            <div key={idx} className="bg-black/20 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/5">
              <span className="font-bold text-yellow-400">LVL {skill.level}</span>
              <span className="text-white/90">{skill.name}</span>
              <span className="bg-white/20 px-1.5 rounded text-[10px] uppercase font-black tracking-tighter text-white/60">{skill.rank}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroProfile;
