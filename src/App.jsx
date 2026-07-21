import { useState, useEffect } from "react";
import { 
  HashRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useNavigate, 
  useLocation, 
  useSearchParams,
  Link
} from "react-router-dom";
import { 
  onAuthStateChanged,
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc,
  onSnapshot, 
  collection, 
  query, 
  where, 
  serverTimestamp,
  getDocs,
  limit,
  increment
} from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";
import { DEFAULT_CAMPAIGNS } from "./data/campaigns";

export const DEFAULT_PAGE_CONTENT = {
  appName: "ReferX",
  appTagline: "Earn Money by Referring Friends",
  supportEmail: "support@referex.in",
  supportWhatsApp: "+91 8185892753",
  homepage: {
    heroTitle: "Complete Campaigns, Grow Teams & Earn Direct Commissions",
    heroDesc: "Welcome to the premier platform for affiliate leaders. Perform verification tasks, build downlines, and secure recursive passive incomes.",
    step1Title: "Register Profile",
    step1Desc: "Sign up with your credentials to unlock a secure promoter node.",
    step2Title: "Perform Tasks",
    step2Desc: "Complete verified campaign tasks to start earning rewards.",
    step3Title: "Invite Friends",
    step3Desc: "Share your referral link to build your multi-level downline network.",
    step4Title: "Withdraw Earnings",
    step4Desc: "Receive direct payouts to your bank account upon verification.",
    faq1Q: "How does the referral commission work?",
    faq1A: "You earn a direct reward when your invitee completes a task, plus team overrides up to multiple levels recursively.",
    faq2Q: "When will my earnings be approved?",
    faq2A: "Verifications are audited by managers and typically approved within 12 to 24 hours.",
    faq3Q: "What is the minimum age to participate?",
    faq3A: "You must be age 18 years or older to register and perform campaign tasks.",
    faq4Q: "Are there any joining fees?",
    faq4A: "No, ReferX is 100% free to join and does not require any capital investment."
  },
  dashboard: {
    welcomeSubtext: "Complete tasks and grow your team to earn more.",
    quickTasksTitle: "Quick Tasks",
    referralCardTitle: "Your Invite Link",
    activityTitle: "Recent Activity"
  },
  team: {
    pageTitle: "My Team Network",
    pageDesc: "Track your referrals, team growth, and commission pipeline.",
    emptyTitle: "Your team is empty",
    emptyDesc: "Share your referral link to start building your network!"
  },
  campaigns: {
    pageTitle: "Available Tasks",
    pageDesc: "Complete tasks to earn rewards. Each task is verified and pays directly to your bank.",
    emptyTitle: "No tasks available",
    emptyDesc: "New earning tasks will appear here soon."
  },
  earnings: {
    pageTitle: "My Wallet & Payouts",
    pageDesc: "Track your commissions, request payouts, and monitor team rewards.",
    withdrawNote: "Withdrawal requests are accepted only after 50+ accounts are opened. Processing takes 24–48 hours on business days."
  },
  profile: {
    withdrawalTitle: "Withdrawal Status",
    withdrawalDesc: "Complete 50 referrals to unlock the ability to withdraw your earnings."
  },
  policies: {
    termsTitle: "ReferX Work Rules",
    termsSec1Title: "1. Verified Work",
    termsSec1Body: "Every account opening task is checked by the partner brand company. If you fill fake, wrong, or duplicate details, your work will be rejected and your account will be blocked.",
    termsSec2Title: "2. Bank Payouts",
    termsSec2Body: "Your earned money is sent directly to your registered bank account. Payout transfers take 12 to 24 hours to reach your bank. Double check your bank details — we cannot recover money sent to wrong details.",
    termsSec3Title: "3. Refer and Earn Rule",
    termsSec3Body: "You get the ₹100 referral bonus only when your friend signs up and successfully completes their first task. Do not make fake accounts to get referral bonus.",
    termsSec4Title: "4. Document Safety",
    termsSec4Body: "Your PAN card and Aadhaar card details are completely safe and encrypted. We only use them for tax and bank verification rules.",
    
    privacyTitle: "Privacy & Data Safety",
    privacySec1Title: "1. Safe Document Storage",
    privacySec1Body: "Your Aadhaar card and PAN details are encrypted and stored in secure systems. Nobody can see them except for official tax and bank verification purposes.",
    privacySec2Title: "2. Task Tracking Data",
    privacySec2Body: "We use automatic tracking links to register when you click and complete a task. This ensures your rewards are correctly added to your wallet.",
    privacySec3Title: "3. Data Safety",
    privacySec3Body: "We never sell, rent, or share your phone number, email, or other personal details with third-party advertising companies.",
    
    warrantTitle: "Payout Rules & Details",
    warrantSec1Title: "1. Direct Verification by Brands",
    warrantSec1Body: "Your rewards are approved only when the partner company (like Demat/Bank brand) confirms you opened a successful account through our link.",
    warrantSec2Title: "2. Processing Timelines",
    warrantSec2Body: "Once verified, we send the money to your bank within 12 to 24 hours. Payouts are sent daily, except on bank holidays.",
    warrantSec3Title: "3. Anti-Cheating Check",
    warrantSec3Body: "If our system finds any cheat activity, fake logins, or multiple dummy accounts under your referral link, we will hold your payout pending review."
  }
};


export const getNormalizedRedirectUrl = (redirectUrl, clickId, userId) => {
  if (!redirectUrl) return "";
  let url = redirectUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    try {
      const stored = localStorage.getItem("referx_profile");
      if (stored) {
        const parsed = JSON.parse(stored);
        resolvedUserId = parsed.referralCode || parsed.userId || parsed.uid;
      }
    } catch (e) {}
  }
  if (clickId) {
    url = url.replace(/{click_id}/gi, clickId)
             .replace(/{clickId}/gi, clickId)
             .replace(/{lead_id}/gi, clickId)
             .replace(/{leadId}/gi, clickId);
  }
  if (resolvedUserId) {
    url = url.replace(/{user_id}/gi, resolvedUserId)
             .replace(/{userId}/gi, resolvedUserId);
  }
  return url;
};

export const propagateNewMember = async (parentUserId, referralPath, newUserId) => {
  if (!parentUserId || parentUserId === "root") return;
  const ancestors = referralPath.filter(uid => uid !== newUserId);
  for (const ancestorUid of ancestors) {
    try {
      const userRef = doc(db, "users", ancestorUid);
      const isParent = ancestorUid === parentUserId;
      const updatePayload = {
        totalTeamMembersCount: increment(1),
        updatedAt: new Date().toISOString()
      };
      if (isParent) {
        updatePayload.directReferralsCount = increment(1);
      }
      await updateDoc(userRef, updatePayload);
    } catch (err) {
      console.error(`Failed to propagate new member to ancestor ${ancestorUid}:`, err);
    }
  }
};

