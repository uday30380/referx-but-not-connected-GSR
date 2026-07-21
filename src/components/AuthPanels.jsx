import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck, Users, Zap, TrendingUp, ArrowLeft, Star,
  Wallet, Clock, BadgeCheck, Award, ChevronRight, Lock
} from "lucide-react";

const TRUST_STATS = [
  {
    icon: <Wallet size={18} strokeWidth={2} />,
    value: "₹128 Cr+",
    label: "Total Paid Out"
  },
  {
    icon: <Users size={18} strokeWidth={2} />,
    value: "12,400+",
    label: "Active Affiliates"
  },
  {
    icon: <BadgeCheck size={18} strokeWidth={2} />,
    value: "100%",
    label: "Brand Verified"
  },
  {
    icon: <Zap size={18} strokeWidth={2} />,
    value: "< 24hr",
    label: "UPI Payout Speed"
  }
];

const BRANDS = [
  { name: "Angel One", color: "#F97316", letter: "A" },
  { name: "Upstox", color: "#8B5CF6", letter: "U" },
  { name: "Groww", color: "#10B981", letter: "G" },
  { name: "HDFC", color: "#3B82F6", letter: "H" },
  { name: "Kotak", color: "#EF4444", letter: "K" }
];

export default function AuthPanels({ onLogin, onRegister, onGoogleLogin, onGoogleLoginWithNavigate, onBackToHome, adminMode = false }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", mobile: "", referralCode: "", photoUrl: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) { errs.email = "Email is required"; }
    else if (!/\S+@\S+\.\S+/.test(formData.email)) { errs.email = "Enter a valid email address"; }
    if (!formData.password) { errs.password = "Password is required"; }
    else if (formData.password.length < 6) { errs.password = "Password must be at least 6 characters"; }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await onLogin(formData.email, formData.password, adminMode ? "admin" : "user");
    } catch (err) {
      setErrors({ form: err.message || "Authentication failed. Try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 30% 20%, #0D1A2E 0%, #060B18 55%, #040810 100%)",
      display: "flex", overflow: "hidden", position: "relative"
    }}>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Outfit:wght@700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');

        @keyframes authOrb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(35px,-28px) scale(1.09)} }
        @keyframes authOrb2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-28px,38px) scale(0.92)} }
        @keyframes authOrb3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,25px)} }
        @keyframes xGlowAuth {
          0%,100%{filter:drop-shadow(0 0 4px rgba(251,191,36,0.35))}
          50%{filter:drop-shadow(0 0 20px rgba(251,191,36,1))}
        }
        @keyframes formEntrance {
          0%{opacity:0;transform:translateY(22px)}
          100%{opacity:1;transform:translateY(0)}
        }
        @keyframes statFadeUp {
          0%{opacity:0;transform:translateY(14px)}
          100%{opacity:1;transform:translateY(0)}
        }
        @keyframes panelSlideIn {
          0%{opacity:0;transform:translateX(44px)}
          100%{opacity:1;transform:translateX(0)}
        }
        @keyframes gradBorderRotate {
          0%{background-position:0% 50%}
          50%{background-position:100% 50%}
          100%{background-position:0% 50%}
        }
        @keyframes ringSpinAuth { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes gridScroll { 0%{transform:translateY(0)} 100%{transform:translateY(55px)} }

        .auth-input {
          width:100%;
          background:rgba(255,255,255,0.035);
          border:1px solid rgba(255,255,255,0.09);
          border-radius:14px;
          padding:14px 16px;
          color:#fff;
          font-size:14px;
          font-weight:500;
          outline:none;
          transition:all 0.22s ease;
          font-family:'Plus Jakarta Sans',sans-serif;
          box-sizing:border-box;
        }
        .auth-input::placeholder { color:rgba(148,163,184,0.38); }
        .auth-input:focus {
          border-color:rgba(251,191,36,0.48);
          background:rgba(255,255,255,0.055);
          box-shadow:0 0 0 3px rgba(251,191,36,0.07);
        }

        .btn-google-auth {
          width:100%;
          background:#ffffff;
          border:1px solid rgba(0,0,0,0.08);
          border-radius:14px;
          padding:14px 20px;
          color:#1a1a1a;
          font-size:14px;
          font-weight:700;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:12px;
          transition:all 0.28s cubic-bezier(0.16,1,0.3,1);
          box-shadow:0 2px 14px rgba(0,0,0,0.28);
          font-family:'Plus Jakarta Sans',sans-serif;
          position:relative;
          overflow:hidden;
        }
        .btn-google-auth:hover {
          transform:translateY(-2px) scale(1.01);
          box-shadow:0 10px 28px rgba(0,0,0,0.38);
        }
        .btn-google-auth::before {
          content:'';
          position:absolute;
          top:0;left:-100%;
          width:60%;height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.38),transparent);
          transform:skewX(-20deg);
          transition:left 0.7s cubic-bezier(0.16,1,0.3,1);
        }
        .btn-google-auth:hover::before { left:150%; }

        .btn-submit-auth {
          width:100%;
          background:linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #EAB308 100%);
          border:none;
          border-radius:14px;
          padding:14px 20px;
          color:#111;
          font-size:14px;
          font-weight:800;
          cursor:pointer;
          transition:all 0.28s cubic-bezier(0.16,1,0.3,1);
          box-shadow:0 4px 22px rgba(234,179,8,0.32);
          font-family:'Plus Jakarta Sans',sans-serif;
          position:relative;
          overflow:hidden;
          letter-spacing:0.01em;
        }
        .btn-submit-auth:hover {
          transform:translateY(-2px) scale(1.01);
          box-shadow:0 10px 32px rgba(234,179,8,0.52);
        }
        .btn-submit-auth:active { transform:scale(0.98); }
        .btn-submit-auth::after {
          content:'';
          position:absolute;
          inset:0;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent);
          transform:translateX(-100%);
          transition:transform 0.6s ease;
        }
        .btn-submit-auth:hover::after { transform:translateX(100%); }

        .trust-stat-card {
          background:rgba(255,255,255,0.035);
          border:1px solid rgba(255,255,255,0.07);
          border-radius:16px;
          padding:16px 18px;
          transition:all 0.22s ease;
        }
        .trust-stat-card:hover {
          background:rgba(255,255,255,0.055);
          border-color:rgba(251,191,36,0.18);
        }
      `}} />

      {/* Grid overlay */}
      <div style={{
        position:"absolute", inset:0,
        backgroundImage:"linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)",
        backgroundSize:"55px 55px",
        animation:"gridScroll 10s linear infinite",
        pointerEvents:"none"
      }} />

      {/* Ambient orbs */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"8%", left:"4%", width:560, height:560, borderRadius:"50%", background:"radial-gradient(circle, rgba(234,179,8,0.065) 0%, transparent 65%)", animation:"authOrb1 26s ease-in-out infinite alternate" }} />
        <div style={{ position:"absolute", bottom:"4%", right:"32%", width:640, height:640, borderRadius:"50%", background:"radial-gradient(circle, rgba(129,140,248,0.05) 0%, transparent 65%)", animation:"authOrb2 32s ease-in-out infinite alternate" }} />
        <div style={{ position:"absolute", top:"50%", left:"50%", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle, rgba(16,185,129,0.03) 0%, transparent 70%)", animation:"authOrb3 20s ease-in-out infinite alternate" }} />
      </div>

      {/* LEFT PANEL — Brand Visual */}
      {!adminMode && (
        <div style={{ flex:1, flexDirection:"column", justifyContent:"center", padding:"52px 60px", position:"relative", minWidth:0 }} className="hidden lg:flex">
          
          {/* Back button */}
          <button
            onClick={onBackToHome}
            style={{ display:"inline-flex", alignItems:"center", gap:8, color:"rgba(148,163,184,0.65)", fontSize:13, fontWeight:600, background:"none", border:"none", cursor:"pointer", marginBottom:52, width:"fit-content", transition:"color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.color="#fff"}
            onMouseLeave={e => e.currentTarget.style.color="rgba(148,163,184,0.65)"}
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>

          {/* Brand name */}
          <div style={{ marginBottom:36 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
              <div style={{
                width:48, height:48, borderRadius:"14px",
                background:"linear-gradient(135deg, #FBBF24 0%, #EAB308 100%)",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 0 28px rgba(234,179,8,0.5)"
              }}>
                <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:900, fontSize:24, color:"#111" }}>R</span>
              </div>
              <div style={{ display:"flex", alignItems:"center" }}>
                <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:900, fontSize:34, color:"#fff", letterSpacing:"-0.02em" }}>Refer</span>
                <span style={{
                  fontFamily:"'Outfit',sans-serif", fontWeight:900, fontSize:34, color:"#FBBF24",
                  letterSpacing:"-0.02em",
                  filter:"drop-shadow(0 0 14px rgba(251,191,36,0.7))",
                  animation:"xGlowAuth 2.8s ease-in-out infinite"
                }}>X</span>
              </div>
            </div>
            <h2 style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:40, color:"#fff", lineHeight:1.2, letterSpacing:"-0.02em", marginBottom:14 }}>
              Turn your network into<br/>
              <span style={{ background:"linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                monthly income.
              </span>
            </h2>
            <p style={{ fontSize:15, color:"rgba(148,163,184,0.72)", lineHeight:1.65, maxWidth:400 }}>
              Promote India's top finance brands, earn milestone payouts, and withdraw to UPI instantly.
            </p>
          </div>

          {/* Trust stats grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:38, maxWidth:420 }}>
            {TRUST_STATS.map((stat, i) => (
              <div key={i} className="trust-stat-card" style={{ animation:`statFadeUp 0.6s ease-out ${0.8 + i * 0.1}s both` }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <div style={{ color:"#FBBF24" }}>{stat.icon}</div>
                </div>
                <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:22, color:"#FBBF24", letterSpacing:"-0.01em" }}>{stat.value}</div>
                <div style={{ fontSize:11, color:"rgba(148,163,184,0.58)", fontWeight:600, marginTop:3 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Partner brands */}
          <div>
            <p style={{ fontSize:10, color:"rgba(100,116,139,0.6)", fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:12 }}>Partnered Brands</p>
            <div style={{ display:"flex", gap:10 }}>
              {BRANDS.map((brand, i) => (
                <div key={i} title={brand.name} style={{
                  width:38, height:38, borderRadius:11,
                  background:`${brand.color}1A`,
                  border:`1px solid ${brand.color}45`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontWeight:900, fontSize:15, color:brand.color,
                  cursor:"default", transition:"all 0.2s ease"
                }}>
                  {brand.letter}
                </div>
              ))}
            </div>
          </div>

          {/* Star rating */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:32 }}>
            <div style={{ display:"flex", gap:2 }}>
              {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#FBBF24" color="#FBBF24" />)}
            </div>
            <span style={{ fontSize:12, color:"rgba(148,163,184,0.58)", fontWeight:600 }}>4.9/5 · Rated by 12,000+ affiliates</span>
          </div>

          {/* Bottom decoration line */}
          <div style={{ position:"absolute", bottom:0, left:60, right:60, height:1, background:"linear-gradient(90deg, transparent, rgba(234,179,8,0.15), transparent)" }} />
        </div>
      )}

      {/* RIGHT PANEL — Auth Form */}
      <div className={adminMode ? "w-full px-6 py-11 lg:px-11" : "w-full px-6 py-11 lg:px-11 lg:min-w-[440px] lg:max-w-[520px]"} style={{
        width: adminMode ? "100%" : undefined,
        display:"flex", flexDirection:"column", justifyContent:"center",
        background:"rgba(4,8,15,0.72)",
        backdropFilter:"blur(28px)",
        WebkitBackdropFilter:"blur(28px)",
        borderLeft: adminMode ? "none" : "1px solid rgba(255,255,255,0.05)",
        position:"relative",
        animation:"panelSlideIn 0.55s cubic-bezier(0.16,1,0.3,1) both"
      }}>

        {/* Subtle top border glow */}
        <div style={{ position:"absolute", top:0, left:"10%", right:"10%", height:1, background:"linear-gradient(90deg, transparent, rgba(234,179,8,0.3), transparent)", pointerEvents:"none" }} />

        {/* Mobile back button */}
        <button
          onClick={onBackToHome}
          style={{ display:"inline-flex", alignItems:"center", gap:8, color:"rgba(148,163,184,0.6)", fontSize:13, fontWeight:600, background:"none", border:"none", cursor:"pointer", marginBottom:32, width:"fit-content" }}
          className="lg:hidden"
        >
          <ArrowLeft size={15} /> Home
        </button>

        {/* Header */}
        <div style={{ marginBottom:34, animation:"formEntrance 0.6s ease-out 0.2s both" }}>
          {adminMode && (
            <div style={{ display:"flex", justifyContent:"center", marginBottom:26 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:42, height:42, borderRadius:"11px", background:"linear-gradient(135deg, #FBBF24, #EAB308)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 22px rgba(234,179,8,0.42)" }}>
                  <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:900, fontSize:21, color:"#111" }}>R</span>
                </div>
                <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:900, fontSize:28, color:"#fff" }}>
                  Refer<span style={{ color:"#FBBF24" }}>X</span>
                </span>
              </div>
            </div>
          )}

          {/* Status badge */}
          <div style={{
            display:"inline-flex", alignItems:"center", gap:8,
            background: adminMode ? "rgba(239,68,68,0.08)" : "rgba(251,191,36,0.07)",
            border: adminMode ? "1px solid rgba(239,68,68,0.18)" : "1px solid rgba(251,191,36,0.18)",
            borderRadius:99, padding:"6px 14px", marginBottom:18
          }}>
            {/* Status dot — SVG, no emoji */}
            <svg width="7" height="7" viewBox="0 0 7 7">
              <circle cx="3.5" cy="3.5" r="3.5" fill={adminMode ? "#EF4444" : "#22C55E"} />
            </svg>
            <span style={{ fontSize:11, fontWeight:700, color: adminMode ? "#EF4444" : "#FBBF24", letterSpacing:"0.12em", textTransform:"uppercase" }}>
              {adminMode ? "Admin Secure Node" : "Affiliate Login"}
            </span>
          </div>

          <h3 style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:30, color:"#fff", letterSpacing:"-0.02em", marginBottom:8 }}>
            {adminMode ? "Admin Authorization" : "Welcome back"}
          </h3>
          <p style={{ fontSize:13, color:"rgba(148,163,184,0.62)", lineHeight:1.6 }}>
            {adminMode
              ? "Sign in with your corporate admin credentials to access the control panel."
              : "Sign in with Google to open your dashboard and check your earnings."}
          </p>
        </div>

        {/* Error message */}
        {errors.form && (
          <div style={{
            background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.22)",
            borderRadius:12, padding:"12px 16px", marginBottom:20,
            fontSize:13, color:"#FCA5A5", fontWeight:600,
            display:"flex", alignItems:"center", gap:8
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="#EF4444" strokeWidth="1.5"/>
              <path d="M8 4.5v4M8 10.5v1" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {errors.form}
          </div>
        )}

        {/* Form content */}
        <div style={{ animation:"formEntrance 0.6s ease-out 0.35s both" }}>
          {adminMode ? (
            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:18 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:"rgba(148,163,184,0.78)", display:"block", marginBottom:8, letterSpacing:"0.05em" }}>Corporate Email</label>
                <input type="email" className="auth-input" placeholder="admin@company.com" value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })} />
                {errors.email && <span style={{ fontSize:11, color:"#FCA5A5", fontWeight:600, marginTop:5, display:"block" }}>{errors.email}</span>}
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:"rgba(148,163,184,0.78)", display:"block", marginBottom:8, letterSpacing:"0.05em" }}>Security Password</label>
                <input type="password" className="auth-input" placeholder="••••••••" value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })} />
                {errors.password && <span style={{ fontSize:11, color:"#FCA5A5", fontWeight:600, marginTop:5, display:"block" }}>{errors.password}</span>}
              </div>
              <button type="submit" className="btn-submit-auth" disabled={isLoading} style={{ marginTop:8 }}>
                {isLoading ? "Authorizing..." : "Access Admin Panel →"}
              </button>
            </form>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
              {isGoogleLoading ? (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:18, padding:"36px 0" }}>
                  <div style={{ width:56, height:56, position:"relative" }}>
                    <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"3px solid rgba(255,255,255,0.07)" }} />
                    <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"3px solid transparent", borderTopColor:"#FBBF24", animation:"ringSpinAuth 0.8s linear infinite" }} />
                    <div style={{ position:"absolute", inset:9, background:"rgba(251,191,36,0.08)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {/* Google G mark */}
                      <svg width="16" height="16" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h5.6c-.28 1.5-1.1 2.8-2 2.6l3.1 2.4c1.8-1.7 2.9-4.2 2.9-7.3z"/>
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.9l-3.1-2.4c-.9.6-2 .97-3.23.97-2.45 0-4.52-1.66-5.27-3.9H.18v2.48C2.16 22 5.85 24 10 24z"/>
                        <path fill="#FBBC05" d="M4.73 14.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V8.72H.18C-.57 10.2-1 12-1 13.8s.43 3.6 1.18 5.08l3.55-2.73-.28-1.35z"/>
                        <path fill="#EA4335" d="M10 4.75c1.77 0 3.35.6 4.6 1.8l3.4-3.4C15.9 1.18 13.22 0 10 0 5.85 0 2.16 2 .18 5.92l3.55 2.73c.75-2.24 2.82-3.9 5.27-3.9z"/>
                      </svg>
                    </div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <p style={{ fontWeight:700, color:"#fff", fontSize:14, marginBottom:5 }}>Signing in with Google...</p>
                    <p style={{ fontSize:12, color:"rgba(148,163,184,0.5)" }}>Opening your dashboard</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Google CTA */}
                  <button className="btn-google-auth" onClick={async () => {
                    setIsGoogleLoading(true);
                    try {
                      const loginFn = onGoogleLoginWithNavigate || onGoogleLogin;
                      await loginFn(navigate);
                    } catch (err) {
                      console.error("Google login failed:", err);
                    } finally {
                      setIsGoogleLoading(false);
                    }
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.28 1.5-1.1 2.8-2 2.6l3.1 2.4c1.8-1.7 2.9-4.2 2.9-7.3z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.9l-3.1-2.4c-.9.6-2 .97-3.23.97-2.45 0-4.52-1.66-5.27-3.9H2.18v2.48C4.16 22 7.85 24 12 24z"/>
                      <path fill="#FBBC05" d="M6.73 14.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V8.72H2.18C1.43 10.2 1 12 1 13.8s.43 3.6 1.18 5.08l3.55-2.73-.28-1.35z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.6 4.6 1.8l3.4-3.4C17.9 1.18 15.22 0 12 0 7.85 0 4.16 2 2.18 5.92l3.55 2.73c.75-2.24 2.82-3.9 5.27-3.9z"/>
                    </svg>
                    Continue with Google — Free to Join
                    <ChevronRight size={16} />
                  </button>

                  {/* Divider */}
                  <div style={{ position:"relative", display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.06)" }} />
                    <span style={{ fontSize:11, color:"rgba(100,116,139,0.55)", fontWeight:600, whiteSpace:"nowrap" }}>Secured by Firebase Auth</span>
                    <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.06)" }} />
                  </div>

                  {/* Trust badges — SVG icon based */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                    {[
                      { icon: <Lock size={11} />, label: "SSL Encrypted" },
                      { icon: <BadgeCheck size={11} />, label: "KYC Verified" },
                      { icon: <Zap size={11} />, label: "Instant Access" }
                    ].map((badge, i) => (
                      <div key={i} style={{
                        background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)",
                        borderRadius:10, padding:"9px 10px",
                        fontSize:10, color:"rgba(148,163,184,0.6)", fontWeight:600,
                        textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:5
                      }}>
                        <div style={{ color:"rgba(251,191,36,0.7)" }}>{badge.icon}</div>
                        {badge.label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Back link */}
        <div style={{ textAlign:"center", marginTop:30 }}>
          <button
            onClick={onBackToHome}
            style={{ fontSize:12, color:"rgba(100,116,139,0.58)", fontWeight:600, background:"none", border:"none", cursor:"pointer", transition:"color 0.2s", display:"inline-flex", alignItems:"center", gap:5 }}
            onMouseEnter={e => e.currentTarget.style.color="rgba(148,163,184,0.9)"}
            onMouseLeave={e => e.currentTarget.style.color="rgba(100,116,139,0.58)"}
          >
            <ArrowLeft size={12} />
            Back to Homepage
          </button>
        </div>

        {/* Bottom decoration */}
        <div style={{ position:"absolute", bottom:0, left:"10%", right:"10%", height:1, background:"linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)", pointerEvents:"none" }} />
      </div>
    </div>
  );
}
