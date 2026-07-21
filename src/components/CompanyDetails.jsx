import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowUpRight, ArrowLeft } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

export default function CompanyDetails({ user }) {
  const navigate = useNavigate();

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-8 animate-fade-in">
      
      {/* Back Button */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-bold text-xs transition duration-200 active:scale-95"
        >
          <ArrowLeft size={14} />
          Go Back
        </button>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          Corporate Verification
        </span>
      </div>

      <div className="grid lg:grid-cols-12 gap-12 items-center">
        {/* Left Side: Information */}
        <ScrollReveal direction="left" className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg">
              <ShieldCheck size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">
                MCA Verified Entity
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight mt-0.5">
                Corporate Transparency
              </h2>
            </div>
          </div>
          
          <p className="text-slate-400 text-sm leading-relaxed">
            RubiCorn Technologies Private Limited is registered under the official Ministry of Corporate Affairs (MCA) registry of the Government of India. Our active registry status ensures complete corporate compliance, prompt commission payouts, and legal safety for all multi-level affiliate promoter networks.
          </p>

          <div className="space-y-3.5">
            {/* Registered Name Card */}
            <div className="flex justify-between items-center p-5 bg-[#0D1526]/50 border border-white/[0.06] rounded-2xl transition hover:border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-emerald-400">✦</span>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Registered Name</span>
              </div>
              <span className="text-sm font-extrabold text-white text-right ml-4">
                RubiCorn Technologies Private Limited
              </span>
            </div>

            {/* Registration / CIN Card */}
            <div className="flex justify-between items-center p-5 bg-[#0D1526]/50 border border-white/[0.06] rounded-2xl transition hover:border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-yellow-400">✦</span>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Registration / CIN</span>
              </div>
              <span className="text-sm font-mono font-extrabold text-yellow-400 text-right ml-4">
                U62011AP2025PTC123113
              </span>
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
              <span className="text-sm font-extrabold text-white text-right ml-4">
                Ganesh (GSR) & E. Sai Kumar
              </span>
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

    </div>
  );
}
