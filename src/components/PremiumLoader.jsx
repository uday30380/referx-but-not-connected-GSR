import React, { useState, useEffect } from "react";

const LETTERS = ["R", "e", "f", "e", "r", "X"];

const STATUS_PHRASES = [
  "Securing your session",
  "Syncing live campaign data",
  "Loading your wallet ledger",
  "Fetching your rank & rewards",
  "Connecting to payment gateways",
  "Verifying KYC credentials",
  "Launching your dashboard"
];

function StarField() {
  const stars = Array.from({ length: 55 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 1.6 + 0.4,
    delay: Math.random() * 4,
    dur: Math.random() * 3 + 2.5,
  }));
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {stars.map(s => (
        <div key={s.id} style={{
          position: "absolute",
          left: `${s.x}%`,
          top: `${s.y}%`,
          width: s.size,
          height: s.size,
          borderRadius: "50%",
          background: "#fff",
          opacity: 0,
          animation: `starTwinkle ${s.dur}s ease-in-out ${s.delay}s infinite alternate`,
        }} />
      ))}
    </div>
  );
}

export default function PremiumLoader({ text = "Loading secure session..." }) {
  const [visibleLetters, setVisibleLetters] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const [progress, setProgress] = useState(6);
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLetters(prev => {
        if (prev >= LETTERS.length) { clearInterval(interval); return prev; }
        return prev + 1;
      });
    }, 170);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setStatusIdx(prev => (prev + 1) % STATUS_PHRASES.length);
    }, 1700);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => prev >= 95 ? 95 : prev + Math.random() * 4.5 + 0.8);
    }, 380);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setDotCount(prev => (prev + 1) % 4);
    }, 420);
    return () => clearInterval(timer);
  }, []);

  const dots = ".".repeat(dotCount);

  return (
    <div style={{
      position: "fixed", inset: 0,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse at 50% 30%, #0B1525 0%, #04080f 60%, #020508 100%)",
      zIndex: 9999, overflow: "hidden", userSelect: "none"
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes starTwinkle { 0%{opacity:0} 100%{opacity:0.7} }
        @keyframes letterDrop {
          0% { opacity: 0; transform: translateY(-32px) scale(0.65); filter: blur(10px); }
          60% { transform: translateY(5px) scale(1.08); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes xPop {
          0% { opacity: 0; transform: scale(0.25) rotate(-18deg); filter: blur(12px); }
          55% { transform: scale(1.35) rotate(5deg); }
          100% { opacity: 1; transform: scale(1) rotate(0); filter: blur(0); }
        }
        @keyframes ringR { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes ringL { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
        @keyframes orbit1 {
          0%{transform:rotate(0deg) translateX(58px) rotate(0deg)}
          100%{transform:rotate(360deg) translateX(58px) rotate(-360deg)}
        }
        @keyframes orbit2 {
          0%{transform:rotate(180deg) translateX(78px) rotate(-180deg)}
          100%{transform:rotate(540deg) translateX(78px) rotate(-540deg)}
        }
        @keyframes orbit3 {
          0%{transform:rotate(90deg) translateX(68px) rotate(-90deg)}
          100%{transform:rotate(450deg) translateX(68px) rotate(-450deg)}
        }
        @keyframes glowPulseLdr {
          0%,100%{box-shadow:0 0 20px rgba(234,179,8,0.18),0 0 60px rgba(234,179,8,0.06)}
          50%{box-shadow:0 0 55px rgba(234,179,8,0.75),0 0 120px rgba(234,179,8,0.3)}
        }
        @keyframes orb1anim { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(50px,-40px) scale(1.12)} }
        @keyframes orb2anim { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-45px,35px) scale(0.88)} }
        @keyframes orb3anim { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,50px) scale(1.05)} }
        @keyframes statusSlide {
          0%{opacity:0;transform:translateY(12px)}
          14%,82%{opacity:1;transform:translateY(0)}
          100%{opacity:0;transform:translateY(-12px)}
        }
        @keyframes shimBarLdr {
          0%{transform:translateX(-200%) skewX(-12deg)}
          100%{transform:translateX(400%) skewX(-12deg)}
        }
        @keyframes progGlowLdr {
          0%,100%{box-shadow:0 0 8px rgba(234,179,8,0.45)}
          50%{box-shadow:0 0 24px rgba(234,179,8,1),0 0 48px rgba(234,179,8,0.35)}
        }
        @keyframes fadeUpLdr { 0%{opacity:0;transform:translateY(12px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes logoShimmer { 0%{transform:translateX(-200%) skewX(-15deg)} 100%{transform:translateX(300%) skewX(-15deg)} }
        @keyframes statusDotPulse { 0%,100%{opacity:0.3;transform:scale(0.7)} 50%{opacity:1;transform:scale(1)} }
        @keyframes gridLineScroll { 0%{transform:translateY(0)} 100%{transform:translateY(60px)} }
      `}} />

      {/* Scrolling grid lines (depth effect) */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.014) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.014) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
        animation: "gridLineScroll 8s linear infinite",
        pointerEvents: "none"
      }} />

      {/* Ambient orbs */}
      <div style={{ position:"absolute", top:"14%", left:"10%", width:520, height:520, borderRadius:"50%", background:"radial-gradient(circle, rgba(234,179,8,0.07) 0%, transparent 70%)", animation:"orb1anim 24s ease-in-out infinite alternate", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:"10%", right:"6%", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle, rgba(129,140,248,0.05) 0%, transparent 70%)", animation:"orb2anim 30s ease-in-out infinite alternate", pointerEvents:"none" }} />
      <div style={{ position:"absolute", top:"55%", left:"55%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(16,185,129,0.035) 0%, transparent 70%)", animation:"orb3anim 18s ease-in-out infinite alternate", pointerEvents:"none" }} />

      {/* Star field */}
      <StarField />

      {/* Ring orbit system */}
      <div style={{ position:"relative", width:178, height:178, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:46 }}>
        {/* Outer ring — dashed gold */}
        <div style={{ position:"absolute", width:162, height:162, borderRadius:"50%", border:"1.5px dashed rgba(234,179,8,0.18)", borderTopColor:"rgba(234,179,8,0.8)", animation:"ringR 9s linear infinite" }} />
        {/* Mid ring — violet */}
        <div style={{ position:"absolute", width:122, height:122, borderRadius:"50%", border:"1.5px solid rgba(129,140,248,0.12)", borderBottomColor:"rgba(129,140,248,0.7)", animation:"ringL 5.5s linear infinite" }} />
        {/* Inner ring — subtle emerald */}
        <div style={{ position:"absolute", width:86, height:86, borderRadius:"50%", border:"1px dotted rgba(16,185,129,0.12)", borderLeftColor:"rgba(16,185,129,0.5)", animation:"ringR 3.8s linear infinite" }} />

        {/* Orbit particles */}
        <div style={{ position:"absolute", top:"50%", left:"50%", width:0, height:0, animation:"orbit1 3.2s linear infinite" }}>
          <div style={{ width:9, height:9, borderRadius:"50%", background:"#FBBF24", boxShadow:"0 0 18px #FBBF24, 0 0 36px rgba(251,191,36,0.55)", marginLeft:4, marginTop:-4 }} />
        </div>
        <div style={{ position:"absolute", top:"50%", left:"50%", width:0, height:0, animation:"orbit2 5s linear infinite" }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:"#818CF8", boxShadow:"0 0 14px #818CF8, 0 0 28px rgba(129,140,248,0.4)", marginLeft:3, marginTop:-3 }} />
        </div>
        <div style={{ position:"absolute", top:"50%", left:"50%", width:0, height:0, animation:"orbit3 4s linear infinite" }}>
          <div style={{ width:5, height:5, borderRadius:"50%", background:"#10B981", boxShadow:"0 0 12px #10B981", marginLeft:2, marginTop:-2 }} />
        </div>

        {/* Center brand box */}
        <div style={{
          width:94, height:94, borderRadius:"1.6rem",
          background:"linear-gradient(145deg, #0E1929 0%, #060D1A 100%)",
          border:"1px solid rgba(234,179,8,0.38)",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          overflow:"hidden", animation:"glowPulseLdr 2.8s ease-in-out infinite",
          position:"relative"
        }}>
          <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:900, fontSize:10, color:"rgba(255,255,255,0.35)", letterSpacing:"0.2em", textTransform:"uppercase", lineHeight:1 }}>Refer</span>
          <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:900, fontSize:40, color:"#FBBF24", lineHeight:1.08, letterSpacing:"-0.03em" }}>X</span>
          {/* Shimmer sweep */}
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)", animation:"logoShimmer 3s ease-in-out 1.5s infinite" }} />
        </div>
      </div>

      {/* Animated brand name letters — "ReferX" */}
      <div style={{ display:"flex", alignItems:"flex-end", gap:1, height:60, marginBottom:12 }}>
        {LETTERS.map((letter, i) => {
          const isX = letter === "X";
          const visible = i < visibleLetters;
          return (
            <span key={i} style={{
              opacity: visible ? 1 : 0,
              fontFamily:"'Outfit',sans-serif",
              fontWeight: 900,
              fontSize: isX ? 54 : 44,
              color: isX ? "#FBBF24" : "#FFFFFF",
              lineHeight: 1,
              letterSpacing: "-0.03em",
              textShadow: isX
                ? "0 0 32px rgba(251,191,36,0.95), 0 0 80px rgba(251,191,36,0.4)"
                : "0 2px 24px rgba(255,255,255,0.08)",
              animation: visible
                ? (isX
                  ? `xPop 0.65s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.17}s both`
                  : `letterDrop 0.52s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.17}s both`)
                : "none",
              display: "inline-block"
            }}>{letter}</span>
          );
        })}
      </div>

      {/* Tagline */}
      <p style={{
        fontSize: 10, fontWeight: 700,
        color: "rgba(148,163,184,0.55)",
        letterSpacing: "0.24em", textTransform: "uppercase",
        marginBottom: 36,
        animation: "fadeUpLdr 0.8s ease-out 1.3s both"
      }}>
        India's #1 Affiliate Network
      </p>

      {/* Status phrase — no emoji, professional style */}
      <div style={{ height:28, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:22, minWidth:300 }}>
        <div key={statusIdx} style={{ display:"flex", alignItems:"center", gap:8, animation:"statusSlide 1.7s ease-in-out" }}>
          {/* Animated status dot — SVG style */}
          <svg width="8" height="8" viewBox="0 0 8 8" style={{ animation:"statusDotPulse 0.85s ease-in-out infinite", flexShrink:0 }}>
            <circle cx="4" cy="4" r="4" fill="#FBBF24" />
          </svg>
          <p style={{
            fontSize: 12, fontWeight: 600,
            color: "rgba(203,213,225,0.85)",
            fontFamily: "'JetBrains Mono',monospace",
            letterSpacing: "0.04em",
            textAlign: "center"
          }}>
            {STATUS_PHRASES[statusIdx]}{dots}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width:240, marginBottom:10 }}>
        <div style={{ width:"100%", height:3, background:"rgba(255,255,255,0.05)", borderRadius:99, overflow:"hidden", position:"relative" }}>
          <div style={{
            position:"absolute", top:0, left:0, height:"100%",
            width:`${Math.min(progress, 95)}%`,
            background:"linear-gradient(90deg, #FBBF24 0%, #F59E0B 60%, #FBBF24 100%)",
            backgroundSize:"200% 100%",
            borderRadius:99,
            transition:"width 0.4s ease",
            animation:"progGlowLdr 1.5s ease-in-out infinite, shimBarLdr 2.2s ease-in-out infinite"
          }} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
          <p style={{ fontSize:9, color:"rgba(100,116,139,0.5)", fontFamily:"'JetBrains Mono',monospace", letterSpacing:"0.1em" }}>
            {Math.round(Math.min(progress, 95))}%
          </p>
          <p style={{ fontSize:9, color:"rgba(100,116,139,0.45)", fontFamily:"'JetBrains Mono',monospace", letterSpacing:"0.1em" }}>
            Initializing...
          </p>
        </div>
      </div>
    </div>
  );
}