export const propagateCampaignCompleted = async (referralPath, userId) => {
  if (!referralPath || referralPath.length === 0) return;
  const ancestors = referralPath.filter(uid => uid !== userId);
  for (const ancestorUid of ancestors) {
    try {
      const userRef = doc(db, "users", ancestorUid);
      await updateDoc(userRef, {
        campaignCount: increment(1),
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(`Failed to propagate campaign completed to ancestor ${ancestorUid}:`, err);
    }
  }
};


// Pages & Components
import Homepage from "./components/Homepage";
import AuthPanels from "./components/AuthPanels";
import Dashboard from "./components/Dashboard";
import Campaigns from "./components/Campaigns";
import Team from "./components/Team";
import Activity from "./components/Activity";
import Profile from "./components/Profile";
import Earnings from "./components/Earnings";
import PremiumLoader from "./components/PremiumLoader";

import Notifications from "./components/Notifications";
import AdminPanel from "./components/AdminPanel";
import Footer from "./components/Footer";
import ReferralLanding from "./components/ReferralLanding";
import MaintenancePage from "./components/MaintenancePage";
import SuperAdminPanel from "./components/SuperAdminPanel";
import CompanyDetails from "./components/CompanyDetails";


export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("referx_user");
    return saved ? JSON.parse(saved) : null;
  });
  
  const [profileData, setProfileData] = useState(() => {
    const saved = localStorage.getItem("referx_profile");
    return saved ? JSON.parse(saved) : null;
  });

  const [joinedCampaigns, setJoinedCampaigns] = useState({});
  const [referrals, setReferrals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [campaignsList, setCampaignsList] = useState(DEFAULT_CAMPAIGNS);
  const [loading, setLoading] = useState(true);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [homepageContent, setHomepageContent] = useState(null);
  const [pageContent, setPageContent] = useState(DEFAULT_PAGE_CONTENT);

  // Sync homepage content configuration settings from Firestore settings/homepage_content
  useEffect(() => {
    const homeContentRef = doc(db, "settings", "homepage_content");
    const unsubscribeHomeContent = onSnapshot(homeContentRef, (snapshot) => {
      if (snapshot.exists()) {
        setHomepageContent(snapshot.data());
      }
    }, (err) => {
      console.warn("Could not sync homepage settings:", err);
    });
    return () => unsubscribeHomeContent();
  }, []);

  // Sync page content configuration settings from Firestore settings/page_content
  useEffect(() => {
    const pageContentRef = doc(db, "settings", "page_content");
    const unsubscribePageContent = onSnapshot(pageContentRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        let cleanedWelcomeSubtext = data.dashboard?.welcomeSubtext || "";
        if (cleanedWelcomeSubtext.includes("The user may join the team") || cleanedWelcomeSubtext.includes("campaign space")) {
          const defaultSubtext = DEFAULT_PAGE_CONTENT.dashboard.welcomeSubtext;
          updateDoc(pageContentRef, {
            "dashboard.welcomeSubtext": defaultSubtext
          }).catch(e => console.warn("Failed to auto-clean welcomeSubtext:", e));
          data.dashboard = { ...data.dashboard, welcomeSubtext: defaultSubtext };
        }
        setPageContent({
          ...DEFAULT_PAGE_CONTENT,
          ...data,
          homepage: { ...DEFAULT_PAGE_CONTENT.homepage, ...(data.homepage || {}) },
          dashboard: { ...DEFAULT_PAGE_CONTENT.dashboard, ...(data.dashboard || {}) },
          team: { ...DEFAULT_PAGE_CONTENT.team, ...(data.team || {}) },
          campaigns: { ...DEFAULT_PAGE_CONTENT.campaigns, ...(data.campaigns || {}) },
          earnings: { ...DEFAULT_PAGE_CONTENT.earnings, ...(data.earnings || {}) },
          profile: { ...DEFAULT_PAGE_CONTENT.profile, ...(data.profile || {}) },
          policies: { ...DEFAULT_PAGE_CONTENT.policies, ...(data.policies || {}) }
        });
      } else {
        setDoc(pageContentRef, DEFAULT_PAGE_CONTENT).catch(err => {
          console.warn("Could not seed settings/page_content:", err);
        });
      }
    }, (err) => {
      console.warn("Could not sync page_content settings:", err);
    });
    return () => unsubscribePageContent();
  }, []);

  const [maintenance, setMaintenance] = useState({
    active: false,
    title: "Under Maintenance",
    message: "We are currently performing scheduled system updates. Please try again in a few minutes.",
    contactWhatsApp: "+91 8185892753",
    contactEmail: "support@referx.in"
  });

  // Sync maintenance settings from Firestore settings/maintenance
  useEffect(() => {
    const maintenanceRef = doc(db, "settings", "maintenance");
    const unsubscribeMaintenance = onSnapshot(maintenanceRef, (snapshot) => {
      if (snapshot.exists()) {
        setMaintenance(snapshot.data());
      } else {
        const defaultMaint = {
          active: false,
          title: "Under Maintenance",
          message: "We are currently performing scheduled system updates. Please try again in a few minutes.",
          contactWhatsApp: "+91 8185892753",
          contactEmail: "support@referx.in"
        };
        setDoc(maintenanceRef, defaultMaint).catch(err => {
          console.warn("Could not seed settings/maintenance:", err);
        });
        setMaintenance(defaultMaint);
      }
    }, (err) => {
      console.warn("Could not sync maintenance settings:", err);
    });
    return () => unsubscribeMaintenance();
  }, []);


  // URL Normalisation for non-hash routing paths
  useEffect(() => {
    const path = window.location.pathname;
    if (path && path !== "/" && path !== "/index.html") {
      const search = window.location.search;
      const hash = window.location.hash;
      window.location.replace(`${window.location.origin}/#${path}${search}${hash}`);
    }
  }, []);

  // Toast Function
  const showToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            const profileWithUid = { uid: firebaseUser.uid, ...data };
            
            // Self-healing migration for 4-digit sequential userId
            const storedId = data.userId;
            const isFourDigitNumeric = storedId && /^\d{4}$/.test(storedId);
            if (!isFourDigitNumeric) {
              let newId;
              if (storedId && /^\d+$/.test(storedId)) {
                // If it is numeric (e.g. 6-digit), convert it directly by parsing and padding to 4 digits
                newId = String(parseInt(storedId, 10)).padStart(4, "0");
              } else {
                newId = await getNextSequentialUserId();
              }
              const newRefCode = `REF${newId}`;
              await updateDoc(userDocRef, {
                userId: newId,
                referralCode: newRefCode,
                referralLink: `${window.location.origin}/#/register?ref=${newRefCode}`
              });
              profileWithUid.userId = newId;
              profileWithUid.referralCode = newRefCode;
              profileWithUid.referralLink = `${window.location.origin}/#/register?ref=${newRefCode}`;
            }

            setProfileData(profileWithUid);
            setJoinedCampaigns(data.joinedCampaigns || {});
            
            // Cache details
            const userMeta = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL
            };
            localStorage.setItem("referx_user", JSON.stringify(userMeta));
            localStorage.setItem("referx_profile", JSON.stringify(profileWithUid));
          }
          setUser(firebaseUser);
        } else {
          setUser(null);
          setProfileData(null);
          setJoinedCampaigns({});
          localStorage.removeItem("referx_user");
          localStorage.removeItem("referx_profile");
        }
      } catch (err) {
        console.error("Auth Listener Error: ", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Database Sync (Authenticated Sessions)
  useEffect(() => {
    if (!user) return;

    // 1. Profile sync
    const userDocRef = doc(db, "users", user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const profileWithUid = { uid: user.uid, ...data };
        setProfileData(profileWithUid);
        setJoinedCampaigns(data.joinedCampaigns || {});
        localStorage.setItem("referx_profile", JSON.stringify(profileWithUid));
      }
    });

    // 2. Referrals list sync
    const referralsQuery = query(
      collection(db, "referrals"), 
      where("referrerUid", "==", user.uid)
    );
    const unsubscribeReferrals = onSnapshot(referralsQuery, (querySnapshot) => {
      const refs = [];
      querySnapshot.forEach((doc) => {
        refs.push({ id: doc.id, ...doc.data() });
      });
      // Sort descending
      refs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReferrals(refs);
    });

    // 3. Notifications list sync
    const notificationsQuery = query(
      collection(db, "notifications"), 
      where("uid", "==", user.uid)
    );
    const unsubscribeNotifications = onSnapshot(notificationsQuery, (querySnapshot) => {
      const notifs = [];
      querySnapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() });
      });
      notifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(notifs);
    });

    return () => {
      unsubscribeUser();
      unsubscribeReferrals();
      unsubscribeNotifications();
    };
  }, [user]);

  // Sync campaigns list from Firestore
  useEffect(() => {
    const campaignsRef = collection(db, "campaigns");
    const unsubscribeCampaigns = onSnapshot(campaignsRef, async (querySnapshot) => {
      if (querySnapshot.empty) {
        setCampaignsList([]);
      } else {
        const list = [];
        querySnapshot.forEach((d) => {
          const data = d.data();
          const defaultCamp = DEFAULT_CAMPAIGNS.find(c => c.id === d.id);
          if (defaultCamp && (data.minLevel === undefined || data.minLevelName === undefined)) {
            updateDoc(doc(db, "campaigns", d.id), {
              minLevel: data.minLevel !== undefined ? data.minLevel : (defaultCamp.minLevel || 1),
              minLevelName: data.minLevelName !== undefined ? data.minLevelName : (defaultCamp.minLevelName || "Associate")
            }).catch(e => console.warn(`Campaign level migration failed for ${d.id}:`, e));
          }
          list.push({ id: d.id, ...data });
        });
        list.sort((a, b) => {
          const posA = a.position !== undefined && a.position !== null ? Number(a.position) : 99999;
          const posB = b.position !== undefined && b.position !== null ? Number(b.position) : 99999;
          if (posA !== posB) {
            return posA - posB;
          }
          return b.reward - a.reward;
        });
        setCampaignsList(list);
      }
    }, (err) => {
      console.error("Failed to sync campaigns list from Firestore:", err);
    });
    return () => unsubscribeCampaigns();
  }, []);


  // Admin Permissions Helper
  const isAdmin = profileData?.isAdmin || profileData?.role === "admin" || 
                  user?.email === "udaykiranvempati123@gmail.com" || 
                  user?.email === "primeappconnect@gmail.com" || 
                  user?.email === "udaykiranvempati@gmail.com" ||
                  user?.email?.includes("admin");

  const getNextSequentialUserId = async () => {
    const counterRef = doc(db, "settings", "counters");
    try {
      const snap = await getDoc(counterRef);
      let count = 0;
      if (snap.exists()) {
        count = snap.data().userCount || 0;
      }
      const nextCount = count + 1;
      await setDoc(counterRef, { userCount: nextCount }, { merge: true });
      return String(nextCount).padStart(4, "0");
    } catch (err) {
      console.warn("Failed to increment user counter, using random fallback:", err);
      const rand = Math.floor(1000 + Math.random() * 8999);
      return String(rand);
    }
  };

  // Google Sign-In (Creates account if missing)
  const handleGoogleLogin = async (navigate) => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await getDoc(userDocRef);
      
      const isUserAdmin = firebaseUser.email === "udaykiranvempati123@gmail.com" || 
                          firebaseUser.email === "primeappconnect@gmail.com" || 
                          firebaseUser.email === "udaykiranvempati@gmail.com" ||
                          firebaseUser.email?.includes("admin");

      let profile;
      if (!docSnap.exists()) {
        const userId = await getNextSequentialUserId();
        const referralCode = `REF${userId}`;
        const employeeId = `ReferX-2026-${userId}`;
        const referralLink = `${window.location.origin}/#/register?ref=${referralCode}`;

        let sponsorUid = "root";
        let sponsorName = "System Admin";
        let sponsorLevel = 5;
        let sponsorLevelName = "Manager";
        
        const referralContextStr = localStorage.getItem("referx_referral_context");
        if (referralContextStr) {
          try {
            const context = JSON.parse(referralContextStr);
            if (context.referrerUid && context.referrerUid !== firebaseUser.uid) {
              sponsorUid = context.referrerUid;
              sponsorName = context.referrerName || "A ReferX Recruiter";
            }
          } catch (e) {}
        }

        // Fetch sponsor path recursively
        let sponsorPath = [];
        if (sponsorUid !== "root") {
          try {
            const sponsorSnap = await getDoc(doc(db, "users", sponsorUid));
            if (sponsorSnap.exists()) {
              sponsorPath = sponsorSnap.data().referralPath || [];
            }
          } catch (pathErr) {
            console.warn("Google Register: failed to resolve sponsor path:", pathErr);
          }
        }
        const referralPath = [...sponsorPath, firebaseUser.uid];

        profile = {
          name: firebaseUser.displayName || "New Leader",
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || "New Leader")}&background=2E1065&color=C084FC`,
          mobile: "",
          aadhaar: "",
          pan: "",
          employeeId,
          userId,
          referralCode,
          referralLink,
          sponsor: {
            uid: sponsorUid,
            name: sponsorName,
            level: sponsorLevel,
            levelName: sponsorLevelName
          },
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          role: isUserAdmin ? "admin" : "user",
          isAdmin: isUserAdmin,
          level: 1, // Member
          totalAccounts: 0,
          bankAccountName: "",
          bankName: "",
          bankAccountNumber: "",
          bankIfscCode: "",
          state: "",
          city: "",
          profileCompleted: true,
          earnings: {
            total: 0,
            pending: 0,
            paid: 0,
            balance: 0
          },
          joinedCampaigns: {},
          passivePercentages: {
            teamOverride: 5,
            downlineReferral: 2,
            monthlyBonus: 1000
          },
          // New Hierarchy Fields
          parentUserId: sponsorUid,
          referralPath: referralPath,
          directReferralsCount: 0,
          totalTeamMembersCount: 0,
          campaignCount: 0,
          approvedCount: 0,
          teamEarnings: 0,
          directEarnings: 0,
          totalEarnings: 0,
          status: "Active",
          updatedAt: new Date().toISOString()
        };

        await setDoc(userDocRef, {
          ...profile,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        });

        // Setup teamHierarchy node
        let ancestors = [];
        if (sponsorUid !== "root") {
          const sponsorHierSnap = await getDoc(doc(db, "teamHierarchy", sponsorUid));
          if (sponsorHierSnap.exists()) {
            const sHierData = sponsorHierSnap.data();
            ancestors = [sponsorUid, ...(sHierData.ancestors || [])];
          } else {
            ancestors = [sponsorUid];
          }
        }

        await setDoc(doc(db, "teamHierarchy", firebaseUser.uid), {
          userId: firebaseUser.uid,
          referrerUid: sponsorUid,
          ancestors: ancestors,
          level: ancestors.length + 1,
          createdAt: serverTimestamp()
        });

        // Propagate team growth recursively to ancestors
        await propagateNewMember(sponsorUid, referralPath, firebaseUser.uid);

        // Log Activity
        await addDoc(collection(db, "activities"), {
          userId: firebaseUser.uid,
          userName: profile.name,
          action: "Referral Registration",
          details: `Registered promoter account under sponsor: ${sponsorName}`,
          timestamp: serverTimestamp()
        });

        showToast("Google account registered successfully! 🎉", "success");
      } else {
        profile = docSnap.data();
        if (isUserAdmin && !profile.isAdmin) {
          profile.isAdmin = true;
          profile.role = "admin";
          await updateDoc(userDocRef, { isAdmin: true, role: "admin" });
        }
        
        // Log Activity for Login
        await addDoc(collection(db, "activities"), {
          userId: firebaseUser.uid,
          userName: profile.name,
          action: "Login",
          details: "Signed into Dashboard via Google Auth.",
          timestamp: serverTimestamp()
        });

        showToast("Signed in successfully with Google.", "success");
      }

      setUser(firebaseUser);
      const mergedProfile = { uid: firebaseUser.uid, ...profile };
      setProfileData(mergedProfile);
      
      // Determine redirection and auto-joining
      await handleAutoJoinReferralGroup(firebaseUser, mergedProfile);
      navigate("/dashboard");
    } catch (error) {
      console.error("Google Auth Error: ", error);
      const errMsg = error?.message || error?.code || "Unknown error";
      showToast(`Google Authentication failed: ${errMsg}`, "danger");
    }
  };

  // Logout Handler
  const handleLogout = async (navigate) => {
    try {
      if (user && profileData) {
        // Log Activity before signing out
        await addDoc(collection(db, "activities"), {
          userId: user.uid,
          userName: profileData.name,
          action: "Logout",
          details: "Terminated dashboard security session.",
          timestamp: serverTimestamp()
        });
      }

      await signOut(auth);
      setProfileData(null);
      setJoinedCampaigns({});
      setReferrals([]);
      setNotifications([]);
      localStorage.removeItem("referx_user");
      localStorage.removeItem("referx_profile");
      showToast("Logged out successfully.", "info");
      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  // Auto Join Referral Group Campaign helper
  const handleAutoJoinReferralGroup = async (currentUser, currentProfile) => {
    const contextStr = localStorage.getItem("referx_referral_context");
    if (!contextStr) return;
    try {
      const context = JSON.parse(contextStr);
      if (context.autoJoinGroup && context.campaignId) {
        const campaign = campaignsList.find(c => c.id === context.campaignId) || { name: context.campaignId, id: context.campaignId };
        
        const updatedJoined = {
          ...(currentProfile.joinedCampaigns || {}),
          [context.campaignId]: {
            status: "In Progress",
            joinedAt: new Date().toISOString(),
            completedSteps: [],
            registeredDetails: {
              name: currentProfile.name || currentUser.displayName || "Promoter",
              mobile: currentProfile.mobile || "",
              bankAccountName: currentProfile.bankAccountName || "",
              bankName: currentProfile.bankName || "",
              bankAccountNumber: currentProfile.bankAccountNumber || "",
              bankIfscCode: currentProfile.bankIfscCode || ""
            }
          }
        };

        await updateDoc(doc(db, "users", currentUser.uid), {
          joinedCampaigns: updatedJoined
        });

        // Also update local state
        setJoinedCampaigns(updatedJoined);
        const mergedProfile = { ...currentProfile, joinedCampaigns: updatedJoined };
        setProfileData(mergedProfile);
        localStorage.setItem("referx_profile", JSON.stringify(mergedProfile));

        // Write referral doc with inviteClicked: ok, joinedGroup: ok, level: 1
        const q = query(
          collection(db, "referrals"),
          where("referrerUid", "==", context.referrerUid),
          where("refereeUid", "==", currentUser.uid),
          where("campaignId", "==", context.campaignId)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          await addDoc(collection(db, "referrals"), {
            referrerUid: context.referrerUid,
            refereeUid: currentUser.uid,
            refereeName: currentProfile.name || currentUser.displayName || "Promoter",
            refereeEmail: currentUser.email,
            campaignId: context.campaignId,
            campaignName: campaign.name,
            rewardAmount: 100,
            inviteClicked: "ok",
            joinedGroup: "ok",
            level: 1,
            status: "pending",
            createdAt: new Date().toISOString()
          });
        } else {
          await updateDoc(doc(db, "referrals", snap.docs[0].id), {
            inviteClicked: "ok",
            joinedGroup: "ok"
          });
        }

        // Notify referrer
        await addDoc(collection(db, "notifications"), {
          uid: context.referrerUid,
          message: `${currentProfile.name || currentUser.displayName || "A new member"} joined your group and started ${campaign.name} campaign!`,
          type: "referral_started",
          createdAt: serverTimestamp(),
          read: false
        });

        // Log Activity
        await addDoc(collection(db, "activities"), {
          userId: currentUser.uid,
          userName: currentProfile.name || currentUser.displayName || "Promoter",
          action: "Campaign Click",
          details: `Auto-joined group & campaign: ${campaign.name} via invite link`,
          timestamp: serverTimestamp()
        });

        // Open tracking link
        const trackingUrl = `${window.location.origin}/#/gateway?action=click&campaignId=${context.campaignId}&userId=${currentUser.uid}`;
        window.open(trackingUrl, "_blank");
      }
    } catch (err) {
      console.error("Failed auto joining referral group:", err);
    } finally {
      localStorage.removeItem("referx_referral_context");
    }
  };



  // Email/Password Registration
  const handleEmailRegister = async (formData) => {
    try {
      const { name, email, password, mobile, referralCode, photoUrl } = formData;
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = result.user;

      const userDocRef = doc(db, "users", firebaseUser.uid);
      const isUserAdmin = email === "udaykiranvempati123@gmail.com" || 
                          email === "primeappconnect@gmail.com" || 
                          email === "udaykiranvempati@gmail.com" ||
                          email?.includes("admin");

      const userId = await getNextSequentialUserId();
      const employeeId = `ReferX-2026-${userId}`;
      const refCode = referralCode || `REF${userId}`;
      const referralLink = `${window.location.origin}/#/register?ref=${refCode}`;

      let sponsorUid = "root";
      let sponsorName = "System Admin";
      let sponsorLevel = 5;
      let sponsorLevelName = "Manager";

      const referralContextStr = localStorage.getItem("referx_referral_context");
      if (referralContextStr) {
        try {
          const context = JSON.parse(referralContextStr);
          if (context.referrerUid && context.referrerUid !== firebaseUser.uid) {
            sponsorUid = context.referrerUid;
            sponsorName = context.referrerName || "A ReferX Recruiter";
          }
        } catch (e) {}
      }

      // Fetch sponsor path recursively
      let sponsorPath = [];
      if (sponsorUid !== "root") {
        try {
          const sponsorSnap = await getDoc(doc(db, "users", sponsorUid));
          if (sponsorSnap.exists()) {
            sponsorPath = sponsorSnap.data().referralPath || [];
          }
        } catch (pathErr) {
          console.warn("Email Register: failed to resolve sponsor path:", pathErr);
        }
      }
      const referralPath = [...sponsorPath, firebaseUser.uid];

      const profile = {
        name,
        email,
        photoURL: photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2E1065&color=C084FC`,
        mobile: mobile || "",
        aadhaar: "",
        pan: "",
        employeeId,
        userId,
        referralCode: refCode,
        referralLink,
        sponsor: {
          uid: sponsorUid,
          name: sponsorName,
          level: sponsorLevel,
          levelName: sponsorLevelName
        },
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        role: isUserAdmin ? "admin" : "user",
        isAdmin: isUserAdmin,
        level: 1,
        totalAccounts: 0,
        bankAccountName: "",
        bankName: "",
        bankAccountNumber: "",
        bankIfscCode: "",
        state: "",
        city: "",
        profileCompleted: true,
        earnings: {
          total: 0,
          pending: 0,
          paid: 0,
          balance: 0
        },
        joinedCampaigns: {},
        passivePercentages: {
          teamOverride: 5,
          downlineReferral: 2,
          monthlyBonus: 1000
        },
        // New Hierarchy Fields
        parentUserId: sponsorUid,
        referralPath: referralPath,
        directReferralsCount: 0,
        totalTeamMembersCount: 0,
        campaignCount: 0,
        approvedCount: 0,
        teamEarnings: 0,
        directEarnings: 0,
        totalEarnings: 0,
        status: "Active",
        updatedAt: new Date().toISOString()
      };

      await setDoc(userDocRef, {
        ...profile,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });

      // Setup teamHierarchy node
      let ancestors = [];
      if (sponsorUid !== "root") {
        const sponsorHierSnap = await getDoc(doc(db, "teamHierarchy", sponsorUid));
        if (sponsorHierSnap.exists()) {
          const sHierData = sponsorHierSnap.data();
          ancestors = [sponsorUid, ...(sHierData.ancestors || [])];
        } else {
          ancestors = [sponsorUid];
        }
      }

      await setDoc(doc(db, "teamHierarchy", firebaseUser.uid), {
        userId: firebaseUser.uid,
        referrerUid: sponsorUid,
        ancestors: ancestors,
        level: ancestors.length + 1,
        createdAt: serverTimestamp()
      });

      // Propagate team growth recursively to ancestors
      await propagateNewMember(sponsorUid, referralPath, firebaseUser.uid);

      // Log Activity
      await addDoc(collection(db, "activities"), {
        userId: firebaseUser.uid,
        userName: profile.name,
        action: "Referral Registration",
        details: `Registered promoter account under sponsor: ${sponsorName}`,
        timestamp: serverTimestamp()
      });

      showToast("Account registered successfully! 🎉", "success");
      setUser(firebaseUser);
      setProfileData({ uid: firebaseUser.uid, ...profile });
    } catch (error) {
      console.error("Registration Error:", error);
      throw error;
    }
  };

  // Email/Password Login
  const handleEmailLogin = async (email, password, role) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = result.user;

      const userDocRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        throw new Error("No user record found in database.");
      }

      const profile = docSnap.data();

      // Role enforcement
      if (role === "admin" && !profile.isAdmin && profile.role !== "admin") {
        await signOut(auth);
        throw new Error("Access denied. Admin credentials required.");
      }

      // Log Activity
      await addDoc(collection(db, "activities"), {
        userId: firebaseUser.uid,
        userName: profile.name,
        action: "Login",
        details: "Signed into Dashboard via Email/Password.",
        timestamp: serverTimestamp()
      });

      showToast("Signed in successfully.", "success");
      setUser(firebaseUser);
      const mergedProfile = { uid: firebaseUser.uid, ...profile };
      setProfileData(mergedProfile);
      await handleAutoJoinReferralGroup(firebaseUser, mergedProfile);
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  };

  // Register campaign
  const handleRegisterCampaign = async (campaignId, registrationDetails) => {
    if (!user) return;
    const existingName = profileData?.bankAccountName || "";
    const existingBank = profileData?.bankName || "";
    const existingNumber = profileData?.bankAccountNumber || "";
    const existingIfsc = profileData?.bankIfscCode || "";
    const existingMobile = profileData?.mobile || "";

    const updatedJoinedCampaigns = {
      ...joinedCampaigns,
      [campaignId]: {
        status: "In Progress",
        joinedAt: new Date().toISOString(),
        completedSteps: [],
        registeredDetails: {
          name: registrationDetails.fullName || profileData?.name || user.displayName || "Promoter",
          mobile: registrationDetails.mobile || existingMobile,
          bankAccountName: registrationDetails.bankAccountName || existingName,
          bankName: registrationDetails.bankName || existingBank,
          bankAccountNumber: registrationDetails.bankAccountNumber || existingNumber,
          bankIfscCode: registrationDetails.bankIfscCode || existingIfsc
        }
      }
    };

    try {
      const userDocRef = doc(db, "users", user.uid);
      const updateData = {
        joinedCampaigns: updatedJoinedCampaigns
      };

      if (registrationDetails.mobile) {
        updateData.mobile = registrationDetails.mobile;
      }
      if (registrationDetails.bankAccountName) {
        updateData.bankAccountName = registrationDetails.bankAccountName;
      }
      if (registrationDetails.bankName) {
        updateData.bankName = registrationDetails.bankName;
      }
      if (registrationDetails.bankAccountNumber) {
        updateData.bankAccountNumber = registrationDetails.bankAccountNumber;
      }
      if (registrationDetails.bankIfscCode) {
        updateData.bankIfscCode = registrationDetails.bankIfscCode;
      }

      await updateDoc(userDocRef, updateData);

      // Handle referral linking by looking up sponsor info directly
      try {
        const userDocRefForSponsor = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRefForSponsor);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const sponsorUid = userData.sponsor?.uid || "root";
          if (sponsorUid && sponsorUid !== "root") {
            const campaign = campaignsList.find(c => c.id === campaignId) || { name: campaignId };
            const q = query(
              collection(db, "referrals"),
              where("referrerUid", "==", sponsorUid),
              where("refereeUid", "==", user.uid),
              where("campaignId", "==", campaignId)
            );
            const snap = await getDocs(q);
            if (snap.empty) {
              const referralDoc = {
                referrerUid: sponsorUid,
                refereeUid: user.uid,
                refereeName: userData.name || registrationDetails.fullName || "Referee Partner",
                refereeEmail: user.email || "",
                campaignId: campaignId,
                campaignName: campaign.name,
                rewardAmount: campaign.reward || 100,
                status: "pending",
                createdAt: new Date().toISOString()
              };
              await addDoc(collection(db, "referrals"), referralDoc);
              
              await addDoc(collection(db, "notifications"), {
                uid: sponsorUid,
                message: `${userData.name || registrationDetails.fullName} registered for ${campaign.name} via your downline link! +₹${campaign.reward || 100} payout pending verification.`,
                type: "referral_started",
                createdAt: serverTimestamp(),
                read: false
              });
            }
          }
        }
      } catch (refErr) {
        console.warn("Failed mapping sponsor referral link trace:", refErr);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to register campaign.", "danger");
    }
  };

  const handleUpdateCampaignSteps = async (campaignId, completedSteps) => {
    if (!user) return;
    const updatedJoinedCampaigns = {
      ...joinedCampaigns,
      [campaignId]: {
        ...joinedCampaigns[campaignId],
        completedSteps
      }
    };

    try {
      await updateDoc(doc(db, "users", user.uid), {
        joinedCampaigns: updatedJoinedCampaigns
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitCampaign = async (campaignId, verificationNotes = "") => {
    if (!user) return;
    const campaign = campaignsList.find(c => c.id === campaignId);
    const reward = campaign ? campaign.reward : 100;
    const currentPending = profileData?.earnings?.pending || 0;

    const updatedJoinedCampaigns = {
      ...joinedCampaigns,
      [campaignId]: {
        ...joinedCampaigns[campaignId],
        status: "Submitted",
        submittedAt: new Date().toISOString(),
        verificationNotes: verificationNotes
      }
    };

    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        joinedCampaigns: updatedJoinedCampaigns,
        "earnings.pending": currentPending + reward,
        campaignCount: increment(1),
        updatedAt: new Date().toISOString()
      });

      // Propagate completion upward to all ancestors in the referralPath
      if (profileData?.referralPath) {
        await propagateCampaignCompleted(profileData.referralPath, user.uid);
      }

      // Sync status to the corresponding referrals document for the sponsor
      const sponsorUid = profileData?.sponsor?.uid || "root";
      if (sponsorUid && sponsorUid !== "root") {
        try {
          const q = query(
            collection(db, "referrals"),
            where("referrerUid", "==", sponsorUid),
            where("refereeUid", "==", user.uid),
            where("campaignId", "==", campaignId)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            await updateDoc(doc(db, "referrals", snap.docs[0].id), {
              status: "submitted",
              updatedAt: new Date().toISOString()
            });
          } else {
            await addDoc(collection(db, "referrals"), {
              referrerUid: sponsorUid,
              refereeUid: user.uid,
              refereeName: profileData.name || "Referee Partner",
              refereeEmail: user.email || "",
              campaignId: campaignId,
              campaignName: campaign?.name || campaignId,
              rewardAmount: reward,
              status: "submitted",
              createdAt: new Date().toISOString()
            });
          }
        } catch (syncErr) {
          console.warn("Failed syncing referral submission status:", syncErr);
        }
      }

      // Verification notification
      await addDoc(collection(db, "notifications"), {
        uid: user.uid,
        message: `Your verification request for ${campaign?.name || campaignId} has been submitted. Payout of ₹${reward} pending audit.`,
        type: "campaign_submitted",
        createdAt: serverTimestamp(),
        read: false
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetCampaign = async (campaignId) => {
    if (!user) return;
    const updatedJoinedCampaigns = {
      ...joinedCampaigns,
      [campaignId]: {
        ...joinedCampaigns[campaignId],
        status: "In Progress",
        resubmittedAt: new Date().toISOString()
      }
    };

    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        joinedCampaigns: updatedJoinedCampaigns
      });

      await addDoc(collection(db, "notifications"), {
        uid: user.uid,
        message: `Campaign status for ${(campaignsList.find(c => c.id === campaignId)?.name || campaignId)} reset to In Progress.`,
        type: "campaign_reset",
        createdAt: serverTimestamp(),
        read: false
      });
    } catch (err) {
      console.error(err);
      showToast("Failed to reset campaign.", "danger");
    }
  };

  const handleUpdateProfile = (updatedUser) => {
    setProfileData(updatedUser);
  };

  // Postback handler logic is defined as a top-level component at the bottom of this file

  // Route Guards and MainLayout are defined as top-level components below the App component

  // Loading Indicator — Premium Dynamic Loader
  if (loading && !user) {
    return <PremiumLoader text="Opening secure session..." />;
  }

  return (
    <Router>
      <ScrollToTop />
      <MaintenanceWrapper maintenance={maintenance} isSuperAdmin={user?.email === "udaykiranvempati123@gmail.com"} loading={loading}>
        <Routes>
        {/* Landing Page */}
        <Route 
          path="/" 
          element={
            user && profileData ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <div className="bg-luxury-dark min-h-screen flex flex-col justify-between">
                <div className="toast-container">
                  {toasts.map((t) => (
                    <div key={t.id} className={`toast border text-xs font-bold ${t.type === "success" ? "bg-emerald-950 border-emerald-800 text-emerald-300" : t.type === "danger" ? "bg-red-950 border-red-800 text-red-300" : "bg-luxury-navy border-slate-700 text-slate-300"}`}>
                      <span>{t.message}</span>
                    </div>
                  ))}
                </div>
                
                <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between h-[68px] px-6 lg:px-10" style={{
                  background: "rgba(4,8,15,0.88)",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  boxShadow: "0 1px 0 rgba(234,179,8,0.08), 0 4px 32px rgba(0,0,0,0.4)"
                }}>
                   {/* Brand mark */}
                  <Link to="/" className="flex items-center gap-2.5 group" style={{ textDecoration:"none" }}>
                    <div style={{
                      width:38, height:38, borderRadius:11,
                      background: "linear-gradient(135deg, #FBBF24 0%, #F59E0B 60%, #EAB308 100%)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      boxShadow:"0 0 22px rgba(234,179,8,0.42), 0 2px 8px rgba(0,0,0,0.3)",
                      transition:"transform 0.2s ease, box-shadow 0.2s ease"
                    }} className="group-hover:scale-105">
                      <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:900, fontSize:20, color:"#0A0F1A", lineHeight:1 }}>R</span>
                    </div>
                    <div className="hidden sm:flex flex-col justify-center">
                      <div className="flex items-center leading-none">
                        <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:900, fontSize:22, color:"#fff", letterSpacing:"-0.02em" }}>Refer</span>
                        <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:900, fontSize:22, letterSpacing:"-0.02em", background:"linear-gradient(135deg, #FBBF24, #EAB308)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>X</span>
                      </div>
                      <span className="text-[7.5px] text-slate-500 font-extrabold tracking-wider uppercase font-sans mt-0.5 leading-none block">by RubiCorn Technologies Pvt. Ltd.</span>
                    </div>
                  </Link>

                  {/* Center trust badge */}
                  <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full" style={{ background:"rgba(16,185,129,0.07)", border:"1px solid rgba(16,185,129,0.18)" }}>
                    <span style={{ width:5, height:5, borderRadius:"50%", background:"#10B981", display:"inline-block", animation:"tickDot 1.5s ease-in-out infinite" }} />
                    <span style={{ fontSize:10, fontWeight:700, color:"rgba(52,211,153,0.85)", letterSpacing:"0.1em", textTransform:"uppercase" }}>All systems live</span>
                  </div>

                  {/* Nav CTAs */}
                  <div className="flex items-center gap-2.5">
                    <Link to="/login" style={{ fontSize:13, fontWeight:600, color:"rgba(148,163,184,0.75)", textDecoration:"none", padding:"6px 14px", borderRadius:10, transition:"color 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.color="#fff"}
                      onMouseLeave={e => e.currentTarget.style.color="rgba(148,163,184,0.75)"}
                    >
                      Sign In
                    </Link>
                    <Link to="/login" style={{
                      fontSize:13, fontWeight:800, color:"#0A0F1A",
                      background:"linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #EAB308 100%)",
                      padding:"8px 18px", borderRadius:10, textDecoration:"none",
                      boxShadow:"0 4px 18px rgba(234,179,8,0.32)",
                      transition:"all 0.25s ease",
                      display:"inline-flex", alignItems:"center", gap:5
                    }}
                      onMouseEnter={e => { e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 8px 28px rgba(234,179,8,0.48)"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 4px 18px rgba(234,179,8,0.32)"; }}
                    >
                      Join Free
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M2.5 6.5h8M7 3l3.5 3.5L7 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  </div>
                </header>

                <main className="mt-[68px] flex-1 flex flex-col justify-between">
                  <Homepage 
                    campaigns={campaignsList}
                    homepageContent={homepageContent}
                    pageContent={pageContent}
                    onGetStarted={() => window.location.href = "#/login"}
                    onLoginTrigger={() => window.location.href = "#/login"}
                  />
                  <Footer user={null} activeView="homepage" pageContent={pageContent} />
                </main>
              </div>
            )
          } 
        />

        {/* Auth page */}
        <Route 
          path="/login" 
          element={
            user && profileData ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <div className="toast-container-wrapper">
                <div className="toast-container">
                  {toasts.map((t) => (
                    <div key={t.id} className={`toast border text-xs font-bold ${t.type === "success" ? "bg-emerald-950 border-emerald-800 text-emerald-300" : t.type === "danger" ? "bg-red-950 border-red-800 text-red-300" : "bg-luxury-navy border-slate-700 text-slate-300"}`}>
                      <span>{t.message}</span>
                    </div>
                  ))}
                </div>
                <AuthPanels 
                  onLogin={handleEmailLogin} 
                  onRegister={handleEmailRegister} 
                  onGoogleLogin={() => handleGoogleLogin(window.location.replace)}
                  onGoogleLoginWithNavigate={handleGoogleLogin}
                  onBackToHome={() => window.location.href = "#/"}
                />
              </div>
            )
          } 
        />

        {/* Admin manual login */}
        <Route 
          path="/admin-login" 
          element={
            user && profileData ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <div className="toast-container-wrapper">
                <div className="toast-container">
                  {toasts.map((t) => (
                    <div key={t.id} className={`toast border text-xs font-bold ${t.type === "success" ? "bg-emerald-950 border-emerald-800 text-emerald-300" : t.type === "danger" ? "bg-red-950 border-red-800 text-red-300" : "bg-luxury-navy border-slate-700 text-slate-300"}`}>
                      <span>{t.message}</span>
                    </div>
                  ))}
                </div>
                <AuthPanels 
                  adminMode={true}
                  onLogin={handleEmailLogin} 
                  onRegister={handleEmailRegister} 
                  onGoogleLogin={() => handleGoogleLogin(window.location.replace)}
                  onGoogleLoginWithNavigate={handleGoogleLogin}
                  onBackToHome={() => window.location.href = "#/"}
                />
              </div>
            )
          } 
        />

        {/* Referral Landing Guest Gateway */}
        <Route 
          path="/register" 
          element={
            <div className="bg-luxury-dark min-h-screen py-20 px-6">
              <div className="toast-container">
                {toasts.map((t) => (
                  <div key={t.id} className={`toast border text-xs font-bold ${t.type === "success" ? "bg-emerald-950 border-emerald-800 text-emerald-300" : t.type === "danger" ? "bg-red-950 border-red-800 text-red-300" : "bg-luxury-navy border-slate-700 text-slate-300"}`}>
                    <span>{t.message}</span>
                  </div>
                ))}
              </div>
              <ReferralLanding 
                user={user}
                profileData={profileData}
                campaigns={campaignsList}
                handleGoogleLogin={handleGoogleLogin}
                setView={() => {}}
                setActiveCampaignId={() => {}}
                showToast={showToast}
                onNavigateToAuth={() => window.location.href = "#/login"}
              />
            </div>
          } 
        />
        <Route 
          path="/ref" 
          element={
            <div className="bg-luxury-dark min-h-screen py-20 px-6">
              <div className="toast-container">
                {toasts.map((t) => (
                  <div key={t.id} className={`toast border text-xs font-bold ${t.type === "success" ? "bg-emerald-950 border-emerald-800 text-emerald-300" : t.type === "danger" ? "bg-red-950 border-red-800 text-red-300" : "bg-luxury-navy border-slate-700 text-slate-300"}`}>
                    <span>{t.message}</span>
                  </div>
                ))}
              </div>
              <ReferralLanding 
                user={user}
                profileData={profileData}
                campaigns={campaignsList}
                handleGoogleLogin={handleGoogleLogin}
                setView={() => {}}
                setActiveCampaignId={() => {}}
                showToast={showToast}
                onNavigateToAuth={() => window.location.href = "#/login"}
              />
            </div>
          } 
        />

        {/* Postback Redirect Click/Complete processor */}
        <Route path="/gateway" element={<CompletionProcessor campaignsList={campaignsList} showToast={showToast} currentUser={user} />} />



        {/* Dashboard Router */}
        <Route 
          path="/dashboard" 
          element={
            <AuthGuard loading={loading} user={user} profileData={profileData}>
              <MainLayout 
                toasts={toasts}
                isAdmin={isAdmin}
                notifications={notifications}
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
                profileData={profileData}
                user={user}
                pageContent={pageContent}
              >
                <Dashboard 
                  user={profileData} 
                  joinedCampaigns={joinedCampaigns} 
                  referrals={referrals}
                  campaigns={campaignsList}
                  showToast={showToast}
                  pageContent={pageContent}
                />
              </MainLayout>
            </AuthGuard>
          } 
        />

        {/* Campaigns Grid Router */}
        <Route 
          path="/campaigns" 
          element={
            <AuthGuard loading={loading} user={user} profileData={profileData}>
              <MainLayout 
                toasts={toasts}
                isAdmin={isAdmin}
                notifications={notifications}
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
                profileData={profileData}
                user={user}
                pageContent={pageContent}
              >
                <Campaigns 
                  user={profileData} 
                  joinedCampaigns={joinedCampaigns} 
                  campaigns={campaignsList}
                  onRegisterCampaign={handleRegisterCampaign}
                  onUpdateCampaignSteps={handleUpdateCampaignSteps}
                  onSubmitCampaign={handleSubmitCampaign}
                  onResetCampaign={handleResetCampaign}
                  showToast={showToast}
                  activeCampaignId={null}
                  setActiveCampaignId={() => {}}
                  pageContent={pageContent}
                />
              </MainLayout>
            </AuthGuard>
          } 
        />

        {/* Team downline hierarchy tracking */}
        <Route 
          path="/team" 
          element={
            <AuthGuard loading={loading} user={user} profileData={profileData}>
              <MainLayout 
                toasts={toasts}
                isAdmin={isAdmin}
                notifications={notifications}
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
                profileData={profileData}
                user={user}
                pageContent={pageContent}
              >
                <Team 
                  user={profileData} 
                  campaigns={campaignsList}
                  showToast={showToast}
                  pageContent={pageContent}
                />
              </MainLayout>
            </AuthGuard>
          } 
        />

        {/* Operations audit activities log */}
        <Route 
          path="/activity" 
          element={
            <AuthGuard loading={loading} user={user} profileData={profileData}>
              <MainLayout 
                toasts={toasts}
                isAdmin={isAdmin}
                notifications={notifications}
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
                profileData={profileData}
                user={user}
                pageContent={pageContent}
              >
                <Activity 
                  user={profileData}
                  showToast={showToast}
                />
              </MainLayout>
            </AuthGuard>
          } 
        />

        {/* Profile Details Edit */}
        <Route 
          path="/profile" 
          element={
            <AuthGuard loading={loading} user={user} profileData={profileData}>
              <MainLayout 
                toasts={toasts}
                isAdmin={isAdmin}
                notifications={notifications}
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
                profileData={profileData}
                user={user}
                pageContent={pageContent}
              >
                <Profile 
                  user={profileData} 
                  joinedCampaigns={joinedCampaigns} 
                  referrals={referrals}
                  campaigns={campaignsList}
                  onUpdateProfile={handleUpdateProfile}
                  onLogout={() => handleLogout(window.location.replace)}
                  showToast={showToast}
                  pageContent={pageContent}
                />
              </MainLayout>
            </AuthGuard>
          } 
        />

        {/* Wallet ledger withdrawals */}
        <Route 
          path="/wallet" 
          element={
            <AuthGuard loading={loading} user={user} profileData={profileData}>
              <MainLayout 
                toasts={toasts}
                isAdmin={isAdmin}
                notifications={notifications}
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
                profileData={profileData}
                user={user}
                pageContent={pageContent}
              >
                <Earnings 
                  user={profileData}
                  joinedCampaigns={joinedCampaigns}
                  referrals={referrals}
                  campaigns={campaignsList}
                  showToast={showToast}
                  pageContent={pageContent}
                />
              </MainLayout>
            </AuthGuard>
          } 
        />

        {/* Admin Console Node */}
        <Route 
          path="/admin" 
          element={
            <AdminGuard loading={loading} user={user} profileData={profileData} isAdmin={isAdmin}>
              <MainLayout 
                toasts={toasts}
                isAdmin={isAdmin}
                notifications={notifications}
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
                profileData={profileData}
                user={user}
                pageContent={pageContent}
              >
                <AdminPanel 
                  user={profileData}
                  campaigns={campaignsList}
                  showToast={showToast}
                  pageContent={pageContent}
                />
              </MainLayout>
            </AdminGuard>
          } 
        />
        <Route 
          path="/admin/team-management" 
          element={
            <AdminGuard loading={loading} user={user} profileData={profileData} isAdmin={isAdmin}>
              <MainLayout 
                toasts={toasts}
                isAdmin={isAdmin}
                notifications={notifications}
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
                profileData={profileData}
                user={user}
                pageContent={pageContent}
              >
                <AdminPanel 
                  user={profileData}
                  campaigns={campaignsList}
                  showToast={showToast}
                  defaultTab="team-management"
                />
              </MainLayout>
            </AdminGuard>
          } 
        />

        {/* Super Admin Panel Route */}
        <Route 
          path="/super-admin" 
          element={
            <SuperAdminGuard loading={loading} user={user} profileData={profileData}>
              <MainLayout 
                toasts={toasts}
                isAdmin={isAdmin}
                notifications={notifications}
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
                profileData={profileData}
                user={user}
                pageContent={pageContent}
              >
                <SuperAdminPanel 
                  showToast={showToast}
                />
              </MainLayout>
            </SuperAdminGuard>
          } 
        />

        {/* Company Details */}
        <Route 
          path="/company-details" 
          element={
            user && profileData ? (
              <MainLayout 
                toasts={toasts}
                isAdmin={isAdmin}
                notifications={notifications}
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
                profileData={profileData}
                user={user}
                pageContent={pageContent}
              >
                <CompanyDetails user={profileData} />
              </MainLayout>
            ) : (
              <div className="bg-luxury-dark min-h-screen flex flex-col justify-between">
                <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between h-[68px] px-6 lg:px-10" style={{
                  background: "rgba(4,8,15,0.88)",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  boxShadow: "0 1px 0 rgba(234,179,8,0.08), 0 4px 32px rgba(0,0,0,0.4)"
                }}>
                  <Link to="/" className="flex items-center gap-2.5 group" style={{ textDecoration:"none" }}>
                    <div style={{
                      width:38, height:38, borderRadius:11,
                      background: "linear-gradient(135deg, #FBBF24 0%, #F59E0B 60%, #EAB308 100%)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      boxShadow:"0 0 22px rgba(234,179,8,0.42), 0 2px 8px rgba(0,0,0,0.3)",
                      transition:"transform 0.2s ease, box-shadow 0.2s ease"
                    }} className="group-hover:scale-105">
                      <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:900, fontSize:20, color:"#0A0F1A", lineHeight:1 }}>R</span>
                    </div>
                    <div className="hidden sm:flex flex-col justify-center">
                      <div className="flex items-center leading-none">
                        <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:900, fontSize:22, color:"#fff", letterSpacing:"-0.02em" }}>Refer</span>
                        <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:900, fontSize:22, letterSpacing:"-0.02em", background:"linear-gradient(135deg, #FBBF24, #EAB308)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>X</span>
                      </div>
                      <span className="text-[7.5px] text-slate-500 font-extrabold tracking-wider uppercase font-sans mt-0.5 leading-none block">by RubiCorn Technologies Pvt. Ltd.</span>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2.5">
                    <Link to="/login" style={{
                      fontSize:13, fontWeight:800, color:"#0A0F1A",
                      background:"linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #EAB308 100%)",
                      padding:"8px 18px", borderRadius:10, textDecoration:"none",
                      boxShadow:"0 4px 18px rgba(234,179,8,0.32)",
                      transition:"all 0.25s ease",
                      display:"inline-flex", alignItems:"center", gap:5
                    }}>
                      Sign In
                    </Link>
                  </div>
                </header>
                <main className="mt-[100px] mb-[40px] flex-1 max-w-6xl mx-auto w-full px-6">
                  <CompanyDetails user={null} />
                </main>
                <Footer user={null} activeView="company-details" pageContent={pageContent} />
              </div>
            )
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </MaintenanceWrapper>
    </Router>
  );
}

const CompletionProcessor = ({ campaignsList, showToast, currentUser }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | redirecting | done
  const [statusMsg, setStatusMsg] = useState("Initializing secure gateway...");
  const [subMsg, setSubMsg] = useState("Please wait while we verify your link");
  
  useEffect(() => {
    // Robust extraction from React Router searchParams, window.location.search and window.location.hash
    const getQueryParam = (name) => {
      if (searchParams && searchParams.has(name)) {
        return searchParams.get(name);
      }
      const searchP = new URLSearchParams(window.location.search);
      if (searchP.has(name)) {
        return searchP.get(name);
      }
      const hash = window.location.hash;
      const questionMarkIndex = hash.indexOf("?");
      if (questionMarkIndex !== -1) {
        const hashSearch = hash.substring(questionMarkIndex);
        const hashP = new URLSearchParams(hashSearch);
        if (hashP.has(name)) {
          return hashP.get(name);
        }
      }
      return null;
    };

    const action = getQueryParam("action");
    const campaignIdParam = getQueryParam("campaignId");
    const userIdParam = getQueryParam("userId");

    if (action === "click" && campaignIdParam && userIdParam) {
      const recordClick = async () => {
        let redirectUrl = "";
        let campaignName = campaignIdParam;
        let targetUid = userIdParam;
        let resolvedReferralCode = userIdParam;

        try {
          setStatusMsg("Verifying campaign link...");
          setSubMsg("Looking up your campaign details");

          // 1. Try Firestore fetch first to ensure we get the latest admin-configured redirect link
          try {
            const campaignDocRef = doc(db, "campaigns", campaignIdParam);
            const campaignSnap = await getDoc(campaignDocRef);
            if (campaignSnap.exists()) {
              const data = campaignSnap.data();
              redirectUrl = data.redirectUrl;
              campaignName = data.name || campaignIdParam;
            } else {
              // Fallback to local list if not found in Firestore
              const campaign = campaignsList.find(c => c.id === campaignIdParam);
              if (campaign) {
                redirectUrl = campaign.redirectUrl;
                campaignName = campaign.name;
              }
            }
          } catch (docErr) {
            console.warn("Click gateway: failed to fetch campaign details from Firestore:", docErr);
            // Fallback on error
            const campaign = campaignsList.find(c => c.id === campaignIdParam);
            if (campaign) {
              redirectUrl = campaign.redirectUrl;
              campaignName = campaign.name;
            }
          }

          setStatusMsg("Logging your click...");
          setSubMsg("Registering activity in the system");

          // 2. Resolve UID and Referral Code robustly
          let userDocFound = false;

          try {
            // First try direct doc fetch assuming userIdParam is the Firebase UID
            const directDocRef = doc(db, "users", userIdParam);
            const directDocSnap = await getDoc(directDocRef);
            if (directDocSnap.exists()) {
              targetUid = userIdParam;
              resolvedReferralCode = directDocSnap.data().referralCode || directDocSnap.data().userId || userIdParam;
              userDocFound = true;
            } else {
              // Not a direct UID, let's search by referralCode or userId
              const cleanUserId = userIdParam.replace(/^(USR|REF)/i, "");
              
              let foundUserDoc = null;
              // 1. Search by referralCode
              const q1 = query(collection(db, "users"), where("referralCode", "==", userIdParam), limit(1));
              const snap1 = await getDocs(q1);
              if (!snap1.empty) {
                foundUserDoc = snap1.docs[0];
              } else {
                // 2. Search by userId
                const q2 = query(collection(db, "users"), where("userId", "==", userIdParam), limit(1));
                const snap2 = await getDocs(q2);
                if (!snap2.empty) {
                  foundUserDoc = snap2.docs[0];
                } else {
                  // 3. Search by cleanUserId
                  const q3 = query(collection(db, "users"), where("userId", "==", cleanUserId), limit(1));
                  const snap3 = await getDocs(q3);
                  if (!snap3.empty) {
                    foundUserDoc = snap3.docs[0];
                  }
                }
              }

              if (foundUserDoc) {
                targetUid = foundUserDoc.id;
                resolvedReferralCode = foundUserDoc.data().referralCode || foundUserDoc.data().userId || userIdParam;
                userDocFound = true;
              }
            }
          } catch (uErr) {
            console.warn("Click gateway: failed to resolve user mapping", uErr);
          }

          const clickId = "CLK" + Math.floor(100000 + Math.random() * 900000);
          
          // 3. Log click tracking in database in background (with a short timeout so it never blocks the redirect)
          const writePromise = setDoc(doc(db, "campaignClicks", clickId), {
            clickId,
            userId: targetUid,
            userName: "Outbound Redirect Tracker",
            campaignId: campaignIdParam,
            campaignName,
            timestamp: serverTimestamp(),
            status: "Started"
          });

          // Wait a maximum of 400ms for database write to succeed, then redirect immediately
          await Promise.race([
            writePromise,
            new Promise((resolve) => setTimeout(resolve, 400))
          ]);

          // 4. Redirect user
          if (redirectUrl) {
            setStatus("redirecting");
            setStatusMsg(`Taking you to ${campaignName}...`);
            setSubMsg("You will be redirected in a moment");
            setTimeout(() => {
              const finalUrl = getNormalizedRedirectUrl(redirectUrl, clickId, resolvedReferralCode);
              window.location.href = finalUrl;
            }, 800);
          } else {
            showToast(`Campaign "${campaignName}" not configured or inactive. Redirecting.`, "danger");
            navigate(currentUser ? "/campaigns" : "/");
          }
        } catch (e) {
          console.error("Click tracking gateway error:", e);
          if (redirectUrl) {
            setStatus("redirecting");
            setStatusMsg("Redirecting you now...");
            setSubMsg("Proceeding to destination");
            setTimeout(() => {
              const clickId = "CLK" + Math.floor(100000 + Math.random() * 900000);
              const finalUrl = getNormalizedRedirectUrl(redirectUrl, clickId, resolvedReferralCode);
              window.location.href = finalUrl;
            }, 800);
          } else {
            showToast("Error processing campaign gateway link.", "danger");
            navigate(currentUser ? "/campaigns" : "/");
          }
        }
      };
      recordClick();
    } else if (action === "complete" && campaignIdParam && userIdParam) {
      const recordCompletion = async () => {
        try {
          setStatusMsg("Processing your completion...");
          setSubMsg("Recording campaign activity");

          let targetUid = userIdParam;
          let targetUserName = "Referee Partner";
          let refereeEmailStr = "";
          let userDocFound = false;

          try {
            // First try direct doc fetch assuming userIdParam is the Firebase UID
            const directDocRef = doc(db, "users", userIdParam);
            const directDocSnap = await getDoc(directDocRef);
            if (directDocSnap.exists()) {
              targetUid = userIdParam;
              targetUserName = directDocSnap.data().name || targetUserName;
              refereeEmailStr = directDocSnap.data().email || refereeEmailStr;
              userDocFound = true;
            } else {
              // Not a direct UID, let's search by referralCode or userId
              const cleanUserId = userIdParam.replace(/^(USR|REF)/i, "");
              
              let foundUserDoc = null;
              // 1. Search by referralCode
              const q1 = query(collection(db, "users"), where("referralCode", "==", userIdParam), limit(1));
              const snap1 = await getDocs(q1);
              if (!snap1.empty) {
                foundUserDoc = snap1.docs[0];
              } else {
                // 2. Search by userId
                const q2 = query(collection(db, "users"), where("userId", "==", userIdParam), limit(1));
                const snap2 = await getDocs(q2);
                if (!snap2.empty) {
                  foundUserDoc = snap2.docs[0];
                } else {
                  // 3. Search by cleanUserId
                  const q3 = query(collection(db, "users"), where("userId", "==", cleanUserId), limit(1));
                  const snap3 = await getDocs(q3);
                  if (!snap3.empty) {
                    foundUserDoc = snap3.docs[0];
                  }
                }
              }

              if (foundUserDoc) {
                targetUid = foundUserDoc.id;
                targetUserName = foundUserDoc.data().name || targetUserName;
                refereeEmailStr = foundUserDoc.data().email || refereeEmailStr;
                userDocFound = true;
              }
            }
          } catch (uErr) {
            console.warn("Completion gateway: failed to resolve user mapping", uErr);
          }

          // Fallback if not found yet (e.g. check if targetUid as sequential userId matches)
          if (!userDocFound) {
            try {
              const uQuery = query(collection(db, "users"), where("userId", "==", targetUid), limit(1));
              const snap = await getDocs(uQuery);
              if (!snap.empty) {
                targetUid = snap.docs[0].id;
                targetUserName = snap.docs[0].data().name;
                refereeEmailStr = snap.docs[0].data().email;
                userDocFound = true;
              }
            } catch (uErr) {
              console.warn("Completion gateway: fallback query failed", uErr);
            }
          }

          // Fetch campaign details
          let campaignName = campaignIdParam;
          let reward = 100;
          try {
            const campaignDocRef = doc(db, "campaigns", campaignIdParam);
            const campaignSnap = await getDoc(campaignDocRef);
            if (campaignSnap.exists()) {
              const data = campaignSnap.data();
              campaignName = data.name || campaignIdParam;
              reward = data.reward || 100;
            } else {
              const campaign = campaignsList.find(c => c.id === campaignIdParam);
              if (campaign) {
                campaignName = campaign.name;
                reward = campaign.reward;
              }
            }
          } catch (cErr) {
            console.warn("Completion gateway: failed to load campaign info", cErr);
            const campaign = campaignsList.find(c => c.id === campaignIdParam);
            if (campaign) {
              campaignName = campaign.name;
              reward = campaign.reward;
            }
          }

          setStatusMsg("Updating your earnings...");
          setSubMsg(`Campaign: ${campaignName} — ₹${reward} pending audit`);

          // Log completion event (failure should not crash the page, but let's log it)
          try {
            await addDoc(collection(db, "campaignClicks"), {
              userId: targetUid,
              campaignId: campaignIdParam,
              timestamp: serverTimestamp(),
              status: "Completed"
            });
          } catch (logErr) {
            console.warn("Completion gateway: failed to log completion click", logErr);
          }

          // Update user profile status
          try {
            const userDocRef = doc(db, "users", targetUid);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              const joinedData = userData.joinedCampaigns?.[campaignIdParam] || {};

              if (joinedData.status !== "Approved" && joinedData.status !== "Submitted") {
                const currentPending = userData.earnings?.pending || 0;

                const updatedJoined = {
                  ...(userData.joinedCampaigns || {}),
                  [campaignIdParam]: {
                    ...joinedData,
                    status: "Submitted",
                    submittedAt: new Date().toISOString(),
                    verificationNotes: "Automatically submitted via callback redirect postback link."
                  }
                };

                await updateDoc(userDocRef, {
                  joinedCampaigns: updatedJoined,
                  "earnings.pending": currentPending + reward,
                  campaignCount: increment(1),
                  updatedAt: new Date().toISOString()
                });

                // Propagate completion upward to all ancestors
                if (userData.referralPath) {
                  await propagateCampaignCompleted(userData.referralPath, targetUid);
                }

                // Sync status to the corresponding referrals document for the sponsor
                const sponsorUid = userData.sponsor?.uid || "root";
                if (sponsorUid && sponsorUid !== "root") {
                  try {
                    const q = query(
                      collection(db, "referrals"),
                      where("referrerUid", "==", sponsorUid),
                      where("refereeUid", "==", targetUid),
                      where("campaignId", "==", campaignIdParam)
                    );
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                      await updateDoc(doc(db, "referrals", snap.docs[0].id), {
                        status: "submitted",
                        updatedAt: new Date().toISOString()
                      });
                    } else {
                      await addDoc(collection(db, "referrals"), {
                        referrerUid: sponsorUid,
                        refereeUid: targetUid,
                        refereeName: userData.name || targetUserName || "Referee Partner",
                        refereeEmail: userData.email || refereeEmailStr || "",
                        campaignId: campaignIdParam,
                        campaignName: campaignName,
                        rewardAmount: reward,
                        status: "submitted",
                        createdAt: new Date().toISOString()
                      });
                    }
                  } catch (syncErr) {
                    console.warn("Failed syncing callback referral status:", syncErr);
                  }
                }

                await addDoc(collection(db, "notifications"), {
                  uid: targetUid,
                  message: `KYC callback for ${campaignName} recorded and submitted for audit.`,
                  type: "campaign_submitted",
                  createdAt: serverTimestamp(),
                  read: false
                });

                await addDoc(collection(db, "activities"), {
                  userId: targetUid,
                  userName: targetUserName,
                  action: "Campaign Submission",
                  details: `Callback redirect processed for campaign: ${campaignName}. Status: Submitted.`,
                  timestamp: serverTimestamp()
                });
              }
            }
          } catch (dbErr) {
            console.error("Completion gateway: failed to write user completion update", dbErr);
          }

          setStatus("done");
          setStatusMsg("All done! Callback processed.");
          setSubMsg("Returning you to your dashboard...");
          showToast("Callback processed successfully!", "success");
          setTimeout(() => navigate(currentUser ? "/dashboard" : "/"), 1500);
        } catch (e) {
          console.error("Completion gateway error:", e);
          navigate(currentUser ? "/dashboard" : "/");
        }
      };
      recordCompletion();
    } else {
      navigate(currentUser ? "/dashboard" : "/");
    }
  }, [searchParams, campaignsList, currentUser]);

  const isRedirecting = status === "redirecting";
  const isDone = status === "done";

  return (
    <div className="min-h-screen bg-luxury-gradient flex flex-col items-center justify-center px-4">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-luxury-gold/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-sm w-full">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center text-luxury-dark font-black shadow-gold-glow text-lg">R</div>
          <span className="font-display font-black tracking-tight text-white text-lg">ReferX <span className="text-gold-gradient">Gateway</span></span>
        </div>

        {/* Spinner / Status Icon */}
        <div className="relative w-24 h-24">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
          {/* Spinning ring */}
          {!isDone && (
            <div
              className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
              style={{ borderTopColor: isRedirecting ? "#8B5CF6" : "#A78BFA", animationDuration: isRedirecting ? "0.7s" : "1.2s" }}
            />
          )}
          {isDone && (
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500" />
          )}
          {/* Inner icon */}
          <div className="absolute inset-3 rounded-full bg-luxury-navy/80 flex items-center justify-center">
            {isDone ? (
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : isRedirecting ? (
              <svg className="w-8 h-8 text-luxury-gold" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            )}
          </div>
        </div>

        {/* Status Text */}
        <div className="text-center">
          <p className="text-white font-bold text-lg mb-2 transition-all duration-500">{statusMsg}</p>
          <p className="text-slate-400 text-sm">{subMsg}</p>
        </div>

        {/* Progress dots */}
        {!isDone && (
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-luxury-gold"
                style={{
                  animation: "pulse 1.4s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`,
                  opacity: 0.6
                }}
              />
            ))}
          </div>
        )}

        <p className="text-xs text-slate-600 text-center mt-4">
          Secured by ReferX · Do not close this tab
        </p>
      </div>
    </div>
  );
};



