import React, { useState, useEffect } from "react";
import { 
  DollarSign, Users, Clock, CheckCircle, AlertCircle, TrendingUp, 
  ArrowUpRight, ShieldAlert, Send, Lock, Gift, Wallet, Banknote, 
  CreditCard, Building, Download, ArrowUp, ArrowDown, Check, ShieldCheck
} from "lucide-react";
import { addDoc, collection, serverTimestamp, doc, updateDoc, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import confetti from "canvas-confetti";

export default function Earnings({ user, joinedCampaigns, referrals = [], campaigns, showToast, pageContent }) {
  const [activeTab, setActiveTab] = useState("upi"); // upi or bank
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [upiId, setUpiId] = useState(user.upiId || "");
  
  // Bank fields
  const [bankName, setBankName] = useState(user.bankName || "");
  const [bankAccountNumber, setBankAccountNumber] = useState(user.bankAccountNumber || "");
  const [bankAccountName, setBankAccountName] = useState(user.bankAccountName || user.name || "");
  const [bankIfscCode, setBankIfscCode] = useState(user.bankIfscCode || "");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [withdrawalsList, setWithdrawalsList] = useState([]);

  const earnings = user.earnings || { total: 0, pending: 0, paid: 0, balance: 0 };
  const accountsOpened = user.approvedCount || user.totalAccounts || 0;

  // Real-time withdrawals list sync
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "withdrawals"), where("uid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setWithdrawalsList(list);
    });
    return () => unsubscribe();
  }, [user]);

  const handleWithdrawalRequest = async (e) => {
    e.preventDefault();
    setError("");

    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) { 
      setError("Please enter a valid amount."); 
      return; 
    }
    if (amountNum > (earnings.balance || 0)) { 
      setError(`Insufficient balance. Maximum available: ₹${earnings.balance || 0}.`); 
      return; 
    }
    if (amountNum < 250) {
      setError("Minimum withdrawal amount is ₹250.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        uid: user.uid,
        employeeId: user.employeeId || ("NXE-" + user.uid.substring(0, 6).toUpperCase()),
        employeeName: user.name || "Affiliate Partner",
        email: user.email,
        amount: amountNum,
        type: activeTab,
        status: "pending",
        createdAt: new Date().toISOString()
      };

      if (activeTab === "upi") {
        if (!upiId.trim()) { setError("Please enter your UPI ID."); setIsSubmitting(false); return; }
        payload.upiId = upiId.trim();
      } else {
        if (!bankName.trim() || !bankAccountName.trim() || !bankAccountNumber.trim() || !bankIfscCode.trim()) {
          setError("Please fill in all bank details.");
          setIsSubmitting(false);
          return;
        }
        payload.bankName = bankName.trim();
        payload.bankAccountName = bankAccountName.trim();
        payload.bankAccountNumber = bankAccountNumber.trim();
        payload.bankIfscCode = bankIfscCode.trim().toUpperCase();
      }

      await addDoc(collection(db, "withdrawals"), payload);

      // Update user document
      const userRef = doc(db, "users", user.uid);
      const currentBalance = earnings.balance || 0;
      const currentPending = earnings.pending || 0;
      
      await updateDoc(userRef, { 
        "earnings.balance": Math.max(0, currentBalance - amountNum), 
        "earnings.pending": currentPending + amountNum 
      });

      await addDoc(collection(db, "notifications"), {
        uid: user.uid,
        message: `Withdrawal request of ₹${amountNum} initiated via ${activeTab.toUpperCase()}.`,
        type: "withdrawal_requested",
        createdAt: serverTimestamp(),
        read: false
      });

      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      showToast(`Withdrawal request of ₹${amountNum} submitted successfully!`, "success");
      setWithdrawAmount("");
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to submit withdrawal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Database-backed Dynamic Variables
  const displayBalance = earnings.balance || 0;
  const displayMain = earnings.main || 0;
  const displayBonus = earnings.bonus || 0;
  const displayReferral = earnings.referral || 0;
  const displayCashback = earnings.cashback || 0;

  // Merge withdrawals (debits) and approved referrals (credits) to build dynamic history ledger
  const mergedTxList = [];
  
  withdrawalsList.forEach(w => {
    mergedTxList.push({
      type: "up",
      title: `Withdrawal - ${w.type === "upi" ? "UPI" : "Bank"}`,
      time: w.createdAt ? new Date(w.createdAt).toLocaleString("en-IN") : "Pending Approval",
      amount: `-₹${w.amount.toLocaleString("en-IN")}`,
      badge: w.status?.toUpperCase() || "PENDING",
      dateObj: w.createdAt ? new Date(w.createdAt) : new Date(),
      bColor: w.status === "approved" 
        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
        : w.status === "rejected" 
          ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
          : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse"
    });
  });

  referrals.filter(r => r.status === "approved").forEach(r => {
    mergedTxList.push({
      type: "down",
      title: `${r.campaignName || "Task Lead"} — lead approved`,
      time: r.createdAt ? new Date(r.createdAt).toLocaleString("en-IN") : "Approved Verification",
      amount: `+₹${(r.rewardAmount || 100).toLocaleString("en-IN")}`,
      badge: "CREDIT",
      dateObj: r.createdAt ? new Date(r.createdAt) : new Date(),
      bColor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
    });
  });

  // Sort by date desc
  mergedTxList.sort((a, b) => b.dateObj - a.dateObj);

  return (
    <div className="flex flex-col gap-8 text-slate-100 entrance-scale-up select-none pb-12">
      
      <style dangerouslySetInnerHTML={{ __html: ".wallet-glow-card { background: rgba(10, 18, 38, 0.45); border: 1px solid rgba(255, 255, 255, 0.06); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3); backdrop-filter: blur(12px); } .sub-wallet-item { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); } .sub-wallet-item:hover { border-color: rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.05); } .btn-gold-action { background: linear-gradient(135deg, #FBBF24 0%, #EAB308 100%); color: #050A15; font-weight: 800; transition: all 0.25s ease; } .btn-gold-action:hover { transform: translateY(-1px); box-shadow: 0 0 20px rgba(234, 179, 8, 0.4); } .transaction-item-hover:hover { background: rgba(255, 255, 255, 0.015); }" }} />

      {/* Trust Badge Banner */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 text-xs text-emerald-400">
        <ShieldCheck size={16} className="shrink-0" />
        <span className="font-semibold">
          Your payouts are protected. All verification milestones are audited by manager panel before UPI settlement.
        </span>
      </div>

      {/* Main Grid: Available Balance Card + Withdraw Funds Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Column 1: Available Balance Card */}
        <div className="lg:col-span-7 wallet-glow-card rounded-[3xl] p-8 flex flex-col justify-between min-h-[300px]">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">AVAILABLE BALANCE</span>
            <div className="text-5xl font-black text-white tracking-tight mt-2 flex items-baseline gap-1">
              ₹{displayBalance.toLocaleString("en-IN")}
            </div>
            <span className="text-xs text-slate-400 block mt-3 font-medium">
              Min withdrawal ₹250 · payouts processed recursively to your verified destination
            </span>
          </div>

          {/* Sub-wallets row */}
          <div className="grid grid-cols-4 gap-3 mt-8">
            {[
              { label: "MAIN", val: displayMain },
              { label: "BONUS", val: displayBonus },
              { label: "REFERRAL", val: displayReferral },
              { label: "CASHBACK", val: displayCashback }
            ].map((sub, i) => (
              <div key={i} className="sub-wallet-item rounded-2xl p-3 text-center transition">
                <span className="text-[8px] text-slate-500 font-black tracking-widest block mb-1">{sub.label}</span>
                <strong className="text-xs font-black text-white font-mono">₹{sub.val.toLocaleString("en-IN")}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Withdraw Funds Card */}
        <div className="lg:col-span-5 wallet-glow-card rounded-[3xl] p-8 space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-white">Withdraw funds</h3>
          </div>

          {/* Switcher tabs */}
          <div className="flex bg-[#060B18]/60 border border-white/5 rounded-full p-1.5 justify-between relative overflow-hidden">
            {/* Sliding highlight container */}
            <div 
              className="absolute top-1.5 bottom-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-md"
              style={{
                left: activeTab === "upi" ? "6px" : "calc(50% + 2px)",
                width: "calc(50% - 8px)"
              }}
            />
            <button 
              type="button"
              onClick={() => setActiveTab("upi")}
              className={`flex-1 py-2.5 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 relative z-10 duration-300 ${
                activeTab === "upi" ? "text-slate-950 font-black" : "text-slate-400 hover:text-white"
              }`}
            >
              📱 UPI · 2 min
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab("bank")}
              className={`flex-1 py-2.5 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 relative z-10 duration-300 ${
                activeTab === "bank" ? "text-slate-950 font-black" : "text-slate-400 hover:text-white"
              }`}
            >
              🏦 Bank · NEFT
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl p-3 font-semibold text-center animate-pulse">
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleWithdrawalRequest} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">AMOUNT (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-mono">₹</span>
                <input 
                  type="number" 
                  value={withdrawAmount} 
                  onChange={e => setWithdrawAmount(e.target.value)} 
                  placeholder="Minimum 250"
                  className="w-full bg-[#060B18]/60 border border-white/10 rounded-2xl py-3.5 pl-8 pr-4 text-white text-sm font-mono focus:outline-none focus:border-yellow-500/40"
                  required
                />
              </div>
            </div>

            {activeTab === "upi" ? (
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">UPI ID</label>
                <input 
                  type="text" 
                  value={upiId} 
                  onChange={e => setUpiId(e.target.value)} 
                  placeholder="e.g. yourname@upi"
                  className="w-full bg-[#060B18]/60 border border-white/10 rounded-2xl py-3.5 px-4 text-white text-sm focus:outline-none focus:border-yellow-500/40"
                  required
                />
              </div>
            ) : (
              <div className="space-y-3 animate-fade-in">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">BANK ACCOUNT NUMBER</label>
                  <input 
                    type="text" 
                    value={bankAccountNumber} 
                    onChange={e => setBankAccountNumber(e.target.value)} 
                    placeholder="Account Number"
                    className="w-full bg-[#060B18]/60 border border-white/10 rounded-2xl py-3.5 px-4 text-white text-sm focus:outline-none focus:border-yellow-500/40"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Bank Name</label>
                    <input 
                      type="text" 
                      value={bankName} 
                      onChange={e => setBankName(e.target.value)} 
                      placeholder="SBI / HDFC"
                      className="w-full bg-[#060B18]/60 border border-white/10 rounded-xl py-2 px-3 text-white text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">IFSC Code</label>
                    <input 
                      type="text" 
                      value={bankIfscCode} 
                      onChange={e => setBankIfscCode(e.target.value)} 
                      placeholder="IFSC"
                      className="w-full bg-[#060B18]/60 border border-white/10 rounded-xl py-2 px-3 text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full btn-gold-action text-[11px] font-black py-4 rounded-2xl flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
            >
              {isSubmitting ? "Processing..." : "Request withdrawal"}
            </button>
          </form>

          <div className="text-[9px] text-slate-500 text-center font-semibold leading-relaxed pt-2">
            Withdrawals are processed instantly Mon-Sat, 8am - 11pm IST.
          </div>
        </div>

      </div>

      {/* Transaction History Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-extrabold text-white">Transaction history</h3>
          <button onClick={() => showToast("Statement exported successfully!", "success")} className="bg-slate-950/60 border border-white/10 hover:border-white/20 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition duration-200">
            <Download size={14} className="text-slate-400" />
            Statement
          </button>
        </div>

        <div className="bg-slate-950/60 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="divide-y divide-white/5 stagger-list">
            {mergedTxList.length > 0 ? (
              mergedTxList.map((tx, idx) => (
                <div key={idx} className="flex justify-between items-center p-5 transaction-item-hover transition duration-200">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === "up" ? "bg-white/5 text-white" : "bg-emerald-500/10 text-emerald-400"
                    }`}>
                      {tx.type === "up" ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-white block">{tx.title}</strong>
                      <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">{tx.time}</span>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-4">
                    <div>
                      <span className={`text-sm font-black font-mono block ${
                        tx.amount.startsWith("+") ? "text-emerald-400" : "text-white"
                      }`}>
                        {tx.amount}
                      </span>
                      <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[8px] font-black tracking-wider border ${tx.bColor}`}>
                        {tx.badge}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs font-semibold">
                No transactions recorded yet. Complete campaigns or request withdrawals to view ledgers here.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
