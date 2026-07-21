import React, { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db } from "../firebase";
import {
  Activity as ActivityIcon, LogIn, LogOut, MousePointerClick, Eye, FileText,
  Share2, UserPlus, TrendingUp, Edit, Clock, Filter, ChevronDown
} from "lucide-react";

const ACTION_CONFIG = {
  "Login": { icon: LogIn, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400", filterKey: "logins" },
  "Logout": { icon: LogOut, color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20", dot: "bg-slate-400", filterKey: "logins" },
  "Campaign Click": { icon: MousePointerClick, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20", dot: "bg-sky-400", filterKey: "campaigns" },
  "Campaign Open": { icon: Eye, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20", dot: "bg-indigo-400", filterKey: "campaigns" },
  "Campaign Submission": { icon: FileText, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400", filterKey: "campaigns" },
  "Referral Share": { icon: Share2, color: "text-fuchsia-400", bg: "bg-fuchsia-500/10 border-fuchsia-500/20", dot: "bg-fuchsia-400", filterKey: "referrals" },
  "Referral Registration": { icon: UserPlus, color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20", dot: "bg-teal-400", filterKey: "referrals" },
  "Team Growth": { icon: TrendingUp, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", dot: "bg-violet-400", filterKey: "growth" },
  "Profile Updated": { icon: Edit, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20", dot: "bg-pink-400", filterKey: "profile" },
};

const DEFAULT_CONFIG = {
  icon: Clock, color: "text-slate-500", bg: "bg-slate-500/8 border-slate-500/15", dot: "bg-slate-500", filterKey: "other"
};

const FILTERS = [
  { key: "all", label: "All", color: "bg-white/10 text-white border-white/20" },
  { key: "logins", label: "Logins", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25" },
  { key: "campaigns", label: "Tasks", color: "bg-sky-500/15 text-sky-300 border-sky-500/25" },
  { key: "referrals", label: "Referrals", color: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/25" },
  { key: "growth", label: "Growth", color: "bg-violet-500/15 text-violet-300 border-violet-500/25" },
  { key: "profile", label: "Profile", color: "bg-pink-500/15 text-pink-300 border-pink-500/25" },
];

const formatTimestamp = (timestamp) => {
  if (!timestamp) return "Just now";
  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else {
    date = new Date(timestamp);
  }
  return date.toLocaleString("en-IN", {
    day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit", hour12: true
  });
};

export default function Activity({ user, showToast }) {
  const [activities, setActivities] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const activitiesQuery = query(
      collection(db, "activities"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc"),
      limit(100)
    );
    const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setActivities(list);
      setLoading(false);
    }, (err) => {
      console.warn("Could not sync activities log:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const filteredList = filterType === "all"
    ? activities
    : activities.filter((act) => {
        const cfg = ACTION_CONFIG[act.action] || DEFAULT_CONFIG;
        return cfg.filterKey === filterType;
      });

  const totalByType = FILTERS.slice(1).reduce((acc, f) => {
    acc[f.key] = activities.filter(a => (ACTION_CONFIG[a.action] || DEFAULT_CONFIG).filterKey === f.key).length;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6 text-slate-100 entrance-scale-up">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ActivityIcon size={24} className="text-cyan-400" />
            Activity Log
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            All actions and events on your account — tracked securely.
          </p>
        </div>

        {/* Stats Pill */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/[0.08]">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-300 font-semibold">{activities.length} total events</span>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterType(f.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 active:scale-95 ${
              filterType === f.key
                ? f.color + " shadow-lg"
                : "bg-white/5 border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/8"
            }`}
          >
            {f.label}
            {f.key !== "all" && totalByType[f.key] > 0 && (
              <span className={`ml-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-md ${filterType === f.key ? "bg-white/20" : "bg-white/8"}`}>
                {totalByType[f.key]}
              </span>
            )}
            {f.key === "all" && (
              <span className={`ml-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-md ${filterType === f.key ? "bg-white/20" : "bg-white/8"}`}>
                {activities.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Summary stat cards row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Logins", value: totalByType.logins || 0, color: "text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/15" },
          { label: "Tasks", value: totalByType.campaigns || 0, color: "text-sky-400", bg: "bg-sky-500/8 border-sky-500/15" },
          { label: "Referrals", value: totalByType.referrals || 0, color: "text-fuchsia-400", bg: "bg-fuchsia-500/8 border-fuchsia-500/15" },
          { label: "Growth", value: totalByType.growth || 0, color: "text-violet-400", bg: "bg-violet-500/8 border-violet-500/15" },
          { label: "Profile", value: totalByType.profile || 0, color: "text-pink-400", bg: "bg-pink-500/8 border-pink-500/15" },
        ].map((s, i) => (
          <div key={s.label} className={`glass-card rounded-2xl p-3 border ${s.bg} text-center hover:scale-[1.02] duration-200 transition-all`}>
            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden shadow-xl hover:-translate-y-0.5 duration-300 transition-all">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/3 rounded-full blur-3xl pointer-events-none" />

        {loading ? (
          <div className="flex flex-col gap-4 py-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-9 h-9 rounded-xl bg-white/4 animate-pulse shrink-0" style={{ animationDelay: `${i * 80}ms` }} />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-white/4 rounded animate-pulse w-1/3" />
                  <div className="h-2.5 bg-white/3 rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center">
              <ActivityIcon size={28} className="text-slate-600" />
            </div>
            <p className="text-slate-400 font-semibold text-sm">No activities found</p>
            <p className="text-slate-600 text-xs">Try a different filter or start using the platform.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-white/8 pl-6 ml-3 flex flex-col gap-5">
            {filteredList.map((item, idx) => {
              const cfg = ACTION_CONFIG[item.action] || DEFAULT_CONFIG;
              const Icon = cfg.icon;
              return (
                <div
                  key={item.id || idx}
                  className="relative flex flex-col md:flex-row md:items-center justify-between gap-3 group animate-slide-up"
                  style={{ animationDelay: `${Math.min(idx, 10) * 30}ms` }}
                >
                  {/* Timeline dot */}
                  <div className="absolute -left-[35px] top-1 w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-200 group-hover:scale-110 group-hover:border-white/20"
                    style={{ background: "#0D1526" }}
                  >
                    <div className={`border ${cfg.bg} rounded-lg w-full h-full flex items-center justify-center`}>
                      <Icon size={14} className={cfg.color} />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">{item.action}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${cfg.bg} ${cfg.color} uppercase tracking-wider`}>
                        Secure
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-2xl">{item.details}</p>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-600 text-[10px] shrink-0">
                    <Clock size={11} />
                    <span>{formatTimestamp(item.timestamp)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