// Top-Level Route Guards & Layout Component Definitions (declared outside App to prevent unmounting re-renders)
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const AuthGuard = ({ children, loading, user, profileData }) => {
  const location = useLocation();
  
  if (loading && (!user || !profileData)) {
    return <PremiumLoader text="Verifying dashboard node..." />;
  }
  
  if (!user || !profileData) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  return children;
};

const AdminGuard = ({ children, loading, user, profileData, isAdmin }) => {
  if (loading && (!user || !profileData)) return null;
  if (!user || !profileData || !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const SuperAdminGuard = ({ children, loading, user, profileData }) => {
  if (loading && (!user || !profileData)) return null;
  const isSuper = user?.email === "udaykiranvempati123@gmail.com";
  if (!user || !profileData || !isSuper) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const MaintenanceWrapper = ({ children, maintenance, isSuperAdmin, loading }) => {
  const location = useLocation();

  if (loading) {
    return <PremiumLoader text="Loading secure content..." />;
  }

  const isAuthRoute = location.pathname === "/login" || 
                      location.pathname === "/admin-login" || 
                      location.pathname.startsWith("/super-admin");

  if (maintenance?.active && !isSuperAdmin && !isAuthRoute) {
    return <MaintenancePage maintenance={maintenance} />;
  }

  return children;
};

const MainLayout = ({ 
  children, 
  user,
  profileData,
  isAdmin, 
  toasts, 
  notifications, 
  showNotifications, 
  setShowNotifications,
  pageContent
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getDesktopTabClass = (path) => {
    const isActive = path === "/dashboard" 
      ? location.pathname === "/dashboard"
      : path === "/campaigns"
        ? location.pathname.startsWith("/campaign")
        : location.pathname === path;
        
    return `flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative select-none ${
      isActive 
        ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-[0_4px_20px_rgba(234,179,8,0.3)] scale-[1.03]" 
        : "text-slate-400 hover:text-white hover:bg-white/[0.06] hover:scale-[1.01]"
    }`;
  };

  const getMobileTabClass = (path) => {
    const isActive = path === "/dashboard" 
      ? location.pathname === "/dashboard"
      : path === "/campaigns"
        ? location.pathname.startsWith("/campaign")
        : location.pathname === path;

    return `flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all duration-200 active:scale-90 select-none ${
      isActive 
        ? "text-yellow-400 bg-yellow-500/10 font-bold" 
        : "text-slate-400 hover:text-white"
    }`;
  };

  const getPageIndicatorGradient = () => {
    if (location.pathname === "/dashboard") return "from-yellow-400 to-amber-500";
    if (location.pathname.startsWith("/campaign")) return "from-amber-400 to-orange-500";
    if (location.pathname === "/wallet") return "from-emerald-400 to-teal-500";
    if (location.pathname === "/profile") return "from-teal-400 to-emerald-500";
    if (location.pathname.startsWith("/admin")) return "from-yellow-400 to-amber-500";
    return "from-yellow-400 to-amber-500";
  };

  const getToastStyles = (type) => {
    if (type === "success") {
      return {
        bg: "bg-[#0A1A12]/95 border-emerald-500/30 text-emerald-300 border-l-emerald-500",
        icon: "check_circle"
      };
    }
    if (type === "danger") {
      return {
        bg: "bg-[#1C0F12]/95 border-rose-500/30 text-rose-300 border-l-rose-500",
        icon: "error"
      };
    }
    return {
      bg: "bg-[#0D1526]/95 border-yellow-500/30 text-yellow-300 border-l-yellow-500",
      icon: "info"
    };
  };

  return (
    <div className="bg-[#060B18] min-h-screen text-slate-100 flex flex-col pb-24 md:pb-0 relative overflow-hidden">
      
      {/* Toast Container */}
      <div className="toast-container z-[300]">
        {toasts.map((t) => {
          const styles = getToastStyles(t.type);
          return (
            <div key={t.id} className={`toast border-y border-r border-l-[4px] flex items-center gap-2.5 rounded-r-2xl rounded-l-md px-4 py-3 shadow-2xl backdrop-blur-md transition-all duration-300 ${styles.bg}`}>
              <span className="material-symbols-outlined text-sm">{styles.icon}</span>
              <span className="font-bold tracking-wide text-xs">{t.message}</span>
            </div>
          );
        })}
      </div>

      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 px-4 md:px-8 pt-4 z-[100] select-none">
        <div className="w-full max-w-7xl mx-auto backdrop-blur-2xl bg-[#060b18]/60 border border-white/5 rounded-2xl flex items-center justify-between px-6 py-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate("/dashboard")}>
            <div className="flex flex-col justify-center">
              <div className="flex items-center leading-none">
                <span className="font-display font-black tracking-tight text-white flex items-center text-base md:text-lg select-none">
                  <span>Refer</span>
                  <span className="text-yellow-400 font-black ml-0.5 relative transition-transform duration-300 group-hover:scale-110">X</span>
                </span>
                <span className="text-slate-400 font-medium text-[10px] ml-2 tracking-wider uppercase font-sans hidden sm:inline-block">Network</span>
              </div>
              <span className="text-[7.5px] text-slate-500 font-extrabold tracking-wider uppercase font-sans mt-0.5 leading-none hidden sm:block">RubiCorn Technologies Private Limited</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4 bg-[#0D1526]/75 border border-white/[0.08] rounded-full p-1.5 shadow-2xl backdrop-blur-md">
            <Link className={getDesktopTabClass("/dashboard")} to="/dashboard">
              <span className="material-symbols-outlined text-[14px]">dashboard</span> Dashboard
            </Link>
            
            <Link className={getDesktopTabClass("/campaigns")} to="/campaigns">
              <span className="material-symbols-outlined text-[14px]">ads_click</span> Campaigns
            </Link>
            
            <Link className={getDesktopTabClass("/wallet")} to="/wallet">
              <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span> Wallet
            </Link>
            
            <Link className={getDesktopTabClass("/profile")} to="/profile">
              <span className="material-symbols-outlined text-[14px]">account_circle</span> Profile
            </Link>

            {isAdmin && (
              <Link className={getDesktopTabClass("/admin")} to="/admin">
                <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span> Admin
              </Link>
            )}

            {user?.email === "udaykiranvempati123@gmail.com" && (
              <Link className={getDesktopTabClass("/super-admin")} to="/super-admin">
                <span className="material-symbols-outlined text-[14px]">shield_person</span> Super Admin
              </Link>
            )}
          </nav>

          {/* Widgets */}
          <div className="flex items-center gap-3">
            {/* Notifications Widget */}
            <Notifications 
              notifications={notifications} 
              showNotifications={showNotifications} 
              setShowNotifications={setShowNotifications}
              user={user}
            />

            {/* Profile Avatar Widget */}
            <div 
              className="w-9 h-9 rounded-full border border-white/10 overflow-hidden cursor-pointer active:scale-95 duration-150 shadow-md hover:border-yellow-400/40"
              onClick={() => navigate("/profile")}
            >
              <img 
                src={profileData?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData?.name || "User")}&background=0D1526&color=EAB308`} 
                alt={profileData?.name} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Dynamic page color gradient line indicator inside capsule */}
          <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${getPageIndicatorGradient()} opacity-80 transition-all duration-500`} />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mt-24 flex-1 max-w-6xl mx-auto w-full px-margin-mobile md:px-margin-desktop space-y-6 relative z-10">
        <div key={location.pathname} className="page-transition-enter">
          {children}
        </div>
      </main>

      {/* Footer */}
      {location.pathname === "/dashboard" && (
        <Footer user={profileData} setView={(v) => navigate(`/${v}`)} activeView={location.pathname.substring(1)} pageContent={pageContent} />
      )}

      {/* Sticky Bottom Nav Bar for Mobile screen sizes */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-2 pb-6 bg-[#060B18]/90 backdrop-blur-lg border-t border-white/[0.08] rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.6)] md:hidden">
        <Link className={getMobileTabClass("/dashboard")} to="/dashboard">
          <span className="material-symbols-outlined text-yellow-400">dashboard</span>
          <span className="font-semibold text-[9px] mt-1 tracking-wider uppercase">Dashboard</span>
        </Link>
        
        <Link className={getMobileTabClass("/campaigns")} to="/campaigns">
          <span className="material-symbols-outlined text-yellow-400">ads_click</span>
          <span className="font-semibold text-[9px] mt-1 tracking-wider uppercase">Campaigns</span>
        </Link>
        
        <Link className={getMobileTabClass("/profile")} to="/profile">
          <span className="material-symbols-outlined text-yellow-400">account_circle</span>
          <span className="font-semibold text-[9px] mt-1 tracking-wider uppercase">Profile</span>
        </Link>

        {isAdmin && (
          <Link className={getMobileTabClass("/admin")} to="/admin">
            <span className="material-symbols-outlined text-yellow-400">admin_panel_settings</span>
            <span className="font-semibold text-[9px] mt-1 tracking-wider uppercase">Admin</span>
          </Link>
        )}

        {user?.email === "udaykiranvempati123@gmail.com" && (
          <Link className={getMobileTabClass("/super-admin")} to="/super-admin">
            <span className="material-symbols-outlined text-yellow-400">shield_person</span>
            <span className="font-semibold text-[9px] mt-1 tracking-wider uppercase">Super Admin</span>
          </Link>
        )}
      </nav>
    </div>
  );
};
