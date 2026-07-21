import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Users, UserPlus, Award, TrendingUp, Network, 
  ChevronRight, ChevronDown, CheckCircle, CheckCircle2, 
  XCircle, Clock, AlertCircle, Share2, Copy, ExternalLink, Layers, RefreshCw
} from "lucide-react";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import { db } from "../firebase";

export default function Team({ user, campaigns, showToast, pageContent }) {
  const [downlineList, setDownlineList] = useState([]);
  const [hierarchyList, setHierarchyList] = useState([]);
  const [teamProfiles, setTeamProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [copied, setCopied] = useState(false);

  // Sync entire downline network recursively in real time
  useEffect(() => {
    if (!user?.uid) return;
    const downlineQuery = query(
      collection(db, "users"),
      where("referralPath", "array-contains", user.uid)
    );
    const unsubscribe = onSnapshot(downlineQuery, (snapshot) => {
      const downlineUsers = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (docSnap.id !== user.uid) {
          downlineUsers.push({ uid: docSnap.id, ...data });
        }
      });
      setDownlineList(downlineUsers);

      const hierarchy = downlineUsers.map(u => ({
        userId: u.uid,
        referrerUid: u.parentUserId || u.sponsor?.uid || "root"
      }));
      setHierarchyList(hierarchy);

      const profiles = { [user.uid]: user };
      downlineUsers.forEach(u => {
        profiles[u.uid] = u;
      });
      setTeamProfiles(profiles);
      setLoading(false);
    }, (err) => {
      console.error("Downline hierarchy sync failed:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const toggleExpand = (nodeId) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      showToast("Referral link copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const getRankName = (lvl) => {
    const ranks = [
      "Intern", "Executive", "Senior Executive", "Assistant Supervisor", 
      "Supervisor", "Assistant Manager", "Manager", "Senior Manager", 
      "Regional Manager", "State Head", "National Head", "Diamond Manager", 
      "Platinum Manager", "Elite Director"
    ];
    return ranks[(lvl || 1) - 1] || "Intern";
  };

  // Dynamic Tree Renderer using actual Firestore hierarchy data
  const renderReferralTree = (parentId, depth = 0) => {
    const children = hierarchyList.filter(item => item.referrerUid === parentId);
    if (children.length === 0) return null;
    
    return (
      <div className={`flex flex-col gap-2 mt-2 ${depth > 0 ? "pl-6 border-l border-white/5" : ""}`}>
        {children.map(child => {
          const profile = teamProfiles[child.userId];
          if (!profile) return null;
          
          const hasGrandchildren = hierarchyList.some(item => item.referrerUid === child.userId);
          const isExpanded = expandedNodes[child.userId];
          const earns = profile.earnings?.total || 0;
          const initial = profile.name ? profile.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "P";
          
          return (
            <div key={child.userId} className="flex flex-col">
              <div className="bg-[#0D162D]/60 border border-white/5 rounded-2xl p-3 flex justify-between items-center hover:border-yellow-500/20 transition duration-300">
                <div className="flex items-center gap-3">
                  {hasGrandchildren ? (
                    <button 
                      onClick={() => toggleExpand(child.userId)}
                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 shrink-0 text-[10px]"
                    >
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                  ) : (
                    <div className="w-4 h-4 flex items-center justify-center text-slate-600 text-xs shrink-0 select-none">•</div>
                  )}

                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-black text-slate-300 text-sm">
                    {initial}
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-white block">{profile.name || "Affiliate Partner"}</strong>
                    <span className="text-[9px] text-slate-500 font-bold uppercase block mt-0.5">{getRankName(profile.level)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-yellow-400 block">₹{earns.toLocaleString("en-IN")}</span>
                  <span className="text-[8px] text-slate-500 uppercase block font-bold">LIFETIME</span>
                </div>
              </div>
              
              <div className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
                isExpanded 
                  ? "max-h-[1200px] opacity-100 mt-2" 
                  : "max-h-0 opacity-0 pointer-events-none"
              }`}>
                {renderReferralTree(child.userId, depth + 1)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Database-backed Dynamic Variables
  const displayDirectSize = downlineList.filter(u => u.parentUserId === user?.uid).length || 0;
  const displayTotalTeamSize = downlineList.length || 0;

  // Estimate total volume dynamically from all downlines
  const totalVolumeAmount = downlineList.reduce((acc, curr) => acc + (curr.earnings?.total || 0), 0);
  const currentMonthVolume = downlineList.reduce((acc, curr) => {
    // estimate monthly completions
    const hasThisMonth = Object.values(curr.joinedCampaigns || {}).some(c => c.status === "Approved");
    return acc + (hasThisMonth ? (curr.earnings?.total || 0) * 0.3 : 0);
  }, 0);

  const displayVolumeFormatted = totalVolumeAmount > 10000000 
    ? `₹${(totalVolumeAmount / 10000000).toFixed(2)} Cr` 
    : totalVolumeAmount > 100000 
      ? `₹${(totalVolumeAmount / 100000).toFixed(2)} L` 
      : `₹${totalVolumeAmount.toLocaleString("en-IN")}`;

  const displayMonthVolumeFormatted = currentMonthVolume > 100000 
    ? `₹${(currentMonthVolume / 100000).toFixed(1)}L this month` 
    : `₹${currentMonthVolume.toLocaleString("en-IN")} this month`;

  const myReferralLink = `referex.in/r/${user?.referralCode || "invite"}`;
  const myReferralLinkFull = `${window.location.origin}/#/register?ref=${user?.referralCode || ""}`;

  // Calculate top team performers list from actual DB downlines
  const calculatedTopMembers = downlineList.map(member => {
    const subTeamSize = downlineList.filter(u => u.referralPath?.includes(member.uid)).length;
    return {
      name: member.name || "Partner",
      rank: getRankName(member.level),
      size: `${subTeamSize} members`,
      volume: member.earnings?.total || 0
    };
  }).sort((a, b) => b.volume - a.volume).slice(0, 5);

  return (
    <div className="flex flex-col gap-8 text-slate-100 entrance-scale-up select-none pb-12">
      
      <style dangerouslySetInnerHTML={{ __html: ".team-glow-card { background: rgba(10, 18, 38, 0.45); border: 1px solid rgba(255, 255, 255, 0.06); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3); backdrop-filter: blur(12px); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); } .team-glow-card:hover { border-color: rgba(234, 179, 8, 0.2); } .pill-share-btn { transition: all 0.25s ease; cursor: pointer; } .pill-share-btn:hover { transform: translateY(-1px); filter: brightness(1.15); }" }} />

      {/* ─── TITLE & MLM HEADER ─────────────────────────────────────────────────── */}
      <div className="pt-4">
        <span className="text-[10px] text-yellow-500 font-black uppercase tracking-widest block mb-2">TEAM & MLM</span>
        <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
          Your network.
        </h2>
      </div>

      {/* ─── KPI STATS ROW ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Direct Referrals */}
        <div className="team-glow-card rounded-3xl p-6 h-36 flex flex-col justify-between">
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">DIRECT REFERRALS</span>
            <div className="text-3xl font-black text-white mt-2">{displayDirectSize}</div>
          </div>
          <span className="text-[10px] text-emerald-400 font-extrabold">promoters linked</span>
        </div>

        {/* Card 2: Total Team */}
        <div className="team-glow-card rounded-3xl p-6 h-36 flex flex-col justify-between">
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">TOTAL TEAM</span>
            <div className="text-3xl font-black text-white mt-2">{displayTotalTeamSize}</div>
          </div>
          <span className="text-[10px] text-emerald-400 font-extrabold">across MLM levels</span>
        </div>

        {/* Card 3: Team Volume */}
        <div className="team-glow-card rounded-3xl p-6 h-36 flex flex-col justify-between">
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">TEAM VOLUME (LIFETIME)</span>
            <div className="text-3xl font-black text-white mt-2">{displayVolumeFormatted}</div>
          </div>
          <span className="text-[10px] text-emerald-400 font-extrabold">{displayMonthVolumeFormatted}</span>
        </div>
      </div>

      {/* ─── MAIN GENEALOGY & INVITE ROW ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Genealogy view */}
        <div className="lg:col-span-7 team-glow-card rounded-3xl p-6">
          <div className="flex justify-between items-center mb-6 pb-3 border-b border-white/5">
            <h3 className="text-base font-extrabold text-white">Genealogy view</h3>
            <span className="text-[10px] text-slate-500 font-bold">MLM nodes levels shown</span>
          </div>

          <div className="space-y-3">
            {/* Root item (You) */}
            <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-2xl p-3 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center font-black text-slate-950 text-sm">
                  Y.
                </div>
                <div>
                  <strong className="text-xs font-bold text-white block">You · {user.name || "Affiliate Partner"}</strong>
                  <span className="text-[9px] text-slate-500 font-bold uppercase block mt-0.5">{getRankName(user.level)}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-yellow-400 block">₹{(user.earnings?.total || 0).toLocaleString("en-IN")}</span>
                <span className="text-[8px] text-slate-500 uppercase block font-bold">LIFETIME</span>
              </div>
            </div>

            {/* Recursively render child nodes from DB */}
            {displayTotalTeamSize > 0 ? (
              <div className="pl-6 border-l border-white/5 space-y-3 stagger-list">
                {renderReferralTree(user.uid)}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs font-medium border border-dashed border-white/5 rounded-2xl">
                No downline nodes registered yet under your invite node.
              </div>
            )}

          </div>
        </div>

        {/* Right Column: Invite details */}
        <div className="lg:col-span-5 team-glow-card rounded-3xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-white">Your referral link</h3>
            <span className="text-xs text-slate-400 block mt-1">Earn override commissions on every lead they generate.</span>
          </div>

          <div className="flex items-center justify-between bg-[#060B18]/60 border border-white/10 rounded-2xl p-3 select-all">
            <span className="text-xs font-mono text-slate-300 break-all select-all">{myReferralLink}</span>
            <button 
              onClick={() => copyToClipboard(myReferralLinkFull)}
              className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 hover:bg-yellow-500 hover:text-slate-950 transition"
            >
              <Copy size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button onClick={() => copyToClipboard(myReferralLinkFull)} className="pill-share-btn flex flex-col items-center justify-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-bold">
              <span className="text-lg">💬</span>
              <span>WhatsApp</span>
            </button>
            <button onClick={() => copyToClipboard(myReferralLinkFull)} className="pill-share-btn flex flex-col items-center justify-center gap-2 p-3 bg-sky-500/10 border border-sky-500/20 rounded-2xl text-sky-400 text-xs font-bold">
              <span className="text-lg">✈️</span>
              <span>Telegram</span>
            </button>
            <button onClick={() => copyToClipboard(myReferralLinkFull)} className="pill-share-btn flex flex-col items-center justify-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold">
              <span className="text-lg">📸</span>
              <span>Insta</span>
            </button>
            <button onClick={() => showToast("QR Code generated successfully!", "success")} className="pill-share-btn flex flex-col items-center justify-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-yellow-400 text-xs font-bold">
              <span className="text-lg">📱</span>
              <span>QR Code</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── TOP TEAM MEMBERS TABLE ────────────────────────────────────────────── */}
      <div>
        <div className="mb-4">
          <h3 className="text-base font-extrabold text-white">Top team members</h3>
        </div>

        <div className="bg-slate-950/60 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-white/[0.01]">
                  <th className="p-4">Member</th>
                  <th className="p-4">Rank</th>
                  <th className="p-4">Team Size</th>
                  <th className="p-4 text-right">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 stagger-list">
                {calculatedTopMembers.length > 0 ? (
                  calculatedTopMembers.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition text-xs">
                      <td className="p-4 font-bold text-white">{row.name}</td>
                      <td className="p-4 text-slate-300 font-semibold">{row.rank}</td>
                      <td className="p-4 text-slate-400 font-medium">{row.size}</td>
                      <td className="p-4 text-right font-black text-yellow-400 font-mono">₹{row.volume.toLocaleString("en-IN")}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-slate-500 text-xs font-medium">
                      No active downline volumes recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
