import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield, Award, Zap, Lock, Mail, Send, ChevronRight, ExternalLink,
  LayoutDashboard, Target, Users, Activity, User, Settings
} from "lucide-react";

export default function Footer({ user, activeView, pageContent }) {
  const [modalType, setModalType] = useState(null);
  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (emailInput) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmailInput("");
      }, 5000);
    }
  };

  const navLinks = user ? [
    { label: "Dashboard", path: "/dashboard", key: "dashboard", icon: LayoutDashboard, color: "text-sky-400" },
    { label: "Campaigns & Tasks", path: "/campaigns", key: "campaigns", icon: Target, color: "text-violet-400" },
    { label: "Profile", path: "/profile", key: "profile", icon: User, color: "text-amber-400" },
  ] : [
    { label: "Log In / Register", path: "/login", key: "login", icon: User, color: "text-sky-400" },
  ];

  const legalItems = [
    { label: "Terms & Conditions", key: "terms", color: "text-sky-400" },
    { label: "Privacy Policy", key: "privacy", color: "text-violet-400" },
    { label: "Payout Policy", key: "warrant", color: "text-emerald-400" },
    { label: "Company Details", key: "company-details", color: "text-yellow-400", isLink: true, path: "/company-details" },
  ];

  const MODAL_CONTENT = {
    terms: {
      title: pageContent?.policies?.termsTitle || "ReferX Work Rules",
      color: "text-sky-400",
      sections: [
        { title: pageContent?.policies?.termsSec1Title || "1. Verified Work", body: pageContent?.policies?.termsSec1Body || "Every account opening task is checked by the partner brand company. If you fill fake, wrong, or duplicate details, your work will be rejected and your account will be blocked." },
        { title: pageContent?.policies?.termsSec2Title || "2. Bank Payouts", body: pageContent?.policies?.termsSec2Body || "Your earned money is sent directly to your registered bank account. Payout transfers take 12 to 24 hours to reach your bank. Double check your bank details — we cannot recover money sent to wrong details." },
        { title: pageContent?.policies?.termsSec3Title || "3. Refer and Earn Rule", body: pageContent?.policies?.termsSec3Body || "You get the ₹100 referral bonus only when your friend signs up and successfully completes their first task. Do not make fake accounts to get referral bonus." },
        { title: pageContent?.policies?.termsSec4Title || "4. Document Safety", body: pageContent?.policies?.termsSec4Body || "Your PAN card and Aadhaar card details are completely safe and encrypted. We only use them for tax and bank verification rules." },
      ]
    },
    privacy: {
      title: pageContent?.policies?.privacyTitle || "Privacy & Data Safety",
      color: "text-violet-400",
      sections: [
        { title: pageContent?.policies?.privacySec1Title || "1. Safe Document Storage", body: pageContent?.policies?.privacySec1Body || "Your Aadhaar card and PAN details are encrypted and stored in secure systems. Nobody can see them except for official tax and bank verification purposes." },
        { title: pageContent?.policies?.privacySec2Title || "2. Task Tracking Data", body: pageContent?.policies?.privacySec2Body || "We use automatic tracking links to register when you click and complete a task. This ensures your rewards are correctly added to your wallet." },
        { title: pageContent?.policies?.privacySec3Title || "3. Data Safety", body: pageContent?.policies?.privacySec3Body || "We never sell, rent, or share your phone number, email, or other personal details with third-party advertising companies." },
      ]
    },
    warrant: {
      title: pageContent?.policies?.warrantTitle || "Payout Rules & Details",
      color: "text-emerald-400",
      sections: [
        { title: pageContent?.policies?.warrantSec1Title || "1. Direct Verification by Brands", body: pageContent?.policies?.warrantSec1Body || "Your rewards are approved only when the partner company (like Demat/Bank brand) confirms you opened a successful account through our link." },
        { title: pageContent?.policies?.warrantSec2Title || "2. Processing Timelines", body: pageContent?.policies?.warrantSec2Body || "Once verified, we send the money to your bank within 12 to 24 hours. Payouts are sent daily, except on bank holidays." },
        { title: pageContent?.policies?.warrantSec3Title || "3. Anti-Cheating Check", body: pageContent?.policies?.warrantSec3Body || "If our system finds any cheat activity, fake logins, or multiple dummy accounts under your referral link, we will hold your payout pending review." },
      ]
    }
  };

  const activeModal = modalType && MODAL_CONTENT[modalType];

  return (
    <>
      <footer className="border-t border-white/[0.06] py-14 px-6 bg-gradient-to-b from-[#0D1526]/40 via-[#070D19]/90 to-[#060B18] mt-auto pb-32 md:pb-14 shadow-2xl">
        <div className="max-w-6xl mx-auto">

          {/* Top Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-10">

            {/* Brand Block */}
            <div className="md:col-span-5 flex flex-col gap-5">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-lg relative overflow-hidden" style={{ background: "linear-gradient(135deg, #FBBF24 0%, #EAB308 50%, #D97706 100%)" }}>
                  <span className="relative z-10">{ (pageContent?.appName || "ReferX").charAt(0).toUpperCase() }</span>
                  <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 30% 30%, white, transparent 60%)" }} />
                </div>
                <div>
                  <span className="font-black text-white text-base block leading-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>{ pageContent?.appName || "ReferX" }</span>
                  <span className="text-xs font-bold bg-gradient-to-r from-amber-400 via-yellow-400 to-yellow-500 bg-clip-text text-transparent">{ pageContent?.appTagline || "Earn by Referring Friends" }</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                {pageContent?.appName || "ReferX"} is a trusted earnings platform by RubiCorn Technologies Private Limited. Founded by Ganesh (GSR) & E. Sai Kumar. Complete simple zero-balance account opening tasks, invite friends, and withdraw your commissions directly to your bank — fast and secure.
              </p>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                  <Shield size={11} /> 100% Safe & Verified
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-full">
                  <Zap size={11} /> Direct Bank Transfers
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full">
                  <Lock size={11} /> Encrypted Data
                </span>
              </div>

              {/* Newsletter */}
              <div>
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                  <Mail size={10} /> Get Earning Alerts
                </h5>
                <form onSubmit={handleSubscribe} className="flex gap-2 max-w-xs">
                  <input
                    type="email"
                    required
                    placeholder="Enter email for updates..."
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/10 transition-all hover:bg-white/[0.05]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl text-white font-extrabold text-xs flex items-center justify-center transition-all active:scale-95 hover:opacity-90 hover:shadow-lg btn-shimmer shrink-0"
                    style={{ background: "linear-gradient(135deg, #FBBF24, #EAB308)" }}
                  >
                    <Send size={13} />
                  </button>
                </form>
                {subscribed && (
                  <p className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1 animate-pulse">
                     Subscribed! You'll get earning updates.
                  </p>
                )}
              </div>
            </div>

            {/* Nav Links */}
            <div className="md:col-span-3">
              <h4 className="text-xs font-bold text-sky-400 mb-5 uppercase tracking-widest flex items-center gap-2">
                <LayoutDashboard size={12} className="text-sky-400" />
                Dashboard Pages
              </h4>
              <ul className="flex flex-col gap-3">
                {navLinks.map(({ label, path, key, icon: Icon, color }) => (
                  <li key={key}>
                    <Link
                      to={path}
                      className={`text-xs flex items-center gap-2.5 group transition-all duration-200 ${
                        activeView === key ? "text-white font-bold" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Icon size={12} className={`${color} shrink-0`} />
                      <span className="footer-link py-0.5">{label}</span>
                      {activeView === key && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div className="md:col-span-4">
              <h4 className="text-xs font-bold text-emerald-400 mb-5 uppercase tracking-widest flex items-center gap-2">
                <Shield size={12} className="text-emerald-400" />
                Policies & Rules
              </h4>
              <ul className="flex flex-col gap-3">
                {legalItems.map((item) => (
                  <li key={item.key}>
                    {item.isLink ? (
                      <Link
                        to={item.path}
                        className="text-xs text-slate-400 hover:text-white text-left transition-all duration-200 group flex items-center gap-2.5 w-full"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.color.replace("text-", "bg-")} shrink-0 opacity-60 group-hover:opacity-100 transition-opacity`} />
                        <span className="footer-link py-0.5">{item.label}</span>
                        <ChevronRight size={11} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ) : (
                      <button
                        className="text-xs text-slate-400 hover:text-white text-left transition-all duration-200 group flex items-center gap-2.5 w-full"
                        onClick={() => setModalType(item.key)}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.color.replace("text-", "bg-")} shrink-0 opacity-60 group-hover:opacity-100 transition-opacity`} />
                        <span className="footer-link py-0.5">{item.label}</span>
                        <ChevronRight size={11} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              {/* Security note */}
              <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-500/10 shadow-inner flex items-start gap-3">
                <span className="text-emerald-400 mt-0.5">🔒</span>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  <span className="font-bold text-slate-200">Secure AES-256 Encryption.</span> Your personal information, Aadhaar card, PAN details, and bank credentials are fully encrypted and never shared with third parties.
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full my-6" style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)" }} />

          {/* Bottom Bar */}
          <div className="flex flex-wrap justify-between items-center gap-3">
            <p className="text-[10px] text-slate-600">
              © {new Date().getFullYear()} {pageContent?.appName || "ReferX"} (RubiCorn Technologies Private Limited). All rights reserved. Made in India 🇮🇳
            </p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[10px] text-slate-600">
                <Lock size={10} /> Secure Platform
              </span>
              <span className="text-slate-700">·</span>
              <span className="text-[10px] text-slate-600">Zero Investment Required</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Policy Modals */}
      {modalType && activeModal && (
        <div className="modal-overlay z-[400]" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Shield size={18} className={activeModal.color} />
                {activeModal.title}
              </h3>
              <button
                className="modal-close"
                onClick={() => setModalType(null)}
              >✕</button>
            </div>

            <div className="flex flex-col gap-4 p-6 overflow-y-auto max-h-[60vh]">
              {activeModal.sections.map((section, i) => (
                <div key={i} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <h4 className="font-bold text-white mb-1.5 text-sm">{section.title}</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">{section.body}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end p-4 pt-0 border-t border-white/5">
              <button
                className="py-2.5 px-6 font-black text-xs rounded-xl transition-all active:scale-95 text-white hover:opacity-90 hover:shadow-lg btn-shimmer"
                style={{ background: "linear-gradient(135deg, #FBBF24, #EAB308)" }}
                onClick={() => setModalType(null)}
              >
                Got It — Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
