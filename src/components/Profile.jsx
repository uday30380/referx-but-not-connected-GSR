import React, { useState } from "react";
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import {
  User, Phone, Landmark, Shield, ChevronRight, LogOut, Check, AlertCircle,
  Award, MapPin, CreditCard, Star, Activity, Users, Wallet, Lock, Unlock,
  TrendingUp, Gift, ArrowUpRight, Info, CheckCircle2, MessageSquare, HelpCircle, Send
} from "lucide-react";

export default function Profile({ user, joinedCampaigns, referrals = [], campaigns, onUpdateProfile, onLogout, showToast, pageContent }) {
  const [profileForm, setProfileForm] = useState({
    name: user.name || "",
    mobile: user.mobile || "",
    bankAccountName: user.bankAccountName || "",
    bankName: user.bankName || "",
    bankAccountNumber: user.bankAccountNumber || "",
    bankIfscCode: user.bankIfscCode || "",
    state: user.state || "",
    city: user.city || ""
  });
  const [expandedSection, setExpandedSection] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [supportForm, setSupportForm] = useState({
    name: user.name || "",
    mobile: user.mobile || "",
    query: ""
  });
  const [supportErrors, setSupportErrors] = useState({});
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);

  const handleSubmitSupport = async (e) => {
    e.preventDefault();
    const tempErrors = {};
    if (!supportForm.name.trim()) tempErrors.name = "Full Name is required";
    if (!supportForm.mobile.trim() || !/^\d{10}$/.test(supportForm.mobile.trim())) {
      tempErrors.mobile = "Must be a valid 10-digit mobile number";
    }
    if (!supportForm.query.trim()) tempErrors.query = "Please describe your query/issue";

    if (Object.keys(tempErrors).length > 0) {
      setSupportErrors(tempErrors);
      showToast("Please fix the errors in the support form.", "danger");
      return;
    }

    setIsSubmittingSupport(true);
    try {
      await addDoc(collection(db, "supportTickets"), {
        userId: user.uid,
        userEmail: user.email || "",
        name: supportForm.name.trim(),
        mobile: supportForm.mobile.trim(),
        query: supportForm.query.trim(),
        status: "Pending",
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, "activities"), {
        userId: user.uid,
        userName: user.name || supportForm.name.trim(),
        action: "Support Ticket Raised",
        details: `Raised query: "${supportForm.query.slice(0, 45)}..."`,
        timestamp: serverTimestamp()
      });

      showToast("Support ticket submitted successfully!", "success");
      setSupportSuccess(true);
      setSupportErrors({});
      setSupportForm(prev => ({ ...prev, query: "" }));
    } catch (err) {
      console.error("Failed to submit support ticket:", err);
      showToast("Failed to submit. Please try again later.", "danger");
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  const handleSaveFields = async (e, section) => {
    e.preventDefault();
    const tempErrors = {};
    const updatedFields = {};
    if (section === "personal") {
      if (!profileForm.state.trim()) tempErrors.state = "State is required";
      if (!profileForm.city.trim()) tempErrors.city = "City is required";
      if (!profileForm.mobile.trim() || !/^\d{10}$/.test(profileForm.mobile.trim())) {
        tempErrors.mobile = "Must be a valid 10-digit mobile number";
      }
      updatedFields.state = profileForm.state.trim();
      updatedFields.city = profileForm.city.trim();
      updatedFields.mobile = profileForm.mobile.trim();
    } else if (section === "contact") {
      // Linked Email section is read-only.
    } else if (section === "banking") {
      if (!profileForm.bankAccountName.trim()) tempErrors.bankAccountName = "Account Holder Name is required";
      if (!profileForm.bankName.trim()) tempErrors.bankName = "Bank Name is required";
      if (!profileForm.bankAccountNumber.trim() || !/^\d{9,18}$/.test(profileForm.bankAccountNumber.trim())) {
        tempErrors.bankAccountNumber = "Enter a valid Account Number (9 to 18 digits)";
      }
      if (!profileForm.bankIfscCode.trim() || !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(profileForm.bankIfscCode.trim())) {
        tempErrors.bankIfscCode = "Enter a valid 11-digit IFSC code (e.g. SBIN0001234)";
      }
      updatedFields.bankAccountName = profileForm.bankAccountName.trim();
      updatedFields.bankName = profileForm.bankName.trim();
      updatedFields.bankAccountNumber = profileForm.bankAccountNumber.trim();
      updatedFields.bankIfscCode = profileForm.bankIfscCode.trim().toUpperCase();
    }
    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      showToast("Please correct validation errors.", "danger");
      return;
    }
    setIsSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, updatedFields);
      await addDoc(collection(db, "activities"), {
        userId: user.uid, userName: user.name,
        action: "Profile Updated",
        details: `Updated ${section === "personal" ? "personal" : section === "contact" ? "email" : "banking"} details.`,
        timestamp: serverTimestamp()
      });
      if (onUpdateProfile) onUpdateProfile({ ...user, ...updatedFields });
      showToast("Settings saved successfully!", "success");
      setExpandedSection(null);
      setErrors({});
    } catch (err) {
      console.error(err);
      showToast("Failed to save profile. Please try again.", "danger");
    } finally {
      setIsSaving(false);
    }
  };

  const getCampaignName = (id) => campaigns.find((c) => c.id === id)?.name || id;
  const getJoinDate = () => {
    if (!user.createdAt) return "2026";
    try {
      let d = user.createdAt.seconds ? new Date(user.createdAt.seconds * 1000) :
               typeof user.createdAt.toDate === "function" ? user.createdAt.toDate() : new Date(user.createdAt);
      return isNaN(d.getTime()) ? "2026" : d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    } catch { return "2026"; }
  };

  const rankNames = [
    "Intern",
    "Executive",
    "Senior Executive",
    "Assistant Supervisor",
    "Supervisor",
    "Assistant Manager",
    "Manager",
    "Senior Manager",
    "Regional Manager",
    "State Head",
    "National Head",
    "Diamond Manager",
    "Platinum Manager",
    "Elite Director"
  ];
  const rankEmojis = ["🌱", "💼", "👔", "🛡️", "⚡", "🔥", "🏆", "👑", "🌍", "🏛️", "🏅", "💎", "🌟", "✨"];
  const currentLevel = user.level || 1;
  const currentRankName = rankNames[currentLevel - 1] || "Intern";

  const rankGradients = [
    "from-amber-600/30 via-amber-700/20 to-slate-900/30",
    "from-amber-500/30 via-amber-600/20 to-slate-900/30",
    "from-yellow-500/30 via-amber-500/20 to-slate-900/30",
    "from-yellow-400/30 via-yellow-500/20 to-slate-900/30",
    "from-orange-500/30 via-amber-500/20 to-slate-900/30",
    "from-emerald-500/30 via-teal-500/20 to-slate-900/30",
    "from-sky-500/30 via-blue-500/20 to-slate-900/30",
    "from-indigo-500/30 via-purple-500/20 to-slate-900/30",
    "from-pink-500/30 via-rose-500/20 to-slate-900/30",
    "from-red-500/30 via-rose-500/20 to-slate-900/30",
    "from-violet-500/30 via-purple-500/20 to-slate-900/30",
    "from-yellow-400/30 via-yellow-300/20 to-slate-900/30",
    "from-amber-400/30 via-yellow-400/20 to-slate-900/30",
    "from-yellow-300/30 via-amber-300/20 to-slate-900/30",
  ];
  const lvlGrad = rankGradients[Math.min(currentLevel - 1, rankGradients.length - 1)];

  const rankBorderColor = [
    "border-sky-500/30", "border-violet-500/30", "border-orange-500/30",
    "border-emerald-500/30", "border-pink-500/30", "border-cyan-500/30", "border-amber-500/30"
  ][Math.min(currentLevel - 1, 6)];

  const rankAccentColor = [
    "text-sky-400", "text-violet-400", "text-orange-400",
    "text-emerald-400", "text-pink-400", "text-cyan-400", "text-amber-400"
  ][Math.min(currentLevel - 1, 6)];

  const toggleSection = (name) => {
    setExpandedSection(expandedSection === name ? null : name);
    setErrors({});
  };

  const inputClass = (hasError) =>
    `w-full bg-white/5 border ${hasError ? "border-rose-500/50 focus:border-rose-500/70" : "border-white/10 hover:border-white/20 focus:border-sky-500/60"} rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500/15 transition-all duration-200`;

  const badgeClass = (status) => {
    const s = status?.toLowerCase();
    if (s === "approved") return "bg-emerald-500/15 border-emerald-500/25 text-emerald-300";
    if (s === "rejected") return "bg-rose-500/15 border-rose-500/25 text-rose-300";
    if (s === "submitted") return "bg-amber-500/15 border-amber-500/25 text-amber-300";
    return "bg-white/5 border-white/10 text-slate-400";
  };

  const approvedCount = Object.values(joinedCampaigns || {}).filter(c => c.status === "Approved").length;

  const statsCards = [
    { label: "Total Earned", value: `₹${(user.earnings?.total || 0).toLocaleString("en-IN")}`, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20", icon: <Wallet size={16} /> },
    { label: "Tasks Done", value: `${approvedCount}`, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: <Check size={16} /> },
    { label: "Team Size", value: `${referrals.length}`, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", icon: <Users size={16} /> },
  ];

  const settingsSections = [
    {
      key: "personal",
      label: "Personal Details",
      sub: (user.state && user.city && user.mobile) 
        ? `${user.city}, ${user.state} · +91 ${user.mobile}` 
        : "Add location & mobile number",
      icon: <MapPin size={18} />,
      iconBg: "bg-sky-500/15 text-sky-400",
      indicatorColor: (user.state && user.city && user.mobile) ? "bg-emerald-400" : "bg-amber-400",
      form: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {["state", "city"].map(field => (
              <div key={field}>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 capitalize">{field}</label>
                <input
                  type="text" required
                  placeholder={field === "state" ? "e.g. Andhra Pradesh" : "e.g. Hyderabad"}
                  className={inputClass(errors[field])}
                  value={profileForm[field]}
                  onChange={e => setProfileForm({ ...profileForm, [field]: e.target.value })}
                />
                {errors[field] && <span className="text-[10px] text-rose-400 mt-1 block flex items-center gap-1"><AlertCircle size={10} /> {errors[field]}</span>}
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">Mobile Number (10 digits)</label>
            <input
              type="tel" maxLength={10} required placeholder="9876543210"
              className={inputClass(errors.mobile)}
              value={profileForm.mobile}
              onChange={e => setProfileForm({ ...profileForm, mobile: e.target.value.replace(/\D/g, "") })}
            />
            {errors.mobile && <span className="text-[10px] text-rose-400 mt-1 block flex items-center gap-1"><AlertCircle size={10} /> {errors.mobile}</span>}
          </div>
        </div>
      )
    },
    {
      key: "contact",
      label: "Linked Email",
      sub: user.email || "Not set",
      icon: <Shield size={18} />,
      iconBg: "bg-violet-500/15 text-violet-400",
      indicatorColor: user.email ? "bg-emerald-400" : "bg-amber-400",
      form: (
        <div>
          <div className="p-4 rounded-xl bg-white/4 border border-white/8 text-xs leading-relaxed text-slate-300">
            <span className="font-bold text-white block mb-1">📧 Google Accounts Security Link</span>
            Your account is securely linked with email: <strong className="text-white">{user.email}</strong>
            <p className="text-slate-500 mt-1">This email acts as your unique identity on ReferX and cannot be changed.</p>
          </div>
        </div>
      )
    },
    {
      key: "banking",
      label: "Bank Account",
      sub: user.bankAccountNumber
        ? `${user.bankName} (···${user.bankAccountNumber.slice(-4)})`
        : "Add bank account for payouts",
      icon: <Landmark size={18} />,
      iconBg: "bg-emerald-500/15 text-emerald-400",
      indicatorColor: user.bankAccountNumber ? "bg-emerald-400" : "bg-rose-400",
      form: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "bankName", label: "Bank Name", placeholder: "SBI / HDFC / ICICI" },
              { key: "bankAccountName", label: "Account Holder", placeholder: "Full name on passbook" },
              { key: "bankAccountNumber", label: "Account Number", placeholder: "9–18 digits" },
              { key: "bankIfscCode", label: "IFSC Code", placeholder: "e.g. SBIN0001234" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">{f.label}</label>
                <input
                  type="text" required placeholder={f.placeholder}
                  className={inputClass(errors[f.key])}
                  value={profileForm[f.key]}
                  onChange={e => setProfileForm({
                    ...profileForm,
                    [f.key]: f.key === "bankIfscCode" ? e.target.value.toUpperCase() : e.target.value
                  })}
                />
                {errors[f.key] && <span className="text-[10px] text-rose-400 mt-0.5 block">{errors[f.key]}</span>}
              </div>
            ))}
          </div>
        </div>
      )
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto pb-12 text-slate-100 entrance-scale-up">

      {/* Profile Hero Card */}
      <div className={`relative rounded-3xl overflow-hidden border ${rankBorderColor}`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${lvlGrad}`} />
        {/* Decorative orbs */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/4 pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-4 p-8 text-center">
          {/* Avatar with initials */}
          <div className={`w-24 h-24 rounded-3xl border-2 ${rankBorderColor} bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center shadow-xl`}>
            <span className={`text-4xl font-black ${rankAccentColor}`}>
              {(user.name || "U").charAt(0).toUpperCase()}
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-white">{user.name}</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Member since {getJoinDate()} ·{" "}
              <span className="font-mono text-white font-bold">{user.userId || "USRxxxx"}</span>
            </p>
          </div>

          {/* Rank Badge */}
          <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border bg-black/20 backdrop-blur-sm ${rankBorderColor} text-white`}>
            <span className="text-xl">{rankEmojis[currentLevel - 1] || "⭐"}</span>
            Rank {currentLevel} — {currentRankName}
          </span>

          {/* Profile ID */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <Shield size={12} className="text-slate-600" />
            {user.employeeId || "ReferX-2026-xxxx"}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {statsCards.map(s => (
          <div key={s.label} className={`rounded-2xl p-4 border ${s.bg} text-center group stat-card-hover`}>
            <div className={`flex justify-center mb-2 ${s.color}`}>{s.icon}</div>
            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Withdrawal Eligibility Section ───────────────── */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Wallet size={12} />
          Withdrawal Status
        </h3>
        <div className={`relative rounded-3xl overflow-hidden border ${approvedCount >= 50 ? "border-emerald-500/30" : "border-amber-500/30"} shadow-xl`} style={{ background: approvedCount >= 50 ? "linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(5,150,105,0.08) 100%)" : "linear-gradient(135deg, rgba(245,158,11,0.05) 0%, rgba(217,119,6,0.08) 100%)" }}>
          {/* Glow orb */}
          <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 blur-2xl ${approvedCount >= 50 ? "bg-emerald-400" : "bg-amber-400"}`} />
          <div className="relative z-10 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${approvedCount >= 50 ? "bg-emerald-500/15 border border-emerald-500/30" : "bg-amber-500/10 border border-amber-500/25"}`}>
                  {approvedCount >= 50
                    ? <Unlock size={22} className="text-emerald-400" />
                    : <Lock size={22} className="text-amber-400" />
                  }
                </div>
                <div>
                  <div className={`text-sm font-extrabold ${approvedCount >= 50 ? "text-emerald-300" : "text-amber-300"}`}>
                    {approvedCount >= 50 ? "🎉 Withdrawal Unlocked!" : (pageContent?.profile?.withdrawalTitle || "🔒 Withdrawal Locked")}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {approvedCount >= 50
                      ? "You can now withdraw your earnings to your bank!"
                      : (pageContent?.profile?.withdrawalDesc || "Complete 50 referrals to unlock withdrawals")}
                  </p>
                </div>
              </div>
              <div className={`text-right shrink-0 px-3 py-1.5 rounded-xl border text-xs font-black ${approvedCount >= 50 ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-300" : "bg-amber-500/10 border-amber-500/25 text-amber-300"}`}>
                {approvedCount}/50
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-[10px] font-bold mb-1.5">
                <span className="text-slate-500">PROGRESS</span>
                <span className={approvedCount >= 50 ? "text-emerald-400" : "text-amber-400"}>{Math.min(100, Math.round((approvedCount / 50) * 100))}%</span>
              </div>
              <div className="h-2.5 bg-white/[0.06] rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${approvedCount >= 50 ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "bg-gradient-to-r from-amber-400 to-orange-500"}`}
                  style={{ width: `${Math.min(100, (approvedCount / 50) * 100)}%` }}
                />
              </div>
            </div>

            {/* Milestones */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              {[10, 20, 35, 50].map(milestone => (
                <div key={milestone} className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center ${approvedCount >= milestone ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/[0.02] border-white/5"}`}>
                  {approvedCount >= milestone
                    ? <CheckCircle2 size={14} className="text-emerald-400" />
                    : <div className={`w-3.5 h-3.5 rounded-full border-2 ${approvedCount >= milestone ? "border-emerald-400 bg-emerald-400" : "border-white/20"}`} />
                  }
                  <span className={`text-[9px] font-black ${approvedCount >= milestone ? "text-emerald-300" : "text-slate-500"}`}>{milestone}</span>
                </div>
              ))}
            </div>

            {/* Info note */}
            <div className="mt-4 flex items-start gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <Info size={13} className="text-sky-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-white">How it works:</strong> After completing 50 successful referrals (accounts opened by your team), you unlock the ability to withdraw your earned money directly to your bank account. No investment is required — you earn purely through referrals!
              </p>
            </div>

            {approvedCount >= 50 && (
              <div className="mt-3 flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                <ArrowUpRight size={14} className="text-emerald-400 shrink-0" />
                <p className="text-[11px] text-emerald-300 font-semibold">
                  Go to <strong>Wallet & Payouts</strong> tab to request your withdrawal now!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Shield size={12} />
          Account Settings
        </h3>
        <div className="glass-card rounded-3xl overflow-hidden divide-y divide-white/[0.06] shadow-xl">
          {settingsSections.map(sec => (
            <div key={sec.key}>
              <button
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-all duration-200 group"
                onClick={() => toggleSection(sec.key)}
              >
                <div className={`w-11 h-11 rounded-xl ${sec.iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                  {sec.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{sec.label}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${sec.indicatorColor} animate-pulse`} />
                  </div>
                  <span className="text-xs text-slate-500 block truncate mt-0.5">{sec.sub}</span>
                </div>
                <ChevronRight
                  size={16}
                  className={`text-slate-500 transition-transform duration-300 shrink-0 ${expandedSection === sec.key ? "rotate-90 text-sky-400" : ""}`}
                />
              </button>
              {expandedSection === sec.key && (
                <div className="px-5 pb-5 border-t border-white/[0.06] bg-white/[0.01]" onClick={e => e.stopPropagation()}>
                  <form onSubmit={(e) => handleSaveFields(e, sec.key)} className="pt-5 space-y-4">
                    {sec.form}
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg disabled:opacity-50 btn-shimmer"
                      style={{ background: "linear-gradient(135deg, #38BDF8 0%, #818CF8 100%)" }}
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <><Check size={15} /> Save Changes</>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Task History */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Activity size={12} />
          Task History
        </h3>
        <div className="glass-card rounded-3xl overflow-hidden divide-y divide-white/[0.06] shadow-xl">
          {Object.keys(joinedCampaigns || {}).length === 0 ? (
            <div className="py-10 text-center">
              <Award size={28} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No tasks started yet.</p>
              <p className="text-slate-600 text-xs mt-1">Visit the Campaigns section to begin! 🚀</p>
            </div>
          ) : (
            Object.entries(joinedCampaigns).map(([campaignId, data]) => (
              <div key={campaignId} className="flex justify-between items-center p-4 hover:bg-white/[0.02] transition-colors">
                <div>
                  <strong className="text-sm text-white font-semibold block">{getCampaignName(campaignId)}</strong>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                    {data.joinedAt ? new Date(data.joinedAt).toLocaleDateString("en-IN") : "—"}
                  </span>
                </div>
                <span className={`text-[9px] font-black px-2.5 py-1.5 rounded-xl border uppercase tracking-wider ${badgeClass(data.status)}`}>
                  {data.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Support Form Card */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <HelpCircle size={12} className="text-orange-400 animate-pulse" />
          Help & Support Helpdesk
        </h3>
        
        <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl relative overflow-hidden transition-all duration-300">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-orange-500/10 to-rose-500/10 blur-xl pointer-events-none" />
          
          {supportSuccess ? (
            <div className="flex flex-col items-center justify-center py-6 text-center animate-fade-in-up">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400 shadow-lg shadow-emerald-500/5">
                <CheckCircle2 size={32} className="animate-pulse" />
              </div>
              <h4 className="text-base font-extrabold text-white">Ticket Submitted Successfully!</h4>
              <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
                Thank you for contacting us. Our manager will review your query and contact you within 12–24 hours.
              </p>
              <button
                type="button"
                onClick={() => setSupportSuccess(false)}
                className="mt-5 px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-xs font-bold text-slate-300 active:scale-95"
              >
                Submit Another Query
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitSupport} className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Facing any problems with task verification, referral commissions, or wallet withdrawals? Drop your query below and our support team will resolve it.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1.5 uppercase tracking-wide">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Enter your name"
                      className={`${inputClass(supportErrors.name)} pl-9`}
                      value={supportForm.name}
                      onChange={e => setSupportForm({ ...supportForm, name: e.target.value })}
                    />
                    <User size={14} className="absolute left-3 top-3.5 text-slate-500" />
                  </div>
                  {supportErrors.name && <span className="text-[10px] text-rose-400 mt-1 block flex items-center gap-1"><AlertCircle size={10} /> {supportErrors.name}</span>}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1.5 uppercase tracking-wide">Mobile Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      placeholder="10-digit number"
                      className={`${inputClass(supportErrors.mobile)} pl-9`}
                      value={supportForm.mobile}
                      onChange={e => setSupportForm({ ...supportForm, mobile: e.target.value })}
                    />
                    <Phone size={14} className="absolute left-3 top-3.5 text-slate-500" />
                  </div>
                  {supportErrors.mobile && <span className="text-[10px] text-rose-400 mt-1 block flex items-center gap-1"><AlertCircle size={10} /> {supportErrors.mobile}</span>}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-300 block mb-1.5 uppercase tracking-wide">Describe your issue / query</label>
                <div className="relative">
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide details about the issue you are facing (e.g. Campaign name, transaction code)..."
                    className={`${inputClass(supportErrors.query)} pl-9 py-3 resize-none`}
                    value={supportForm.query}
                    onChange={e => setSupportForm({ ...supportForm, query: e.target.value })}
                  />
                  <MessageSquare size={14} className="absolute left-3 top-3.5 text-slate-500" />
                </div>
                {supportErrors.query && <span className="text-[10px] text-rose-400 mt-1 block flex items-center gap-1"><AlertCircle size={10} /> {supportErrors.query}</span>}
              </div>

              <button
                type="submit"
                disabled={isSubmittingSupport}
                className="w-full py-3.5 rounded-2xl text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg disabled:opacity-50 btn-shimmer mt-2"
                style={{ background: "linear-gradient(135deg, #F97316 0%, #E11D48 100%)" }}
              >
                {isSubmittingSupport ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Submitting Query...
                  </>
                ) : (
                  <><Send size={13} /> Submit Support Request</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="w-full py-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-rose-400 font-bold text-sm hover:bg-rose-500/10 hover:border-rose-500/35 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 group shadow-md"
      >
        <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
        Sign Out of Account
      </button>

    </div>
  );
}
