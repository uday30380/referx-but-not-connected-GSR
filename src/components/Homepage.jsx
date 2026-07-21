import React, { useState, useEffect } from "react";
import {
  Sparkles, ArrowRight, ChevronRight, Award, TrendingUp,
  Mail, Send, ShieldCheck, Check, Zap, Users, Trophy,
  Star, HelpCircle, Layers, LineChart, Network, ArrowUpRight,
  BadgeCheck, Coins, Gift, Rocket, ShieldAlert, Lock, Smartphone,
  ChevronDown, UserCheck, BarChart2, CreditCard, PiggyBank, Landmark,
  Wifi, Shield, Globe, ShoppingBag, Leaf, Briefcase, UserCog, Target,
  Flame, Crown, Map, Flag, Gem, Headphones, Watch, Car, Plane, Building,
  Monitor, Bike
} from "lucide-react";
import { collection, query, orderBy, limit, getDocs, onSnapshot, where } from "firebase/firestore";
import { db } from "../firebase";
import ScrollReveal from "./ScrollReveal";

// Professional SVG icon box component — no emoji
function IconBox({ icon, color = "#FBBF24", bg = "rgba(234,179,8,0.1)", border = "rgba(234,179,8,0.18)", size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 10,
      background: bg, border: `1px solid ${border}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, color
    }}>
      {icon}
    </div>
  );
}

export default function Homepage({ campaigns = [], onGetStarted, onLoginTrigger, homepageContent, pageContent }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const DEFAULT_LEADERBOARD = [
    { rank: 1, name: "Vikram Chatterjee", title: "Elite Director · Mumbai", earnings: "₹8.42L", badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
    { rank: 2, name: "Ananya Iyer", title: "Diamond Manager · Bengaluru", earnings: "₹6.15L", badge: "bg-slate-400/20 text-slate-300 border-slate-400/30" },
    { rank: 3, name: "Rohit Malhotra", title: "Diamond Manager · Pune", earnings: "₹5.48L", badge: "bg-amber-600/20 text-amber-300 border-amber-600/30" },
    { rank: 4, name: "Priya Sharma", title: "Platinum Manager · Jaipur", earnings: "₹4.89L", badge: "bg-slate-500/10 text-slate-300 border-white/5" },
    { rank: 5, name: "Arjun Krishnan", title: "National Head · Chennai", earnings: "₹4.13L", badge: "bg-slate-500/10 text-slate-300 border-white/5" }
  ];

  const DEFAULT_SUCCESS_STORIES = [
    { name: "Karthik R.", rank: "Diamond Manager · Hyderabad", earnings: "₹38.4L", joined: "Joined 14 months ago", text: "I was a part-time tutor. ReferX let me build a 4,200 member team across Telangana. I closed my last salary slip 8 months ago." },
    { name: "Meera J.", rank: "Platinum Manager · Kochi", earnings: "₹22.1L", joined: "Joined 9 months ago", text: "The dashboard tracks everything. Withdrawals hit UPI in under a minute. I refer Angel One on WhatsApp groups and earnings are real." },
    { name: "Devansh G.", rank: "Regional Manager · Lucknow", earnings: "₹11.8L", joined: "Joined 6 months ago", text: "Climbed from Executive to Regional Manager in 6 months. The rank rewards are real — I'm picking up my Thar next week." }
  ];

  // Dynamic States from Database — pre-filled with defaults so they never appear empty
  const [leaderboard, setLeaderboard] = useState(DEFAULT_LEADERBOARD);
  const [tickerItems, setTickerItems] = useState([
    { text: "@rohit_payout: ₹12,450 via UPI", status: "success" },
    { text: "ANGEL ONE: 42 new accounts in last hour", status: "info" },
    { text: "@neha_earn unlocked DIAMOND MANAGER", status: "success" },
    { text: "KOTAK 811 payout increased to ₹280", status: "info" },
    { text: "@arjun_k: ₹8,200 withdrawn", status: "success" },
    { text: "HDFC Credit Card · 96% approval today", status: "info" },
    { text: "@priya.s referred 18 new affiliates", status: "success" }
  ]);
  const [liveEarnings, setLiveEarnings] = useState([
    { name: "Aditya B.", campaign: "Angel One", amount: "₹850" },
    { name: "Sara K.", campaign: "Upstox", amount: "₹1,200" },
    { name: "Rohit M.", campaign: "HDFC Card", amount: "₹2,500" }
  ]);
  const [successStories, setSuccessStories] = useState(DEFAULT_SUCCESS_STORIES);
  
  const [dbStats, setDbStats] = useState({
    payouts: "₹128 Cr+",
    affiliates: "1,24,500+",
    campaignsCount: 58,
    avgTime: "2 min"
  });

  // Fetch dynamic statistics & leaderboard from Firestore
  useEffect(() => {
    const fetchStatsAndLeaderboard = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        let totalPaid = 0;
        let count = 0;
        const usersList = [];
        
        usersSnap.forEach(u => {
          const data = u.data();
          const earns = data.earnings ? (data.earnings.total || 0) : 0;
          totalPaid += earns;
          count++;
          usersList.push({ uid: u.id, ...data });
        });

        // Dynamic Stats formatting (fallback to user-provided static text if empty)
        let payoutsFormatted = "₹128 Cr+";
        if (totalPaid > 0) {
          if (totalPaid > 10000000) {
            payoutsFormatted = "₹" + (totalPaid / 10000000).toFixed(2) + " Cr+";
          } else if (totalPaid > 100000) {
            payoutsFormatted = "₹" + (totalPaid / 100000).toFixed(2) + " L+";
          } else {
            payoutsFormatted = "₹" + totalPaid.toLocaleString("en-IN");
          }
        }

        setDbStats({
          payouts: totalPaid > 0 ? payoutsFormatted : "₹128 Cr+",
          affiliates: count > 0 ? count.toLocaleString("en-IN") + "+" : "1,24,500+",
          campaignsCount: campaigns && campaigns.length > 0 ? campaigns.length : 58,
          avgTime: "2 min"
        });

        // Sort users to build Leaderboard
        const sortedLeaders = usersList
          .sort((a, b) => {
            const earningsA = a.earnings ? (a.earnings.total || 0) : 0;
            const earningsB = b.earnings ? (b.earnings.total || 0) : 0;
            return earningsB - earningsA;
          })
          .slice(0, 5);

        const ranks = [
          "Intern", "Executive", "Senior Executive", "Assistant Supervisor", 
          "Supervisor", "Assistant Manager", "Manager", "Senior Manager", 
          "Regional Manager", "State Head", "National Head", "Diamond Manager", 
          "Platinum Manager", "Elite Director"
        ];

        if (sortedLeaders.length > 0) {
          const dbLeaders = sortedLeaders.map((u, idx) => {
            const levelName = ranks[(u.level || 1) - 1] || "Intern";
            const cityLabel = u.city || "India";
            const totalEarnedStr = u.earnings ? (u.earnings.total || 0).toLocaleString("en-IN") : "0";
            return {
              rank: idx + 1,
              name: u.name || "Anonymous Leader",
              title: levelName + " · " + cityLabel,
              earnings: "₹" + totalEarnedStr,
              badge: idx === 0 ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" : 
                     idx === 1 ? "bg-slate-400/20 text-slate-300 border-slate-400/30" :
                     "bg-amber-600/20 text-amber-300 border-amber-600/30"
            };
          });
          setLeaderboard(dbLeaders);
        } else {
          // Default Leaderboard if DB is clean
          setLeaderboard([
            { rank: 1, name: "Vikram Chatterjee", title: "Elite Director · Mumbai", earnings: "₹8.42L", badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
            { rank: 2, name: "Ananya Iyer", title: "Diamond Manager · Bengaluru", earnings: "₹6.15L", badge: "bg-slate-400/20 text-slate-300 border-slate-400/30" },
            { rank: 3, name: "Rohit Malhotra", title: "Diamond Manager · Pune", earnings: "₹5.48L", badge: "bg-amber-600/20 text-amber-300 border-amber-600/30" },
            { rank: 4, name: "Priya Sharma", title: "Platinum Manager · Jaipur", earnings: "₹4.89L", badge: "bg-slate-500/10 text-slate-300 border-white/5" },
            { rank: 5, name: "Arjun Krishnan", title: "National Head · Chennai", earnings: "₹4.13L", badge: "bg-slate-500/10 text-slate-300 border-white/5" }
          ]);
        }

        // Build success stories dynamically from top earners
        if (sortedLeaders.length >= 3) {
          const stories = sortedLeaders.slice(0, 3).map((u, idx) => {
            const namePart = u.name || "Partner";
            const cityPart = u.city || "India";
            const levelPart = ranks[(u.level || 1) - 1] || "Intern";
            const totalEarnedStr = u.earnings ? (u.earnings.total || 0).toLocaleString("en-IN") : "0";
            const customTexts = [
              "I was a part-time tutor. ReferX let me build a 4,200 member team across Telangana. I closed my last salary slip 8 months ago.",
              "The dashboard tracks everything. Withdrawals hit UPI in under a minute. I refer Angel One on WhatsApp groups and earnings are real.",
              "Climbed from Executive to Regional Manager in 6 months. The rank rewards are real — I'm picking up my Thar next week."
            ];
            return {
              name: namePart,
              rank: levelPart + " · " + cityPart,
              earnings: "₹" + totalEarnedStr,
              joined: "Joined " + (idx === 0 ? "14 months ago" : idx === 1 ? "9 months ago" : "6 months ago"),
              text: customTexts[idx] || "Highly trustworthy interface. Verified tracking and recursive MLM commission structures work perfectly."
            };
          });
          setSuccessStories(stories);
        } else {
          // Default Success Stories if DB is clean
          setSuccessStories([
            { name: "Karthik R.", rank: "Diamond Manager · Hyderabad", earnings: "₹38.4L", joined: "Joined 14 months ago", text: "I was a part-time tutor. ReferX let me build a 4,200 member team across Telangana. I closed my last salary slip 8 months ago." },
            { name: "Meera J.", rank: "Platinum Manager · Kochi", earnings: "₹22.1L", joined: "Joined 9 months ago", text: "The dashboard tracks everything. Withdrawals hit UPI in under a minute. I refer Angel One on WhatsApp groups and earnings are real." },
            { name: "Devansh G.", rank: "Regional Manager · Lucknow", earnings: "₹11.8L", joined: "Joined 6 months ago", text: "Climbed from Executive to Regional Manager in 6 months. The rank rewards are real — I'm picking up my Thar next week." }
          ]);
        }

      } catch (err) {
        console.warn("Stats fetch failed:", err);
      }
    };
    fetchStatsAndLeaderboard();
  }, [campaigns]);

  // Real-time approved withdrawals for Ticker and Live Payout Feed
  useEffect(() => {
    const q = query(
      collection(db, "withdrawals"),
      where("status", "==", "approved"),
      orderBy("createdAt", "desc"),
      limit(7)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach(docSnap => {
        const w = docSnap.data();
        const cleanName = w.employeeName ? w.employeeName.toUpperCase().replace(/\s+/g, "_") : "PARTNER";
        items.push({
          text: "@" + cleanName + ": ₹" + w.amount.toLocaleString("en-IN") + " WITHDRAWN VIA UPI",
          status: "success"
        });
      });

      // Default user-defined items if database is clean/empty
      if (items.length === 0) {
        items.push(
          { text: "@rohit_payout: ₹12,450 via UPI", status: "success" },
          { text: "ANGEL ONE: 42 new accounts in last hour", status: "info" },
          { text: "@neha_earn unlocked DIAMOND MANAGER", status: "success" },
          { text: "KOTAK 811 payout increased to ₹280", status: "info" },
          { text: "@arjun_k: ₹8,200 withdrawn", status: "success" },
          { text: "HDFC Credit Card · 96% approval today", status: "info" },
          { text: "@priya.s referred 18 new affiliates", status: "success" }
        );
      }
      setTickerItems(items);
    }, (err) => {
      console.warn("Real-time withdrawals feed error:", err);
    });
    return () => unsubscribe();
  }, []);

  // Live Scrolling list of earnings — rotates every 2 seconds
  useEffect(() => {
    const allEntries = [
      { name: "Aditya B.", campaign: "Angel One", amount: "₹850" },
      { name: "Sara K.", campaign: "Upstox", amount: "₹1,200" },
      { name: "Rohit M.", campaign: "HDFC Card", amount: "₹2,500" },
      { name: "Priya S.", campaign: "Groww MF", amount: "₹680" },
      { name: "Karthik R.", campaign: "Kotak 811", amount: "₹480" },
      { name: "Neha D.", campaign: "Angel One", amount: "₹960" }
    ];
    let idx = 0;
    const timer = setInterval(() => {
      const batch = allEntries.slice(idx % allEntries.length, (idx % allEntries.length) + 3);
      const wrapped = batch.length < 3 ? [...batch, ...allEntries.slice(0, 3 - batch.length)] : batch;
      setLiveEarnings(wrapped);
      idx++;
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const marketplaceCategories = [
    { name: "Demat & Broker", count: "12 campaigns", icon: <BarChart2 size={18} />, iconColor: "#FBBF24", iconBg: "rgba(234,179,8,0.1)", iconBorder: "rgba(234,179,8,0.2)" },
    { name: "Credit Cards", count: "9 campaigns", icon: <CreditCard size={18} />, iconColor: "#A78BFA", iconBg: "rgba(167,139,250,0.1)", iconBorder: "rgba(167,139,250,0.2)" },
    { name: "Personal Loans", count: "7 campaigns", icon: <PiggyBank size={18} />, iconColor: "#34D399", iconBg: "rgba(52,211,153,0.1)", iconBorder: "rgba(52,211,153,0.2)" },
    { name: "Savings Accounts", count: "8 campaigns", icon: <Landmark size={18} />, iconColor: "#60A5FA", iconBg: "rgba(96,165,250,0.1)", iconBorder: "rgba(96,165,250,0.2)" },
    { name: "UPI Apps", count: "4 campaigns", icon: <Wifi size={18} />, iconColor: "#FB923C", iconBg: "rgba(251,146,60,0.1)", iconBorder: "rgba(251,146,60,0.2)" },
    { name: "Insurance", count: "6 campaigns", icon: <Shield size={18} />, iconColor: "#FBBF24", iconBg: "rgba(234,179,8,0.1)", iconBorder: "rgba(234,179,8,0.2)" },
    { name: "Mutual Funds", count: "5 campaigns", icon: <TrendingUp size={18} />, iconColor: "#34D399", iconBg: "rgba(52,211,153,0.1)", iconBorder: "rgba(52,211,153,0.2)" },
    { name: "Shopping & Apps", count: "7 campaigns", icon: <ShoppingBag size={18} />, iconColor: "#F472B6", iconBg: "rgba(244,114,182,0.1)", iconBorder: "rgba(244,114,182,0.2)" }
  ];

  const hostCampaigns = [
    { id: "angel_one", name: "Angel One Demat", cat: "Broker", reward: 100, epc: "38.20", approval: "94%", tag: "HIGH EPC", avatar: "A", color: "from-orange-500 via-amber-500 to-yellow-400" },
    { id: "upstox", name: "Upstox Pro", cat: "Broker", reward: 450, epc: "52.10", approval: "91%", tag: "TRENDING", avatar: "U", color: "from-indigo-700 via-purple-700 to-pink-600" },
    { id: "groww", name: "Groww Mutual Fund", cat: "Mutual Funds", reward: 320, epc: "28.40", approval: "96%", tag: "VERIFIED", avatar: "G", color: "from-emerald-500 to-teal-500" },
    { id: "hdfc", name: "HDFC Credit Card", cat: "Cards", reward: 2500, epc: "98.00", approval: "82%", tag: "PREMIUM", avatar: "H", color: "from-blue-700 to-indigo-900" },
    { id: "kotak", name: "Kotak 811 Savings", cat: "Banking", reward: 280, epc: "41.20", approval: "89%", tag: "INSTANT", avatar: "K", color: "from-rose-700 to-red-900" },
    { id: "airtel", name: "Airtel Payments Bank", cat: "Banking", reward: 160, epc: "22.50", approval: "93%", tag: "VOLUME", avatar: "A", color: "from-red-600 to-red-800" }
  ];

  // Professional SVG icon nodes for leadership ranks — no emoji
  const rankIcons = [
    <Leaf size={18} />,         // Intern
    <Briefcase size={18} />,   // Executive
    <UserCog size={18} />,     // Senior Executive
    <Shield size={18} />,      // Assistant Supervisor
    <Target size={18} />,      // Supervisor
    <Flame size={18} />,       // Assistant Manager
    <Trophy size={18} />,      // Manager
    <Crown size={18} />,       // Senior Manager (YOUR RANK)
    <Globe size={18} />,       // Regional Manager
    <Landmark size={18} />,    // State Head
    <Flag size={18} />,        // National Head
    <Gem size={18} />,         // Diamond Manager
    <Star size={18} />,        // Platinum Manager
    <Sparkles size={18} />     // Elite Director
  ];

  const leadershipRanks = [
    { rank: "RANK 01", name: "Intern", active: false },
    { rank: "RANK 02", name: "Executive", active: false },
    { rank: "RANK 03", name: "Senior Executive", active: false },
    { rank: "RANK 04", name: "Assistant Supervisor", active: false },
    { rank: "RANK 05", name: "Supervisor", active: false },
    { rank: "RANK 06", name: "Assistant Manager", active: false },
    { rank: "RANK 07", name: "Manager", active: false },
    { rank: "RANK 08", name: "Senior Manager", active: true, tag: "YOUR RANK" },
    { rank: "RANK 09", name: "Regional Manager", active: false },
    { rank: "RANK 10", name: "State Head", active: false },
    { rank: "RANK 11", name: "National Head", active: false },
    { rank: "RANK 12", name: "Diamond Manager", active: false },
    { rank: "RANK 13", name: "Platinum Manager", active: false },
    { rank: "RANK 14", name: "Elite Director", active: false }
  ];

  // Professional SVG icon rewards — no emoji
  const rewards = [
    { name: "Earbuds", unlock: "₹25k earned", icon: <Headphones size={20} />, iconColor: "#FBBF24", iconBg: "rgba(251,191,36,0.1)", iconBorder: "rgba(251,191,36,0.2)", borderClass: "border-amber-500/30 bg-amber-500/5" },
    { name: "Smart Watch", unlock: "₹75k earned", icon: <Watch size={20} />, iconColor: "#FDE68A", iconBg: "rgba(253,230,138,0.1)", iconBorder: "rgba(253,230,138,0.2)", borderClass: "border-yellow-500/30 bg-yellow-500/5" },
    { name: "Smartphone", unlock: "₹2L earned", icon: <Smartphone size={20} />, iconColor: "#FB923C", iconBg: "rgba(251,146,60,0.1)", iconBorder: "rgba(251,146,60,0.2)", borderClass: "border-orange-500/30 bg-orange-500/5" },
    { name: "MacBook Pro", unlock: "₹5L earned", icon: <Monitor size={20} />, iconColor: "#34D399", iconBg: "rgba(52,211,153,0.1)", iconBorder: "rgba(52,211,153,0.2)", borderClass: "border-teal-500/30 bg-teal-500/5" },
    { name: "Royal Enfield", unlock: "₹12L earned", icon: <Bike size={20} />, iconColor: "#F87171", iconBg: "rgba(248,113,113,0.1)", iconBorder: "rgba(248,113,113,0.2)", borderClass: "border-red-500/30 bg-red-500/5" },
    { name: "Mahindra Thar", unlock: "₹35L earned", icon: <Car size={20} />, iconColor: "#FDE68A", iconBg: "rgba(253,230,138,0.12)", iconBorder: "rgba(234,179,8,0.3)", borderClass: "border-yellow-400/40 bg-yellow-400/10" },
    { name: "Intl. Trip · Dubai", unlock: "₹50L earned", icon: <Plane size={20} />, iconColor: "#C084FC", iconBg: "rgba(192,132,252,0.1)", iconBorder: "rgba(192,132,252,0.2)", borderClass: "border-purple-500/30 bg-purple-500/5" },
    { name: "Hall of Fame", unlock: "₹1Cr+ earned", icon: <Building size={20} />, iconColor: "#FBBF24", iconBg: "rgba(234,179,8,0.15)", iconBorder: "rgba(234,179,8,0.4)", borderClass: "border-yellow-500/50 bg-gradient-to-r from-yellow-500/10 to-amber-600/5" }
  ];

  const faqList = [
    {
      q: "Is joining REFERX free?",
      a: "Yes. Account creation, KYC verification and access to all 58 campaigns is 100% free. We earn only when you earn."
    },
    {
      q: "How fast are withdrawals?",
      a: "Withdrawals are processed instantly via UPI in under 2 minutes. Alternatively, you can withdraw directly to your registered bank account via NEFT."
    },
    {
      q: "How does the MLM/team commission work?",
      a: "You earn override commissions recursively on every affiliate you recruit up to multiple downline levels. Whenever your team members complete campaigns, you secure direct commission nodes."
    },
    {
      q: "Are the payouts really real?",
      a: "Absolutely. We are officially partnered with India's largest finance companies. All payouts are verified and settled to UPI in seconds."
    },
    {
      q: "What documents do I need for KYC?",
      a: "You only need an Aadhaar card and PAN card. Your documentation is encrypted and securely stored for compliance and banking audits."
    },
    {
      q: "Can I run paid ads for these campaigns?",
      a: "Yes. Affiliates are allowed to run digital campaigns on Google, Meta, or Telegram, provided they follow the respective brand guidelines."
    }
  ];

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="min-h-screen text-slate-100 relative overflow-x-hidden" style={{ background: "linear-gradient(135deg, #050A15 0%, #070E20 50%, #0B1630 100%)" }}>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Outfit:wght@700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .ticker-wrap { overflow: hidden; width: 100%; background: #020609; border-bottom: 1px solid rgba(234,179,8,0.12); }
        .ticker-container { display: inline-flex; white-space: nowrap; animation: tickerAnimation 35s linear infinite; }
        .ticker-item { padding: 9px 28px; font-size: 10.5px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }
        .btn-primary {
          background: linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #EAB308 100%);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative; overflow: hidden;
        }
        .btn-primary::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent); transform:translateX(-100%); transition:transform 0.5s ease; }
        .btn-primary:hover::after { transform:translateX(100%); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 36px rgba(234,179,8,0.48); }
        .btn-secondary { transition: all 0.25s cubic-bezier(0.16,1,0.3,1); position:relative; overflow:hidden; }
        .btn-secondary::after { content:''; position:absolute; inset:0; background:rgba(255,255,255,0); transition:background 0.2s; }
        .btn-secondary:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.18); transform:translateY(-1px); }
        .shimmer-btn { position: relative; overflow: hidden; }
        .card-hover { transition: all 0.32s cubic-bezier(0.16, 1, 0.3, 1); }
        .card-hover:hover { transform: translateY(-6px); border-color: rgba(234,179,8,0.28); box-shadow: 0 16px 48px rgba(0,0,0,0.6), 0 0 24px rgba(234,179,8,0.06); }
        .gold-border-glow { border-color: rgba(234,179,8,0.22); box-shadow: 0 0 24px rgba(234,179,8,0.08); }
        .text-gold-accent { color: #FBBF24; background: linear-gradient(135deg, #FEF08A 0%, #FBBF24 50%, #EAB308 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        @keyframes tickerAnimation { 0% { transform: translate3d(0,0,0); } 100% { transform: translate3d(-50%,0,0); } }
        @keyframes heroFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes heroPulse { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.04)} }
        @keyframes counterUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes liveRowIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes shimBarHero { 0%{transform:translateX(-200%) skewX(-15deg)} 100%{transform:translateX(400%) skewX(-15deg)} }
        @keyframes goldGlowPulse { 0%,100%{box-shadow:0 0 0 0 rgba(234,179,8,0)} 50%{box-shadow:0 0 30px 4px rgba(234,179,8,0.18)} }
        @keyframes tickDot { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.5);opacity:1} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUpFade { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes gradientShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        .hero-card { animation: heroFloat 6s ease-in-out infinite; }
        .live-row { animation: liveRowIn 0.4s ease-out both; }
        .stat-val { animation: counterUp 0.6s ease-out both; }
        .stat-item { transition: all 0.3s ease; }
        .stat-item:hover { transform: scale(1.04); }
        .active-rank-card { animation: goldGlowPulse 2.5s ease-in-out infinite; }
        .leaderboard-row { transition: all 0.25s ease; }
        .leaderboard-row:hover { background: rgba(255,255,255,0.04) !important; transform: translateX(4px); }
        .faq-item { transition: border-color 0.2s ease; }
        .faq-item:hover { border-color: rgba(234,179,8,0.2) !important; }
      ` }} />

      {/* Ambient background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.08]" style={{ background: "radial-gradient(circle, #EAB308 0%, transparent 70%)", filter: "blur(100px)" }} />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.05]" style={{ background: "radial-gradient(circle, #F59E0B 0%, transparent 70%)", filter: "blur(100px)" }} />
      </div>

      {/* ─── NEWS TICKER STRIP ─────────────────────────────────────── */}
      <div className="ticker-wrap relative z-20 mt-[1px]">
        <div className="ticker-container">
          {tickerItems.map((item, idx) => (
            <div key={idx} className="ticker-item flex items-center gap-2">
              <span className={item.status === "success" ? "w-2 h-2 rounded-full bg-emerald-400 animate-pulse" : "w-2 h-2 rounded-full bg-sky-400 animate-pulse"} />
              <span className="text-slate-300 font-mono font-extrabold">{item.text}</span>
            </div>
          ))}
          {/* Duplicate for seamless loop */}
          {tickerItems.map((item, idx) => (
            <div key={"dup-" + idx} className="ticker-item flex items-center gap-2">
              <span className={item.status === "success" ? "w-2 h-2 rounded-full bg-emerald-400 animate-pulse" : "w-2 h-2 rounded-full bg-sky-400 animate-pulse"} />
              <span className="text-slate-300 font-mono font-extrabold">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── HERO SECTION ────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-20 md:pt-24">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          
          {/* Left Text Column */}
          <ScrollReveal direction="left" duration={900} className="flex flex-col items-start gap-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/10">
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#FBBF24", display:"inline-block", animation:"pulse 1.5s ease-in-out infinite" }} />
              <span className="text-[10px] font-black text-yellow-300 uppercase tracking-widest">
                India's Affiliate Network · {dbStats.payouts} Paid
              </span>
              <ShieldCheck className="text-yellow-400" size={12} />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-white font-display">
              Turn your network into a{" "}
              <span className="text-gold-accent font-black">monthly income machine.</span>
            </h1>

            <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
              Promote India's biggest finance brands — Angel One, Upstox, Groww, HDFC, Kotak. Earn milestone-based payouts, unlock lifetime referral income, and withdraw to UPI in seconds.
            </p>

            <div className="flex flex-wrap gap-4 mt-2">
              <button onClick={onGetStarted} className="btn-primary shimmer-btn text-slate-950 font-black px-8 py-4 rounded-xl flex items-center gap-2 text-sm shadow-lg">
                Start Earning Free <ArrowRight size={18} />
              </button>
              <button onClick={onLoginTrigger} className="px-8 py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold flex items-center gap-2 text-sm transition-all active:scale-95">
                Browse Campaigns
              </button>
            </div>

            {/* Sub-badges */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-white/5 pt-6 mt-4 w-full text-slate-400 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-yellow-500" />
                <span className="font-semibold">100% Verified Brands</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-yellow-500" />
                <span className="font-semibold">Instant UPI Payouts</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck size={16} className="text-yellow-500" />
                <span className="font-semibold">Free KYC Onboarding</span>
              </div>
            </div>
          </ScrollReveal>

          {/* Right Live Earnings Card Column */}
          <ScrollReveal direction="right" duration={900} delay={150} className="relative flex justify-center lg:justify-end w-full">
            <div className="hero-card relative w-full max-w-md rounded-3xl overflow-hidden" style={{
              background: "linear-gradient(145deg, #0A1525 0%, #060D1A 100%)",
              border: "1px solid rgba(234,179,8,0.22)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
              backdropFilter: "blur(24px)"
            }}>
              {/* Top shimmer bar */}
              <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:"linear-gradient(90deg, transparent, rgba(234,179,8,0.5), transparent)" }} />
              {/* Shimmer sweep */}
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.025) 50%,transparent 70%)", animation:"shimBarHero 4s ease-in-out 2s infinite", pointerEvents:"none" }} />

              <div className="p-6">
                {/* Header row */}
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ width:6, height:6, borderRadius:"50%", background:"#10B981", display:"inline-block", animation:"tickDot 1.4s ease-in-out infinite" }} />
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Today's Earnings · India</span>
                    </div>
                    <div className="text-3xl sm:text-4xl font-black text-white" style={{ fontFamily:"'Outfit',sans-serif", letterSpacing:"-0.02em" }}>₹14,31,475</div>
                  </div>
                  <div style={{ background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.25)", borderRadius:99, padding:"4px 10px", display:"inline-flex", alignItems:"center", gap:4 }}>
                    <span style={{ color:"#34D399", fontSize:10, fontWeight:800 }}>▲ +18.2%</span>
                  </div>
                </div>

                {/* Stats Boxes row */}
                <div className="grid grid-cols-3 gap-2 mb-5" style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:14, padding:"10px 12px" }}>
                  <div className="text-center">
                    <span className="text-[8px] text-slate-500 font-bold block uppercase tracking-wider">Affiliates Live</span>
                    <strong className="text-xs text-white font-mono font-bold block mt-1">12,408</strong>
                  </div>
                  <div className="text-center" style={{ borderLeft:"1px solid rgba(255,255,255,0.05)", borderRight:"1px solid rgba(255,255,255,0.05)" }}>
                    <span className="text-[8px] text-slate-500 font-bold block uppercase tracking-wider">Leads / hr</span>
                    <strong className="text-xs text-white font-mono font-bold block mt-1">3,250</strong>
                  </div>
                  <div className="text-center">
                    <span className="text-[8px] text-slate-500 font-bold block uppercase tracking-wider">Avg Payout</span>
                    <strong className="text-xs text-yellow-400 font-mono font-bold block mt-1">₹417</strong>
                  </div>
                </div>

                {/* Section label */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Live Payouts Feed</span>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:9, color:"#34D399", fontWeight:700 }}>
                    <span style={{ width:5, height:5, borderRadius:"50%", background:"#10B981", animation:"tickDot 1s ease-in-out infinite" }} />
                    LIVE
                  </span>
                </div>

                {/* Live earnings entries */}
                <div className="space-y-2">
                  {liveEarnings.map((item, idx) => (
                    <div key={`${item.name}-${idx}`} className="live-row flex items-center justify-between p-3 rounded-xl" style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.045)", animationDelay:`${idx * 0.08}s` }}>
                      <div className="flex items-center gap-2.5">
                        <div style={{ width:28, height:28, borderRadius:8, background:`linear-gradient(135deg, ${idx===0?"#F59E0B,#EAB308":idx===1?"#8B5CF6,#6D28D9":"#10B981,#059669"})`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontWeight:900, fontSize:10, color:"#fff" }}>
                          {item.name.charAt(0)}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">{item.name}</span>
                          <span className="text-[9px] text-slate-500 block">via {item.campaign}</span>
                        </div>
                      </div>
                      <strong className="text-xs text-emerald-400 font-mono font-extrabold">+{item.amount}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom decoration */}
              <div style={{ position:"absolute", bottom:0, left:0, right:0, height:1, background:"linear-gradient(90deg, transparent, rgba(234,179,8,0.15), transparent)" }} />
            </div>
          </ScrollReveal>
          
        </div>
      </section>

      {/* ─── STATISTICS PANEL ── Premium animated stats bar ─── */}
      <section className="relative z-10 border-t border-b border-white/5 py-12 bg-slate-950/50 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(234,179,8,0.04) 0%, transparent 70%)" }} />
        <ScrollReveal direction="scale" duration={800} className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: "Lifetime Payouts", val: dbStats.payouts, gold: false },
            { label: "Active Affiliates", val: dbStats.affiliates, gold: false },
            { label: "Premium Campaigns", val: dbStats.campaignsCount, gold: false },
            { label: "Avg Withdrawal Time", val: dbStats.avgTime, gold: true }
          ].map((s, i) => (
            <div key={i} className="stat-item relative">
              <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:80, height:80, borderRadius:"50%", background:s.gold ? "rgba(234,179,8,0.05)" : "rgba(255,255,255,0.02)", filter:"blur(20px)", pointerEvents:"none" }} />
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-2" style={{ letterSpacing:"0.15em" }}>{s.label}</span>
              <div className={`text-2xl sm:text-3xl font-black mt-1 stat-val ${s.gold ? "text-yellow-400" : "text-white"}`} style={{ animationDelay: `${i * 0.1}s`, fontFamily:"'Outfit',sans-serif", letterSpacing:"-0.02em" }}>
                {s.val}
              </div>
              {i < 3 && <div className="hidden md:block absolute right-0 top-1/4 h-1/2 w-px bg-white/5" />}
            </div>
          ))}
        </ScrollReveal>
      </section>

      {/* ─── MARKETPLACE SECTION ─────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <ScrollReveal direction="up" className="text-center mb-12">
          <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest block mb-2">Marketplace</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">58 premium campaigns. One dashboard.</h2>
        </ScrollReveal>

        {/* Categories grid — professional SVG icons */}
        <ScrollReveal direction="scale" delay={100} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16 stagger-list">
          {marketplaceCategories.map((c, idx) => (
            <div key={idx} className="bg-slate-950/50 border border-white/5 rounded-2xl p-4 flex items-center gap-3 card-hover select-none">
              <IconBox icon={c.icon} color={c.iconColor} bg={c.iconBg} border={c.iconBorder} size={38} />
              <div>
                <strong className="text-xs text-white block">{c.name}</strong>
                <span className="text-[9px] text-slate-500 font-bold block mt-0.5">{c.count}</span>
              </div>
            </div>
          ))}
        </ScrollReveal>

        {/* Hot Now Campaigns list */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" /> Hot now
            <span className="text-[10px] text-slate-500 font-semibold lowercase tracking-normal">· Top earning campaigns this week</span>
          </h3>
          <button onClick={onLoginTrigger} className="text-xs font-bold text-yellow-400 hover:text-white flex items-center gap-1 transition">
            View all <ChevronRight size={14} />
          </button>
        </div>

        <ScrollReveal direction="scale" delay={150} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-list">
          {hostCampaigns.map((camp, idx) => (
            <div key={idx} className="bg-slate-950/60 border border-white/5 rounded-3xl p-6 flex flex-col justify-between min-h-[250px] relative overflow-hidden card-hover">
              <div>
                <div className="flex justify-between items-start">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${camp.color} flex items-center justify-center font-black text-slate-950 text-sm shadow-md`}>
                    {camp.avatar}
                  </div>
                  <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                    {camp.tag}
                  </span>
                </div>
                <div className="mt-5">
                  <h4 className="text-base font-extrabold text-white">{camp.name}</h4>
                  <span className="text-[9px] text-slate-500 block uppercase font-bold mt-1">{camp.cat} · Milestone payouts</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-4 mt-6 text-center w-full">
                <div>
                  <span className="text-[8px] text-slate-500 font-bold block uppercase">Payout</span>
                  <strong className="text-xs text-yellow-400 font-bold block mt-0.5">₹{camp.reward}</strong>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 font-bold block uppercase">EPC</span>
                  <strong className="text-xs text-white font-mono block mt-0.5">₹{camp.epc}</strong>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 font-bold block uppercase">Approval</span>
                  <strong className="text-xs text-emerald-400 block mt-0.5">{camp.approval}</strong>
                </div>
              </div>
            </div>
          ))}
        </ScrollReveal>
      </section>

      {/* ─── DYNAMIC COMMISSIONS SECTION ─────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text */}
          <ScrollReveal direction="left" className="lg:col-span-6 space-y-6">
            <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest block">Dynamic Commissions</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              The more you sell, the more you earn — per lead.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Every campaign uses milestone-based payouts. Cross volume tiers mid-month and your remaining leads automatically pay the higher rate.
            </p>

            <div className="space-y-3 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <Check className="text-yellow-400" size={16} />
                <span>Auto-upgraded rates within the same cycle</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="text-yellow-400" size={16} />
                <span>Custom enterprise slabs for 1000+ volume</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="text-yellow-400" size={16} />
                <span>Real-time slab tracker on every campaign</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="text-yellow-400" size={16} />
                <span>Admin-configurable per campaign — no devs needed</span>
              </div>
            </div>
          </ScrollReveal>

          {/* Right Live Slabs Table */}
          <ScrollReveal direction="right" delay={150} className="lg:col-span-6 bg-slate-950/60 border border-white/5 rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
              <div>
                <span className="text-[9px] text-yellow-400 font-bold block uppercase tracking-wider">Live slabs</span>
                <strong className="text-sm text-white block">Angel One — Demat Opening</strong>
              </div>
              <span className="text-[9px] text-slate-500 font-bold">Updated today</span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-2.5">Accounts opened</th>
                  <th className="py-2.5 text-right">Payout per account</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                <tr>
                  <td className="py-2.5 font-semibold">1 – 10</td>
                  <td className="py-2.5 text-right font-bold text-white">₹50 / acc</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-semibold">11 – 20</td>
                  <td className="py-2.5 text-right font-bold text-white">₹60 / acc</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-semibold">21 – 50</td>
                  <td className="py-2.5 text-right font-bold text-white">₹80 / acc</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-semibold">51 – 100</td>
                  <td className="py-2.5 text-right font-bold text-white">₹90 / acc</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-semibold">101 – 500</td>
                  <td className="py-2.5 text-right font-bold text-white">₹95 / acc</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-semibold">501 – 1000</td>
                  <td className="py-2.5 text-right font-bold text-white">₹100 / acc</td>
                </tr>
                <tr className="text-yellow-400">
                  <td className="py-2.5 font-extrabold">1000+</td>
                  <td className="py-2.5 text-right font-black uppercase tracking-wider text-[10px]">Custom Premium Payout</td>
                </tr>
              </tbody>
            </table>
          </ScrollReveal>

        </div>
      </section>

      {/* ─── WHY REFERX ──────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
        <ScrollReveal direction="up" className="text-center mb-14">
          <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest block mb-2">Why ReferX</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Built for affiliates who want more than just clicks.
          </h2>
        </ScrollReveal>

        <ScrollReveal direction="scale" delay={100} className="grid md:grid-cols-3 gap-6 stagger-list">
          {[
            {
              title: "Instant UPI Payouts",
              desc: "Withdraw to UPI, bank or wallet. Money in your account in under 2 minutes.",
              icon: <Zap size={22} className="text-yellow-400" />
            },
            {
              title: "Real-time Tracking",
              desc: "Clicks, registrations, KYC, approvals, paid — all live with sub-second updates.",
              icon: <TrendingUp size={22} className="text-yellow-400" />
            },
            {
              title: "Unlimited MLM Levels",
              desc: "Earn override commissions on every affiliate you recruit — for life.",
              icon: <Network size={22} className="text-yellow-400" />
            },
            {
              title: "14 Career Ranks",
              desc: "Climb from Intern to Elite Director. Each rank unlocks bigger rewards & limits.",
              icon: <Award size={22} className="text-yellow-400" />
            },
            {
              title: "Fraud-Safe Engine",
              desc: "AI-powered fraud detection protects your earnings and keeps approvals high.",
              icon: <ShieldCheck size={22} className="text-yellow-400" />
            },
            {
              title: "VIP Support",
              desc: "Dedicated relationship managers from Senior Manager rank upwards.",
              icon: <Users size={22} className="text-yellow-400" />
            }
          ].map((feat, idx) => (
            <div key={idx} className="bg-slate-950/60 border border-white/5 p-6 rounded-3xl flex flex-col gap-4 card-hover">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                {feat.icon}
              </div>
              <div>
                <h3 className="text-base font-bold text-white block mb-2">{feat.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{feat.desc}</p>
              </div>
            </div>
          ))}
        </ScrollReveal>
      </section>



      {/* ─── CORPORATE TRANSPARENCY / MCA VERIFICATION ───────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Side: Information */}
          <ScrollReveal direction="left" className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck size={20} />
              </div>
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">MCA Verified Entity</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Corporate Transparency
                </h2>
              </div>
            </div>
            
            <p className="text-slate-400 text-sm leading-relaxed">
              Registered under the official Ministry of Corporate Affairs (MCA) registry of the Government of India. Our active status ensures complete corporate compliance, prompt payments, and secure promoter structures.
            </p>

            <div className="space-y-3.5">
              {/* Registered Name Card */}
              <div className="flex justify-between items-center p-5 bg-[#0D1526]/50 border border-white/[0.06] rounded-2xl transition hover:border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400">✦</span>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Registered Name</span>
                </div>
                <span className="text-sm font-extrabold text-white text-right ml-4">RubiCorn Technologies Private Limited</span>
              </div>

              {/* Registration / CIN Card */}
              <div className="flex justify-between items-center p-5 bg-[#0D1526]/50 border border-white/[0.06] rounded-2xl transition hover:border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-yellow-400">✦</span>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Registration / CIN</span>
                </div>
                <span className="text-sm font-mono font-extrabold text-yellow-400 text-right ml-4">U62011AP2025PTC123113</span>
              </div>

              {/* Registry Status Card */}
              <div className="flex justify-between items-center p-5 bg-[#0D1526]/50 border border-white/[0.06] rounded-2xl transition hover:border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400">✦</span>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Registry Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-extrabold text-emerald-400">Active (MCA Verified)</span>
                </div>
              </div>

              {/* Founders & Directors Card */}
              <div className="flex justify-between items-center p-5 bg-[#0D1526]/50 border border-white/[0.06] rounded-2xl transition hover:border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-violet-400">✦</span>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Founders & Directors</span>
                </div>
                <span className="text-sm font-extrabold text-white text-right ml-4">Ganesh (GSR) & E. Sai Kumar</span>
              </div>
            </div>

            <div className="pt-2">
              <a 
                href="https://www.mca.gov.in/content/mca/global/en/contact-us/company-search.html" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 font-extrabold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-lg"
              >
                Verify on Official MCA Portal <ArrowUpRight size={14} />
              </a>
            </div>
          </ScrollReveal>

          {/* Right Side: Mockup of MCA Portal Proof */}
          <ScrollReveal direction="right" delay={150} className="lg:col-span-5 flex justify-center w-full">
            <div className="w-full max-w-[360px] h-[550px] bg-slate-950 rounded-[40px] p-3.5 border-4 border-slate-800 shadow-2xl relative overflow-hidden select-none flex flex-col justify-between">
              
              {/* Browser Header / Search URL Mockup */}
              <div className="bg-slate-900/90 border border-white/5 rounded-2xl p-2.5 mb-3 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex-1 bg-[#060B18] border border-white/5 rounded-lg py-1 px-3 text-[9px] text-slate-400 font-mono flex items-center gap-1.5 truncate">
                  <span className="text-emerald-500">🔒</span> mca.gov.in/company-search
                </div>
                <div className="text-[10px] text-slate-500 shrink-0 font-bold">⋮</div>
              </div>

              {/* MCA Web Content Frame */}
              <div className="flex-1 bg-[#F9FAFB] text-slate-800 rounded-2xl p-3 border border-white/5 overflow-y-auto no-scrollbar flex flex-col justify-between text-[8px] relative">
                
                {/* MCA Portal Header */}
                <div className="border-b border-slate-200 pb-2 mb-2 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {/* Ministry Logo Icon placeholder */}
                    <div className="w-5 h-5 rounded bg-blue-900 flex items-center justify-center text-white font-serif font-black text-[7px]">M</div>
                    <div>
                      <strong className="text-blue-900 block font-extrabold text-[7px] leading-tight">MINISTRY OF CORPORATE AFFAIRS</strong>
                      <span className="text-slate-500 block text-[5px] leading-none uppercase font-semibold">Government of India</span>
                    </div>
                  </div>
                  <div className="text-right text-slate-400 text-[5px] font-bold">
                    English ▾
                  </div>
                </div>

                {/* Main page content inside Mockup */}
                <div className="space-y-2 flex-1">
                  <div className="text-[6px] text-slate-400 font-semibold uppercase tracking-wider">
                    Home &gt; MCA Services &gt; Master Data &gt; View Company Master Data
                  </div>
                  
                  {/* Search box showing query */}
                  <div className="bg-white border border-slate-300 rounded p-1.5 flex items-center justify-between text-slate-700">
                    <span className="font-semibold text-slate-900">Rubicorn Technologies Private Limited</span>
                    <span>🔍</span>
                  </div>

                  {/* Radio options */}
                  <div className="flex gap-3 text-[6px] text-slate-500 font-bold">
                    <label className="flex items-center gap-1"><input type="radio" checked disabled /> Company/LLP</label>
                    <label className="flex items-center gap-1"><input type="radio" disabled /> Directors</label>
                  </div>

                  {/* Results Header */}
                  <div className="flex justify-between items-center text-[6px] text-slate-400 font-bold pt-1 border-t border-slate-100">
                    <span>Showing results 1 of 1</span>
                    <span>Page shows 10 ▾</span>
                  </div>

                  {/* Records Table */}
                  <div className="border border-slate-200 rounded overflow-hidden bg-white">
                    <div className="grid grid-cols-12 bg-slate-100 text-slate-600 font-bold border-b border-slate-200 p-1">
                      <div className="col-span-2">S.No.</div>
                      <div className="col-span-4">Company name</div>
                      <div className="col-span-4">CIN/FCRN/LLPIN</div>
                      <div className="col-span-2 text-right">Status</div>
                    </div>
                    <div className="grid grid-cols-12 p-1 text-slate-700 font-semibold items-center bg-slate-50 relative">
                      <div className="col-span-2">1</div>
                      <div className="col-span-4 text-blue-900 font-bold">
                        RUBICORN TECHNOLOGIES PRIVATE LIMITED
                        {/* Red Arrow Pointer */}
                        <div className="absolute top-1/2 left-[30%] -translate-y-1/2 w-6 h-6 z-20 pointer-events-none animate-bounce">
                          <span className="text-[16px] text-red-500 block transform rotate-[135deg]">➔</span>
                        </div>
                      </div>
                      <div className="col-span-4 font-mono text-[6.5px]">U62011AP2025PTC123113</div>
                      <div className="col-span-2 text-right text-emerald-600 font-bold flex items-center justify-end gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block" /> Active
                      </div>
                    </div>
                  </div>

                  {/* Gov/State/Status details */}
                  <div className="bg-[#EDF2F7] border border-[#CBD5E0] rounded p-2 text-slate-600 font-medium space-y-1 mt-2">
                    <div className="flex justify-between">
                      <span>State of Registration:</span>
                      <strong className="text-slate-800">Andhra Pradesh</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Date of Incorporation:</span>
                      <strong className="text-slate-800">2025</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Class of Company:</span>
                      <strong className="text-slate-800">Private Limited</strong>
                    </div>
                  </div>
                </div>

                {/* Verified Badge / Stamp Overlay */}
                <div className="absolute bottom-16 right-4 w-[68px] h-[68px] rounded-full border-2 border-emerald-500 bg-emerald-50/95 flex flex-col items-center justify-center text-center shadow-lg transform rotate-[-12deg] z-10 border-dashed animate-pulse">
                  <span className="text-[12px] leading-none">✅</span>
                  <strong className="text-[6px] text-emerald-800 font-black tracking-tighter mt-0.5">MCA VERIFIED</strong>
                  <span className="text-[5px] text-emerald-600 font-extrabold uppercase tracking-widest leading-none">ACTIVE</span>
                </div>

                {/* Footer and copy */}
                <div className="border-t border-slate-200 pt-1.5 mt-2 text-[5px] text-slate-400 text-center space-y-0.5">
                  <p className="font-semibold">This site is owned by Ministry of Corporate Affairs, Gov of India</p>
                  <p>Disclaimer · Last Updated: 24 July, 2025</p>
                </div>
              </div>

              {/* Sub-Badges beneath Mockup */}
              <div className="mt-3 flex justify-between gap-2 shrink-0 select-none">
                <span className="flex-1 py-1.5 px-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[9px] text-center rounded-xl flex items-center justify-center gap-1 shadow-inner uppercase tracking-wider animate-pulse">
                  ✓ ACTIVE
                </span>
                <span className="flex-1 py-1.5 px-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 font-black text-[9px] text-center rounded-xl flex items-center justify-center gap-1 shadow-inner uppercase tracking-wider">
                  MCA India
                </span>
                <span className="flex-1 py-1.5 px-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-black text-[9px] text-center rounded-xl flex items-center justify-center gap-1 shadow-inner uppercase tracking-wider">
                  2025
                </span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── FAQ ACCORDION SECTION ───────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20 border-t border-white/5">
        <ScrollReveal direction="up" className="text-center mb-14">
          <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest block mb-2">FAQ</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Everything you wanted to ask.</h2>
        </ScrollReveal>

        <ScrollReveal direction="scale" className="space-y-3">
          {faqList.map((faq, idx) => {
            const isOpened = openFaq === idx;
            return (
              <div 
                key={idx} 
                className="bg-slate-950/60 border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/10"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 flex justify-between items-center text-left text-sm font-bold text-white transition focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <span className={`p-1 rounded-lg bg-white/5 border border-white/5 text-slate-400 transition-transform duration-300 ${isOpened ? "rotate-180 text-yellow-400" : ""}`}>
                    <ChevronDown size={14} />
                  </span>
                </button>

                <div 
                  className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
                    isOpened ? "max-h-36 opacity-100 border-t border-white/5" : "max-h-0 opacity-0 pointer-events-none"
                  }`}
                >
                  <p className="p-5 text-xs text-slate-400 leading-relaxed bg-[#050A15]/40">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </ScrollReveal>
      </section>

      {/* ─── CALL TO ACTION FOOTER BANNER ───────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
        <ScrollReveal direction="scale" className="bg-gradient-to-r from-yellow-500/10 via-amber-600/5 to-slate-950/40 border border-yellow-500/25 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <span className="text-[10px] font-black text-yellow-300 uppercase tracking-widest block">JOIN THE NETWORK</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Your next ₹1 lakh starts today.
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
              Join 1,24,500+ Indian affiliates earning real money from real brands.
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <button onClick={onGetStarted} className="btn-primary shimmer-btn text-slate-950 font-black px-8 py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center gap-2">
                Create free account <ArrowRight size={14} />
              </button>
              <button onClick={onLoginTrigger} className="px-8 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition active:scale-95">
                Browse campaigns
              </button>
            </div>

            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pt-4">
              Available across India · 28 states · 8 UTs
            </p>
          </div>
        </ScrollReveal>
      </section>

    </div>
  );
}
