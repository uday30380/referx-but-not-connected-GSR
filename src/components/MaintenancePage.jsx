import React, { useState, useEffect } from "react";
import { Mail, MessageSquare, Wrench, Clock, RefreshCw } from "lucide-react";

export default function MaintenancePage({ maintenance }) {
  const {
    title = "Under Maintenance",
    message = "We are currently performing scheduled system updates. Please try again in a few minutes.",
    contactWhatsApp = "+91 8185892753",
    contactEmail = "support@referx.in"
  } = maintenance || {};

  const [dots, setDots] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => setDots(d => d >= 3 ? 1 : d + 1), 600);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #040810 0%, #060B18 60%, #0A0F1E 100%)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", position: "relative", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes maintOrb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-20px) scale(1.08)} }
        @keyframes maintOrb2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-25px,30px) scale(0.93)} }
        @keyframes wrenchWobble { 0%,100%{transform:rotate(-15deg)} 50%{transform:rotate(15deg)} }
        @keyframes ringMaint { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes cardFadeUp { 0%{opacity:0;transform:translateY(20px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes pulseRingMaint {
          0%,100%{box-shadow:0 0 0 0 rgba(234,179,8,0.15)}
          50%{box-shadow:0 0 0 16px rgba(234,179,8,0)}
        }
        @keyframes glowPulseMaint {
          0%,100%{box-shadow:0 0 20px rgba(234,179,8,0.15)}
          50%{box-shadow:0 0 50px rgba(234,179,8,0.5)}
        }
      `}} />

      {/* Ambient orbs */}
      <div style={{ position:"absolute", top:"15%", left:"10%", width:450, height:450, borderRadius:"50%", background:"radial-gradient(circle, rgba(234,179,8,0.07) 0%, transparent 65%)", animation:"maintOrb1 20s ease-in-out infinite alternate", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:"10%", right:"8%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 65%)", animation:"maintOrb2 26s ease-in-out infinite alternate", pointerEvents:"none" }} />
      <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)", backgroundSize:"55px 55px", pointerEvents:"none" }} />

      <div style={{ maxWidth:480, width:"100%", textAlign:"center", position:"relative", zIndex:10, animation:"cardFadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>

        {/* Brand logo */}
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:36 }}>
          <div style={{ width:40, height:40, borderRadius:"10px", background:"linear-gradient(135deg, #FBBF24, #EAB308)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 20px rgba(234,179,8,0.5)" }}>
            <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:900, fontSize:20, color:"#111" }}>R</span>
          </div>
          <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:900, fontSize:26, color:"#fff" }}>Refer<span style={{ color:"#FBBF24" }}>X</span></span>
        </div>

        {/* Animated wrench icon */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", marginBottom:28 }}>
          <div style={{ position:"relative" }}>
            {/* Outer pulse ring */}
            <div style={{ position:"absolute", inset:-12, borderRadius:"50%", border:"2px solid rgba(234,179,8,0.2)", animation:"pulseRingMaint 2.5s ease-in-out infinite" }} />
            {/* Rotating ring */}
            <div style={{ position:"absolute", inset:-6, borderRadius:"50%", border:"1.5px dashed rgba(234,179,8,0.3)", animation:"ringMaint 8s linear infinite" }} />
            {/* Icon bubble */}
            <div style={{ width:88, height:88, borderRadius:"1.5rem", background:"rgba(13,22,45,0.8)", border:"1px solid rgba(234,179,8,0.25)", display:"flex", alignItems:"center", justifyContent:"center", animation:"glowPulseMaint 2.5s ease-in-out infinite", position:"relative", backdropFilter:"blur(16px)" }}>
              <Wrench style={{ width:36, height:36, color:"#FBBF24", animation:"wrenchWobble 2s ease-in-out infinite" }} />
            </div>
          </div>
        </div>

        {/* Text card */}
        <div style={{ background:"rgba(13,22,45,0.5)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"1.75rem", padding:"32px 28px", backdropFilter:"blur(20px)", boxShadow:"0 20px 60px rgba(0,0,0,0.6)" }}>

          {/* Status badge */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.25)", borderRadius:999, padding:"6px 14px", marginBottom:20 }}>
            <Clock size={12} color="#FBBF24" />
            <span style={{ fontSize:11, fontWeight:700, color:"#FBBF24", letterSpacing:"0.1em", textTransform:"uppercase" }}>Scheduled Maintenance</span>
          </div>

          <h1 style={{ fontFamily:"'Outfit',sans-serif", fontWeight:900, fontSize:28, color:"#fff", letterSpacing:"-0.02em", marginBottom:12 }}>
            {title}
          </h1>
          <p style={{ fontSize:14, color:"rgba(148,163,184,0.7)", lineHeight:1.65, marginBottom:24 }}>
            {message}
          </p>

          {/* Animated loading dots */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, marginBottom:28, padding:"12px 0", borderTop:"1px solid rgba(255,255,255,0.06)", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
            <RefreshCw size={14} color="rgba(148,163,184,0.5)" style={{ animation:"ringMaint 2s linear infinite" }} />
            <span style={{ fontSize:12, color:"rgba(148,163,184,0.6)", fontWeight:600, fontFamily:"'JetBrains Mono',monospace" }}>
              System restoring{".".repeat(dots)}
            </span>
          </div>

          {/* Contact buttons */}
          <p style={{ fontSize:11, color:"rgba(100,116,139,0.6)", fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:14 }}>
            Need urgent help?
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {contactWhatsApp && (
              <a href={`https://wa.me/${contactWhatsApp.replace(/\+/g, "").replace(/\s/g, "")}`} target="_blank" rel="noopener noreferrer"
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:"13px 20px", borderRadius:14, background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.25)", color:"#34D399", fontSize:13, fontWeight:700, textDecoration:"none", transition:"all 0.2s ease" }}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(16,185,129,0.14)"; e.currentTarget.style.transform="translateY(-2px)"}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(16,185,129,0.08)"; e.currentTarget.style.transform="translateY(0)"}}>
                <MessageSquare size={16} /> 💬 WhatsApp Support
              </a>
            )}
            {contactEmail && (
              <a href={`mailto:${contactEmail}`}
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:"13px 20px", borderRadius:14, background:"rgba(56,189,248,0.08)", border:"1px solid rgba(56,189,248,0.25)", color:"#7DD3FC", fontSize:13, fontWeight:700, textDecoration:"none", transition:"all 0.2s ease" }}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(56,189,248,0.14)"; e.currentTarget.style.transform="translateY(-2px)"}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(56,189,248,0.08)"; e.currentTarget.style.transform="translateY(0)"}}>
                <Mail size={16} /> 📧 Email Support
              </a>
            )}
          </div>
        </div>

        <p style={{ marginTop:24, fontSize:11, color:"rgba(100,116,139,0.45)", fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase" }}>
          ReferX — India's #1 Affiliate Network
        </p>
      </div>
    </div>
  );
}
