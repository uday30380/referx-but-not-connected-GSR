import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Award,
  Users,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Clock,
  ShieldAlert,
  ExternalLink,
} from "lucide-react";
import { doc, getDoc, collection, query, where, getDocs, limit, updateDoc, addDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function ReferralLanding({
  user,
  profileData,
  campaigns,
  setView,
  showToast,
  onNavigateToAuth
}) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [referrerProfile, setReferrerProfile] = useState(null);
  const [referrerStats, setReferrerStats] = useState({ completedTasks: 0, totalReferrals: 0, successfulReferrals: 0 });
  const [friendSignups, setFriendSignups] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [joiningLoading, setJoiningLoading] = useState(false);

  // Read params
  const campaignId = searchParams.get("campaign") || "";
  const refCodeParam = searchParams.get("ref") || "";
  const refByUidParam = searchParams.get("refBy") || "";

  const featuredCampaign =
    campaigns.find((c) => c.id.toLowerCase() === campaignId.toLowerCase()) || campaigns[0];

  // Check if the current logged-in user is already in this campaign
  useEffect(() => {
    if (!user || !featuredCampaign) {
      setAlreadyJoined(false);
      return;
    }
    const joined = profileData?.joinedCampaigns || {};
    const campaignEntry = joined[featuredCampaign.id];
    // "Already Joined" means they have ANY status: In Progress, Submitted, or Approved
    if (campaignEntry && campaignEntry.status) {
      setAlreadyJoined(true);
    } else {
      setAlreadyJoined(false);
    }
  }, [user, profileData, featuredCampaign]);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingStats(true);
      try {
        let referrerUid = refByUidParam;
        
        // If refCodeParam exists, lookup user by referralCode in Firestore
        if (refCodeParam) {
          const userQuery = query(
            collection(db, "users"),
            where("referralCode", "==", refCodeParam),
            limit(1)
          );
          const snap = await getDocs(userQuery);
          if (!snap.empty) {
            referrerUid = snap.docs[0].id;
          }
        }

        if (!referrerUid) {
          setLoadingStats(false);
          return;
        }

        // Fetch profile
        const referrerRef = doc(db, "users", referrerUid);
        const docSnap = await getDoc(referrerRef);
        let completedCount = 0;
        let profileName = "A ReferX Member";
        let profilePhoto = "";

        if (docSnap.exists()) {
          const data = docSnap.data();
          profileName = data.name || profileName;
          profilePhoto = data.photoURL || "";
          if (data.joinedCampaigns) {
            completedCount = Object.values(data.joinedCampaigns).filter(
              (c) => c.status === "Approved"
            ).length;
          }
          setReferrerProfile({ uid: referrerUid, name: profileName, photoURL: profilePhoto, email: data.email || "", referralCode: data.referralCode || "" });
          
          // Store referral sponsor context in localStorage for register process
          localStorage.setItem("referx_referral_context", JSON.stringify({
            referrerUid,
            referrerName: profileName,
            referralCode: data.referralCode || refCodeParam,
            campaignId: campaignId
          }));
        } else {
          setReferrerProfile({ uid: referrerUid, name: "Premium Member", photoURL: "", email: "", referralCode: "" });
        }

        // Fetch referrer stats
        const q = query(collection(db, "referrals"), where("referrerUid", "==", referrerUid));
        const qSnap = await getDocs(q);
        const refsList = [];
        qSnap.forEach((doc) => refsList.push(doc.data()));

        const approvedCount = refsList.filter((r) => r.status === "approved").length;
        setReferrerStats({ completedTasks: completedCount, totalReferrals: refsList.length, successfulReferrals: approvedCount });

        setFriendSignups(
          refsList
            .map((r) => ({
              name: r.refereeName || "Verified Referee",
              email: r.refereeEmail ? `${r.refereeEmail.split("@")[0].substring(0, 3)}***@gmail.com` : "friend***@gmail.com",
              campaignName: r.campaignName || "KYC Campaign",
              status: r.status || "pending",
            }))
            .slice(0, 8)
        );
      } catch (err) {
        console.error("Error loading referrer data:", err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchData();
  }, [refCodeParam, refByUidParam, campaignId]);

  const handleCtaAction = async () => {
    if (!referrerProfile) {
      showToast("Invalid recruiter node.", "danger");
      return;
    }

    // If already joined — navigate to campaigns page directly
    if (alreadyJoined && user) {
      showToast("You are already part of this campaign! Redirecting to your campaign page.", "info");
      navigate('/campaigns');
      return;
    }

    if (user) {
      if (featuredCampaign) {
        setJoiningLoading(true);
        showToast(`Joining campaign and opening ${featuredCampaign.name} tracking...`, "success");
        try {
          // Auto-register campaign if not already in progress
          const userDocRef = doc(db, "users", user.uid);
          const currentJoined = profileData?.joinedCampaigns || {};
          
          if (!currentJoined[featuredCampaign.id]) {
            const updatedJoined = {
              ...currentJoined,
              [featuredCampaign.id]: {
                status: "In Progress",
                joinedAt: new Date().toISOString(),
                completedSteps: [],
                registeredDetails: {
                  name: profileData?.name || user.displayName || "Promoter",
                  mobile: profileData?.mobile || "",
                  bankAccountName: profileData?.bankAccountName || "",
                  bankName: profileData?.bankName || "",
                  bankAccountNumber: profileData?.bankAccountNumber || "",
                  bankIfscCode: profileData?.bankIfscCode || ""
                }
              }
            };
            
            await updateDoc(userDocRef, {
              joinedCampaigns: updatedJoined
            });
          }

          // Create / update referral document showing invite clicked, joined group, and level 1
          const q = query(
            collection(db, "referrals"),
            where("referrerUid", "==", referrerProfile.uid),
            where("refereeUid", "==", user.uid),
            where("campaignId", "==", featuredCampaign.id)
          );
          const snap = await getDocs(q);
          if (snap.empty) {
            await addDoc(collection(db, "referrals"), {
              referrerUid: referrerProfile.uid,
              refereeUid: user.uid,
              refereeName: profileData?.name || user.displayName || "Promoter",
              refereeEmail: user.email,
              campaignId: featuredCampaign.id,
              campaignName: featuredCampaign.name,
              rewardAmount: 100,
              inviteClicked: "ok",
              joinedGroup: "ok",
              level: 1,
              status: "pending",
              createdAt: new Date().toISOString()
            });
          } else {
            const refDocRef = doc(db, "referrals", snap.docs[0].id);
            await updateDoc(refDocRef, {
              inviteClicked: "ok",
              joinedGroup: "ok"
            });
          }

          // Open campaign tracking link
          const trackingUrl = `${window.location.origin}/#/gateway?action=click&campaignId=${featuredCampaign.id}&userId=${user.uid}`;
          window.open(trackingUrl, "_blank");

          // Set already joined state
          setAlreadyJoined(true);
        } catch (err) {
          console.error("Failed to auto-register campaign:", err);
          navigate('/campaigns');
        } finally {
          setJoiningLoading(false);
        }
      } else {
        navigate("/campaigns");
      }
    } else {
      // Store context for auto-joining after registration
      localStorage.setItem("referx_referral_context", JSON.stringify({
        referrerUid: referrerProfile.uid,
        referrerName: referrerProfile.name,
        referralCode: referrerProfile.referralCode || refCodeParam,
        campaignId: featuredCampaign.id,
        autoJoinGroup: true,
        inviteClicked: "ok"
      }));

      // Redirect to Auth page
      if (onNavigateToAuth) {
        onNavigateToAuth();
      } else {
        navigate("/login");
      }
    }
  };

  if ((!refCodeParam && !refByUidParam) || !featuredCampaign) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto gap-4 text-slate-100">
        <ShieldAlert size={52} className="text-red-400 animate-bounce" />
        <h3 className="text-xl font-bold text-white">Invalid Referral Link</h3>
        <p className="text-slate-400 text-xs md:text-sm">
          This link is not complete. Please ask your friend to send the invite link again.
        </p>
        <button className="py-2.5 px-6 rounded-xl bg-gold-gradient text-luxury-dark font-black text-xs shadow-gold-glow mt-4" onClick={() => setView("homepage")}>
          Go to Homepage
        </button>
      </div>
    );
  }

  const badgeClass = (status) => {
    const map = { 
      approved: "bg-emerald-950 border-emerald-800 text-emerald-300", 
      rejected: "bg-red-950 border-red-800 text-red-300", 
      pending: "bg-amber-950 border-amber-800 text-amber-300" 
    };
    return `inline-flex px-2 py-0.5 rounded-full border text-[9px] font-bold ${map[status] || "bg-slate-900 border-slate-700 text-slate-400"}`;
  };

  // Get the current campaign status label for the "already joined" banner
  const currentCampStatus = profileData?.joinedCampaigns?.[featuredCampaign?.id]?.status || "";

  const statusLabel = {
    "In Progress": { label: "In Progress — Complete your task steps", color: "text-amber-400", bg: "bg-amber-950/40 border-amber-800" },
    "Submitted": { label: "Submitted — Waiting to be checked", color: "text-blue-400", bg: "bg-blue-950/40 border-blue-800" },
    "Approved": { label: "Approved ✓ — Checked & Reward Earned!", color: "text-emerald-400", bg: "bg-emerald-950/40 border-emerald-800" },
    "Rejected": { label: "Rejected — Please talk to support", color: "text-red-400", bg: "bg-red-950/40 border-red-800" },
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-slate-100 max-w-5xl mx-auto">
      
      {/* ===== ALREADY JOINED BANNER ===== */}
      {alreadyJoined && user && (
        <div className="rounded-3xl border border-emerald-700/50 bg-emerald-950/30 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-600/5 pointer-events-none rounded-3xl" />
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-600/40 flex items-center justify-center shrink-0">
            <CheckCircle2 size={26} className="text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-extrabold text-emerald-300">You've Already Joined! 🎉</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              You are already registered for <strong className="text-white">{featuredCampaign.name}</strong>.{" "}
              {currentCampStatus && statusLabel[currentCampStatus] && (
                <span className={`font-semibold ${statusLabel[currentCampStatus].color}`}>
                  Status: {statusLabel[currentCampStatus].label}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap shrink-0">
            <button
              onClick={() => navigate('/campaigns')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-600/40 text-emerald-300 font-bold text-xs hover:bg-emerald-600/30 transition"
            >
              <ExternalLink size={12} /> View Task
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold font-bold text-xs hover:bg-luxury-gold/20 transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Invitation Header Card */}
      <div className="glass-card-premium rounded-3xl p-6 md:p-8 relative overflow-hidden border border-white/10 shadow-premium-card">
        <div className="absolute top-0 right-0 w-80 h-80 bg-luxury-purple/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          
          {loadingStats ? (
            <div className="flex items-center gap-4 min-h-[80px]">
              <div className="w-16 h-16 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
              <div className="flex flex-col gap-2">
                <div className="h-4 w-44 bg-white/5 rounded-lg animate-pulse" />
                <div className="h-3 w-28 bg-white/5 rounded-lg animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src={referrerProfile?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(referrerProfile?.name || "R")}&background=2E1065&color=C084FC&size=150`}
                  alt={referrerProfile?.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/10 border border-luxury-gold/30"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-luxury-dark flex items-center justify-center text-white text-[9px] font-black">
                  ✓
                </span>
              </div>
              
              <div>
                <h2 className="text-xl font-extrabold text-white">Join and Complete Task</h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Invited by <strong className="text-luxury-gold font-semibold">{referrerProfile?.name}</strong> to do the task <strong className="text-white font-semibold">{featuredCampaign.name}</strong> and start earning.
                </p>
              </div>
            </div>
          )}

          {/* Recruiter Stats */}
          <div className="flex gap-2 flex-wrap md:self-stretch items-center">
            {[
              { label: "Tasks Completed", val: loadingStats ? "--" : `${referrerStats.completedTasks} Done`, icon: <Award size={13} className="text-luxury-gold" /> },
              { label: "Team Size", val: loadingStats ? "--" : `${referrerStats.totalReferrals} Leaders`, icon: <Users size={13} className="text-purple-400" /> },
              { label: "Invite Link Status", val: "✓ Active", icon: <TrendingUp size={13} className="text-emerald-400" /> }
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2 bg-luxury-dark/40 border border-white/5 rounded-xl px-3 py-2">
                {s.icon}
                <div>
                  <span className="text-slate-500 text-[8px] font-black uppercase tracking-wider block">{s.label}</span>
                  <strong className="text-white text-xs">{s.val}</strong>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Onboarding Campaign Card */}
        <div className="glass-card-premium rounded-3xl p-6 border-l-4 border-l-luxury-gold flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="bg-gold-gradient text-luxury-dark text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                Task Reward
              </span>
              <strong className="text-2xl font-black text-luxury-gold">₹{featuredCampaign.reward}</strong>
            </div>

            <h3 className="text-lg font-bold text-white mb-2">{featuredCampaign.name} Onboarding</h3>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed mb-4">{featuredCampaign.shortDesc}</p>

            <div className="bg-luxury-dark/40 rounded-2xl p-4 border border-white/5 mb-4 text-xs">
              <span className="font-bold text-luxury-gold block mb-1.5">Prerequisites / What you need</span>
              <ul className="list-disc pl-4 text-slate-300 space-y-1">
                {(featuredCampaign.eligibility || []).map((req, idx) => (
                  <li key={idx} className="leading-relaxed">{req}</li>
                ))}
              </ul>
            </div>


          </div>

          {/* Already joined → show go-to-campaign button; otherwise show join button */}
          {alreadyJoined && user ? (
            <div className="flex flex-col gap-3 mt-6">
              <div className="w-full py-3.5 rounded-xl border border-emerald-700/50 bg-emerald-950/30 flex items-center justify-center gap-2 text-emerald-300 font-black text-xs">
                <CheckCircle2 size={16} /> Already Joined
              </div>
              <button
                onClick={() => navigate('/campaigns')}
                className="w-full py-3.5 bg-gold-gradient text-luxury-dark font-black text-xs rounded-xl shadow-gold-glow flex items-center justify-center gap-1.5 hover:opacity-95 transition btn-shimmer"
              >
                View My Task <ExternalLink size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleCtaAction}
              disabled={joiningLoading}
              className={`w-full py-4 bg-gold-gradient text-luxury-dark font-black text-xs rounded-xl shadow-gold-glow flex items-center justify-center gap-1.5 hover:opacity-95 transition mt-6 btn-shimmer ${joiningLoading ? "opacity-60 cursor-wait" : ""}`}
            >
              {joiningLoading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-luxury-dark/40 border-t-luxury-dark animate-spin" />
                  Joining...
                </>
              ) : (
                <>Start Task Now <ArrowRight size={14} /></>
              )}
            </button>
          )}
        </div>

        {/* Live Recruiting Activity */}
        <div className="glass-card-premium rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5 mb-1.5">
              <UserCheck size={16} className="text-purple-400" /> Friends who joined
            </h3>
            <p className="text-slate-500 text-[10px] mb-4">People who recently joined using this link</p>

            {loadingStats ? (
              <div className="flex flex-col gap-3 py-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : friendSignups.length === 0 ? (
              <div className="flex flex-col items-center py-10 bg-luxury-dark/30 rounded-2xl border border-white/5 gap-3 text-center">
                <Clock size={32} className="text-slate-650" />
                <h4 className="font-bold text-slate-300">No one here yet!</h4>
                <p className="text-[10px] text-slate-500 max-w-[200px]">
                  Nobody has registered using this link yet. Be the first one!
                </p>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-500 font-bold uppercase pb-2">
                      <th className="pb-2">Friend</th>
                      <th className="pb-2">Task</th>
                      <th className="pb-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {friendSignups.map((ref, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition">
                        <td className="py-2.5">
                          <strong className="text-white block">{ref.name}</strong>
                          <span className="text-[10px] text-slate-500 font-mono">{ref.email}</span>
                        </td>
                        <td className="py-2.5 text-slate-300">{ref.campaignName}</td>
                        <td className="py-2.5 text-right">
                          <span className={badgeClass(ref.status)}>{ref.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="border-t border-white/5 pt-4 mt-4 flex justify-between items-center text-xs text-slate-500">
            <span>
              Total Team Rewards: <strong className="text-white">₹{referrerStats.successfulReferrals * 100}</strong>
            </span>
            <span className="flex items-center gap-1 text-[10px]">
              🔒 Safe and verified
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
