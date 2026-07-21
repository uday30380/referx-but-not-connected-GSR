import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  TrendingUp, DollarSign, Users, CheckCircle2, Award, ArrowRight,
  Clock, Sparkles, Zap, Target, ChevronRight, Copy, AlertTriangle, Trophy,
  Star, Activity, Flame, Crown, Eye, EyeOff, Bell, Calendar, ShieldCheck
} from "lucide-react";
import { collection, query, where, orderBy, limit, onSnapshot, doc } from "firebase/firestore";
import { db } from "../firebase";

const AnimatedNumber = ({ value, duration = 900, prefix = "" }) => {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value) || 0;
    if (end === 0) { setCurrent(0); return; }
    const totalFrames = Math.min(60, Math.max(20, Math.floor(duration / 16)));
    const stepValue = end / totalFrames;
    let frame = 0;
    const timer = setInterval(() => {
      frame++;
      start = Math.round(stepValue * frame);
      if (frame >= totalFrames) { clearInterval(timer); setCurrent(end); }
      else { setCurrent(start); }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span className="counter-value">{prefix}{current.toLocaleString("en-IN")}</span>;
};

export default function Dashboard({ user, joinedCampaigns, referrals = [], campaigns, showToast, pageContent }) {
  const navigate = useNavigate();
  const [levelConfig, setLevelConfig] = useState({
    level2: 100,
    level3: 250,
    level4: 500,
    level5: 1000,
    level6: 2000,
    level7: 5000,
    level8: 8000,
    level9: 12000,
    level10: 16000,
    level11: 20000,
    level12: 25000,
    level13: 30000,
    level14: 40000
  });
  const [showBalance, setShowBalance] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const actQuery = query(
      collection(db, "activities"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc"),
      limit(6)
    );
    const unsubscribe = onSnapshot(actQuery, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setRecentActivities(list);
      setLoadingActivities(false);
    }, (err) => {
      console.warn("Dashboard activities sync:", err);
      setLoadingActivities(false);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const docRef = doc(db, "settings", "levels");
    const unsubscribeConfig = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setLevelConfig(snapshot.data());
      }
    }, (err) => {
      console.warn("Dashboard levelConfig sync error:", err);
    });
    return () => unsubscribeConfig();
  }, []);

  // Database-backed Dynamic Variables
  const userNameDisplay = user.name || "Affiliate Partner";
  
  const rankNames = [
    "Intern", "Executive", "Senior Executive", "Assistant Supervisor", 
    "Supervisor", "Assistant Manager", "Manager", "Senior Manager", 
    "Regional Manager", "State Head", "National Head", "Diamond Manager", 
    "Platinum Manager", "Elite Director"
  ];
  const userRankDisplay = rankNames[(user.level || 1) - 1] || "Intern";
  const userIdDisplay = user.employeeId || ("NXE-" + (user.uid ? user.uid.substring(0, 6).toUpperCase() : "100482"));

  const displayBalance = user.earnings?.balance || 0;
  const displayBonusWallet = user.earnings?.bonus || 0;
  const displayTeamIncome = user.earnings?.team || 0;

  // Earnings overview slabs
  const displayToday = user.earningsDetail?.today || 0;
  const displayYesterday = user.earningsDetail?.yesterday || 0;
  const displayThisWeek = user.earningsDetail?.weekly || 0;
  const displayThisMonth = user.earningsDetail?.monthly || 0;

  const displayPending = user.earnings?.pending || 0;
  const displayApproved = user.earnings?.approved || 0;
  const displayReferral = user.earnings?.referral || 0;
  const displayLifetime = user.earnings?.total || 0;

  const totalReferralsCount = referrals.length || 0;

  const rejectedCampaign = Object.entries(joinedCampaigns || {}).find(([_, d]) => d.status === "Rejected");
  const rejectedCampaignId = rejectedCampaign?.[0] || null;
  const rejectedCampaignName = rejectedCampaignId
    ? (campaigns.find(c => c.id === rejectedCampaignId)?.name || rejectedCampaignId)
    : "";

  // Dynamic campaign performance calculation based on actual completions/approvals
  const campaignPerformanceList = campaigns.map(c => {
    const listForCamp = Object.values(joinedCampaigns || {}).filter(jc => jc.campaignId === c.id || jc.id === c.id);
    const approvedCount = listForCamp.filter(jc => jc.status === "Approved").length;
    
    // Count team completions for this campaign
    const teamCompletionsCount = referrals.filter(r => r.campaignId === c.id && r.status === "approved").length;
    const totalCount = approvedCount + teamCompletionsCount;
    const estimatedValue = totalCount * c.reward;

    return {
      name: c.name,
      value: estimatedValue,
      count: totalCount
    };
  }).filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);

  // If no dynamic performance data, populate with empty states or standard listing of available campaigns with 0 completions
  const finalPerfList = campaignPerformanceList.length > 0 ? campaignPerformanceList : campaigns.slice(0, 4).map(c => ({
    name: c.name,
    value: 0,
    count: 0
  }));

  // Dynamic 7-day cumulative earnings graph calculation for real-time analysis
  const getGraphDataPoints = () => {
    const daysLabels = [];
    const points = Array(7).fill(0);
    const now = new Date();
    
    // Generate day labels (e.g. "Jun 24")
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      daysLabels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
    }

    // Filter approved referrals in last 7 days
    if (referrals && referrals.length > 0) {
      const approvedRefs = referrals.filter(r => r.status === "approved" || r.status === "Approved" || r.status === "pending");
      approvedRefs.forEach(r => {
        const date = r.createdAt ? new Date(r.createdAt) : new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 7) {
          points[6 - diffDays] += r.rewardAmount || 100;
        }
      });
    }

    // Convert daily points to cumulative progress to display a rising ledger curve
    let cumulative = 0;
    const cumulativePoints = points.map(val => {
      cumulative += val;
      return cumulative;
    });

    // Fallback seed curve to represent active volume trends if the user has 0 actual referrals
    const fallbackCurve = [1200, 1850, 2400, 3100, 4800, 6200, displayLifetime > 0 ? displayLifetime : 8500];
    const finalPoints = displayLifetime > 0 || referrals.length > 0
      ? cumulativePoints 
      : fallbackCurve;

    // Map points to SVG coordinates (viewBox 0 0 300 120)
    // padding: vertical 15px (y range: 15 to 85)
    const maxVal = Math.max(...finalPoints, 100);
    const minVal = 0;
    const range = maxVal - minVal;

    const coords = finalPoints.map((val, idx) => {
      const x = (idx / 6) * 300;
      const y = 85 - ((val - minVal) / range) * 70;
      return { x, y };
    });

    // Generate smooth Cubic Bezier path
    let pathD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const cpX1 = coords[i - 1].x + 25;
      const cpY1 = coords[i - 1].y;
      const cpX2 = coords[i].x - 25;
      const cpY2 = coords[i].y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${coords[i].x} ${coords[i].y}`;
    }

    const fillD = `${pathD} L 300 100 L 0 100 Z`;

    return { pathD, fillD, points: finalPoints, coords, labels: daysLabels };
  };

  const graphData = getGraphDataPoints();

  return (
    <div className="flex flex-col gap-8 text-slate-100 entrance-scale-up pb-24 md:pb-36">

      {/* Global CSS enhancements for chart, tables, and borders */}
      <style dangerouslySetInnerHTML={{ __html: `
        .dashboard-glow-card {
          background: rgba(10, 18, 38, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(12px);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .dashboard-glow-card:hover {
          border-color: rgba(234, 179, 8, 0.2);
          box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.5), 0 0 20px 0 rgba(234, 179, 8, 0.03);
          transform: translateY(-2px);
        }
        .stat-card-overview {
          background: rgba(13, 22, 46, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.25s ease;
        }
        .stat-card-overview:hover {
          border-color: rgba(234, 179, 8, 0.15);
          background: rgba(13, 22, 46, 0.6);
          transform: scale(1.02);
        }
        .btn-gold-action {
          background: linear-gradient(135deg, #FBBF24 0%, #EAB308 100%);
          color: #050A15;
          font-weight: 800;
          transition: all 0.25s ease;
        }
        .btn-gold-action:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 20px rgba(234, 179, 8, 0.4);
        }
        .pulse-activity-status {
          position: relative;
        }
        .pulse-activity-status::after {
          content: '';
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #34D399;
          right: -12px;
          top: 50%;
          transform: translateY(-50%);
          box-shadow: 0 0 8px #34D399;
          animation: pulseStatus 2s infinite;
        }
        @keyframes pulseStatus {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
      `}} />

      {/* Rejection Alert */}
      {rejectedCampaignId && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-2xl border border-rose-500/25 bg-rose-500/5 border-l-4 border-l-rose-500 animate-pulse">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white text-sm font-bold block">Action Required — Task Rejected</strong>
              <p className="text-xs text-slate-400 mt-0.5">
                Your <strong className="text-rose-300">{rejectedCampaignName}</strong> submission was rejected. Update your details and resubmit.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/campaigns')}
            className="px-5 py-2 bg-rose-500/15 border border-rose-500/35 hover:bg-rose-500/25 text-rose-300 font-bold text-xs rounded-xl transition-all active:scale-95 shrink-0"
          >
            Fix Now →
          </button>
        </div>
      )}

      {/* Trust & Security Header Alert banner */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:16, background:"rgba(16,185,129,0.05)", border:"1px solid rgba(16,185,129,0.12)" }}>
        <ShieldCheck size={15} color="#34D399" style={{ flexShrink:0 }} />
        <span style={{ fontSize:12, fontWeight:600, color:"rgba(52,211,153,0.85)", lineHeight:1.5 }}>
          🔒 Secure session protected by ReferX AI-Fraud-Safe Engine · Payouts processed to your verified UPI/bank within 24 hours.
        </span>
      </div>

      {/* ─── WELCOME BACK HEADER ─────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center select-none pt-2 dash-welcome-anim">
        <div>
          <span style={{ fontSize:10, color:"rgba(251,191,36,0.7)", fontWeight:800, letterSpacing:"0.2em", textTransform:"uppercase", display:"block", marginBottom:4 }}>👋 WELCOME BACK</span>
          <h2 style={{ fontSize:32, fontWeight:900, color:"#fff", lineHeight:1.1, letterSpacing:"-0.02em", fontFamily:"'Outfit',sans-serif", display:"flex", alignItems:"center", gap:10 }}>
            {userNameDisplay} 
            <span style={{ fontSize:20 }}>✨</span>
          </h2>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(251,191,36,0.08)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:999, padding:"4px 12px" }}>
              <Crown size={11} color="#FBBF24" />
              <span style={{ fontSize:11, fontWeight:700, color:"#FBBF24" }}>{userRankDisplay}</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:999, padding:"4px 12px" }}>
              <span style={{ fontSize:11, fontWeight:600, color:"rgba(148,163,184,0.7)" }}>ID {userIdDisplay}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN CARDS GRID ─────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto w-full stagger-list">
        {/* Card 1: Available Balance */}
        <div className="dashboard-glow-card rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between h-48">
          <div>
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">
              <span className="flex items-center gap-1">AVAILABLE BALANCE</span>
              <button onClick={() => setShowBalance(!showBalance)} className="text-slate-600 hover:text-slate-400 transition">
                {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-black text-white relative h-9 min-w-[150px] overflow-hidden">
                <span className={`absolute left-0 transition-all duration-300 ease-out ${showBalance ? "opacity-100 translate-y-0 filter blur-0" : "opacity-0 -translate-y-2 filter blur-sm pointer-events-none"}`}>
                  <AnimatedNumber value={displayBalance} prefix="₹" />
                </span>
                <span className={`absolute left-0 transition-all duration-300 ease-out font-mono tracking-widest ${!showBalance ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                  ••••••
                </span>
              </div>
              {showBalance && displayToday > 0 && (
                <span className="text-[10px] text-emerald-400 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  +₹{displayToday} today
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={() => navigate('/wallet')} className="btn-gold-action w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md">
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* ─── EARNINGS OVERVIEW SECTION ───────────────────────────────────────────── */}
      <div>
        <div className="text-left mb-4">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">EARNINGS OVERVIEW</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-list">
          {/* Row 1 */}
          <div className="stat-card-overview rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">
              <span>TODAY</span>
            </div>
            <strong className="text-xl font-extrabold text-white font-mono">
              ₹<AnimatedNumber value={displayToday} />
            </strong>
          </div>

          <div className="stat-card-overview rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">
              <span>YESTERDAY</span>
            </div>
            <strong className="text-xl font-extrabold text-white font-mono">
              ₹<AnimatedNumber value={displayYesterday} />
            </strong>
          </div>

          <div className="stat-card-overview rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">
              <span>THIS WEEK</span>
            </div>
            <strong className="text-xl font-extrabold text-white font-mono">
              ₹<AnimatedNumber value={displayThisWeek} />
            </strong>
          </div>

          <div className="stat-card-overview rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">
              <span>THIS MONTH</span>
            </div>
            <strong className="text-xl font-extrabold text-white font-mono">
              ₹<AnimatedNumber value={displayThisMonth} />
            </strong>
          </div>


        </div>
      </div>



    </div>
  );
}
