import React, { useState, useEffect } from "react";
import { 
  CheckCircle, ExternalLink, Clock, AlertCircle, Check, 
  ChevronRight, Shield, Phone, CreditCard, User, Copy, 
  Share2, Award, Lock, Zap, Users, Search, HelpCircle, 
  CheckSquare, ArrowRight, ShieldCheck, Landmark, Flame, Coins
} from "lucide-react";
import confetti from "canvas-confetti";

export default function Campaigns({
  user,
  joinedCampaigns = {},
  campaigns = [],
  onRegisterCampaign,
  onUpdateCampaignSteps,
  onSubmitCampaign,
  onResetCampaign,
  showToast,
  activeCampaignId,
  setActiveCampaignId,
  pageContent,
}) {
  const [flippedCampaigns, setFlippedCampaigns] = useState({});

  const handleToggleFlip = (campaignId, e) => {
    if (e) e.stopPropagation();
    setFlippedCampaigns(prev => ({
      ...prev,
      [campaignId]: !prev[campaignId]
    }));
  };
  
  // Search, Category, and Status Tab Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeStatusTab, setActiveStatusTab] = useState("all"); // all, progress, submitted, approved
  const [sortBy, setSortBy] = useState("epc"); // epc, payout

  // Sync scroll position
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeCampaignId]);

  const getCampaignStatus = (campaignId) => {
    return joinedCampaigns?.[campaignId]?.status || "Not Started";
  };

  const getNormalizedRedirectUrl = (redirectUrl, clickId, userId) => {
    if (!redirectUrl) return "";
    let url = redirectUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    if (clickId) {
      url = url.replace(/{click_id}/gi, clickId)
               .replace(/{clickId}/gi, clickId)
               .replace(/{lead_id}/gi, clickId)
               .replace(/{leadId}/gi, clickId);
    }
    if (userId) {
      url = url.replace(/{user_id}/gi, userId)
               .replace(/{userId}/gi, userId);
    }
    return url;
  };

  const handleStartNowClick = async (campaign) => {
    if (campaign.isLockedByAdmin === true) {
      showToast("This task is closed by manager.", "danger");
      return;
    }

    try {
      showToast("Initializing campaign tracker... Open the brand page to sign up.", "success");
      const regDetails = {
        fullName: user.name || "Promoter",
        mobile: user.mobile || "",
        bankAccountName: user.bankAccountName || "",
        bankName: user.bankName || "",
        bankAccountNumber: user.bankAccountNumber || "",
        bankIfscCode: user.bankIfscCode || ""
      };
      await onRegisterCampaign(campaign.id, regDetails);
      
      if (campaign.redirectUrl) {
        setTimeout(() => {
          const clickId = "CLK" + Math.floor(100000 + Math.random() * 900000);
          const finalUrl = getNormalizedRedirectUrl(campaign.redirectUrl, clickId, user.referralCode || user.userId);
          window.open(finalUrl, "_blank");
        }, 800);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to start task. Please try again.", "danger");
    }
  };

  const handleStepToggle = async (campaignId, stepIndex) => {
    const joinedInfo = joinedCampaigns?.[campaignId];
    if (!joinedInfo) return;
    let completedSteps = [...(joinedInfo.completedSteps || [])];
    if (completedSteps.includes(stepIndex)) {
      completedSteps = completedSteps.filter((s) => s !== stepIndex);
    } else {
      completedSteps.push(stepIndex);
    }
    try {
      await onUpdateCampaignSteps(campaignId, completedSteps);
    } catch (err) {
      console.error(err);
    }
  };



  // Category Filtering Rules
  const filteredCampaigns = campaigns.filter((camp) => {
    const status = getCampaignStatus(camp.id);
    
    // 1. Status Filter
    if (activeStatusTab === "progress" && status !== "In Progress") return false;
    if (activeStatusTab === "submitted" && status !== "Submitted") return false;
    if (activeStatusTab === "approved" && status !== "Approved") return false;

    // 2. Search Query Filter
    const matchesSearch = camp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          camp.shortDesc.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // 3. Category Pill Filter
    if (selectedCategory === "All") return true;
    if (selectedCategory === "Broker") {
      return camp.id === "angel_one" || camp.id === "upstox" || camp.id === "groww" || camp.name.toLowerCase().includes("demat") || camp.name.toLowerCase().includes("broker");
    }
    if (selectedCategory === "Cards") {
      return camp.name.toLowerCase().includes("card") || camp.id === "jigri";
    }
    if (selectedCategory === "Loans") {
      return camp.name.toLowerCase().includes("loan") || camp.name.toLowerCase().includes("personal");
    }
    if (selectedCategory === "Banking") {
      return camp.name.toLowerCase().includes("savings") || camp.name.toLowerCase().includes("bank") || camp.id === "kotak";
    }
    if (selectedCategory === "Insurance") {
      return camp.name.toLowerCase().includes("insurance");
    }
    if (selectedCategory === "UPI") {
      return camp.name.toLowerCase().includes("upi") || camp.name.toLowerCase().includes("paytm");
    }
    if (selectedCategory === "Shopping") {
      return camp.name.toLowerCase().includes("shopping") || camp.name.toLowerCase().includes("plus") || camp.id === "flipkart";
    }
    return true;
  });

  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    if (sortBy === "payout") {
      return b.reward - a.reward;
    }
    // Default to position sorting
    const posA = a.position !== undefined && a.position !== null ? Number(a.position) : 99999;
    const posB = b.position !== undefined && b.position !== null ? Number(b.position) : 99999;
    if (posA !== posB) return posA - posB;
    return (a.minLevel || 1) - (b.minLevel || 1);
  });

  // Category visual setup
  const getCategoryTheme = (camp) => {
    const name = (camp.name || "").toLowerCase();
    if (name.includes("card")) return { label: "Cards", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: CreditCard };
    if (name.includes("loan") || name.includes("personal")) return { label: "Loans", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: Landmark };
    if (name.includes("savings") || name.includes("bank")) return { label: "Banking", color: "text-sky-400 bg-sky-500/10 border-sky-500/20", icon: Landmark };
    if (name.includes("insurance")) return { label: "Insurance", color: "text-purple-400 bg-purple-500/10 border-purple-500/20", icon: Shield };
    if (name.includes("upi") || name.includes("paytm")) return { label: "UPI", color: "text-pink-400 bg-pink-500/10 border-pink-500/20", icon: Zap };
    return { label: "Broker", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: Award };
  };

  // Styled Brand Avatars to eliminate plain white letter bubbles
  const getBrandAvatar = (camp) => {
    const name = (camp.name || "").toLowerCase();
    
    let initials = "CP";
    if (camp.name) {
      initials = camp.name.substring(0, 2).toUpperCase();
      if (camp.name.includes(" ")) {
        const parts = camp.name.split(" ");
        initials = (parts[0].charAt(0) + (parts[1]?.charAt(0) || "")).toUpperCase();
      } else {
        initials = camp.name.substring(0, 1).toUpperCase();
      }
    }

    if (name.includes("angel")) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 flex items-center justify-center font-black text-slate-950 text-base shadow-lg shadow-orange-500/10 campaign-avatar-glow shrink-0 border border-white/10">
          A
        </div>
      );
    }
    if (name.includes("upstox")) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-purple-500/10 campaign-avatar-glow shrink-0 border border-white/10">
          U
        </div>
      );
    }
    if (name.includes("groww")) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center font-black text-slate-950 text-base shadow-lg shadow-emerald-500/10 campaign-avatar-glow shrink-0 border border-white/10">
          G
        </div>
      );
    }
    if (name.includes("hdfc")) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-900 flex items-center justify-center font-black text-white text-base shadow-lg shadow-blue-800/10 campaign-avatar-glow shrink-0 border border-white/10">
          H
        </div>
      );
    }
    if (name.includes("axis")) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-700 to-red-900 flex items-center justify-center font-black text-white text-base shadow-lg shadow-rose-800/10 campaign-avatar-glow shrink-0 border border-white/10">
          X
        </div>
      );
    }
    if (name.includes("sbi")) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center font-black text-white text-base shadow-lg shadow-cyan-500/10 campaign-avatar-glow shrink-0 border border-white/10">
          S
        </div>
      );
    }
    
    // Generic high-fidelity gradient backup
    return (
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center font-black text-yellow-400 text-sm shadow-md shrink-0">
        {initials}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in text-slate-100 pb-12 select-none relative">
      
      <style dangerouslySetInnerHTML={{ __html: "@keyframes cardEntrance { 0% { opacity: 0; transform: translateY(30px) scale(0.96); filter: blur(4px); } 100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } } @keyframes activeLine { from { transform: scaleX(0); opacity: 0; } to { transform: scaleX(1); opacity: 1; } } .perspective-1000 { perspective: 1000px; -webkit-perspective: 1000px; } .transform-style-3d { transform-style: preserve-3d; -webkit-transform-style: preserve-3d; } .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); -webkit-transform: rotateY(180deg); } .campaign-card-outer { animation: cardEntrance 0.55s cubic-bezier(0.16, 1, 0.3, 1) both; transition: all 0.55s cubic-bezier(0.16, 1, 0.3, 1); } .campaign-card-outer:hover { transform: translateY(-8px); filter: drop-shadow(0 20px 30px rgba(0, 0, 0, 0.65)); } .campaign-item-card { background: rgba(13, 22, 45, 0.45); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.07); border-radius: 2.2rem; transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); } .campaign-item-card:hover { border-color: rgba(234, 179, 8, 0.45); box-shadow: 0 0 30px rgba(234, 179, 8, 0.1); } .campaign-avatar-glow { box-shadow: 0 0 15px rgba(255, 255, 255, 0.05); } .bar-progress-fill { transition: width 0.4s ease; } .active-tab-line { animation: activeLine 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: center; }" }} />

      {/* Trust Sign Banner */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/15 text-xs text-yellow-400">
        <ShieldCheck size={16} className="shrink-0" />
        <span className="font-semibold">
          AI Fraud-Safe Audit in effect. Submit authentic credentials matching Aadhaar/KYC to avoid account audits.
        </span>
      </div>

      {/* Header section */}
      <div>
        <span className="text-[10px] text-yellow-500 font-black uppercase tracking-widest block mb-2">CAMPAIGNS MARKETPLACE</span>
        <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
          Explore and start earning tasks.
        </h2>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Unlock levels, start financial campaigns, track completion stages, and submit proof details.
        </p>
      </div>

      {/* Dashboard Filter and Category Strip */}
      <div className="space-y-4">
        {/* Search and Sort Row */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              className="w-full bg-slate-950/60 border border-white/[0.08] focus:border-yellow-500/40 rounded-full py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:ring-1 focus:ring-yellow-500/20 transition-all text-xs md:text-sm focus:outline-none" 
              placeholder="Search Angel One, HDFC Card..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-950/60 border border-white/[0.08] text-slate-300 font-bold px-4 py-3.5 rounded-full text-xs cursor-pointer focus:outline-none focus:border-yellow-500/40"
            >
              <option value="epc">Sort: EPC (High to Low)</option>
              <option value="payout">Sort: Payout (High to Low)</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs (all, progress, submitted, approved) */}
        <div className="flex border-b border-white/5 pb-2">
          {[
            { key: "all", label: "All Campaigns" },
            { key: "progress", label: "In Progress" },
            { key: "submitted", label: "Verification Requested" },
            { key: "approved", label: "Approved (Paid)" }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveStatusTab(tab.key)}
              className={"px-4 py-2 text-xs font-black transition relative " + (
                activeStatusTab === tab.key 
                  ? "text-yellow-400" 
                  : "text-slate-400 hover:text-white"
              )}
            >
              {tab.label}
              {activeStatusTab === tab.key && (
                <span className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-yellow-400 rounded-full active-tab-line" />
              )}
            </button>
          ))}
        </div>

        {/* Category Pills Row */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            { key: "All", label: "All Categories" },
            { key: "Broker", label: "Demat & Broker" },
            { key: "Cards", label: "Credit Cards" },
            { key: "Loans", label: "Personal Loans" },
            { key: "Banking", label: "Savings Accounts" },
            { key: "Insurance", label: "Insurance" },
            { key: "UPI", label: "UPI Apps" },
            { key: "Shopping", label: "Shopping" }
          ].map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button 
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={"px-4 py-2 rounded-full text-xs font-extrabold whitespace-nowrap transition-all border " + (
                  isActive 
                    ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 border-yellow-400" 
                    : "bg-slate-950/40 border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Campaign Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-list">
        {sortedCampaigns.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-1.5 bg-slate-950/30">
            <AlertCircle size={24} className="text-slate-500 mb-2" />
            <strong className="text-sm text-white">No tasks match selected filter parameters</strong>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">ReferX Marketplace</span>
          </div>
        ) : (
          sortedCampaigns.map((camp, idx) => {
            const status = getCampaignStatus(camp.id);
            const userLevel = user.level || 1;
            const requiredLevel = camp.minLevel || 1;
            const isLevelLocked = userLevel < requiredLevel;
            
            const activeCampaignInProgress = Object.entries(joinedCampaigns || {}).find(
              ([_, data]) => data.status === "In Progress" || data.status === "Submitted"
            );
            const activeCampaignIdInProgress = activeCampaignInProgress ? activeCampaignInProgress[0] : null;
            const activeCampaignNameInProgress = activeCampaignIdInProgress
              ? (campaigns.find((c) => c.id === activeCampaignIdInProgress)?.name || activeCampaignIdInProgress)
              : "";
            
            const isLockedByActiveCamp = activeCampaignIdInProgress && activeCampaignIdInProgress !== camp.id && status !== "Approved";
            
            const dependsOnCampId = camp.dependsOn;
            const isPrerequisiteLocked = dependsOnCampId && dependsOnCampId !== "None" && 
              (!joinedCampaigns?.[dependsOnCampId] || joinedCampaigns[dependsOnCampId].status !== "Approved");
            const prerequisiteCampName = dependsOnCampId ? (campaigns.find(c => c.id === dependsOnCampId)?.name || dependsOnCampId) : "";
            const isLockedByAdmin = camp.isLockedByAdmin === true;
            const isLocked = isLockedByAdmin;

            const theme = getCategoryTheme(camp);

            // Stats values
            let epcVal = camp.epc || (camp.reward === 100 ? "38.20" : camp.reward === 450 ? "52.10" : camp.reward === 320 ? "28.40" : camp.reward === 2500 ? "98.00" : ((camp.reward || 100) * 0.15).toFixed(2));
            let approvalRate = camp.approvalRate || (camp.reward === 100 ? "94%" : camp.reward === 450 ? "91%" : camp.reward === 320 ? "96%" : "93%");
            let payoutVal = camp.payout || (camp.id === "angel_one" ? "₹50 - ₹100" : "₹" + (camp.reward || 100).toLocaleString("en-IN"));
            let dailyCapVal = camp.id === "angel_one" ? "UNLIMITED CAP" : "1,000 CAP/DAY";

            // Progress tracking
            const joinedInfo = joinedCampaigns?.[camp.id];
            let progressPct = 0;
            if (joinedInfo && joinedInfo.completedSteps && camp.steps && camp.steps.length > 0) {
              progressPct = Math.round((joinedInfo.completedSteps.length / camp.steps.length) * 100);
            }

            const isFlipped = flippedCampaigns[camp.id];

            return (
              <div key={camp.id} className="relative w-full h-[390px] perspective-1000 campaign-card-outer" style={{ animationDelay: `${idx * 0.07}s` }}>
                <div 
                  className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${
                    isFlipped ? "rotate-y-180" : ""
                  }`}
                >
                  
                  {/* Front Side of the Card */}
                  <div className={"absolute inset-0 backface-hidden campaign-item-card rounded-[2.2rem] p-6 flex flex-col justify-between h-full bg-[#0D1526]/70 border border-white/[0.08] shadow-2xl overflow-hidden transition-all duration-300 " + (isLocked ? "opacity-40" : "")}>
                    <div>
                      {/* Card Header */}
                      <div className="flex justify-between items-start">
                        {getBrandAvatar(camp)}
                        <span className={"px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider " + theme.color}>
                          {theme.label}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div className="mt-5">
                        <h3 className="text-base font-extrabold text-white leading-tight flex items-center gap-1.5">
                          {camp.name}
                          {!isLocked && status === "Approved" && (
                            <CheckCircle size={14} className="text-emerald-400 shrink-0 animate-bounce" />
                          )}
                        </h3>
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                          {camp.shortDesc || "Milestone slabs · brand-verified"}
                        </p>
                      </div>

                      {!isLocked && status === "Submitted" && (
                        <div className="mt-4 p-2 bg-sky-500/5 border border-sky-500/15 rounded-xl flex items-center gap-2 text-[10px] text-sky-400 font-bold">
                          <Clock size={12} className="animate-spin shrink-0 text-sky-400" />
                          Submitted · Audit Pending
                        </div>
                      )}

                      {/* Stats columns with premium metrics design */}
                      <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-4 mt-4 text-center">
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center justify-center gap-0.5">
                            <Coins size={8} className="text-yellow-500" /> PAYOUT
                          </span>
                          <strong className="text-sm text-yellow-400 font-black block mt-0.5">{payoutVal}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center justify-center gap-0.5">
                            <Flame size={8} className="text-orange-500" /> EPC
                          </span>
                          <strong className="text-sm text-white font-mono block mt-0.5">₹{epcVal}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center justify-center gap-0.5">
                            <ShieldCheck size={8} className="text-emerald-500" /> APPROVAL
                          </span>
                          <strong className="text-sm text-emerald-400 block mt-0.5">{approvalRate}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Footer buttons based on status */}
                    <div className="pt-4 mt-4 border-t border-white/5 flex gap-2">
                      {isLocked ? (
                        <button 
                          className="w-full bg-slate-950/40 border border-white/5 text-slate-500 text-[10px] font-black py-3.5 rounded-2xl flex items-center justify-center gap-1.5 cursor-not-allowed" 
                          disabled
                        >
                          <Lock size={12} />
                          {isLockedByAdmin 
                            ? "Closed by Manager" 
                            : isPrerequisiteLocked 
                              ? 'Finish "' + prerequisiteCampName + '"' 
                              : isLevelLocked 
                                ? "Unlocks at Rank " + camp.minLevel
                                : 'Finish "' + activeCampaignNameInProgress + '" first'}
                        </button>
                      ) : status === "Approved" ? (
                        <div className="flex gap-2 w-full">
                          <div className="flex-1 py-3.5 bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-xs font-black text-center rounded-2xl flex items-center justify-center gap-1.5">
                            <Check size={14} /> Payout Released
                          </div>
                          <button
                            onClick={(e) => handleToggleFlip(camp.id, e)}
                            className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black rounded-2xl transition active:scale-95 flex items-center justify-center"
                            title="Share Task"
                          >
                            <Share2 size={14} />
                          </button>
                        </div>
                      ) : status === "Submitted" || status === "In Progress" ? (
                        <div className="flex gap-2 w-full">
                          <button
                            onClick={() => {
                              const clickId = "CLK" + Math.floor(100000 + Math.random() * 900000);
                              const finalUrl = getNormalizedRedirectUrl(camp.redirectUrl, clickId, user.referralCode || user.userId);
                              window.open(finalUrl, "_blank");
                            }}
                            className="flex-1 py-3.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 text-xs font-black rounded-2xl hover:scale-[1.01] transition active:scale-95 flex items-center justify-center"
                          >
                            Open Task
                          </button>
                          <button
                            onClick={(e) => handleToggleFlip(camp.id, e)}
                            className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black rounded-2xl transition active:scale-95 flex items-center justify-center"
                            title="Share Task"
                          >
                            <Share2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 w-full">
                          <button 
                            onClick={() => handleStartNowClick(camp)}
                            className="flex-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 text-xs font-black py-3.5 rounded-2xl text-center shadow-lg hover:scale-[1.01] transition active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            Start Task Now <ArrowRight size={14} />
                          </button>
                          <button
                            onClick={(e) => handleToggleFlip(camp.id, e)}
                            className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black rounded-2xl transition active:scale-95 flex items-center justify-center"
                            title="Share Task"
                          >
                            <Share2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Back Side of the Card */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-[2.2rem] p-6 flex flex-col justify-between h-full bg-[#090E1B] border border-yellow-500/20 shadow-[0_4px_30px_rgba(234,179,8,0.1)] overflow-hidden">
                    <div>
                      <div className="flex justify-between items-center pb-3 border-b border-white/5">
                        <span className="text-[10px] text-yellow-400 font-black uppercase tracking-widest">Share Campaign</span>
                        <button 
                          onClick={(e) => handleToggleFlip(camp.id, e)}
                          className="text-[10px] text-slate-400 hover:text-white px-2.5 py-1 rounded-full bg-white/5 border border-white/10 transition"
                        >
                          ✕ Close
                        </button>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-sm font-black text-white">{camp.name} Invites</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                          Recruit promoters under your network hierarchy & secure direct slab overrides!
                        </p>
                      </div>

                      <div className="mt-4 space-y-3">
                        {/* Inviting Campaign Link */}
                        <div>
                          <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Inviting Campaign Link</label>
                          <div className="flex gap-1.5 bg-[#060B18]/60 p-2 rounded-xl border border-white/5">
                            <input 
                              type="text" 
                              readOnly 
                              value={`${window.location.origin}/#/register?ref=${user?.referralCode || ""}&campaign=${camp.id}`}
                              className="bg-transparent text-[9px] font-mono text-slate-300 w-full focus:outline-none select-all"
                            />
                            <button
                              onClick={() => {
                                const url = `${window.location.origin}/#/register?ref=${user?.referralCode || ""}&campaign=${camp.id}`;
                                navigator.clipboard.writeText(url);
                                showToast("Inviting Campaign Link copied!", "success");
                              }}
                              className="text-[9px] bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black px-2.5 py-1 rounded-lg transition"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5">
                      <button
                        onClick={(e) => handleToggleFlip(camp.id, e)}
                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-black py-3 rounded-xl transition"
                      >
                        Back to Campaign
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>



    </div>
  );
}
