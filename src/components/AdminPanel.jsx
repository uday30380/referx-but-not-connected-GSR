import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Award, 
  Users, 
  User, 
  Phone, 
  CreditCard, 
  Check, 
  X, 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink,
  ChevronDown,
  DollarSign,
  TrendingUp,
  Bell,
  Download,
  Database,
  Briefcase,
  AlertCircle,
  Send,
  Sliders,
  Search,
  Filter,
  ChevronRight,
  UserCheck,
  BarChart2,
  LineChart,
  Calendar,
  List,
  UserX,
  Activity,
  ArrowUpRight,
  DownloadCloud,
  Network,
  Sparkles,
  CheckCircle,
  Clock
} from "lucide-react";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  serverTimestamp,
  getDocs,
  getDoc,
  query,
  where,
  limit,
  increment
} from "firebase/firestore";
import { db } from "../firebase";
import { DEFAULT_CAMPAIGNS } from "../data/campaigns";

export const propagateCampaignApproved = async (referralPath, userId) => {
  if (!referralPath || referralPath.length === 0) return;
  const ancestors = referralPath.filter(uid => uid !== userId);
  for (const ancestorUid of ancestors) {
    try {
      const userRef = doc(db, "users", ancestorUid);
      await updateDoc(userRef, {
        approvedCount: increment(1),
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(`Admin: failed to propagate campaign approval to ancestor ${ancestorUid}:`, err);
    }
  }
};

export const propagateEarnings = async (referralPath, userId, directAmount, sourceUserLabel) => {
  if (!referralPath || referralPath.length === 0 || directAmount <= 0) return;
  const ancestors = referralPath.filter(uid => uid !== userId);
  for (const ancestorUid of ancestors) {
    try {
      const userRef = doc(db, "users", ancestorUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const uData = userSnap.data();
        const teamOverridePct = uData.passivePercentages?.teamOverride || 5;
        const overrideAmt = Math.round(directAmount * (teamOverridePct / 100));
        
        if (overrideAmt > 0) {
          const currentBalance = uData.earnings?.balance || 0;
          const currentTotal = uData.earnings?.total || 0;
          const currentTeamEarnings = uData.teamEarnings || 0;
          const currentTotalEarnings = uData.totalEarnings || 0;
          
          await updateDoc(userRef, {
            "earnings.balance": currentBalance + overrideAmt,
            "earnings.total": currentTotal + overrideAmt,
            teamEarnings: currentTeamEarnings + overrideAmt,
            totalEarnings: currentTotalEarnings + overrideAmt,
            updatedAt: new Date().toISOString()
          });

          // Payout notification
          await addDoc(collection(db, "notifications"), {
            uid: ancestorUid,
            message: `🎉 Team override payout: Earned +₹${overrideAmt} from task completion by downline member (${sourceUserLabel}).`,
            type: "override_payout",
            createdAt: serverTimestamp(),
            read: false
          });
        }
      }
    } catch (err) {
      console.error(`Admin: failed to propagate team override to ancestor ${ancestorUid}:`, err);
    }
  }
};

export default function AdminPanel({ user: adminUser, campaigns, showToast, defaultTab }) {
  const [activeTab, setActiveTab] = useState(() => {
    if (defaultTab) return defaultTab;
    if (window.location.hash.includes("/admin/team-management")) return "team-management";
    return localStorage.getItem("referx_admin_active_tab") || "employees";
  }); // employees | team-management | withdrawals | submissions | referrals | campaigns | tracking | levels | passive | notifications | reports

  useEffect(() => {
    localStorage.setItem("referx_admin_active_tab", activeTab);
  }, [activeTab]);

  const [activeCmsSection, setActiveCmsSection] = useState("general");
  const [cmsForm, setCmsForm] = useState({
    appName: "ReferX",
    appTagline: "Earn Money by Referring Friends",
    supportEmail: "support@referx.in",
    supportWhatsApp: "+91 8185892753",
    homepage: {
      heroTitle: "",
      heroDesc: "",
      step1Title: "",
      step1Desc: "",
      step2Title: "",
      step2Desc: "",
      step3Title: "",
      step3Desc: "",
      step4Title: "",
      step4Desc: "",
      faq1Q: "",
      faq1A: "",
      faq2Q: "",
      faq2A: "",
      faq3Q: "",
      faq3A: "",
      faq4Q: "",
      faq4A: ""
    },
    dashboard: {
      welcomeSubtext: "",
      quickTasksTitle: "",
      referralCardTitle: "",
      activityTitle: ""
    },
    team: {
      pageTitle: "",
      pageDesc: "",
      emptyTitle: "",
      emptyDesc: ""
    },
    campaigns: {
      pageTitle: "",
      pageDesc: "",
      emptyTitle: "",
      emptyDesc: ""
    },
    earnings: {
      pageTitle: "",
      pageDesc: "",
      withdrawNote: ""
    },
    profile: {
      withdrawalTitle: "",
      withdrawalDesc: ""
    },
    policies: {
      termsTitle: "",
      termsSec1Title: "",
      termsSec1Body: "",
      termsSec2Title: "",
      termsSec2Body: "",
      termsSec3Title: "",
      termsSec3Body: "",
      termsSec4Title: "",
      termsSec4Body: "",
      privacyTitle: "",
      privacySec1Title: "",
      privacySec1Body: "",
      privacySec2Title: "",
      privacySec2Body: "",
      privacySec3Title: "",
      privacySec3Body: "",
      warrantTitle: "",
      warrantSec1Title: "",
      warrantSec1Body: "",
      warrantSec2Title: "",
      warrantSec2Body: "",
      warrantSec3Title: "",
      warrantSec3Body: ""
    }
  });

  useEffect(() => {
    const cmsRef = doc(db, "settings", "page_content");
    const unsubscribeCms = onSnapshot(cmsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCmsForm({
          appName: data.appName || "ReferX",
          appTagline: data.appTagline || "Earn Money by Referring Friends",
          supportEmail: data.supportEmail || "support@referx.in",
          supportWhatsApp: data.supportWhatsApp || "+91 8185892753",
          homepage: {
            heroTitle: data.homepage?.heroTitle || "",
            heroDesc: data.homepage?.heroDesc || "",
            step1Title: data.homepage?.step1Title || "",
            step1Desc: data.homepage?.step1Desc || "",
            step2Title: data.homepage?.step2Title || "",
            step2Desc: data.homepage?.step2Desc || "",
            step3Title: data.homepage?.step3Title || "",
            step3Desc: data.homepage?.step3Desc || "",
            step4Title: data.homepage?.step4Title || "",
            step4Desc: data.homepage?.step4Desc || "",
            faq1Q: data.homepage?.faq1Q || "",
            faq1A: data.homepage?.faq1A || "",
            faq2Q: data.homepage?.faq2Q || "",
            faq2A: data.homepage?.faq2A || "",
            faq3Q: data.homepage?.faq3Q || "",
            faq3A: data.homepage?.faq3A || "",
            faq4Q: data.homepage?.faq4Q || "",
            faq4A: data.homepage?.faq4A || ""
          },
          dashboard: {
            welcomeSubtext: data.dashboard?.welcomeSubtext || "",
            quickTasksTitle: data.dashboard?.quickTasksTitle || "",
            referralCardTitle: data.dashboard?.referralCardTitle || "",
            activityTitle: data.dashboard?.activityTitle || ""
          },
          team: {
            pageTitle: data.team?.pageTitle || "",
            pageDesc: data.team?.pageDesc || "",
            emptyTitle: data.team?.emptyTitle || "",
            emptyDesc: data.team?.emptyDesc || ""
          },
          campaigns: {
            pageTitle: data.campaigns?.pageTitle || "",
            pageDesc: data.campaigns?.pageDesc || "",
            emptyTitle: data.campaigns?.emptyTitle || "",
            emptyDesc: data.campaigns?.emptyDesc || ""
          },
          earnings: {
            pageTitle: data.earnings?.pageTitle || "",
            pageDesc: data.earnings?.pageDesc || "",
            withdrawNote: data.earnings?.withdrawNote || ""
          },
          profile: {
            withdrawalTitle: data.profile?.withdrawalTitle || "",
            withdrawalDesc: data.profile?.withdrawalDesc || ""
          },
          policies: {
            termsTitle: data.policies?.termsTitle || "",
            termsSec1Title: data.policies?.termsSec1Title || "",
            termsSec1Body: data.policies?.termsSec1Body || "",
            termsSec2Title: data.policies?.termsSec2Title || "",
            termsSec2Body: data.policies?.termsSec2Body || "",
            termsSec3Title: data.policies?.termsSec3Title || "",
            termsSec3Body: data.policies?.termsSec3Body || "",
            termsSec4Title: data.policies?.termsSec4Title || "",
            termsSec4Body: data.policies?.termsSec4Body || "",
            privacyTitle: data.policies?.privacyTitle || "",
            privacySec1Title: data.policies?.privacySec1Title || "",
            privacySec1Body: data.policies?.privacySec1Body || "",
            privacySec2Title: data.policies?.privacySec2Title || "",
            privacySec2Body: data.policies?.privacySec2Body || "",
            privacySec3Title: data.policies?.privacySec3Title || "",
            privacySec3Body: data.policies?.privacySec3Body || "",
            warrantTitle: data.policies?.warrantTitle || "",
            warrantSec1Title: data.policies?.warrantSec1Title || "",
            warrantSec1Body: data.policies?.warrantSec1Body || "",
            warrantSec2Title: data.policies?.warrantSec2Title || "",
            warrantSec2Body: data.policies?.warrantSec2Body || "",
            warrantSec3Title: data.policies?.warrantSec3Title || "",
            warrantSec3Body: data.policies?.warrantSec3Body || ""
          }
        });
      }
    }, (err) => {
      console.warn("Could not sync CMS settings in Admin Panel:", err);
    });
    return () => unsubscribeCms();
  }, []);

  const handleSaveCms = async (e) => {
    e.preventDefault();
    try {
      const cmsRef = doc(db, "settings", "page_content");
      await setDoc(cmsRef, cmsForm, { merge: true });
      showToast("Page Content CMS updated successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to save CMS changes.", "danger");
    }
  };

  const [usersList, setUsersList] = useState([]);
  const [referralsList, setReferralsList] = useState([]);
  const [withdrawalsList, setWithdrawalsList] = useState([]);
  const [activitiesList, setActivitiesList] = useState([]);
  const [clicksList, setClicksList] = useState([]);
  const [supportTicketsList, setSupportTicketsList] = useState([]);
  const [supportSearchQuery, setSupportSearchQuery] = useState("");
  
  // Levels config (synchronized from Firestore doc: settings/levels)
  const [levelConfig, setLevelConfig] = useState({
    level2: 1000,
    level3: 2000,
    level4: 5000,
    level5: 10000,
    level6: 20000,
    level7: 30000
  });

  // Edit Employee State
  const [editingUser, setEditingUser] = useState(null);
  const [trackingUser, setTrackingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    mobile: "",
    bankAccountName: "",
    bankName: "",
    bankAccountNumber: "",
    bankIfscCode: "",
    totalAccounts: 0,
    level: 1,
    balance: 0,
    pending: 0,
    paid: 0,
    todayEarnings: 0,
    yesterdayEarnings: 0,
    joinedCampaigns: {}
  });

  // Campaign Form State
  const [showCampForm, setShowCampForm] = useState(false);
  const [editingCampId, setEditingCampId] = useState(null);
  const [imgErrors, setImgErrors] = useState({});
  const [campForm, setCampForm] = useState({
    id: "",
    name: "",
    reward: 100,
    shortDesc: "",
    eligibility: "",
    steps: [],
    redirectUrl: "",
    minLevel: 1,
    minLevelName: "Member",
    isLockedByAdmin: false,
    dependsOn: "None",
    logo: "",
    position: 0,
    payout: "",
    epc: "",
    approvalRate: ""
  });

  // Global Passive Income Percentages
  const [globalPassive, setGlobalPassive] = useState({
    teamOverride: 5,
    downlineReferral: 2,
    monthlyBonus: 1000,
    isActive: true
  });

  const [selectedRank, setSelectedRank] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Notification Broadcaster
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastType, setBroadcastType] = useState("info");

  // Tracking Tab States
  const [manualEvent, setManualEvent] = useState({
    userId: "",
    campaignId: "",
    type: "click"
  });
  const [bulkCsvText, setBulkCsvText] = useState("");
  const [trackingSearch, setTrackingSearch] = useState("");
  const [withdrawalSearchQuery, setWithdrawalSearchQuery] = useState("");
  const [referralSearchQuery, setReferralSearchQuery] = useState("");
  const [checklistSearchQuery, setChecklistSearchQuery] = useState("");
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [campaignSearchQuery, setCampaignSearchQuery] = useState("");

  // Sync users list
  useEffect(() => {
    const usersRef = collection(db, "users");
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ uid: doc.id, ...doc.data() });
      });
      setUsersList(list);
    }, (err) => {
      console.warn("Could not sync users:", err);
    });
    return () => unsubscribeUsers();
  }, []);

  // Sync referrals list
  useEffect(() => {
    const referralsRef = collection(db, "referrals");
    const unsubscribeRefs = onSnapshot(referralsRef, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReferralsList(list);
    }, (err) => {
      console.warn("Could not sync referrals:", err);
    });
    return () => unsubscribeRefs();
  }, []);

  // Sync withdrawals
  useEffect(() => {
    const withdrawalsRef = collection(db, "withdrawals");
    const unsubscribeWithdrawals = onSnapshot(withdrawalsRef, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setWithdrawalsList(list);
    }, (err) => {
      console.warn("Could not sync withdrawals:", err);
    });
    return () => unsubscribeWithdrawals();
  }, []);

  // Sync campaign clicks from collection 'campaignClicks'
  useEffect(() => {
    const clicksRef = collection(db, "campaignClicks");
    const unsubscribeClicks = onSnapshot(clicksRef, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setClicksList(list);
    }, (err) => {
      console.warn("Could not sync clicks:", err);
    });
    return () => unsubscribeClicks();
  }, []);

  // Sync activities from collection 'activities'
  useEffect(() => {
    const activitiesRef = collection(db, "activities");
    const unsubscribeActivities = onSnapshot(activitiesRef, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      list.sort((a, b) => {
        const timeA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp).getTime();
        const timeB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp).getTime();
        return timeB - timeA;
      });
      setActivitiesList(list);
    }, (err) => {
      console.warn("Could not sync activities:", err);
    });
    return () => unsubscribeActivities();
  }, []);

  // Sync support tickets from collection 'supportTickets'
  useEffect(() => {
    const ticketsRef = collection(db, "supportTickets");
    const unsubscribeTickets = onSnapshot(ticketsRef, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
      setSupportTicketsList(list);
    }, (err) => {
      console.warn("Could not sync support tickets:", err);
    });
    return () => unsubscribeTickets();
  }, []);

  // Database Self-Healing Migration (Auto-repairs missing referralPath & counters for existing users)
  useEffect(() => {
    if (usersList.length === 0) return;
    
    const runMigration = async () => {
      let migratedPaths = 0;
      let migratedCounters = 0;

      for (const usr of usersList) {
        if (usr.role === "admin") continue;

        // 1. Repair referralPath array
        const hasPath = usr.referralPath && Array.isArray(usr.referralPath) && usr.referralPath.length > 0;
        const correctEnd = hasPath && usr.referralPath[usr.referralPath.length - 1] === usr.uid;

        let computedPath = usr.referralPath || [];
        let parentUid = usr.parentUserId || usr.sponsor?.uid || "root";

        if (!hasPath || !correctEnd) {
          let ancestors = [];
          let currentParent = parentUid;
          const visited = new Set();

          while (currentParent && currentParent !== "root" && !visited.has(currentParent)) {
            visited.add(currentParent);
            ancestors.unshift(currentParent);
            const parentDoc = usersList.find(u => u.uid === currentParent);
            currentParent = parentDoc ? (parentDoc.parentUserId || parentDoc.sponsor?.uid || "root") : "root";
          }

          computedPath = [...ancestors, usr.uid];

          try {
            await updateDoc(doc(db, "users", usr.uid), {
              parentUserId: parentUid,
              referralPath: computedPath,
              updatedAt: new Date().toISOString()
            });
            migratedPaths++;
            // Update local snapshot cache for subsequent operations
            usr.referralPath = computedPath;
            usr.parentUserId = parentUid;
          } catch (err) {
            console.error(`Migration: failed to repair referralPath for ${usr.name}:`, err);
          }
        }

        // 2. Repair direct & total team metrics counters
        const actualDirectCount = usersList.filter(u => u.parentUserId === usr.uid || u.sponsor?.uid === usr.uid).length;
        const actualTotalTeamCount = usersList.filter(u => u.referralPath && u.referralPath.includes(usr.uid) && u.uid !== usr.uid).length;

        if (usr.directReferralsCount !== actualDirectCount || usr.totalTeamMembersCount !== actualTotalTeamCount) {
          try {
            await updateDoc(doc(db, "users", usr.uid), {
              directReferralsCount: actualDirectCount,
              totalTeamMembersCount: actualTotalTeamCount,
              updatedAt: new Date().toISOString()
            });
            migratedCounters++;
          } catch (err) {
            console.error(`Migration: failed to repair counters for ${usr.name}:`, err);
          }
        }
      }

      if (migratedPaths > 0 || migratedCounters > 0) {
        showToast(`Self-Healing Sync: Repaired referral paths for ${migratedPaths} and counters for ${migratedCounters} promoter records.`, "success");
      }
    };

    const timer = setTimeout(() => {
      runMigration();
    }, 2000);

    return () => clearTimeout(timer);
  }, [usersList]);

  // Sync level configurations
  useEffect(() => {
    const docRef = doc(db, "settings", "levels");
    const unsubscribeConfig = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setLevelConfig(snapshot.data());
      } else {
        // Seed default config if missing
        setDoc(docRef, {
          level2: 100,
          level3: 250,
          level4: 500,
          level5: 1000,
          level6: 2000,
          level7: 5000,
          level8: 8000,
          level9: 12000,
          level10: 16000,
          level11: 20000,
          level12: 25000,
          level13: 30000,
          level14: 40000
        });
      }
    });
    return () => unsubscribeConfig();
  }, []);

  // Sync passive configurations
  useEffect(() => {
    const docRef = doc(db, "settings", "passive");
    const unsubscribePassive = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setGlobalPassive({
          teamOverride: data.teamOverride !== undefined ? data.teamOverride : 5,
          downlineReferral: data.downlineReferral !== undefined ? data.downlineReferral : 2,
          monthlyBonus: data.monthlyBonus !== undefined ? data.monthlyBonus : 1000,
          isActive: data.isActive !== undefined ? data.isActive : true
        });
      } else {
        // Seed default config if missing
        setDoc(docRef, {
          teamOverride: 5,
          downlineReferral: 2,
          monthlyBonus: 1000,
          isActive: true
        }).catch(err => console.error("Failed to seed passive configuration:", err));
      }
    });
    return () => unsubscribePassive();
  }, []);

  const getRankName = (lvl) => {
    const ranks = [
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
    return ranks[(lvl || 1) - 1] || "Intern";
  };

  const calculateUserLevel = (approvedReferralsCount) => {
    if (approvedReferralsCount >= (levelConfig.level14 || 40000)) return 14;
    if (approvedReferralsCount >= (levelConfig.level13 || 30000)) return 13;
    if (approvedReferralsCount >= (levelConfig.level12 || 25000)) return 12;
    if (approvedReferralsCount >= (levelConfig.level11 || 20000)) return 11;
    if (approvedReferralsCount >= (levelConfig.level10 || 16000)) return 10;
    if (approvedReferralsCount >= (levelConfig.level9 || 12000)) return 9;
    if (approvedReferralsCount >= (levelConfig.level8 || 8000)) return 8;
    if (approvedReferralsCount >= (levelConfig.level7 || 5000)) return 7;
    if (approvedReferralsCount >= (levelConfig.level6 || 2000)) return 6;
    if (approvedReferralsCount >= (levelConfig.level5 || 1000)) return 5;
    if (approvedReferralsCount >= (levelConfig.level4 || 500)) return 4;
    if (approvedReferralsCount >= (levelConfig.level3 || 250)) return 3;
    if (approvedReferralsCount >= (levelConfig.level2 || 100)) return 2;
    return 1;
  };

  const handleSeedLeaderboardData = async () => {
    try {
      const mockLeaders = [
        {
          uid: "seed-vijay-malhotra",
          name: "Vijay Malhotra",
          email: "vijay@referx.com",
          mobile: "9988776611",
          bankAccountName: "Vijay Malhotra",
          bankName: "HDFC Bank",
          bankAccountNumber: "50100412345678",
          bankIfscCode: "HDFC0000240",
          employeeId: "ReferX-2026-VIP5",
          userId: "USR5001",
          referralCode: "REF5001",
          referralLink: `${window.location.origin}/#/register?ref=REF5001`,
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          lastLoginAt: new Date().toISOString(),
          role: "user",
          isAdmin: false,
          level: 5, // Manager
          totalAccounts: 120,
          earnings: { total: 120000, pending: 0, paid: 110000, balance: 10000 },
          joinedCampaigns: {
            angel_one: { status: "Approved", joinedAt: new Date().toISOString(), completedSteps: [0,1,2,3,4,5,6] }
          }
        },
        {
          uid: "seed-ravi-kumar",
          name: "Ravi Kumar",
          email: "ravi.kumar@referx.com",
          mobile: "9988776655",
          bankAccountName: "Ravi Kumar",
          bankName: "State Bank of India",
          bankAccountNumber: "30291827364",
          bankIfscCode: "SBIN0001234",
          employeeId: "ReferX-2026-1021",
          userId: "USR5002",
          referralCode: "REF5002",
          referralLink: `${window.location.origin}/#/register?ref=REF5002`,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastLoginAt: new Date().toISOString(),
          role: "user",
          isAdmin: false,
          level: 3, // Supervisor
          totalAccounts: 48,
          earnings: { total: 48000, pending: 0, paid: 45000, balance: 3000 },
          joinedCampaigns: {
            angel_one: { status: "Approved", joinedAt: new Date().toISOString(), completedSteps: [0,1,2,3,4,5,6] },
            upstox: { status: "Approved", joinedAt: new Date().toISOString(), completedSteps: [0,1,2,3,4,5,6] }
          }
        }
      ];

      for (const leader of mockLeaders) {
        await setDoc(doc(db, "users", leader.uid), leader);
        await setDoc(doc(db, "teamHierarchy", leader.uid), {
          userId: leader.uid,
          referrerUid: "root",
          ancestors: [],
          level: 1,
          createdAt: new Date().toISOString()
        });
      }
      showToast("Visual Leaderboard Mock Data Seeded successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Data seeding failed.", "danger");
    }
  };

  const handleSyncDefaultCampaigns = async () => {
    if (!window.confirm("WARNING: Are you sure you want to sync default campaigns? This will overwrite existing campaign details (such as redirect links) with their original defaults!")) {
      return;
    }
    try {
      for (const camp of DEFAULT_CAMPAIGNS) {
        await setDoc(doc(db, "campaigns", camp.id), {
          ...camp,
          createdAt: new Date().toISOString()
        }, { merge: true });
      }
      showToast("Default campaigns successfully synced with Firestore!", "success");
    } catch (err) {
      console.error(err);
      showToast("Campaign sync failed.", "danger");
    }
  };

  const getKycSubmissions = () => {
    const subs = [];
    usersList.forEach((u) => {
      if (u.joinedCampaigns) {
        Object.entries(u.joinedCampaigns).forEach(([campaignId, joinedData]) => {
          if (joinedData.status === "Submitted") {
            subs.push({
              userUid: u.uid,
              userName: u.name || "N/A",
              userEmail: u.email || "N/A",
              campaignId,
              campaignName: campaigns.find(c => c.id === campaignId)?.name || campaignId,
              reward: campaigns.find(c => c.id === campaignId)?.reward || 100,
              registeredDetails: joinedData.registeredDetails || {},
              verificationNotes: joinedData.verificationNotes || "",
              submittedAt: joinedData.submittedAt || joinedData.joinedAt
            });
          }
        });
      }
    });
    return subs;
  };

  // Add/Edit Campaign Handler
  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    if (!campForm.id || !campForm.name || !campForm.reward) {
      showToast("Please fill in the required parameters.", "danger");
      return;
    }

    const newCamp = {
      name: campForm.name,
      reward: Number(campForm.reward),
      shortDesc: campForm.shortDesc || "",
      eligibility: typeof campForm.eligibility === "string" 
        ? campForm.eligibility.split("\n").map(s => s.trim()).filter(Boolean) 
        : Array.isArray(campForm.eligibility) ? campForm.eligibility.map(s => s.trim()).filter(Boolean) : [],
      steps: Array.isArray(campForm.steps) 
        ? campForm.steps.map(s => s.trim()).filter(Boolean)
        : (typeof campForm.steps === "string" ? campForm.steps.split("\n").map(s => s.trim()).filter(Boolean) : []),
      redirectUrl: (campForm.redirectUrl || "").trim(),
      minLevel: Number(campForm.minLevel || 1),
      minLevelName: campForm.minLevelName || "Member",
      isLockedByAdmin: campForm.isLockedByAdmin || false,
      dependsOn: campForm.dependsOn || "None",
      logo: (campForm.logo || "").trim(),
      position: Number(campForm.position || 0),
      payout: campForm.payout || "",
      epc: campForm.epc || "",
      approvalRate: campForm.approvalRate || ""
    };

    try {
      const campaignDocRef = doc(db, "campaigns", campForm.id.trim().toLowerCase());
      await setDoc(campaignDocRef, newCamp, { merge: true });
      showToast("Campaign saved successfully in Firestore!", "success");
      
      setShowCampForm(false);
      setEditingCampId(null);
      setCampForm({ 
        id: "", 
        name: "", 
        reward: 100, 
        shortDesc: "", 
        eligibility: "", 
        steps: [], 
        redirectUrl: "", 
        minLevel: 1, 
        minLevelName: "Member",
        isLockedByAdmin: false,
        dependsOn: "None",
        logo: "",
        position: 0,
        payout: "",
        epc: "",
        approvalRate: ""
      });
    } catch (err) {
      console.error(err);
      showToast("Failed to save campaign.", "danger");
    }
  };

  const handleEditCampClick = (camp) => {
    setEditingCampId(camp.id);
    setCampForm({
      id: camp.id,
      name: camp.name,
      reward: camp.reward,
      shortDesc: camp.shortDesc || "",
      eligibility: typeof camp.eligibility === "string" ? camp.eligibility : (camp.eligibility || []).join("\n"),
      steps: Array.isArray(camp.steps) ? camp.steps : (typeof camp.steps === "string" ? camp.steps.split("\n").map(s => s.trim()).filter(Boolean) : []),
      redirectUrl: camp.redirectUrl || "",
      minLevel: camp.minLevel || 1,
      minLevelName: camp.minLevelName || "Member",
      isLockedByAdmin: camp.isLockedByAdmin || false,
      dependsOn: camp.dependsOn || "None",
      logo: camp.logo || "",
      position: camp.position || 0,
      payout: camp.payout || "",
      epc: camp.epc || "",
      approvalRate: camp.approvalRate || ""
    });
    setShowCampForm(true);
  };

  const handleDeleteCamp = async (id) => {
    if (!window.confirm(`Delete campaign configuration: ${id}?`)) return;
    try {
      await deleteDoc(doc(db, "campaigns", id));
      showToast("Campaign configuration deleted.", "success");
    } catch (err) {
      console.error(err);
      showToast("Deletion failed.", "danger");
    }
  };

  // Edit Employee Handler
  const handleEditUserClick = (usr) => {
    setEditingUser(usr);
    setEditForm({
      name: usr.name || "",
      email: usr.email || "",
      mobile: usr.mobile || "",
      bankAccountName: usr.bankAccountName || "",
      bankName: usr.bankName || "",
      bankAccountNumber: usr.bankAccountNumber || "",
      bankIfscCode: usr.bankIfscCode || "",
      totalAccounts: usr.totalAccounts || 0,
      level: usr.level || 1,
      balance: usr.earnings?.balance || 0,
      pending: usr.earnings?.pending || 0,
      paid: usr.earnings?.paid || 0,
      todayEarnings: usr.earningsDetail?.today || 0,
      yesterdayEarnings: usr.earningsDetail?.yesterday || 0,
      joinedCampaigns: usr.joinedCampaigns || {}
    });
  };

  const handleSaveUserEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const userRef = doc(db, "users", editingUser.uid);
      await updateDoc(userRef, {
        name: editForm.name,
        email: editForm.email,
        mobile: editForm.mobile,
        bankAccountName: editForm.bankAccountName,
        bankName: editForm.bankName,
        bankAccountNumber: editForm.bankAccountNumber,
        bankIfscCode: editForm.bankIfscCode,
        totalAccounts: Number(editForm.totalAccounts),
        level: Number(editForm.level),
        "earnings.balance": Number(editForm.balance),
        "earnings.pending": Number(editForm.pending),
        "earnings.paid": Number(editForm.paid),
        "earningsDetail.today": Number(editForm.todayEarnings),
        "earningsDetail.yesterday": Number(editForm.yesterdayEarnings),
        joinedCampaigns: editForm.joinedCampaigns
      });
      showToast(`Employee profile updated successfully!`, "success");
      setEditingUser(null);
    } catch (err) {
      console.error(err);
      showToast("Profile update failed.", "danger");
    }
  };

  const handleResolveTicket = async (ticketId, currentStatus) => {
    try {
      const ticketRef = doc(db, "supportTickets", ticketId);
      const newStatus = currentStatus === "Resolved" ? "Pending" : "Resolved";
      await updateDoc(ticketRef, { status: newStatus });
      
      // Add log
      await addDoc(collection(db, "activities"), {
        userId: adminUser.uid,
        userName: adminUser.name || "Admin",
        action: `Support Ticket Updated`,
        details: `Marked support ticket ${ticketId} as ${newStatus}.`,
        timestamp: serverTimestamp()
      });
      showToast(`Ticket status updated to ${newStatus}!`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to update ticket status.", "danger");
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm("Are you sure you want to delete this support ticket?")) return;
    try {
      await deleteDoc(doc(db, "supportTickets", ticketId));
      showToast("Support ticket deleted successfully.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete support ticket.", "danger");
    }
  };

  const handleCampaignStatusChange = (campId, newStatus) => {
    const updatedJoined = { ...editForm.joinedCampaigns };
    if (newStatus === "Not Started") {
      delete updatedJoined[campId];
    } else {
      updatedJoined[campId] = {
        ...(updatedJoined[campId] || { joinedAt: new Date().toISOString(), completedSteps: [] }),
        status: newStatus
      };
      if (newStatus === "Approved") {
        const camp = campaigns.find(c => c.id === campId);
        if (camp && camp.steps) {
          updatedJoined[campId].completedSteps = camp.steps.map((_, i) => i);
        }
      }
    }
    setEditForm({
      ...editForm,
      joinedCampaigns: updatedJoined
    });
  };

  // Approve Checklist activations
  const handleApproveKyc = async (sub) => {
    try {
      const userDoc = usersList.find(u => u.uid === sub.userUid);
      if (!userDoc) return;

      const currentBalance = userDoc.earnings?.balance || 0;
      const currentTotal = userDoc.earnings?.total || 0;
      const currentPending = userDoc.earnings?.pending || 0;
      const currentAccounts = userDoc.totalAccounts || 0;

      const updatedJoined = {
        ...(userDoc.joinedCampaigns || {}),
        [sub.campaignId]: {
          ...(userDoc.joinedCampaigns?.[sub.campaignId] || {}),
          status: "Approved",
          approvedAt: new Date().toISOString()
        }
      };

      const newAccounts = currentAccounts + 1;
      
      const userDocRef = doc(db, "users", sub.userUid);
      await updateDoc(userDocRef, {
        joinedCampaigns: updatedJoined,
        totalAccounts: newAccounts,
        "earnings.balance": currentBalance + sub.reward,
        "earnings.total": currentTotal + sub.reward,
        "earnings.pending": Math.max(0, currentPending - sub.reward),
        approvedCount: increment(1),
        directEarnings: increment(sub.reward),
        totalEarnings: increment(sub.reward),
        updatedAt: new Date().toISOString()
      });

      // Propagate campaign approval recursively to ancestors
      if (userDoc.referralPath) {
        await propagateCampaignApproved(userDoc.referralPath, sub.userUid);
      }

      // Propagate team override payouts recursively from the direct campaign reward
      if (userDoc.referralPath) {
        await propagateEarnings(userDoc.referralPath, sub.userUid, sub.reward, sub.userName);
      }

      // Payout notification
      await addDoc(collection(db, "notifications"), {
        uid: sub.userUid,
        message: `Your KYC activation checklist for ${sub.campaignName} has been approved! ₹${sub.reward} credited to balance.`,
        type: "campaign_approved",
        createdAt: serverTimestamp(),
        read: false
      });

      // Log Activity
      await addDoc(collection(db, "activities"), {
        userId: sub.userUid,
        userName: sub.userName,
        action: "Team Growth",
        details: `KYC Activation Approved for campaign: ${sub.campaignName}. Commission credited.`,
        timestamp: serverTimestamp()
      });

      // Referral automatic verification and payout
      try {
        const referralsQuery = query(
          collection(db, "referrals"),
          where("refereeUid", "==", sub.userUid),
          where("campaignId", "==", sub.campaignId)
        );
        const referralsSnap = await getDocs(referralsQuery);
        
        if (!referralsSnap.empty) {
          for (const refDoc of referralsSnap.docs) {
            const refData = refDoc.data();
            if (refData.status === "approved" || refData.status === "Approved") continue;
            
            const refDocRef = doc(db, "referrals", refDoc.id);
            
            // Mark referral approved
            await updateDoc(refDocRef, { status: "approved", approvedAt: new Date().toISOString() });
            
            // Fetch referrer profile to update balance
            const referrerDocRef = doc(db, "users", refData.referrerUid);
            const referrerSnap = await getDoc(referrerDocRef);
            
            if (referrerSnap.exists()) {
              const referrerData = referrerSnap.data();
              const refBalance = referrerData.earnings?.balance || 0;
              const refTotal = referrerData.earnings?.total || 0;
              const rewardAmount = refData.rewardAmount || 100;
              
              // Count all approved referrals to recalculate rank level
              const approvedRefsQuery = query(
                collection(db, "referrals"),
                where("referrerUid", "==", refData.referrerUid),
                where("status", "==", "approved")
              );
              const approvedSnap = await getDocs(approvedRefsQuery);
              const approvedCount = approvedSnap.size + 1; // including the current one

              const refTargetLevel = calculateUserLevel(approvedCount);

              await updateDoc(referrerDocRef, {
                "earnings.balance": refBalance + rewardAmount,
                "earnings.total": refTotal + rewardAmount,
                directEarnings: increment(rewardAmount),
                totalEarnings: increment(rewardAmount),
                level: refTargetLevel,
                updatedAt: new Date().toISOString()
              });

              // Propagate overrides from the direct referral reward amount
              if (referrerData.referralPath) {
                await propagateEarnings(referrerData.referralPath, refData.referrerUid, rewardAmount, referrerData.name);
              }

              if (refTargetLevel !== (referrerData.level || 1)) {
                await addDoc(collection(db, "notifications"), {
                  uid: refData.referrerUid,
                  message: `🎉 Promotion Achieved! You have been promoted to ${getRankName(refTargetLevel)}!`,
                  type: "promotion",
                  createdAt: serverTimestamp(),
                  read: false
                });

                await addDoc(collection(db, "activities"), {
                  userId: refData.referrerUid,
                  userName: referrerData.name,
                  action: "Team Growth",
                  details: `Promoted to rank level: ${getRankName(refTargetLevel)} (Total Approved Referrals: ${approvedCount})`,
                  timestamp: serverTimestamp()
                });
              }
              
              // Notify referrer
              await addDoc(collection(db, "notifications"), {
                uid: refData.referrerUid,
                message: `🎉 Referral payout processed! Your invite referee ${sub.userName} completed ${sub.campaignName}. +₹${rewardAmount} credited to balance.`,
                type: "referral_payout",
                createdAt: serverTimestamp(),
                read: false
              });
            }
          }
        }
      } catch (refErr) {
        console.error("Error processing auto-referral approval: ", refErr);
      }

      showToast(`Approved ${sub.campaignName} checklist and credited ₹${sub.reward}!`, "success");
    } catch (err) {
      console.error(err);
      showToast("Approval failed.", "danger");
    }
  };

  const handleRejectKyc = async (sub) => {
    try {
      const userDoc = usersList.find(u => u.uid === sub.userUid);
      if (!userDoc) return;

      const currentPending = userDoc.earnings?.pending || 0;
      const updatedJoined = {
        ...(userDoc.joinedCampaigns || {}),
        [sub.campaignId]: {
          ...(userDoc.joinedCampaigns?.[sub.campaignId] || {}),
          status: "Rejected",
          rejectedAt: new Date().toISOString()
        }
      };

      await updateDoc(doc(db, "users", sub.userUid), {
        joinedCampaigns: updatedJoined,
        "earnings.pending": Math.max(0, currentPending - sub.reward)
      });

      await addDoc(collection(db, "notifications"), {
        uid: sub.userUid,
        message: `KYC verification request for ${sub.campaignName} was rejected. Documents couldn't be validated.`,
        type: "campaign_rejected",
        createdAt: serverTimestamp(),
        read: false
      });

      showToast(`Rejected checklist submission for ${sub.campaignName}.`, "warning");
    } catch (err) {
      console.error(err);
    }
  };

  // Approve referrals signups
  const handleApproveReferral = async (ref) => {
    try {
      const referrerDoc = usersList.find(u => u.uid === ref.referrerUid);
      const currentBalance = referrerDoc?.earnings?.balance || 0;
      const currentTotal = referrerDoc?.earnings?.total || 0;

      await updateDoc(doc(db, "referrals", ref.id), { status: "approved", approvedAt: new Date().toISOString() });

      if (referrerDoc) {
        // Fetch approved count
        const approvedRefsQuery = query(
          collection(db, "referrals"),
          where("referrerUid", "==", ref.referrerUid),
          where("status", "==", "approved")
        );
        const approvedSnap = await getDocs(approvedRefsQuery);
        const approvedCount = approvedSnap.size + 1;
        const refTargetLevel = calculateUserLevel(approvedCount);

        await updateDoc(doc(db, "users", ref.referrerUid), {
          "earnings.balance": currentBalance + ref.rewardAmount,
          "earnings.total": currentTotal + ref.rewardAmount,
          directEarnings: increment(ref.rewardAmount),
          totalEarnings: increment(ref.rewardAmount),
          approvedCount: increment(1),
          level: refTargetLevel,
          updatedAt: new Date().toISOString()
        });

        // Propagate campaign approval recursively to the referrer's ancestors
        if (referrerDoc.referralPath) {
          await propagateCampaignApproved(referrerDoc.referralPath, ref.referrerUid);
        }

        if (refTargetLevel !== (referrerDoc.level || 1)) {
          await addDoc(collection(db, "notifications"), {
            uid: ref.referrerUid,
            message: `🎉 Promotion Achieved! You have been automatically promoted to ${getRankName(refTargetLevel)}!`,
            type: "promotion",
            createdAt: serverTimestamp(),
            read: false
          });
        }
      }

      await addDoc(collection(db, "notifications"), {
        uid: ref.referrerUid,
        message: `Your downline candidate signup for ${ref.refereeName} (${ref.campaignName}) approved! +₹${ref.rewardAmount} bounty credited.`,
        type: "referral_approved",
        createdAt: serverTimestamp(),
        read: false
      });

      showToast(`Referral signup approved! wired ₹${ref.rewardAmount} bounty.`, "success");
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectReferral = async (ref) => {
    try {
      await updateDoc(doc(db, "referrals", ref.id), { status: "rejected" });
      
      await addDoc(collection(db, "notifications"), {
        uid: ref.referrerUid,
        message: `Your referred invite for ${ref.refereeName} was rejected under validation audit.`,
        type: "referral_rejected",
        createdAt: serverTimestamp(),
        read: false
      });

      showToast(`Referral rejected.`, "warning");
    } catch (err) {
      console.error(err);
    }
  };

  // Approve Payout withdrawals
  const handleApproveWithdrawal = async (withdraw) => {
    try {
      const userDoc = usersList.find(u => u.uid === withdraw.uid);
      const currentPaid = userDoc?.earnings?.paid || 0;
      const currentPending = userDoc?.earnings?.pending || 0;

      await updateDoc(doc(db, "withdrawals", withdraw.id), { status: "approved" });

      if (userDoc) {
        await updateDoc(doc(db, "users", withdraw.uid), {
          "earnings.paid": currentPaid + withdraw.amount,
          "earnings.pending": Math.max(0, currentPending - withdraw.amount)
        });
      }

      await addDoc(collection(db, "notifications"), {
        uid: withdraw.uid,
        message: `Bank settlement approved! ₹${withdraw.amount} successfully wired to your bank account (${withdraw.bankName || 'N/A'}, A/C ending with ${(withdraw.bankAccountNumber || '').slice(-4)}).`,
        type: "withdrawal_approved",
        createdAt: serverTimestamp(),
        read: false
      });

      showToast(`Withdrawal of ₹${withdraw.amount} marked paid!`, "success");
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectWithdrawal = async (withdraw) => {
    try {
      const userDoc = usersList.find(u => u.uid === withdraw.uid);
      const currentBalance = userDoc?.earnings?.balance || 0;
      const currentPending = userDoc?.earnings?.pending || 0;

      await updateDoc(doc(db, "withdrawals", withdraw.id), { status: "rejected" });

      if (userDoc) {
        // Return amount back to available balance and subtract from pending
        await updateDoc(doc(db, "users", withdraw.uid), {
          "earnings.balance": currentBalance + withdraw.amount,
          "earnings.pending": Math.max(0, currentPending - withdraw.amount)
        });
      }

      await addDoc(collection(db, "notifications"), {
        uid: withdraw.uid,
        message: `Withdrawal request of ₹${withdraw.amount} was rejected. Balance returned to wallet. Please check details.`,
        type: "withdrawal_rejected",
        createdAt: serverTimestamp(),
        read: false
      });

      showToast(`Withdrawal of ₹${withdraw.amount} rejected. Balance refunded.`, "warning");
    } catch (err) {
      console.error(err);
    }
  };

  // Global passive percentages settings
  const handleSavePassiveSettings = async (e) => {
    e.preventDefault();
    try {
      for (const u of usersList) {
        await updateDoc(doc(db, "users", u.uid), {
          passivePercentages: {
            teamOverride: Number(globalPassive.teamOverride),
            downlineReferral: Number(globalPassive.downlineReferral),
            monthlyBonus: Number(globalPassive.monthlyBonus)
          }
        });
      }
      showToast("Global team passive overrides updated across all promoters!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to save passive settings.", "danger");
    }
  };

  // Levels Settings Handler
  const handleSaveLevelConfig = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "settings", "levels"), {
        level2: Number(levelConfig.level2),
        level3: Number(levelConfig.level3),
        level4: Number(levelConfig.level4),
        level5: Number(levelConfig.level5),
        level6: Number(levelConfig.level6),
        level7: Number(levelConfig.level7)
      });
      showToast("Promotion rank requirements updated in Firestore successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to save level config.", "danger");
    }
  };

  // Unified Rank & Overrides Settings Handler
  const handleSaveRankAndOverrides = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // 1. Save levels settings
      await setDoc(doc(db, "settings", "levels"), {
        level2: Number(levelConfig.level2 || 100),
        level3: Number(levelConfig.level3 || 250),
        level4: Number(levelConfig.level4 || 500),
        level5: Number(levelConfig.level5 || 1000),
        level6: Number(levelConfig.level6 || 2000),
        level7: Number(levelConfig.level7 || 5000),
        level8: Number(levelConfig.level8 || 8000),
        level9: Number(levelConfig.level9 || 12000),
        level10: Number(levelConfig.level10 || 16000),
        level11: Number(levelConfig.level11 || 20000),
        level12: Number(levelConfig.level12 || 25000),
        level13: Number(levelConfig.level13 || 30000),
        level14: Number(levelConfig.level14 || 40000),
        color1: levelConfig.color1 || "bg-primary",
        color2: levelConfig.color2 || "bg-blue-500",
        color3: levelConfig.color3 || "bg-emerald-500",
        color4: levelConfig.color4 || "bg-rose-500",
        color5: levelConfig.color5 || "bg-amber-500",
        color6: levelConfig.color6 || "bg-amber-500",
        color7: levelConfig.color7 || "bg-amber-500",
        color8: levelConfig.color8 || "bg-amber-500",
        color9: levelConfig.color9 || "bg-amber-500",
        color10: levelConfig.color10 || "bg-amber-500",
        color11: levelConfig.color11 || "bg-amber-500",
        color12: levelConfig.color12 || "bg-amber-500",
        color13: levelConfig.color13 || "bg-amber-500",
        color14: levelConfig.color14 || "bg-amber-500"
      });

      // 1.5. Save passive overrides globally
      await setDoc(doc(db, "settings", "passive"), {
        teamOverride: Number(globalPassive.teamOverride),
        downlineReferral: Number(globalPassive.downlineReferral),
        monthlyBonus: Number(globalPassive.monthlyBonus),
        isActive: globalPassive.isActive
      });

      // 2. Save passive settings across all users
      for (const u of usersList) {
        if (u.role !== "admin") {
          await updateDoc(doc(db, "users", u.uid), {
            passivePercentages: {
              teamOverride: Number(globalPassive.teamOverride),
              downlineReferral: Number(globalPassive.downlineReferral),
              monthlyBonus: Number(globalPassive.monthlyBonus)
            }
          });
        }
      }
      showToast("Ecosystem rank and overrides configuration saved successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to save rank and overrides.", "danger");
    } finally {
      setIsSaving(false);
    }
  };

  // Global broadcast notifications
  const handleBroadcastNotification = async (e) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    try {
      for (const u of usersList) {
        await addDoc(collection(db, "notifications"), {
          uid: u.uid,
          message: broadcastMessage.trim(),
          type: broadcastType,
          createdAt: serverTimestamp(),
          read: false
        });
      }
      showToast("Broadcast message dispatched to all network promoters!", "success");
      setBroadcastMessage("");
    } catch (err) {
      console.error(err);
      showToast("Broadcast failed.", "danger");
    }
  };

  const handleLogManualEvent = async (e) => {
    e.preventDefault();
    if (!manualEvent.userId || !manualEvent.campaignId) {
      showToast("Please select user and campaign.", "danger");
      return;
    }
    try {
      // Use collection 'campaignClicks'
      const collectionName = manualEvent.type === "click" ? "campaignClicks" : "campaign_completions";
      const randomId = Math.floor(100000 + Math.random() * 900000);
      const clickId = `CLK${randomId}`;

      const payload = {
        clickId,
        userId: manualEvent.userId,
        campaignId: manualEvent.campaignId,
        timestamp: serverTimestamp()
      };
      
      if (manualEvent.type === "complete") {
        payload.status = "completed";
      } else {
        payload.status = "Started";
      }

      await setDoc(doc(db, "campaignClicks", clickId), payload);

      // Log manual activity
      await addDoc(collection(db, "activities"), {
        userId: manualEvent.userId,
        userName: usersList.find(u => u.uid === manualEvent.userId)?.name || "Promoter",
        action: manualEvent.type === "click" ? "Campaign Click" : "Campaign Submission",
        details: `Manual tracking ${manualEvent.type} event logged by admin. (ID: ${clickId})`,
        timestamp: serverTimestamp()
      });

      showToast(`Logged manual ${manualEvent.type} event successfully!`, "success");
      setManualEvent({ userId: "", campaignId: "", type: "click" });
    } catch (err) {
      console.error(err);
      showToast("Logging failed.", "danger");
    }
  };

  const handleProcessBulkCsv = async (e) => {
    e.preventDefault();
    if (!bulkCsvText.trim()) {
      showToast("Please enter CSV logs.", "danger");
      return;
    }
    const lines = bulkCsvText.split("\n").map(l => l.trim()).filter(Boolean);
    let successCount = 0;
    let errorCount = 0;

    for (const line of lines) {
      const parts = line.split(",").map(p => p.trim());
      if (parts.length < 3) {
        errorCount++;
        continue;
      }
      const [uId, cId, evType] = parts;
      const type = evType.toLowerCase();

      const userExists = usersList.some(u => u.uid === uId);
      const campaignExists = campaigns.some(c => c.id === cId);
      if (!userExists || !campaignExists || (type !== "click" && type !== "complete" && type !== "completion")) {
        errorCount++;
        continue;
      }

      try {
        const randomId = Math.floor(100000 + Math.random() * 900000);
        const clickId = `CLK${randomId}`;

        await setDoc(doc(db, "campaignClicks", clickId), {
          clickId,
          userId: uId,
          campaignId: cId,
          timestamp: serverTimestamp(),
          status: type === "click" ? "Started" : "Completed"
        });

        successCount++;
      } catch (err) {
        console.error("CSV import line failed: ", line, err);
        errorCount++;
      }
    }

    showToast(`Bulk upload finished! Processed: ${successCount}, Failed: ${errorCount}`, successCount > 0 ? "success" : "warning");
    setBulkCsvText("");
  };

  const handleGenerateReport = (type) => {
    let content = `ReferX ${type.toUpperCase()} SUMMARY REPORT\n`;
    content += `Date Compiled: ${new Date().toLocaleString()}\n`;
    content += `==========================================\n\n`;
    content += `Employee ID, Name, Email, Level, Accounts Completed, Balance, Paid Out\n`;
    
    usersList.forEach(u => {
      content += `${u.employeeId || "N/A"}, ${u.name}, ${u.email}, ${getRankName(u.level)}, ${u.totalAccounts || 0}, ₹${u.earnings?.balance || 0}, ₹${u.earnings?.paid || 0}\n`;
    });

    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `ReferX_${type}_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast(`Compiled report successfully downloaded!`, "success");
  };

  const kycSubmissions = getKycSubmissions();

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-slate-100">
      
      {/* Admin Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-display text-2xl font-extrabold text-white flex items-center gap-2 tracking-tight">
              <ShieldCheck size={26} className="text-luxury-gold" /> ReferX Administrative Node
            </h2>
            {adminUser?.email && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {adminUser.email}
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Re-route database payouts, adjust user ranks, configure campaigns, and audit withdrawal requests.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleSeedLeaderboardData}
            className="bg-purple-gradient text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-purple-glow hover:opacity-90 transition"
          >
            <Database size={14} /> Seed Leaderboard Mocks
          </button>
          
          <button
            onClick={handleSyncDefaultCampaigns}
            className="bg-sky-gradient text-luxury-dark font-black py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-sky-glow hover:opacity-90 transition"
          >
            <Database size={14} /> Sync Default Campaigns
          </button>
          
          {activeTab === "campaigns" && !showCampForm && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative w-64">
                <Search size={13} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search Campaigns..."
                  value={campaignSearchQuery}
                  onChange={(e) => setCampaignSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/[0.08] focus:border-luxury-gold rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>
              <button className="bg-gold-gradient text-luxury-dark font-black py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 whitespace-nowrap" onClick={() => setShowCampForm(true)}>
                <Plus size={14} /> Create Campaign
              </button>
            </div>
          )}
        </div>
      </div>
      {/* KPI Bento Grid */}
      {!trackingUser && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-md mb-md">
          {/* Total Employees */}
          <div className="glass-panel p-md rounded-xl flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">groups</span>
              </div>
              <span className="text-[10px] bg-white/5 border border-white/10 text-outline px-2 py-0.5 rounded font-label-caps">PROMOTERS</span>
            </div>
            <div>
              <p className="font-label-caps text-[10px] text-outline tracking-wider block">TOTAL NODES</p>
              <h3 className="font-display-lg-mobile text-2xl font-bold text-on-surface mt-1">{usersList.filter(u => u.role !== 'admin').length}</h3>
            </div>
          </div>

          {/* Active */}
          <div className="glass-panel p-md rounded-xl flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-lg bg-status-active/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-status-active">electric_bolt</span>
              </div>
              <span className="text-[10px] bg-white/5 border border-white/10 text-outline px-2 py-0.5 rounded font-label-caps">TIER 1+</span>
            </div>
            <div>
              <p className="font-label-caps text-[10px] text-outline tracking-wider block">ACTIVE TIER</p>
              <h3 className="font-display-lg-mobile text-2xl font-bold text-on-surface mt-1">{usersList.filter(u => u.role !== 'admin' && (u.totalAccounts > 0 || u.level > 1)).length}</h3>
            </div>
          </div>

          {/* Suspended */}
          <div className="glass-panel p-md rounded-xl flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-lg bg-status-rejected/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-status-rejected">block</span>
              </div>
              <span className="text-[10px] bg-white/5 border border-white/10 text-outline px-2 py-0.5 rounded font-label-caps">SUSPENDED</span>
            </div>
            <div>
              <p className="font-label-caps text-[10px] text-outline tracking-wider block">FLAGGED NODES</p>
              <h3 className="font-display-lg-mobile text-2xl font-bold text-on-surface mt-1">{usersList.filter(u => u.suspended).length}</h3>
            </div>
          </div>

          {/* Pending */}
          <div className="glass-panel p-md rounded-xl flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-lg bg-status-pending/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-status-pending">hourglass_empty</span>
              </div>
              <span className="text-[10px] bg-white/5 border border-white/10 text-outline px-2 py-0.5 rounded font-label-caps">AUDIT QUEUE</span>
            </div>
            <div>
              <p className="font-label-caps text-[10px] text-outline tracking-wider block">PENDING CHECKS</p>
              <h3 className="font-display-lg-mobile text-2xl font-bold text-on-surface mt-1">{kycSubmissions.length}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Tabs list */}
      <div className="flex border-b border-white/[0.06] gap-1 overflow-x-auto pb-1.5 no-scrollbar">
        {[
          { key: "employees", label: "Employees Manager", color: "border-sky-400 text-sky-400 bg-sky-500/10" },
          { key: "team-management", label: "Team Management", color: "border-violet-400 text-violet-400 bg-violet-500/10" },
          { key: "withdrawals", label: "Withdrawals Queue", badge: withdrawalsList.filter(w => w.status === "pending").length, color: "border-emerald-400 text-emerald-400 bg-emerald-500/10" },
          { key: "submissions", label: "Checklist Audits", badge: kycSubmissions.length, color: "border-amber-400 text-amber-400 bg-amber-500/10" },
          { key: "referrals", label: "Referral Signups", badge: referralsList.filter(r => r.status === "pending").length, color: "border-orange-400 text-orange-400 bg-orange-500/10" },
          { key: "campaigns", label: "Campaign Editor", color: "border-pink-400 text-pink-400 bg-pink-500/10" },
          { key: "tracking", label: "Tracking Node", color: "border-cyan-400 text-cyan-400 bg-cyan-500/10" },
          { key: "levels", label: "Rank & Overrides", color: "border-fuchsia-400 text-fuchsia-400 bg-fuchsia-500/10" },
          { key: "notifications", label: "Broadcaster", color: "border-rose-400 text-rose-400 bg-rose-500/10" },
          { key: "reports", label: "Reports Node", color: "border-yellow-400 text-yellow-400 bg-yellow-500/10" },
          { key: "page-content", label: "Page Content Editor", color: "border-indigo-400 text-indigo-400 bg-indigo-500/10" },
          { key: "support-tickets", label: "Support Tickets", badge: supportTicketsList.filter(t => t.status === "Pending").length, color: "border-amber-500 text-amber-500 bg-amber-600/10" }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setShowCampForm(false); setTrackingUser(null); }}
            className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 rounded-t-xl transition-all duration-300 ${
              activeTab === tab.key
                ? tab.color
                : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
            } bg-transparent`}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span className="ml-1.5 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Content tabs */}
      <div className="min-h-[400px]">
        {trackingUser ? (
          <div className="flex flex-col gap-6 animate-fade-in text-slate-100">
            <div>
              <button 
                onClick={() => setTrackingUser(null)}
                className="flex items-center gap-1.5 text-xs font-bold text-luxury-gold hover:text-white transition mb-3 bg-white/5 border border-white/10 py-1.5 px-3 rounded-lg hover:border-luxury-gold"
              >
                ← Back to Employees Directory
              </button>
            </div>

            <div className="glass-card-premium rounded-3xl p-6 md:p-8 border border-white/10 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-premium-card">
              <div className="absolute top-0 right-0 w-80 h-80 bg-luxury-purple/10 rounded-full blur-3xl pointer-events-none" />
              <div>
                <span className="text-xs font-black text-luxury-gold uppercase block mb-1">Affiliate Link Auditor</span>
                <h3 className="text-xl font-extrabold text-white">Tracking &amp; Conversions</h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Promoter: <strong className="text-white">{trackingUser.name}</strong> ({trackingUser.employeeId || "No Employee ID"})
                </p>
              </div>

              <div className="flex gap-4 flex-wrap w-full md:w-auto">
                <div className="bg-luxury-dark/40 border border-white/5 p-4 rounded-2xl flex-1 md:flex-initial md:w-48">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Tracked Link Clicks</span>
                  <strong className="text-2xl text-white font-mono block mt-1">
                    {clicksList.filter(c => c.userId === trackingUser.uid && (c.status === "Started" || !c.status)).length}
                  </strong>
                </div>
              </div>
            </div>

            <div className="glass-card-premium rounded-3xl p-6 md:p-8 border border-white/10">
              <span className="text-xs font-black text-luxury-gold uppercase tracking-wider block border-b border-white/5 pb-2 mb-4">
                Campaign Gateway Breakdown
              </span>
              <div className="grid md:grid-cols-2 gap-4">
                {campaigns.map((camp) => {
                  const campClicks = clicksList.filter(c => c.userId === trackingUser.uid && c.campaignId === camp.id && (c.status === "Started" || !c.status)).length;
                  const directComps = clicksList.filter(c => c.userId === trackingUser.uid && c.campaignId === camp.id && (c.status === "Completed" || c.status === "completed")).length;
                  const refComps = referralsList.filter(r => r.referrerUid === trackingUser.uid && r.campaignId === camp.id && r.status === "approved").length;
                  const totalComps = directComps + refComps;
                  
                  const trackingLink = `${window.location.origin}/#/gateway?action=click&campaignId=${camp.id}&userId=${trackingUser.uid}`;
                  const completeLink = `${window.location.origin}/#/gateway?action=complete&campaignId=${camp.id}&userId=${trackingUser.uid}`;

                  return (
                    <div key={camp.id} className="bg-luxury-dark/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 hover:border-white/10 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-white text-sm block font-bold">{camp.name}</strong>
                          <span className="text-[10px] text-slate-500 block mt-0.5">Upto: ₹{camp.reward}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-[10px] font-bold text-slate-300">
                            Clicks: <strong className="text-white font-mono">{campClicks}</strong>
                          </span>
                          <span className="bg-gold-gradient text-luxury-dark rounded-lg px-2.5 py-1 text-[10px] font-black shadow-gold-glow">
                            Conversions: <strong className="font-mono">{totalComps}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 bg-luxury-dark/50 p-2.5 rounded-xl border border-white/5 text-[10px] font-mono">
                        <div>
                          <div className="text-slate-500 font-bold uppercase text-[9px] mb-0.5">Unique Tracking Link</div>
                          <div className="flex items-center justify-between gap-2 bg-luxury-navy/40 border border-white/5 rounded p-1">
                            <span className="truncate text-slate-300 select-all">{trackingLink}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(trackingLink);
                                showToast("Tracking Link copied!", "success");
                              }}
                              className="px-1.5 py-0.5 bg-white/5 hover:bg-white/10 rounded text-[9px] text-white transition shrink-0"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Team Management Tab */}
            {activeTab === "team-management" && (
              <TeamManagementModule 
                usersList={usersList}
                referralsList={referralsList}
                clicksList={clicksList}
                activitiesList={activitiesList}
                withdrawalsList={withdrawalsList}
                campaigns={campaigns}
                showToast={showToast}
                getRankName={getRankName}
                calculateUserLevel={calculateUserLevel}
              />
            )}

            {/* 1. Employees Tab */}
        {activeTab === "employees" && (() => {
          const filteredEmployees = usersList.filter(usr => {
            const query = employeeSearchQuery.toLowerCase().trim();
            if (!query) return true;
            return (
              (usr.name || "").toLowerCase().includes(query) ||
              (usr.userId || "").toLowerCase().includes(query) ||
              (usr.email || "").toLowerCase().includes(query) ||
              (usr.mobile || "").toLowerCase().includes(query) ||
              (usr.referralCode || "").toLowerCase().includes(query)
            );
          });
          
          return (
            <div className="glass-card-premium rounded-3xl overflow-hidden">
              <div className="p-4 bg-white/5 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <span className="text-xs font-bold text-slate-300">Registered Promoters Directory ({filteredEmployees.length})</span>
                
                {/* Search Bar */}
                <div className="relative w-full sm:w-72">
                  <Search size={13} className="absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search Name, User ID, Email, Phone..."
                    value={employeeSearchQuery}
                    onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/[0.08] focus:border-luxury-gold rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 font-bold uppercase">
                      <th className="p-4">Employee ID / Name</th>
                      <th className="p-4">Mobile</th>
                      <th className="p-4">Settlement Bank Details</th>
                      <th className="p-4 text-right">Ranks Lvl</th>
                      <th className="p-4 text-right">Accounts Done</th>
                      <th className="p-4 text-right">Balance</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          No promoters matched your search query.
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((usr) => (
                        <tr key={usr.uid} className="hover:bg-white/5 transition">
                          <td className="p-4">
                            <strong className="block">
                              <button
                                onClick={() => setTrackingUser(usr)}
                                className="text-luxury-gold hover:underline font-bold text-left bg-transparent border-none p-0 outline-none transition"
                              >
                                {usr.name}
                              </button>
                            </strong>
                            <span className="text-[10px] text-slate-500 font-mono">{usr.userId || "None"} — {usr.email}</span>
                          </td>
                          <td className="p-4 font-mono text-slate-300">{usr.mobile || "N/A"}</td>
                          <td className="p-4 font-mono text-luxury-gold font-bold">
                            {usr.bankAccountNumber ? (
                              <div className="flex flex-col text-[11px] gap-0.5 font-sans leading-tight normal-case text-left">
                                <span className="text-white font-medium">{usr.bankAccountName}</span>
                                <span className="text-slate-400 font-mono text-[10px]">{usr.bankName} - {usr.bankAccountNumber}</span>
                                <span className="text-[9px] text-slate-500 font-mono">IFSC: {usr.bankIfscCode}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">No bank setup</span>
                            )}
                          </td>
                          <td className="p-4 text-right font-bold text-slate-200">{getRankName(usr.level)}</td>
                          <td className="p-4 text-right font-extrabold text-purple-300">{usr.totalAccounts || 0}</td>
                          <td className="p-4 text-right font-black text-white">₹{usr.earnings?.balance || 0}</td>
                          <td className="p-4 text-right">
                            <div className="inline-flex gap-1.5 justify-end">
                              <button
                                onClick={() => setTrackingUser(usr)}
                                className="py-1 px-2.5 bg-luxury-navy border border-luxury-gold/30 hover:border-luxury-gold text-luxury-gold hover:text-white rounded-lg text-[10px] font-black transition inline-flex items-center gap-1 shadow-gold-glow/5"
                              >
                                <ExternalLink size={10} /> Track Links
                              </button>
                              <button
                                onClick={() => handleEditUserClick(usr)}
                                className="py-1 px-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold transition inline-flex items-center gap-1"
                              >
                                <Edit size={10} /> Edit Stats
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* 2. Withdrawals Queue Tab */}
        {activeTab === "withdrawals" && (
          <div className="flex flex-col gap-5">
            {/* Withdrawal Policy Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-panel rounded-2xl p-5 border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-2xl shrink-0">💸</div>
                <div>
                  <div className="text-emerald-300 font-black text-xl">{withdrawalsList.filter(w => w.status === "pending").length}</div>
                  <div className="text-xs text-slate-400 font-bold">Pending Requests</div>
                </div>
              </div>
              <div className="glass-panel rounded-2xl p-5 border border-sky-500/20 bg-sky-500/5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-2xl shrink-0">✅</div>
                <div>
                  <div className="text-sky-300 font-black text-xl">₹{withdrawalsList.filter(w => w.status === "approved").reduce((sum, w) => sum + (w.amount || 0), 0).toLocaleString("en-IN")}</div>
                  <div className="text-xs text-slate-400 font-bold">Total Paid Out</div>
                </div>
              </div>
              <div className="glass-panel rounded-2xl p-5 border border-amber-500/20 bg-amber-500/5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-2xl shrink-0">🔓</div>
                <div>
                  <div className="text-amber-300 font-black text-xl">50</div>
                  <div className="text-xs text-slate-400 font-bold">Referrals to Unlock</div>
                </div>
              </div>
            </div>

            {/* Policy Banner */}
            <div className="glass-panel rounded-2xl p-4 border border-white/10 flex items-start gap-3 bg-white/[0.02]">
              <span className="text-lg shrink-0">🔒</span>
              <div>
                <strong className="text-white text-sm block mb-1">Withdrawal Requirement Policy</strong>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Users can only submit withdrawal requests after completing <span className="text-emerald-400 font-bold">50 successful referrals</span> (accounts opened by their team members). This system ensures account quality and prevents fraud. Withdrawal requests submitted here are from verified eligible users only.
                </p>
              </div>
            </div>

            {/* Main Table */}
            <div className="glass-card-premium rounded-3xl overflow-hidden">
              {(() => {
                const filteredWithdrawals = withdrawalsList.filter(withdraw => {
                  if (!withdrawalSearchQuery) return true;
                  const q = withdrawalSearchQuery.toLowerCase();
                  return (
                    (withdraw.employeeName || "").toLowerCase().includes(q) ||
                    (withdraw.employeeId || "").toLowerCase().includes(q) ||
                    (withdraw.email || "").toLowerCase().includes(q) ||
                    (withdraw.bankAccountName || "").toLowerCase().includes(q) ||
                    (withdraw.bankAccountNumber || "").toLowerCase().includes(q) ||
                    (withdraw.bankName || "").toLowerCase().includes(q) ||
                    (withdraw.status || "").toLowerCase().includes(q)
                  );
                });
                return (
                  <>
                    <div className="p-4 bg-white/5 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-300">Bank Dispatch Settlement Requests Queue ({filteredWithdrawals.length} of {withdrawalsList.length})</span>
                        <span className="text-[10px] text-slate-500 font-mono">Requires 50 referrals to request</span>
                      </div>
                      
                      {/* Search withdrawals */}
                      <div className="relative w-full md:w-72">
                        <Search size={13} className="absolute left-3 top-3 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Search by ID, Name, Account, UPI..."
                          value={withdrawalSearchQuery}
                          onChange={(e) => setWithdrawalSearchQuery(e.target.value)}
                          className="w-full bg-luxury-dark border border-slate-700/60 rounded-xl pl-8 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-luxury-gold"
                        />
                        {withdrawalSearchQuery && (
                          <button type="button" onClick={() => setWithdrawalSearchQuery("")} className="absolute right-3 top-2 text-slate-500 hover:text-white text-xs">✕</button>
                        )}
                      </div>
                    </div>

                    {withdrawalsList.length === 0 ? (
                      <div className="py-16 text-center">
                        <div className="text-4xl mb-3">💳</div>
                        <div className="text-slate-400 text-sm font-semibold mb-1">No withdrawal requests yet</div>
                        <p className="text-slate-600 text-xs">Users need to complete 50 referrals before requesting withdrawals</p>
                      </div>
                    ) : filteredWithdrawals.length === 0 ? (
                      <div className="py-16 text-center">
                        <div className="text-4xl mb-3">🔍</div>
                        <div className="text-slate-400 text-sm font-semibold mb-1">No matching withdrawal requests</div>
                        <p className="text-slate-600 text-xs">Try adjusting your search terms</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-white/10 text-slate-400 font-bold uppercase">
                              <th className="p-4">Employee ID / Name</th>
                              <th className="p-4">Bank Account Details</th>
                              <th className="p-4">Referrals Completed</th>
                              <th className="p-4 text-right">Requested Amount</th>
                              <th className="p-4 text-right">Date</th>
                              <th className="p-4 text-right">Settlement Status</th>
                              <th className="p-4 text-right">Operations</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {filteredWithdrawals.map((withdraw) => {
                              const userDoc = usersList.find(u => u.uid === withdraw.uid);
                              const referralCount = userDoc?.approvedCount || userDoc?.totalAccounts || 0;
                              return (
                                <tr key={withdraw.id} className="hover:bg-white/5 transition">
                                  <td className="p-4">
                                    <strong className="text-white block">{withdraw.employeeName}</strong>
                                    <span className="text-[10px] text-slate-500 font-mono">{withdraw.employeeId} — {withdraw.email}</span>
                                  </td>
                                  <td className="p-4 font-mono text-luxury-gold font-bold">
                                    {withdraw.bankAccountNumber ? (
                                      <div className="flex flex-col text-[11px] gap-0.5 font-sans leading-tight normal-case text-left">
                                        <span className="text-white font-medium">{withdraw.bankAccountName}</span>
                                        <span className="text-slate-400 font-mono text-[10px]">{withdraw.bankName} - {withdraw.bankAccountNumber}</span>
                                        <span className="text-[9px] text-slate-500 font-mono">IFSC: {withdraw.bankIfscCode}</span>
                                      </div>
                                    ) : (
                                      <span className="text-amber-500 text-[11px]">N/A</span>
                                    )}
                                  </td>
                                  <td className="p-4">
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border ${referralCount >= 50 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-amber-500/10 border-amber-500/20 text-amber-300"}`}>
                                      {referralCount >= 50 ? "✅" : "⚠️"} {referralCount}/50
                                    </div>
                                  </td>
                                  <td className="p-4 text-right font-black text-white text-sm">₹{withdraw.amount?.toLocaleString("en-IN")}</td>
                                  <td className="p-4 text-right text-slate-400 text-[10px]">
                                    {withdraw.createdAt ? new Date(withdraw.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                                  </td>
                                  <td className="p-4 text-right">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                                      withdraw.status === "approved" 
                                        ? "bg-emerald-950 border-emerald-800 text-emerald-300"
                                        : withdraw.status === "rejected"
                                          ? "bg-red-950 border-red-800 text-red-300"
                                          : "bg-amber-950 border-amber-800 text-amber-300"
                                    }`}>
                                      {withdraw.status}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right">
                                    {withdraw.status === "pending" ? (
                                      <div className="inline-flex gap-1.5">
                                        <button
                                          onClick={() => handleApproveWithdrawal(withdraw)}
                                          className="py-1 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-luxury-dark rounded-lg text-[10px] font-black transition flex items-center gap-0.5"
                                        >
                                          <Check size={10} /> Settle Paid
                                        </button>
                                        <button
                                          onClick={() => handleRejectWithdrawal(withdraw)}
                                          className="py-1 px-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-red-400 rounded-lg text-[10px] font-bold transition flex items-center gap-0.5"
                                        >
                                          <X size={10} /> Refund
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-slate-500 text-[10px] font-semibold">Logged & Checked</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* 3. Submissions Tab */}
        {activeTab === "submissions" && (
          <div className="glass-card-premium rounded-3xl overflow-hidden">
            {(() => {
              const filteredChecklistSubmissions = kycSubmissions.filter(sub => {
                if (!checklistSearchQuery) return true;
                const q = checklistSearchQuery.toLowerCase();
                return (
                  (sub.userName || "").toLowerCase().includes(q) ||
                  (sub.userEmail || "").toLowerCase().includes(q) ||
                  (sub.campaignName || "").toLowerCase().includes(q) ||
                  (sub.registeredDetails?.mobile || "").toLowerCase().includes(q) ||
                  (sub.registeredDetails?.bankAccountName || "").toLowerCase().includes(q) ||
                  (sub.registeredDetails?.bankAccountNumber || "").toLowerCase().includes(q) ||
                  (sub.registeredDetails?.bankName || "").toLowerCase().includes(q)
                );
              });
              return (
                <>
                  <div className="p-4 bg-white/5 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <span className="text-xs font-bold text-slate-300">Campaign Checklist Verification Audit ({filteredChecklistSubmissions.length} of {kycSubmissions.length})</span>
                    
                    {/* Search checklists */}
                    <div className="relative w-full md:w-72">
                      <Search size={13} className="absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search by Employee, Campaign, bank details..."
                        value={checklistSearchQuery}
                        onChange={(e) => setChecklistSearchQuery(e.target.value)}
                        className="w-full bg-luxury-dark border border-slate-700/60 rounded-xl pl-8 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-luxury-gold"
                      />
                      {checklistSearchQuery && (
                        <button type="button" onClick={() => setChecklistSearchQuery("")} className="absolute right-3 top-2 text-slate-500 hover:text-white text-xs">✕</button>
                      )}
                    </div>
                  </div>

                  {kycSubmissions.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 text-xs">No pending checklists verification requests.</div>
                  ) : filteredChecklistSubmissions.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="text-4xl mb-3">🔍</div>
                      <div className="text-slate-400 text-sm font-semibold mb-1">No matching checklist verification requests</div>
                      <p className="text-slate-600 text-xs">Try adjusting your search terms</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-400 font-bold uppercase">
                            <th className="p-4">Employee</th>
                            <th className="p-4">Affiliate Campaign</th>
                            <th className="p-4">Declared Profile details</th>
                            <th className="p-4 text-right">Reward Commissions</th>
                            <th className="p-4 text-right">Action Gate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredChecklistSubmissions.map((sub, idx) => (
                            <tr key={idx} className="hover:bg-white/5 transition">
                              <td className="p-4">
                                <strong className="text-white block">{sub.userName}</strong>
                                <span className="text-[10px] text-slate-500">{sub.userEmail}</span>
                              </td>
                              <td className="p-4 font-bold text-slate-300">{sub.campaignName}</td>
                              <td className="p-4 text-[11px] space-y-0.5">
                                <div>Phone: {sub.registeredDetails?.mobile}</div>
                                {sub.registeredDetails?.bankAccountNumber ? (
                                  <div className="flex flex-col text-[10px] text-slate-400 font-sans leading-tight mt-1">
                                    <span className="text-white font-medium">Bank Details:</span>
                                    <span>A/C Name: {sub.registeredDetails.bankAccountName}</span>
                                    <span>{sub.registeredDetails.bankName} - {sub.registeredDetails.bankAccountNumber}</span>
                                    <span>IFSC: {sub.registeredDetails.bankIfscCode}</span>
                                  </div>
                                ) : (
                                  <div>Bank Details: <span className="text-luxury-gold font-mono font-bold">N/A</span></div>
                                )}
                                {sub.verificationNotes && (
                                  <div className="mt-1 bg-white/5 border border-white/10 p-1.5 rounded text-slate-300 max-w-xs break-words">
                                    <span className="text-[9px] text-slate-500 font-bold block">User Note:</span>
                                    {sub.verificationNotes}
                                  </div>
                                )}
                              </td>
                              <td className="p-4 text-right font-black text-luxury-gold text-sm">₹{sub.reward}</td>
                              <td className="p-4 text-right">
                                <div className="inline-flex gap-1.5">
                                  <button
                                    onClick={() => handleApproveKyc(sub)}
                                    className="py-1 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-luxury-dark rounded-lg text-[10px] font-black transition"
                                  >
                                    ✓ Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectKyc(sub)}
                                    className="py-1 px-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-red-400 rounded-lg text-[10px] font-bold transition"
                                  >
                                    ✕ Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* 4. Referral Signups Tab */}
        {activeTab === "referrals" && (
          <div className="glass-card-premium rounded-3xl overflow-hidden">
            {(() => {
              const filteredReferrals = referralsList.filter(ref => {
                if (!referralSearchQuery) return true;
                const q = referralSearchQuery.toLowerCase();
                const referrer = usersList.find(u => u.uid === ref.referrerUid);
                const referrerName = referrer ? referrer.name : "";
                return (
                  (ref.refereeName || "").toLowerCase().includes(q) ||
                  (ref.refereeEmail || "").toLowerCase().includes(q) ||
                  (ref.campaignName || "").toLowerCase().includes(q) ||
                  (ref.status || "").toLowerCase().includes(q) ||
                  (referrerName || "").toLowerCase().includes(q) ||
                  (ref.referrerUid || "").toLowerCase().includes(q) ||
                  (ref.refereeUid || "").toLowerCase().includes(q)
                );
              });
              return (
                <>
                  <div className="p-4 bg-white/5 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <span className="text-xs font-bold text-slate-300">Downline Referral Invites Register ({filteredReferrals.length} of {referralsList.length})</span>
                    
                    {/* Search referrals */}
                    <div className="relative w-full md:w-72">
                      <Search size={13} className="absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search by Referee, Referrer, Campaign, Status..."
                        value={referralSearchQuery}
                        onChange={(e) => setReferralSearchQuery(e.target.value)}
                        className="w-full bg-luxury-dark border border-slate-700/60 rounded-xl pl-8 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-luxury-gold"
                      />
                      {referralSearchQuery && (
                        <button type="button" onClick={() => setReferralSearchQuery("")} className="absolute right-3 top-2 text-slate-500 hover:text-white text-xs">✕</button>
                      )}
                    </div>
                  </div>

                  {referralsList.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 text-xs">No referrals signed up yet.</div>
                  ) : filteredReferrals.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="text-4xl mb-3">🔍</div>
                      <div className="text-slate-400 text-sm font-semibold mb-1">No matching referral invites</div>
                      <p className="text-slate-600 text-xs">Try adjusting your search terms</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-400 font-bold uppercase">
                            <th className="p-4">Referrer Promotor</th>
                            <th className="p-4">Candidate Referee</th>
                            <th className="p-4">Campaign Track</th>
                            <th className="p-4 text-right">Bounty reward</th>
                            <th className="p-4 text-right">Invites status</th>
                            <th className="p-4 text-right">Verification Gate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredReferrals.map((ref) => {
                            const referrer = usersList.find(u => u.uid === ref.referrerUid);
                            return (
                              <tr key={ref.id} className="hover:bg-white/5 transition">
                                <td className="p-4">
                                  <strong className="text-white block">{referrer ? referrer.name : "Unknown"}</strong>
                                  <span className="text-[10px] text-slate-500 font-mono">UID: {ref.referrerUid.substring(0, 8)}...</span>
                                </td>
                                <td className="p-4">
                                  <strong className="text-slate-200 block">{ref.refereeName}</strong>
                                  <span className="text-[10px] text-slate-500">{ref.refereeEmail}</span>
                                </td>
                                <td className="p-4 font-semibold text-slate-300">{ref.campaignName}</td>
                                <td className="p-4 text-right font-bold text-luxury-gold">₹{ref.rewardAmount}</td>
                                <td className="p-4 text-right">
                                  <span className={`inline-flex px-2 py-0.5 rounded-full border text-[9px] font-bold ${
                                    ref.status === "approved"
                                      ? "bg-emerald-950 border-emerald-800 text-emerald-300"
                                      : ref.status === "rejected"
                                        ? "bg-red-950 border-red-800 text-red-300"
                                        : "bg-amber-950 border-amber-800 text-amber-300"
                                  }`}>
                                    {ref.status}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  {ref.status === "pending" ? (
                                    <div className="inline-flex gap-1.5">
                                      <button
                                        onClick={() => handleApproveReferral(ref)}
                                        className="py-1 px-2 bg-emerald-500 hover:bg-emerald-600 text-luxury-dark rounded-lg text-[9px] font-black transition"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleRejectReferral(ref)}
                                        className="py-1 px-2 bg-white/5 hover:bg-white/10 border border-white/10 text-red-400 rounded-lg text-[9px] font-bold transition"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-500 font-semibold">Processed</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* 5. Campaign Editor Tab */}
        {activeTab === "campaigns" && (
          <div>
            {showCampForm ? (
              <div className="glass-card-premium rounded-3xl p-6 max-w-xl mx-auto border border-white/10">
                <h3 className="font-display text-sm font-bold text-white mb-4">
                  {editingCampId ? "Edit Campaign configuration" : "Create New Affiliate Campaign"}
                </h3>

                <form onSubmit={handleSaveCampaign} className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Campaign ID Slug (Lowercase)</label>
                      <input
                        type="text"
                        disabled={!!editingCampId}
                        required
                        className="form-input-luxury"
                        placeholder="e.g. upstox"
                        value={campForm.id}
                        onChange={(e) => setCampForm({ ...campForm, id: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Campaign Title</label>
                      <input
                        type="text"
                        required
                        className="form-input-luxury"
                        placeholder="e.g. Upstox Demat"
                        value={campForm.name}
                        onChange={(e) => setCampForm({ ...campForm, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Commission Reward (₹)</label>
                      <input
                        type="number"
                        required
                        className="form-input-luxury"
                        placeholder="e.g. 400"
                        value={campForm.reward}
                        onChange={(e) => setCampForm({ ...campForm, reward: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Onboarding Redirect URL</label>
                      <input
                        type="url"
                        className="form-input-luxury"
                        placeholder="e.g. https://brand.com"
                        value={campForm.redirectUrl}
                        onChange={(e) => setCampForm({ ...campForm, redirectUrl: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Minimum Level Required</label>
                      <input
                        type="number"
                        min={1}
                        max={7}
                        className="form-input-luxury"
                        placeholder="e.g. 2"
                        value={campForm.minLevel}
                        onChange={(e) => setCampForm({ ...campForm, minLevel: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Level Name</label>
                      <input
                        type="text"
                        className="form-input-luxury"
                        placeholder="e.g. Supervisor"
                        value={campForm.minLevelName}
                        onChange={(e) => setCampForm({ ...campForm, minLevelName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Prerequisite Campaign</label>
                      <select
                        className="form-input-luxury bg-luxury-navy text-xs text-white"
                        value={campForm.dependsOn || "None"}
                        onChange={(e) => setCampForm({ ...campForm, dependsOn: e.target.value })}
                      >
                        <option value="None">None</option>
                        {campaigns.filter(c => c.id !== campForm.id).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-5 select-none">
                      <input
                        type="checkbox"
                        id="isLockedByAdmin"
                        className="w-4 h-4 rounded bg-surface-container-lowest border-white/10 text-primary focus:ring-0 cursor-pointer"
                        checked={campForm.isLockedByAdmin || false}
                        onChange={(e) => setCampForm({ ...campForm, isLockedByAdmin: e.target.checked })}
                      />
                      <label htmlFor="isLockedByAdmin" className="text-xs font-bold text-slate-300 cursor-pointer">
                        Lock Campaign (Disable Access)
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">Campaign Sorting Order Position (Lowest numbers visible first)</label>
                    <input
                      type="number"
                      min={0}
                      className="form-input-luxury"
                      placeholder="e.g. 1"
                      value={campForm.position !== undefined ? campForm.position : ""}
                      onChange={(e) => setCampForm({ ...campForm, position: e.target.value === "" ? "" : Number(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">Campaign Logo Image URL</label>
                    <input
                      type="url"
                      className="form-input-luxury"
                      placeholder="e.g. https://brand.com/logo.png"
                      value={campForm.logo || ""}
                      onChange={(e) => setCampForm({ ...campForm, logo: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Custom Payout Text</label>
                      <input
                        type="text"
                        className="form-input-luxury"
                        placeholder="e.g. ₹50 - ₹100"
                        value={campForm.payout || ""}
                        onChange={(e) => setCampForm({ ...campForm, payout: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">EPC (₹)</label>
                      <input
                        type="text"
                        className="form-input-luxury"
                        placeholder="e.g. 52.50"
                        value={campForm.epc || ""}
                        onChange={(e) => setCampForm({ ...campForm, epc: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Approval Rate (%)</label>
                      <input
                        type="text"
                        className="form-input-luxury"
                        placeholder="e.g. 93%"
                        value={campForm.approvalRate || ""}
                        onChange={(e) => setCampForm({ ...campForm, approvalRate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">Short Description</label>
                    <input
                      type="text"
                      className="form-input-luxury"
                      placeholder="Zero brokerage trading account..."
                      value={campForm.shortDesc}
                      onChange={(e) => setCampForm({ ...campForm, shortDesc: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">Eligibility Criteria (One per line)</label>
                    <textarea
                      rows={3}
                      className="form-input-luxury h-20"
                      placeholder="Valid Aadhaar&#10;Valid PAN card"
                      value={campForm.eligibility}
                      onChange={(e) => setCampForm({ ...campForm, eligibility: e.target.value })}
                    />
                  </div>



                  <div className="flex gap-3 mt-2">
                    <button type="submit" className="flex-1 py-3 bg-gold-gradient text-luxury-dark font-black text-xs rounded-xl shadow-gold-glow">
                      Save Campaign
                    </button>
                    <button type="button" onClick={() => setShowCampForm(false)} className="px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (() => {
              const filteredCamps = campaigns.filter(camp => {
                const query = campaignSearchQuery.toLowerCase().trim();
                if (!query) return true;
                return (
                  (camp.name || "").toLowerCase().includes(query) ||
                  (camp.id || "").toLowerCase().includes(query) ||
                  (camp.shortDesc || "").toLowerCase().includes(query)
                );
              });
              
              return (
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredCamps.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-500 text-xs border border-dashed border-white/5 rounded-2xl">
                      No campaigns matched your search query.
                    </div>
                  ) : (
                    filteredCamps.map((camp) => (
                      <div key={camp.id} className="glass-card-premium rounded-2xl p-5 flex flex-col justify-between border-l-2 border-l-luxury-gold">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-extrabold text-slate-400">ID: {camp.id} | Level {camp.minLevel || 1}</span>
                            <strong className="text-luxury-gold font-extrabold">₹{camp.reward}</strong>
                          </div>
                          <div className="flex items-center gap-3 mb-2.5">
                            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center p-1.5 overflow-hidden shrink-0 shadow-md">
                              {camp.logo && !imgErrors[camp.id] ? (
                                <img 
                                  src={camp.logo} 
                                  alt={camp.name} 
                                  className="w-full h-full object-contain filter brightness-110"
                                  onError={() => setImgErrors(prev => ({ ...prev, [camp.id]: true }))}
                                />
                              ) : (
                                <div className="w-full h-full rounded-lg bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center text-xs font-black text-white">
                                  {camp.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-white leading-tight">{camp.name}</h4>
                          </div>
                          <p className="text-slate-400 text-[10px] leading-relaxed truncate">{camp.shortDesc}</p>
                        </div>

                        <div className="flex gap-2 mt-4 pt-3 border-t border-white/5">
                          <button onClick={() => handleEditCampClick(camp)} className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1">
                            <Edit size={10} /> Edit
                          </button>
                          <button onClick={() => handleDeleteCamp(camp.id)} className="px-3 py-2 bg-red-950/20 border border-red-900/40 text-red-400 rounded-lg text-[10px] font-bold flex items-center justify-center">
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* 5.5. Tracking Node Tab */}
        {activeTab === "tracking" && (
          <div className="flex flex-col gap-6">
            <div className="glass-card-premium rounded-3xl p-6 border border-white/10">
              <h3 className="text-sm font-bold text-white mb-2">Link Tracking &amp; Conversion Gateways</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Click logs and completions are processed in real-time. Use the search bar below to filter results.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-luxury-dark/40 border border-white/5 p-4 rounded-2xl">
                  <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Click Tracking URL Route</span>
                  <div className="bg-luxury-navy/40 border border-white/5 rounded p-2 text-slate-300 break-all select-all">
                    {`${window.location.origin}/#/gateway?action=click&campaignId={campaignId}&userId={userId}`}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass-card-premium rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1.5">Log Manual Tracking Event</h3>
                  <form onSubmit={handleLogManualEvent} className="flex flex-col gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Select Employee/User</label>
                      <select
                        required
                        className="form-input-luxury bg-luxury-navy"
                        value={manualEvent.userId}
                        onChange={(e) => setManualEvent({ ...manualEvent, userId: e.target.value })}
                      >
                        <option value="">-- Choose Promoter --</option>
                        {usersList.map(u => (
                          <option key={u.uid} value={u.uid}>{u.name} ({u.userId || "No ID"})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Select Campaign</label>
                      <select
                        required
                        className="form-input-luxury bg-luxury-navy"
                        value={manualEvent.campaignId}
                        onChange={(e) => setManualEvent({ ...manualEvent, campaignId: e.target.value })}
                      >
                        <option value="">-- Choose Campaign --</option>
                        {campaigns.map(c => (
                          <option key={c.id} value={c.id}>{c.name} (₹{c.reward})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Event Classification</label>
                      <select
                        className="form-input-luxury bg-luxury-navy"
                        value={manualEvent.type}
                        onChange={(e) => setManualEvent({ ...manualEvent, type: e.target.value })}
                      >
                        <option value="click">Click Event (Link Visited)</option>
                        <option value="complete">Completion Event (Conversion Logged)</option>
                      </select>
                    </div>

                    <button type="submit" className="w-full py-2.5 bg-gold-gradient text-luxury-dark rounded-xl text-xs font-black hover:opacity-95 shadow-gold-glow mt-2 transition">
                      Log Tracked Event
                    </button>
                  </form>
                </div>
              </div>

              <div className="glass-card-premium rounded-3xl p-6 border border-white/10">
                <h3 className="text-sm font-bold text-white mb-1.5">Process Bulk CSV Tracking Logs</h3>
                <form onSubmit={handleProcessBulkCsv} className="flex flex-col gap-3">
                  <textarea
                    rows={6}
                    required
                    className="form-input-luxury font-mono text-xs h-36 resize-none"
                    placeholder="user-uid-123, angel_one, click&#10;user-uid-123, upstox, complete"
                    value={bulkCsvText}
                    onChange={(e) => setBulkCsvText(e.target.value)}
                  />
                  <button type="submit" className="w-full py-2.5 bg-purple-gradient text-white rounded-xl text-xs font-bold shadow-purple-glow transition">
                    Upload &amp; Process Tracking Logs
                  </button>
                </form>
              </div>
            </div>

            <div className="glass-card-premium rounded-3xl overflow-hidden">
              <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-300">Live Network Click &amp; Completion Auditing Logs</span>
                <input
                  type="text"
                  className="bg-luxury-navy border border-white/10 rounded-lg px-2.5 py-1 text-[10px] outline-none focus:border-luxury-gold max-w-xs w-full text-white"
                  placeholder="Search logs..."
                  value={trackingSearch}
                  onChange={(e) => setTrackingSearch(e.target.value)}
                />
              </div>

              {(() => {
                const mergedLogs = [
                  ...clicksList.map(c => ({ ...c, logType: "Click", style: "bg-blue-950/40 border-blue-900/40 text-blue-300" }))
                ];
                
                mergedLogs.sort((a, b) => {
                  const tA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp).getTime();
                  const tB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp).getTime();
                  return (tB || 0) - (tA || 0);
                });

                const filteredLogs = mergedLogs.filter(log => {
                  const search = trackingSearch.toLowerCase();
                  if (!search) return true;
                  const userName = usersList.find(u => u.uid === log.userId)?.name || "";
                  const campaignName = campaigns.find(c => c.id === log.campaignId)?.name || "";
                  return (
                    log.userId?.toLowerCase().includes(search) ||
                    log.campaignId?.toLowerCase().includes(search) ||
                    userName.toLowerCase().includes(search) ||
                    campaignName.toLowerCase().includes(search)
                  );
                });

                if (filteredLogs.length === 0) {
                  return <div className="py-16 text-center text-slate-500 text-xs">No click events recorded.</div>;
                }

                return (
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 font-bold uppercase">
                          <th className="p-4">Timestamp</th>
                          <th className="p-4">Promoter User</th>
                          <th className="p-4">Target Campaign</th>
                          <th className="p-4">Event Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                        {filteredLogs.slice(0, 30).map((log) => {
                          const userName = usersList.find(u => u.uid === log.userId)?.name || "Unknown User";
                          const campaignName = campaigns.find(c => c.id === log.campaignId)?.name || log.campaignId;
                          const formattedDate = log.timestamp?.seconds
                            ? new Date(log.timestamp.seconds * 1000).toLocaleString()
                            : log.timestamp ? new Date(log.timestamp).toLocaleString() : "Real-time sync";

                          return (
                            <tr key={log.id} className="hover:bg-white/5 transition">
                              <td className="p-4 text-slate-400">{formattedDate}</td>
                              <td className="p-4 text-left">
                                <strong className="text-white block font-sans">{userName}</strong>
                                <span className="text-[10px] text-slate-500 block">UID: {log.userId}</span>
                              </td>
                              <td className="p-4 font-bold text-slate-300 font-sans">{campaignName}</td>
                              <td className="p-4">
                                <span className={`inline-flex px-2 py-0.5 rounded-full border text-[9px] font-bold ${log.style}`}>
                                  {log.logType}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* 6. Rank & Overrides Tab */}
        {activeTab === "levels" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg animate-fade-in text-on-surface">
            {/* Left Panel: Rank Hierarchy */}
            <aside className="lg:col-span-4 flex flex-col gap-md">
              <div className="glass-panel rounded-xl p-md flex flex-col gap-sm">
                <div className="flex justify-between items-center mb-base">
                  <h3 className="font-title-sm text-title-sm text-on-surface">Rank Hierarchy</h3>
                  <span className="bg-primary/20 text-primary px-2.5 py-1 rounded-full text-[10px] font-label-caps uppercase tracking-wider">
                    Ecosystem
                  </span>
                </div>
                
                <div className="flex flex-col gap-xs overflow-y-auto max-h-[500px] custom-scrollbar">
                  {[
                    { lvl: 1, name: "Intern", desc: "Starting Tier", icon: "shield_person" },
                    { lvl: 2, name: "Executive", desc: `${levelConfig.level2 || 100} Appr. Ref`, icon: "verified_user" },
                    { lvl: 3, name: "Senior Executive", desc: `${levelConfig.level3 || 250} Appr. Ref`, icon: "military_tech" },
                    { lvl: 4, name: "Assistant Supervisor", desc: `${levelConfig.level4 || 500} Appr. Ref`, icon: "badge" },
                    { lvl: 5, name: "Supervisor", desc: `${levelConfig.level5 || 1000} Appr. Ref`, icon: "verified_user" },
                    { lvl: 6, name: "Assistant Manager", desc: `${levelConfig.level6 || 2000} Appr. Ref`, icon: "stars" },
                    { lvl: 7, name: "Manager", desc: `${levelConfig.level7 || 5000} Appr. Ref`, icon: "diamond" },
                    { lvl: 8, name: "Senior Manager", desc: `${levelConfig.level8 || 8000} Appr. Ref`, icon: "workspace_premium" },
                    { lvl: 9, name: "Regional Manager", desc: `${levelConfig.level9 || 12000} Appr. Ref`, icon: "language" },
                    { lvl: 10, name: "State Head", desc: `${levelConfig.level10 || 16000} Appr. Ref`, icon: "account_balance" },
                    { lvl: 11, name: "National Head", desc: `${levelConfig.level11 || 20000} Appr. Ref`, icon: "flag" },
                    { lvl: 12, name: "Diamond Manager", desc: `${levelConfig.level12 || 25000} Appr. Ref`, icon: "emoji_events" },
                    { lvl: 13, name: "Platinum Manager", desc: `${levelConfig.level13 || 30000} Appr. Ref`, icon: "military_tech" },
                    { lvl: 14, name: "Elite Director", desc: `${levelConfig.level14 || 40000} Appr. Ref`, icon: "trophy" }
                  ].map((rk) => (
                    <div
                      key={rk.lvl}
                      onClick={() => setSelectedRank(rk.lvl)}
                      className={`p-md rounded-lg flex items-center justify-between cursor-pointer transition-all ${
                        selectedRank === rk.lvl
                          ? "bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-primary bg-surface-container/35"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-md">
                        {(() => {
                          const badgeColorClass = levelConfig[`color${rk.lvl}`] || (
                            rk.lvl === 1 ? "bg-primary" :
                            rk.lvl === 2 ? "bg-blue-500" :
                            rk.lvl === 3 ? "bg-emerald-500" :
                            rk.lvl === 4 ? "bg-rose-500" :
                            "bg-amber-500"
                          );
                          const txtColor = badgeColorClass === "bg-primary" ? "text-primary" : badgeColorClass.replace("bg-", "text-");
                          const bgColor = badgeColorClass === "bg-primary" ? "bg-primary/10" : badgeColorClass + "/15";
                          return (
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgColor} ${txtColor}`}>
                              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {rk.icon}
                              </span>
                            </div>
                          );
                        })()}
                        <div>
                          <p className="font-bold text-on-surface text-xs">{rk.name}</p>
                          <p className="text-[10px] text-outline mt-0.5">Lvl {rk.lvl} • {rk.desc}</p>
                        </div>
                      </div>
                      {selectedRank === rk.lvl && (
                        <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* Right Panel: Editor */}
            <div className="lg:col-span-8 flex flex-col gap-lg">
              <form onSubmit={handleSaveRankAndOverrides} className="glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <div className="bg-primary/10 px-lg py-md border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-primary">edit</span>
                    <span className="font-label-caps text-label-caps text-primary tracking-widest uppercase">
                      RANK EDITOR: {[
                        "Intern", "Executive", "Senior Executive", "Assistant Supervisor", "Supervisor", "Assistant Manager",
                        "Manager", "Senior Manager", "Regional Manager", "State Head", "National Head",
                        "Diamond Manager", "Platinum Manager", "Elite Director"
                      ][selectedRank - 1]}
                    </span>
                  </div>
                  <div className="flex gap-sm">
                    <button
                      type="button"
                      onClick={() => {
                        showToast("Changes discarded.", "info");
                      }}
                      className="bg-surface-container-highest text-on-surface px-4 py-2 rounded-lg font-body-sm text-body-sm hover:bg-surface-bright transition-colors active:scale-95"
                    >
                      Discard
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="bg-primary text-on-primary-container px-4 py-2 rounded-lg font-body-sm text-body-sm font-bold shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>

                <div className="p-lg grid grid-cols-1 md:grid-cols-2 gap-xl">
                  {/* General Info */}
                  <div className="flex flex-col gap-lg">
                    <h4 className="font-title-sm text-title-sm text-on-surface flex items-center gap-xs">
                      General Info
                    </h4>
                    <div className="space-y-md">
                      <div className="flex flex-col gap-xs">
                        <label className="font-label-caps text-label-caps text-outline">Rank Name</label>
                        <input
                          type="text"
                          disabled
                          className="bg-surface-container-lowest border-none opacity-60 cursor-not-allowed rounded-lg text-on-surface w-full p-2.5 text-xs font-semibold"
                          value={[
                            "Intern", "Executive", "Senior Executive", "Assistant Supervisor", "Supervisor", "Assistant Manager",
                            "Manager", "Senior Manager", "Regional Manager", "State Head", "National Head",
                            "Diamond Manager", "Platinum Manager", "Elite Director"
                          ][selectedRank - 1]}
                        />
                      </div>
                      <div className="flex flex-col gap-xs">
                        <label className="font-label-caps text-label-caps text-outline">Level Identifier</label>
                        <div className="flex items-center gap-sm">
                          <input
                            type="number"
                            disabled
                            className="bg-surface-container-lowest border-none opacity-60 cursor-not-allowed rounded-lg text-on-surface w-24 p-2.5 text-xs font-mono font-semibold"
                            value={selectedRank}
                          />
                          <span className="text-outline text-[11px] italic">Determines hierarchy stacking order.</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-xs">
                        <label className="font-label-caps text-label-caps text-outline">Rank Badge Color</label>
                        <div className="flex gap-sm">
                          {[
                            { key: "bg-primary", label: "Yellow/Purple" },
                            { key: "bg-blue-500", label: "Blue" },
                            { key: "bg-emerald-500", label: "Green" },
                            { key: "bg-rose-500", label: "Pink" },
                            { key: "bg-amber-500", label: "Orange" }
                          ].map(col => {
                            const activeColor = levelConfig[`color${selectedRank}`] || (
                              selectedRank === 1 ? "bg-primary" :
                              selectedRank === 2 ? "bg-blue-500" :
                              selectedRank === 3 ? "bg-emerald-500" :
                              selectedRank === 4 ? "bg-rose-500" :
                              "bg-amber-500"
                            );
                            const isSelected = activeColor === col.key;
                            return (
                              <button 
                                key={col.key}
                                type="button" 
                                onClick={() => setLevelConfig(prev => ({ ...prev, [`color${selectedRank}`]: col.key }))}
                                className={`w-8 h-8 rounded-full ${col.key} transition-all duration-200 transform hover:scale-110 active:scale-95 ${
                                  isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110" : "opacity-80"
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="flex flex-col gap-lg">
                    <h4 className="font-title-sm text-title-sm text-on-surface flex items-center gap-xs">
                      Requirements
                    </h4>
                    <div className="space-y-md">
                      <div className="flex flex-col gap-xs">
                        <label className="font-label-caps text-label-caps text-outline">Approved Referrals</label>
                        <div className="relative">
                          <input
                            type="number"
                            disabled={selectedRank === 1}
                            className={`bg-surface-container-lowest border ${
                              selectedRank === 1 ? "border-none opacity-60 cursor-not-allowed" : "border-white/10 focus:border-primary"
                            } rounded-lg text-on-surface w-full pr-12 p-2.5 text-xs font-mono`}
                            value={selectedRank === 1 ? 0 : levelConfig[`level${selectedRank}`] || ""}
                            onChange={(e) => {
                              if (selectedRank === 1) return;
                              setLevelConfig({
                                ...levelConfig,
                                [`level${selectedRank}`]: Number(e.target.value)
                              });
                            }}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[18px]">group</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-xs">
                        <label className="font-label-caps text-label-caps text-outline">Team Volume (Min Monthly)</label>
                        <div className="relative">
                          <input
                            type="text"
                            disabled
                            className="bg-surface-container-lowest border-none opacity-60 cursor-not-allowed rounded-lg text-on-surface w-full pr-12 p-2.5 text-xs font-mono"
                            value="₹0"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[18px]">payments</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/5 mx-lg"></div>

                {/* Overrides & Commission */}
                <div className="p-lg flex flex-col gap-lg">
                  <div className="flex justify-between items-center">
                    <h4 className="font-title-sm text-title-sm text-on-surface">Override Rules &amp; Commission</h4>
                    <div className="flex items-center gap-md">
                      <span className="text-xs text-outline font-label-caps uppercase tracking-wider">ACTIVE STATUS</span>
                      <button
                        type="button"
                        onClick={() => setGlobalPassive(prev => ({ ...prev, isActive: !prev.isActive }))}
                        className={`w-12 h-6 rounded-full relative transition-all duration-200 border ${
                          globalPassive.isActive 
                            ? "bg-primary/25 border-primary/40 flex items-center justify-end px-1" 
                            : "bg-slate-900 border-white/10 flex items-center justify-start px-1"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full shadow-md transition-all duration-200 ${
                          globalPassive.isActive ? "bg-primary shadow-[0_0_8px_rgba(168,85,247,0.6)]" : "bg-slate-500"
                        }`}></div>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                    <div className="bg-surface-container-lowest border border-white/5 rounded-xl p-md">
                      <div className="flex items-center justify-between mb-sm">
                        <p className="font-label-caps text-[10px] text-primary uppercase font-bold tracking-wider">Direct Pay</p>
                        <span className="material-symbols-outlined text-outline text-[16px]">info</span>
                      </div>
                      <div className="flex items-baseline gap-xs">
                        <span className="text-2xl font-bold font-mono">10</span>
                        <span className="text-outline text-xs">%</span>
                      </div>
                      <p className="text-[9px] text-outline mt-1.5">Commission on direct referral task completion.</p>
                    </div>

                    <div className="bg-surface-container-lowest border border-white/5 rounded-xl p-md">
                      <div className="flex items-center justify-between mb-sm">
                        <p className="font-label-caps text-[10px] text-primary uppercase font-bold tracking-wider">Level 2 Override</p>
                        <span className="material-symbols-outlined text-outline text-[16px]">info</span>
                      </div>
                      <div className="flex items-baseline gap-xs">
                        <input
                          type="number"
                          className="bg-transparent border-none p-0 focus:ring-0 text-2xl font-bold font-mono w-16 text-on-surface"
                          value={globalPassive.teamOverride}
                          onChange={(e) => setGlobalPassive({ ...globalPassive, teamOverride: Number(e.target.value) })}
                        />
                        <span className="text-outline text-xs">%</span>
                      </div>
                      <p className="text-[9px] text-outline mt-1.5">Earnings overrides from referees' downline referrers.</p>
                    </div>

                    <div className="bg-surface-container-lowest border border-white/5 rounded-xl p-md">
                      <div className="flex items-center justify-between mb-sm">
                        <p className="font-label-caps text-[10px] text-primary uppercase font-bold tracking-wider">Infinity Override</p>
                        <span className="material-symbols-outlined text-outline text-[16px]">info</span>
                      </div>
                      <div className="flex items-baseline gap-xs">
                        <input
                          type="number"
                          className="bg-transparent border-none p-0 focus:ring-0 text-2xl font-bold font-mono w-16 text-on-surface"
                          value={globalPassive.downlineReferral}
                          onChange={(e) => setGlobalPassive({ ...globalPassive, downlineReferral: Number(e.target.value) })}
                        />
                        <span className="text-outline text-xs">%</span>
                      </div>
                      <p className="text-[9px] text-outline mt-1.5">Applies to deep multi-generation network overrides.</p>
                    </div>
                  </div>
                </div>
              </form>

              {/* Rank Up Rewards */}
              <div className="flex flex-col gap-md">
                <h4 className="font-title-sm text-title-sm text-on-surface px-1">Rank Up Rewards</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                  <div className="glass-panel p-md rounded-xl flex flex-col gap-sm">
                    <div className="w-10 h-10 rounded-full bg-status-approved/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-status-approved">card_giftcard</span>
                    </div>
                    <div>
                      <p className="font-bold text-on-surface text-xs">Achievement Cash Bonus</p>
                      <p className="text-[10px] text-outline mt-0.5">Instant one-time bonus payout upon rank promotion.</p>
                    </div>
                    <div className="mt-auto pt-sm flex justify-between items-center border-t border-white/5">
                      <div className="flex items-center gap-1">
                        <span className="text-outline text-xs">₹</span>
                        <input
                          type="number"
                          className="bg-transparent border-none p-0 focus:ring-0 text-primary font-bold w-20 text-sm font-mono"
                          value={globalPassive.monthlyBonus}
                          onChange={(e) => setGlobalPassive({ ...globalPassive, monthlyBonus: Number(e.target.value) })}
                        />
                      </div>
                      <span className="material-symbols-outlined text-outline text-sm">settings</span>
                    </div>
                  </div>

                  <div className="glass-panel rounded-xl p-md flex flex-col gap-sm border-dashed border-white/10 hover:border-primary/40 bg-transparent opacity-60 hover:opacity-100 cursor-pointer transition-all items-center justify-center py-lg text-center">
                    <span className="material-symbols-outlined text-primary mb-xs text-[28px]">add_circle</span>
                    <p className="font-label-caps text-label-caps text-outline">Add New Reward</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. Broadcaster Tab */}
        {activeTab === "notifications" && (
          <div className="glass-card-premium rounded-3xl p-6 md:p-8 max-w-lg mx-auto border border-white/10">
            <h3 className="font-display text-sm font-bold text-white mb-4 flex items-center gap-1.5">
              <Bell size={18} className="text-purple-400" /> Broadcast Global Network Notification
            </h3>
            <form onSubmit={handleBroadcastNotification} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Alert Classification (Type)</label>
                <select
                  className="form-input-luxury bg-luxury-navy"
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value)}
                >
                  <option value="info">General Information (Info)</option>
                  <option value="success">Promotion / Bonus Achievement (Success)</option>
                  <option value="warning">System Alert (Warning)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Notification Message</label>
                <textarea
                  required
                  rows={4}
                  className="form-input-luxury h-28"
                  placeholder="e.g. Leaderboard payouts updated..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                />
              </div>

              <button type="submit" className="w-full py-3 bg-purple-gradient text-white font-bold text-xs rounded-xl shadow-purple-glow flex items-center justify-center gap-1.5 transition">
                <Send size={14} /> Dispatch Network Alert
              </button>
            </form>
          </div>
        )}

        {/* 9. Reports Tab */}
        {activeTab === "reports" && (
          <div className="glass-card-premium rounded-3xl p-6 md:p-8 max-w-lg mx-auto border border-white/10 text-center">
            <Briefcase size={40} className="text-luxury-gold mx-auto mb-3" />
            <h3 className="font-display text-sm font-bold text-white mb-2">ReferX Report Compiling Center</h3>
            <div className="flex flex-col gap-4 max-w-xs mx-auto">
              <button
                onClick={() => handleGenerateReport("daily")}
                className="w-full py-3.5 bg-gold-gradient text-luxury-dark font-black text-xs rounded-xl shadow-gold-glow flex items-center justify-center gap-2 hover:opacity-95 transition click-physics"
              >
                <Download size={14} /> Compile Daily Performance Report
              </button>
            </div>
          </div>
        )}

        {/* 10. Page Content Tab (CMS) */}
        {activeTab === "page-content" && (
          <div className="glass-card-premium rounded-3xl p-6 md:p-8 border border-white/10 max-w-4xl mx-auto">
            <h3 className="font-display text-base font-bold text-white mb-4 flex items-center gap-2">
              <Sliders size={20} className="text-luxury-gold animate-pulse" /> Page Content Manager (CMS)
            </h3>
            
            {/* CMS Sections Subtabs */}
            <div className="flex border-b border-white/5 gap-2 pb-2 mb-6 overflow-x-auto select-none no-scrollbar">
              {[
                { key: "general", label: "General & Support" },
                { key: "homepage", label: "Homepage" },
                { key: "dashboard", label: "Dashboard" },
                { key: "team", label: "Team Page" },
                { key: "campaigns", label: "Campaigns Page" },
                { key: "earnings", label: "Wallet Page" },
                { key: "profile", label: "Profile Page" },
                { key: "policies", label: "Footer & Policies" }
              ].map(sec => (
                <button
                  type="button"
                  key={sec.key}
                  onClick={() => setActiveCmsSection(sec.key)}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg transition-colors ${
                    activeCmsSection === sec.key 
                      ? "bg-gold-gradient text-luxury-dark shadow-gold-glow font-extrabold" 
                      : "bg-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveCms} className="flex flex-col gap-8 text-left">
              
              {/* Section 1: General Settings */}
              {activeCmsSection === "general" && (
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                  <h4 className="text-xs font-black text-luxury-gold uppercase tracking-wider mb-2">General App & Support Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">App Name</label>
                      <input
                        type="text"
                        className="form-input-luxury text-xs"
                        value={cmsForm.appName}
                        onChange={(e) => setCmsForm({ ...cmsForm, appName: e.target.value })}
                        placeholder="ReferX"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">App Tagline</label>
                      <input
                        type="text"
                        className="form-input-luxury text-xs"
                        value={cmsForm.appTagline}
                        onChange={(e) => setCmsForm({ ...cmsForm, appTagline: e.target.value })}
                        placeholder="Earn Money by Referring Friends"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Support Email</label>
                      <input
                        type="email"
                        className="form-input-luxury text-xs"
                        value={cmsForm.supportEmail}
                        onChange={(e) => setCmsForm({ ...cmsForm, supportEmail: e.target.value })}
                        placeholder="support@referx.in"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Support WhatsApp Number (e.g. +91 8185892753)</label>
                      <input
                        type="text"
                        className="form-input-luxury text-xs"
                        value={cmsForm.supportWhatsApp}
                        onChange={(e) => setCmsForm({ ...cmsForm, supportWhatsApp: e.target.value })}
                        placeholder="+91 8185892753"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Section 2: Homepage Content */}
              {activeCmsSection === "homepage" && (
                <div className="space-y-6">
                  {/* Hero Copy */}
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                    <h4 className="text-xs font-black text-luxury-gold uppercase tracking-wider mb-2">Hero Section Copy</h4>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Hero Title</label>
                      <input
                        type="text"
                        className="form-input-luxury"
                        value={cmsForm.homepage.heroTitle}
                        onChange={(e) => setCmsForm({ 
                          ...cmsForm, 
                          homepage: { ...cmsForm.homepage, heroTitle: e.target.value } 
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Hero Description</label>
                      <textarea
                        rows={3}
                        className="form-input-luxury h-20 text-xs"
                        value={cmsForm.homepage.heroDesc}
                        onChange={(e) => setCmsForm({ 
                          ...cmsForm, 
                          homepage: { ...cmsForm.homepage, heroDesc: e.target.value } 
                        })}
                      />
                    </div>
                  </div>

                  {/* Flow Steps */}
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                    <h4 className="text-xs font-black text-luxury-gold uppercase tracking-wider mb-4">Onboarding Flow Steps (1 to 4)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Step 1 */}
                      <div className="border border-white/5 p-3.5 rounded-xl bg-white/[0.02] space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Step 01</span>
                        <div>
                          <label className="text-[9px] font-bold text-slate-300 block mb-0.5">Title</label>
                          <input
                            type="text"
                            className="form-input-luxury text-xs"
                            value={cmsForm.homepage.step1Title}
                            onChange={(e) => setCmsForm({ 
                              ...cmsForm, 
                              homepage: { ...cmsForm.homepage, step1Title: e.target.value } 
                            })}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-300 block mb-0.5">Description</label>
                          <textarea
                            rows={2}
                            className="form-input-luxury text-xs h-14"
                            value={cmsForm.homepage.step1Desc}
                            onChange={(e) => setCmsForm({ 
                              ...cmsForm, 
                              homepage: { ...cmsForm.homepage, step1Desc: e.target.value } 
                            })}
                          />
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="border border-white/5 p-3.5 rounded-xl bg-white/[0.02] space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Step 02</span>
                        <div>
                          <label className="text-[9px] font-bold text-slate-300 block mb-0.5">Title</label>
                          <input
                            type="text"
                            className="form-input-luxury text-xs"
                            value={cmsForm.homepage.step2Title}
                            onChange={(e) => setCmsForm({ 
                              ...cmsForm, 
                              homepage: { ...cmsForm.homepage, step2Title: e.target.value } 
                            })}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-300 block mb-0.5">Description</label>
                          <textarea
                            rows={2}
                            className="form-input-luxury text-xs h-14"
                            value={cmsForm.homepage.step2Desc}
                            onChange={(e) => setCmsForm({ 
                              ...cmsForm, 
                              homepage: { ...cmsForm.homepage, step2Desc: e.target.value } 
                            })}
                          />
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="border border-white/5 p-3.5 rounded-xl bg-white/[0.02] space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Step 03</span>
                        <div>
                          <label className="text-[9px] font-bold text-slate-300 block mb-0.5">Title</label>
                          <input
                            type="text"
                            className="form-input-luxury text-xs"
                            value={cmsForm.homepage.step3Title}
                            onChange={(e) => setCmsForm({ 
                              ...cmsForm, 
                              homepage: { ...cmsForm.homepage, step3Title: e.target.value } 
                            })}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-300 block mb-0.5">Description</label>
                          <textarea
                            rows={2}
                            className="form-input-luxury text-xs h-14"
                            value={cmsForm.homepage.step3Desc}
                            onChange={(e) => setCmsForm({ 
                              ...cmsForm, 
                              homepage: { ...cmsForm.homepage, step3Desc: e.target.value } 
                            })}
                          />
                        </div>
                      </div>

                      {/* Step 4 */}
                      <div className="border border-white/5 p-3.5 rounded-xl bg-white/[0.02] space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Step 04</span>
                        <div>
                          <label className="text-[9px] font-bold text-slate-300 block mb-0.5">Title</label>
                          <input
                            type="text"
                            className="form-input-luxury text-xs"
                            value={cmsForm.homepage.step4Title}
                            onChange={(e) => setCmsForm({ 
                              ...cmsForm, 
                              homepage: { ...cmsForm.homepage, step4Title: e.target.value } 
                            })}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-300 block mb-0.5">Description</label>
                          <textarea
                            rows={2}
                            className="form-input-luxury text-xs h-14"
                            value={cmsForm.homepage.step4Desc}
                            onChange={(e) => setCmsForm({ 
                              ...cmsForm, 
                              homepage: { ...cmsForm.homepage, step4Desc: e.target.value } 
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FAQs */}
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                    <h4 className="text-xs font-black text-luxury-gold uppercase tracking-wider mb-4">Frequently Asked Questions (FAQ 1 to 4)</h4>
                    <div className="flex flex-col gap-6">
                      {[1, 2, 3, 4].map(idx => (
                        <div key={idx} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-2">FAQ 0{idx}</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-[9px] font-bold text-slate-300 block mb-0.5">Question</label>
                              <input
                                type="text"
                                className="form-input-luxury text-xs"
                                value={cmsForm.homepage[`faq${idx}Q`]}
                                onChange={(e) => setCmsForm({ 
                                  ...cmsForm, 
                                  homepage: { ...cmsForm.homepage, [`faq${idx}Q`]: e.target.value } 
                                })}
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-slate-300 block mb-0.5">Answer</label>
                              <textarea
                                rows={2}
                                className="form-input-luxury text-xs h-14"
                                value={cmsForm.homepage[`faq${idx}A`]}
                                onChange={(e) => setCmsForm({ 
                                  ...cmsForm, 
                                  homepage: { ...cmsForm.homepage, [`faq${idx}A`]: e.target.value } 
                                })}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Section 3: Dashboard Content */}
              {activeCmsSection === "dashboard" && (
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                  <h4 className="text-xs font-black text-luxury-gold uppercase tracking-wider mb-2">Dashboard Page Copy</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Welcome Hero Subtext</label>
                      <input
                        type="text"
                        className="form-input-luxury text-xs"
                        value={cmsForm.dashboard.welcomeSubtext}
                        onChange={(e) => setCmsForm({
                          ...cmsForm,
                          dashboard: { ...cmsForm.dashboard, welcomeSubtext: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Quick Tasks Card Title</label>
                      <input
                        type="text"
                        className="form-input-luxury text-xs"
                        value={cmsForm.dashboard.quickTasksTitle}
                        onChange={(e) => setCmsForm({
                          ...cmsForm,
                          dashboard: { ...cmsForm.dashboard, quickTasksTitle: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Recent Activity Section Title</label>
                      <input
                        type="text"
                        className="form-input-luxury text-xs"
                        value={cmsForm.dashboard.activityTitle}
                        onChange={(e) => setCmsForm({
                          ...cmsForm,
                          dashboard: { ...cmsForm.dashboard, activityTitle: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Section 4: Team Page Content */}
              {activeCmsSection === "team" && (
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                  <h4 className="text-xs font-black text-luxury-gold uppercase tracking-wider mb-2">Team Network Page Copy</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Team Page Header Title</label>
                      <input
                        type="text"
                        className="form-input-luxury text-xs"
                        value={cmsForm.team.pageTitle}
                        onChange={(e) => setCmsForm({
                          ...cmsForm,
                          team: { ...cmsForm.team, pageTitle: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Team Page Description</label>
                      <textarea
                        rows={2}
                        className="form-input-luxury text-xs h-14"
                        value={cmsForm.team.pageDesc}
                        onChange={(e) => setCmsForm({
                          ...cmsForm,
                          team: { ...cmsForm.team, pageDesc: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Empty State Title (If no downline)</label>
                      <input
                        type="text"
                        className="form-input-luxury text-xs"
                        value={cmsForm.team.emptyTitle}
                        onChange={(e) => setCmsForm({
                          ...cmsForm,
                          team: { ...cmsForm.team, emptyTitle: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Empty State Description</label>
                      <textarea
                        rows={2}
                        className="form-input-luxury text-xs h-14"
                        value={cmsForm.team.emptyDesc}
                        onChange={(e) => setCmsForm({
                          ...cmsForm,
                          team: { ...cmsForm.team, emptyDesc: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Section 5: Campaigns Page Content */}
              {activeCmsSection === "campaigns" && (
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                  <h4 className="text-xs font-black text-luxury-gold uppercase tracking-wider mb-2">Campaigns / Tasks Page Copy</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Campaigns Header Title</label>
                      <input
                        type="text"
                        className="form-input-luxury text-xs"
                        value={cmsForm.campaigns.pageTitle}
                        onChange={(e) => setCmsForm({
                          ...cmsForm,
                          campaigns: { ...cmsForm.campaigns, pageTitle: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Campaigns Description</label>
                      <textarea
                        rows={2}
                        className="form-input-luxury text-xs h-14"
                        value={cmsForm.campaigns.pageDesc}
                        onChange={(e) => setCmsForm({
                          ...cmsForm,
                          campaigns: { ...cmsForm.campaigns, pageDesc: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Empty State Title (If no campaigns match query)</label>
                      <input
                        type="text"
                        className="form-input-luxury text-xs"
                        value={cmsForm.campaigns.emptyTitle}
                        onChange={(e) => setCmsForm({
                          ...cmsForm,
                          campaigns: { ...cmsForm.campaigns, emptyTitle: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Empty State Description</label>
                      <textarea
                        rows={2}
                        className="form-input-luxury text-xs h-14"
                        value={cmsForm.campaigns.emptyDesc}
                        onChange={(e) => setCmsForm({
                          ...cmsForm,
                          campaigns: { ...cmsForm.campaigns, emptyDesc: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Section 6: Earnings Page Content */}
              {activeCmsSection === "earnings" && (
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                  <h4 className="text-xs font-black text-luxury-gold uppercase tracking-wider mb-2">Earnings & Wallet Page Copy</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Wallet Page Header Title</label>
                      <input
                        type="text"
                        className="form-input-luxury text-xs"
                        value={cmsForm.earnings.pageTitle}
                        onChange={(e) => setCmsForm({
                          ...cmsForm,
                          earnings: { ...cmsForm.earnings, pageTitle: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Wallet Page Description</label>
                      <textarea
                        rows={2}
                        className="form-input-luxury text-xs h-14"
                        value={cmsForm.earnings.pageDesc}
                        onChange={(e) => setCmsForm({
                          ...cmsForm,
                          earnings: { ...cmsForm.earnings, pageDesc: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Withdrawal Requirement Note (Shown in Modal)</label>
                      <textarea
                        rows={2}
                        className="form-input-luxury text-xs h-14"
                        value={cmsForm.earnings.withdrawNote}
                        onChange={(e) => setCmsForm({
                          ...cmsForm,
                          earnings: { ...cmsForm.earnings, withdrawNote: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Section 7: Profile Page Content */}
              {activeCmsSection === "profile" && (
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                  <h4 className="text-xs font-black text-luxury-gold uppercase tracking-wider mb-2">User Profile Page Copy</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Withdrawal Box Title (Locked State)</label>
                      <input
                        type="text"
                        className="form-input-luxury text-xs"
                        value={cmsForm.profile.withdrawalTitle}
                        onChange={(e) => setCmsForm({
                          ...cmsForm,
                          profile: { ...cmsForm.profile, withdrawalTitle: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Withdrawal Box Description (Locked State)</label>
                      <textarea
                        rows={2}
                        className="form-input-luxury text-xs h-14"
                        value={cmsForm.profile.withdrawalDesc}
                        onChange={(e) => setCmsForm({
                          ...cmsForm,
                          profile: { ...cmsForm.profile, withdrawalDesc: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Section 8: Footer & Policies Content */}
              {activeCmsSection === "policies" && (
                <div className="space-y-6">
                  {/* Terms & Conditions */}
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                    <h4 className="text-xs font-black text-luxury-gold uppercase tracking-wider mb-2">Terms & Conditions Policy</h4>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Terms Header Title</label>
                      <input
                        type="text"
                        className="form-input-luxury text-xs"
                        value={cmsForm.policies?.termsTitle || ""}
                        onChange={(e) => setCmsForm({
                          ...cmsForm,
                          policies: { ...cmsForm.policies, termsTitle: e.target.value }
                        })}
                      />
                    </div>

                    {[1, 2, 3, 4].map(num => (
                      <div key={num} className="border-t border-white/5 pt-3 space-y-3">
                        <span className="text-[9px] font-bold text-slate-500 uppercase">Section {num}</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="md:col-span-1">
                            <label className="text-[9px] font-bold text-slate-300 block mb-0.5">Section Title</label>
                            <input
                              type="text"
                              className="form-input-luxury text-xs"
                              value={cmsForm.policies?.[`termsSec${num}Title`] || ""}
                              onChange={(e) => setCmsForm({
                                ...cmsForm,
                                policies: { ...cmsForm.policies, [`termsSec${num}Title`]: e.target.value }
                              })}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-[9px] font-bold text-slate-300 block mb-0.5">Section Description / Matter</label>
                            <textarea
                              rows={2}
                              className="form-input-luxury text-xs h-14"
                              value={cmsForm.policies?.[`termsSec${num}Body`] || ""}
                              onChange={(e) => setCmsForm({
                                ...cmsForm,
                                policies: { ...cmsForm.policies, [`termsSec${num}Body`]: e.target.value }
                              })}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Privacy Policy */}
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                    <h4 className="text-xs font-black text-luxury-gold uppercase tracking-wider mb-2">Privacy & Data Safety Policy</h4>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Privacy Header Title</label>
                      <input
                        type="text"
                        className="form-input-luxury text-xs"
                        value={cmsForm.policies?.privacyTitle || ""}
                        onChange={(e) => setCmsForm({
                          ...cmsForm,
                          policies: { ...cmsForm.policies, privacyTitle: e.target.value }
                        })}
                      />
                    </div>

                    {[1, 2, 3].map(num => (
                      <div key={num} className="border-t border-white/5 pt-3 space-y-3">
                        <span className="text-[9px] font-bold text-slate-500 uppercase">Section {num}</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="md:col-span-1">
                            <label className="text-[9px] font-bold text-slate-300 block mb-0.5">Section Title</label>
                            <input
                              type="text"
                              className="form-input-luxury text-xs"
                              value={cmsForm.policies?.[`privacySec${num}Title`] || ""}
                              onChange={(e) => setCmsForm({
                                ...cmsForm,
                                policies: { ...cmsForm.policies, [`privacySec${num}Title`]: e.target.value }
                              })}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-[9px] font-bold text-slate-300 block mb-0.5">Section Description / Matter</label>
                            <textarea
                              rows={2}
                              className="form-input-luxury text-xs h-14"
                              value={cmsForm.policies?.[`privacySec${num}Body`] || ""}
                              onChange={(e) => setCmsForm({
                                ...cmsForm,
                                policies: { ...cmsForm.policies, [`privacySec${num}Body`]: e.target.value }
                              })}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Payout Policy */}
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                    <h4 className="text-xs font-black text-luxury-gold uppercase tracking-wider mb-2">Payout Rules & Details Policy</h4>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Payout Header Title</label>
                      <input
                        type="text"
                        className="form-input-luxury text-xs"
                        value={cmsForm.policies?.warrantTitle || ""}
                        onChange={(e) => setCmsForm({
                          ...cmsForm,
                          policies: { ...cmsForm.policies, warrantTitle: e.target.value }
                        })}
                      />
                    </div>

                    {[1, 2, 3].map(num => (
                      <div key={num} className="border-t border-white/5 pt-3 space-y-3">
                        <span className="text-[9px] font-bold text-slate-500 uppercase">Section {num}</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="md:col-span-1">
                            <label className="text-[9px] font-bold text-slate-300 block mb-0.5">Section Title</label>
                            <input
                              type="text"
                              className="form-input-luxury text-xs"
                              value={cmsForm.policies?.[`warrantSec${num}Title`] || ""}
                              onChange={(e) => setCmsForm({
                                ...cmsForm,
                                policies: { ...cmsForm.policies, [`warrantSec${num}Title`]: e.target.value }
                              })}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-[9px] font-bold text-slate-300 block mb-0.5">Section Description / Matter</label>
                            <textarea
                              rows={2}
                              className="form-input-luxury text-xs h-14"
                              value={cmsForm.policies?.[`warrantSec${num}Body`] || ""}
                              onChange={(e) => setCmsForm({
                                ...cmsForm,
                                policies: { ...cmsForm.policies, [`warrantSec${num}Body`]: e.target.value }
                              })}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-4 bg-gold-gradient text-luxury-dark font-black text-xs rounded-xl shadow-gold-glow flex items-center justify-center gap-2 hover:opacity-95 transition click-physics"
              >
                <ShieldCheck size={16} /> Save Changes & Publish to Live Site
              </button>
            </form>
          </div>
        )}

        {/* Support Tickets Tab Panel */}
        {activeTab === "support-tickets" && (
          <div className="glass-card-premium rounded-3xl p-6 md:p-8 border border-white/10 max-w-5xl mx-auto text-left">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-400">support_agent</span>
                  Support Tickets Panel
                </h3>
                <p className="text-xs text-slate-400 mt-1">Review user-submitted queries and mark their status.</p>
              </div>
              
              {/* Search ticket input */}
              <div className="relative w-full md:w-72">
                <input
                  type="text"
                  placeholder="Search by name, email, query..."
                  className="form-input-luxury pl-9 text-xs py-2"
                  value={supportSearchQuery}
                  onChange={(e) => setSupportSearchQuery(e.target.value)}
                />
                <Search size={14} className="absolute left-3 top-3.5 text-slate-500" />
                {supportSearchQuery && (
                  <button type="button" onClick={() => setSupportSearchQuery("")} className="absolute right-3 top-2.5 text-slate-500 hover:text-white">✕</button>
                )}
              </div>
            </div>

            {/* List tickets */}
            {(() => {
              const query = supportSearchQuery.toLowerCase().trim();
              const filtered = supportTicketsList.filter(t => 
                t.name?.toLowerCase().includes(query) ||
                t.userEmail?.toLowerCase().includes(query) ||
                t.mobile?.includes(query) ||
                t.query?.toLowerCase().includes(query)
              );

              if (filtered.length === 0) {
                return (
                  <div className="py-12 text-center border border-white/5 rounded-2xl bg-white/[0.01]">
                    <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">support_agent</span>
                    <p className="text-sm font-bold text-slate-400">No support tickets found</p>
                    <p className="text-xs text-slate-600 mt-1">When users submit contact requests from their profile page, they will show up here.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filtered.map(ticket => {
                    const date = ticket.createdAt?.seconds
                      ? new Date(ticket.createdAt.seconds * 1000).toLocaleString("en-IN")
                      : ticket.createdAt
                        ? new Date(ticket.createdAt).toLocaleString("en-IN")
                        : "Unknown Date";

                    return (
                      <div
                        key={ticket.id}
                        className={`p-5 rounded-2xl border transition-all duration-300 ${
                          ticket.status === "Resolved"
                            ? "bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/20"
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-extrabold text-white">{ticket.name}</h4>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                                ticket.status === "Resolved"
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                  : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                              }`}>
                                {ticket.status || "Pending"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono mt-1">
                              📧 {ticket.userEmail} · 📞 {ticket.mobile}
                            </p>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono self-end sm:self-start shrink-0">{date}</span>
                        </div>

                        {/* Query Text */}
                        <div className="p-3 rounded-xl bg-black/30 border border-white/5 mb-4">
                          <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-all">
                            {ticket.query}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleResolveTicket(ticket.id, ticket.status)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition click-physics ${
                              ticket.status === "Resolved"
                                ? "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
                                : "bg-emerald-500 text-black font-extrabold hover:bg-emerald-400"
                            }`}
                          >
                            <Check size={12} />
                            {ticket.status === "Resolved" ? "Reopen Ticket" : "Mark Resolved"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTicket(ticket.id)}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 uppercase tracking-wider flex items-center gap-1 transition click-physics"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </>)}

      </div>

      {/* Edit Employee Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-content glass-card border border-white/10 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="text-xs font-black text-luxury-gold uppercase block mb-1">Corporate Override</span>
                <h3 className="text-xl font-extrabold text-white">Edit Employee Stats</h3>
              </div>
              <button className="modal-close text-white" onClick={() => setEditingUser(null)}>✕</button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    className="form-input-luxury"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    className="form-input-luxury"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">Mobile</label>
                  <input
                    type="text"
                    className="form-input-luxury"
                    value={editForm.mobile}
                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    className="form-input-luxury"
                    value={editForm.bankAccountName}
                    onChange={(e) => setEditForm({ ...editForm, bankAccountName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">Bank Name</label>
                  <input
                    type="text"
                    className="form-input-luxury"
                    value={editForm.bankName}
                    onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">Account Number</label>
                  <input
                    type="text"
                    className="form-input-luxury"
                    value={editForm.bankAccountNumber}
                    onChange={(e) => setEditForm({ ...editForm, bankAccountNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">Bank IFSC Code</label>
                  <input
                    type="text"
                    className="form-input-luxury"
                    value={editForm.bankIfscCode}
                    onChange={(e) => setEditForm({ ...editForm, bankIfscCode: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">Total Accounts</label>
                  <input
                    type="number"
                    className="form-input-luxury"
                    value={editForm.totalAccounts}
                    onChange={(e) => setEditForm({ ...editForm, totalAccounts: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">Active Rank Level (1 - 7)</label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    className="form-input-luxury"
                    value={editForm.level}
                    onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">Available Balance (₹)</label>
                  <input
                    type="number"
                    className="form-input-luxury"
                    value={editForm.balance}
                    onChange={(e) => setEditForm({ ...editForm, balance: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">Pending Balance (₹)</label>
                  <input
                    type="number"
                    className="form-input-luxury"
                    value={editForm.pending}
                    onChange={(e) => setEditForm({ ...editForm, pending: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">Paid Out Balance (₹)</label>
                  <input
                    type="number"
                    className="form-input-luxury"
                    value={editForm.paid}
                    onChange={(e) => setEditForm({ ...editForm, paid: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">Today's Earnings (₹)</label>
                  <input
                    type="number"
                    className="form-input-luxury"
                    value={editForm.todayEarnings}
                    onChange={(e) => setEditForm({ ...editForm, todayEarnings: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">Yesterday's Earnings (₹)</label>
                  <input
                    type="number"
                    className="form-input-luxury"
                    value={editForm.yesterdayEarnings}
                    onChange={(e) => setEditForm({ ...editForm, yesterdayEarnings: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 mt-2">
                <span className="text-[11px] font-black text-luxury-gold uppercase tracking-wider block mb-2">
                  Campaign Status Manager
                </span>
                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1 bg-luxury-dark/40 border border-white/5 rounded-xl p-2.5">
                  {campaigns.map((camp) => {
                    const currentStatus = editForm.joinedCampaigns?.[camp.id]?.status || "Not Started";
                    return (
                      <div key={camp.id} className="flex justify-between items-center gap-3 p-2 border-b border-white/5 last:border-b-0 text-xs">
                        <div className="flex-1 min-w-0">
                          <strong className="text-white block truncate">{camp.name}</strong>
                        </div>
                        <select
                          className="bg-luxury-navy border border-white/10 rounded-lg px-2 py-1 text-[10px] font-semibold text-slate-200 focus:border-luxury-gold outline-none"
                          value={currentStatus}
                          onChange={(e) => handleCampaignStatusChange(camp.id, e.target.value)}
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Submitted">Submitted</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-gold-gradient text-luxury-dark font-black text-xs rounded-xl shadow-gold-glow mt-2">
                Commit Stat Override Changes
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// ============================================================================
// ADVANCED TEAM MANAGEMENT MODULE COMPONENT
// ============================================================================
export function TeamManagementModule({ 
  usersList, 
  referralsList, 
  clicksList, 
  activitiesList, 
  withdrawalsList, 
  campaigns, 
  showToast, 
  getRankName, 
  calculateUserLevel 
}) {
  const [subTab, setSubTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [activitySearchQuery, setActivitySearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Table Filters
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterActive, setFilterActive] = useState("all");
  const [filterCampaign, setFilterCampaign] = useState("all");
  const [filterSize, setFilterSize] = useState("all");
  const [filterEarnings, setFilterEarnings] = useState("all");
  
  // Table Sorting
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // Tree View State
  const [expandedNodes, setExpandedNodes] = useState({});
  const [selectedTreeRoot, setSelectedTreeRoot] = useState("all");

  // Leader Management editing
  const [editingRoleUserId, setEditingRoleUserId] = useState(null);
  const [customRoleInput, setCustomRoleInput] = useState("");
  const [editingLevelUserId, setEditingLevelUserId] = useState(null);
  const [leaderLevelInput, setLeaderLevelInput] = useState(1);

  // User details drawer tab
  const [drawerTab, setDrawerTab] = useState("details");

  // Debounced real-time Firestore analytics update
  const [analyticsDoc, setAnalyticsDoc] = useState(null);

  // Auto-calculated statistics
  const totalLeaders = usersList.filter(u => (u.directReferralsCount || 0) > 0 || u.level >= 2).length;
  const totalMembers = usersList.filter(u => u.role !== "admin").length;
  const totalReferrals = usersList.reduce((acc, u) => acc + (u.directReferralsCount || 0), 0);
  
  const activeMembers = usersList.filter(u => {
    if (u.role === "admin") return false;
    const lastLogin = u.lastLoginAt ? new Date(u.lastLoginAt) : null;
    const isRecent = lastLogin && (Date.now() - lastLogin.getTime()) < 7 * 24 * 60 * 60 * 1000;
    const hasCompletions = u.totalAccounts > 0 || (u.campaignCount || 0) > 0;
    return isRecent || hasCompletions;
  });
  const totalActiveCount = activeMembers.length;
  const totalInactiveCount = Math.max(0, totalMembers - totalActiveCount);

  const approvedMembersCount = usersList.filter(u => u.role !== "admin" && (u.approvedCount || 0) > 0).length;
  
  const pendingMembersCount = usersList.filter(u => {
    if (u.role === "admin") return false;
    return Object.values(u.joinedCampaigns || {}).some(c => c.status === "Submitted");
  }).length;

  const campaignParticipantsCount = usersList.filter(u => {
    if (u.role === "admin") return false;
    return Object.keys(u.joinedCampaigns || {}).length > 0;
  }).length;

  const totalCompletions = usersList.reduce((acc, u) => acc + (u.totalAccounts || u.approvedCount || 0), 0);
  const totalTeamEarnings = usersList.reduce((acc, u) => acc + (u.teamEarnings || 0), 0);

  // Growth Analytics
  const getJoinsCount = (days) => {
    const limit = Date.now() - days * 24 * 60 * 60 * 1000;
    return usersList.filter(u => {
      if (u.role === "admin") return false;
      const joinDate = u.createdAt ? new Date(u.createdAt).getTime() : null;
      return joinDate && joinDate >= limit;
    }).length;
  };
  const joinedToday = getJoinsCount(1);
  const joinedWeek = getJoinsCount(7);
  const joinedMonth = getJoinsCount(30);

  // Team Leader Calculations
  const leadersList = usersList.filter(u => (u.directReferralsCount || 0) > 0 || u.level >= 2);
  
  let topPerformingTeamName = "N/A";
  let maxScore = -1;
  leadersList.forEach(l => {
    const score = (l.totalTeamMembersCount || 0) * 10 + (l.teamEarnings || 0);
    if (score > maxScore) {
      maxScore = score;
      topPerformingTeamName = `Team ${l.name}`;
    }
  });

  let fastestGrowingTeamName = "N/A";
  let maxWeekJoins = -1;
  leadersList.forEach(l => {
    const downline = usersList.filter(u => u.referralPath && u.referralPath.includes(l.uid) && u.uid !== l.uid);
    const newJoins = downline.filter(u => {
      const joinDate = u.createdAt ? new Date(u.createdAt) : null;
      return joinDate && (Date.now() - joinDate.getTime()) < 7 * 24 * 60 * 60 * 1000;
    }).length;
    if (newJoins > maxWeekJoins) {
      maxWeekJoins = newJoins;
      fastestGrowingTeamName = `Team ${l.name}`;
    }
  });

  // Dynamic real-time calculation of passive percentage ratio
  const directEarningSum = usersList.reduce((acc, u) => acc + (u.directEarnings || 0), 0);
  const totalEarningSum = usersList.reduce((acc, u) => acc + (u.totalEarnings || u.earnings?.total || 0), 0);
  const totalDirectEarnings = directEarningSum;
  const totalOverrideEarnings = totalTeamEarnings;

  // Sync to database analytics collection separately
  const activeStatsDoc = React.useMemo(() => ({
    totalLeaders,
    totalMembers,
    totalReferrals,
    totalActiveCount,
    totalInactiveCount,
    approvedMembersCount,
    pendingMembersCount,
    campaignParticipantsCount,
    totalCompletions,
    totalTeamEarnings,
    topPerformingTeamName,
    fastestGrowingTeamName,
    joinedToday,
    joinedWeek,
    joinedMonth,
    directEarningSum,
    totalEarningSum
  }), [
    totalLeaders, totalMembers, totalReferrals, totalActiveCount, totalInactiveCount, 
    approvedMembersCount, pendingMembersCount, campaignParticipantsCount, totalCompletions, 
    totalTeamEarnings, topPerformingTeamName, fastestGrowingTeamName, joinedToday, 
    joinedWeek, joinedMonth, directEarningSum, totalEarningSum
  ]);

  useEffect(() => {
    const statsRef = doc(db, "teamAnalytics", "current_stats");
    const writeStats = async () => {
      try {
        await setDoc(statsRef, {
          ...activeStatsDoc,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn("Failed to write to teamAnalytics document:", err);
      }
    };
    const timer = setTimeout(writeStats, 4000);
    return () => clearTimeout(timer);
  }, [activeStatsDoc]);

  // Handle Updates
  const handleUpdateRole = async (userId, customRole) => {
    try {
      await updateDoc(doc(db, "users", userId), { customRole, updatedAt: new Date().toISOString() });
      showToast(`Custom role "${customRole}" assigned successfully!`, "success");
      setEditingRoleUserId(null);
    } catch (err) {
      showToast("Role assignment failed.", "danger");
    }
  };

  const handleUpdateLeaderLevel = async (userId, newLvl) => {
    try {
      await updateDoc(doc(db, "users", userId), { level: Number(newLvl), updatedAt: new Date().toISOString() });
      showToast(`User rank level updated to Level ${newLvl}!`, "success");
      setEditingLevelUserId(null);
    } catch (err) {
      showToast("Failed to update level.", "danger");
    }
  };

  const toggleExpand = (nodeId) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // CSV Export functions
  const exportToCSV = (data, filename) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(",")];
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        const escaped = ("" + (val === undefined || val === null ? "" : val)).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`${filename} compiled and downloaded successfully!`, "success");
  };

  const handleExportTeamReport = () => {
    const data = usersList.map(u => ({
      Name: u.name || "N/A",
      UserID: u.userId || "N/A",
      Email: u.email || "N/A",
      Mobile: u.mobile || "N/A",
      ReferralCode: u.referralCode || "N/A",
      Sponsor: u.sponsor?.name || "N/A",
      Level: u.level || 1,
      DirectReferrals: u.directReferralsCount || 0,
      TotalTeamMembers: u.totalTeamMembersCount || 0,
      Earnings: u.earnings?.total || 0,
      JoinDate: u.createdAt || "N/A",
      LastActive: u.lastLoginAt || "N/A"
    }));
    exportToCSV(data, `Team_Report_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const handleExportCampaignReport = () => {
    const data = campaigns.map(camp => {
      const parts = usersList.filter(u => u.joinedCampaigns?.[camp.id]);
      const pending = parts.filter(u => u.joinedCampaigns[camp.id].status === "Submitted").length;
      const approved = parts.filter(u => u.joinedCampaigns[camp.id].status === "Approved").length;
      const rejected = parts.filter(u => u.joinedCampaigns[camp.id].status === "Rejected").length;
      return {
        CampaignName: camp.name,
        Reward: camp.reward,
        TotalParticipants: parts.length,
        Pending: pending,
        Approved: approved,
        Rejected: rejected,
        ConversionRate: parts.length > 0 ? `${Math.round((approved / parts.length) * 100)}%` : "0%"
      };
    });
    exportToCSV(data, `Campaign_Report_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const handleExportEarningsReport = () => {
    const data = usersList.map(u => ({
      Name: u.name,
      UserID: u.userId,
      DirectEarnings: u.directEarnings || 0,
      TeamEarnings: u.teamEarnings || 0,
      ReferralEarnings: u.directEarnings || 0,
      TotalEarnings: (u.directEarnings || 0) + (u.teamEarnings || 0),
      Balance: u.earnings?.balance || 0,
      Paid: u.earnings?.paid || 0
    }));
    exportToCSV(data, `Earnings_Report_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const handleExportReferralReport = () => {
    const data = referralsList.map(r => ({
      ReferrerName: r.referrerName || "N/A",
      RefereeName: r.refereeName || "N/A",
      Campaign: r.campaignName || "N/A",
      BountyReward: r.rewardAmount || 0,
      Status: r.status || "N/A",
      Date: r.createdAt || "N/A"
    }));
    exportToCSV(data, `Referrals_Report_${new Date().toISOString().slice(0,10)}.csv`);
  };

  // Filter & Search Table computation
  const filteredUsers = React.useMemo(() => {
    return usersList.filter(u => {
      if (u.role === "admin") return false;
      
      // Search
      const search = searchTerm.toLowerCase();
      const matchSearch = !searchTerm || 
        (u.name || "").toLowerCase().includes(search) ||
        (u.userId || "").toLowerCase().includes(search) ||
        (u.email || "").toLowerCase().includes(search) ||
        (u.mobile || "").toLowerCase().includes(search) ||
        (u.referralCode || "").toLowerCase().includes(search) ||
        (u.sponsor?.name || "").toLowerCase().includes(search);

      if (!matchSearch) return false;

      // Filter Level
      if (filterLevel !== "all" && String(u.level) !== filterLevel) return false;

      // Filter Approval Status
      if (filterStatus !== "all" && u.status !== filterStatus) return false;

      // Filter Active Status
      if (filterActive !== "all") {
        const isActive = activeMembers.some(am => am.uid === u.uid);
        if (filterActive === "active" && !isActive) return false;
        if (filterActive === "inactive" && isActive) return false;
      }

      // Filter Campaign Status
      if (filterCampaign !== "all") {
        const joined = u.joinedCampaigns?.[filterCampaign];
        if (!joined) return false;
      }

      // Filter Team Size range
      if (filterSize !== "all") {
        const size = u.totalTeamMembersCount || 0;
        if (filterSize === "small" && size >= 10) return false;
        if (filterSize === "medium" && (size < 10 || size >= 50)) return false;
        if (filterSize === "large" && size < 50) return false;
      }

      // Filter Earnings range
      if (filterEarnings !== "all") {
        const total = u.earnings?.total || 0;
        if (filterEarnings === "low" && total >= 1000) return false;
        if (filterEarnings === "mid" && (total < 1000 || total >= 5000)) return false;
        if (filterEarnings === "high" && total < 5000) return false;
      }

      return true;
    }).sort((a, b) => {
      let fieldA, fieldB;
      if (sortField === "name") {
        fieldA = (a.name || "").toLowerCase();
        fieldB = (b.name || "").toLowerCase();
      } else if (sortField === "userId") {
        fieldA = (a.userId || "").toLowerCase();
        fieldB = (b.userId || "").toLowerCase();
      } else if (sortField === "teamSize") {
        fieldA = a.totalTeamMembersCount || 0;
        fieldB = b.totalTeamMembersCount || 0;
      } else if (sortField === "earnings") {
        fieldA = a.earnings?.total || 0;
        fieldB = b.earnings?.total || 0;
      } else if (sortField === "joinDate") {
        fieldA = new Date(a.createdAt || 0).getTime();
        fieldB = new Date(b.createdAt || 0).getTime();
      } else if (sortField === "lastActive") {
        fieldA = new Date(a.lastLoginAt || 0).getTime();
        fieldB = new Date(b.lastLoginAt || 0).getTime();
      }

      if (fieldA < fieldB) return sortOrder === "asc" ? -1 : 1;
      if (fieldA > fieldB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [usersList, searchTerm, filterLevel, filterStatus, filterActive, filterCampaign, filterSize, filterEarnings, sortField, sortOrder, activeMembers]);

  // Build root elements for Tree View
  const treeRoots = React.useMemo(() => {
    const roots = usersList.filter(u => {
      if (u.role === "admin") return false;
      return !u.parentUserId || u.parentUserId === "root" || u.sponsor?.uid === "root";
    });
    if (selectedTreeRoot !== "all") {
      return roots.filter(r => r.uid === selectedTreeRoot);
    }
    return roots;
  }, [usersList, selectedTreeRoot]);

  const teamProfilesMap = React.useMemo(() => {
    const map = {};
    usersList.forEach(u => {
      map[u.uid] = u;
    });
    return map;
  }, [usersList]);

  const treeHierarchyList = React.useMemo(() => {
    return usersList.map(u => ({
      userId: u.uid,
      referrerUid: u.parentUserId || u.sponsor?.uid || "root"
    }));
  }, [usersList]);

  // Earnings trends & lists
  const sortedEarners = React.useMemo(() => {
    return [...usersList]
      .filter(u => u.role !== "admin")
      .sort((a, b) => (b.earnings?.total || 0) - (a.earnings?.total || 0));
  }, [usersList]);
  
  const topEarners = sortedEarners.slice(0, 5);
  const lowestEarners = [...sortedEarners].reverse().slice(0, 5);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-slate-100">
      
      {/* Module Subtabs Menu */}
      <div className="flex border-b border-white/5 gap-2 pb-2 overflow-x-auto select-none">
        {[
          { key: "dashboard", label: "Analytics Overview", icon: <BarChart2 size={13} /> },
          { key: "directory", label: "Directory & Search", icon: <List size={13} /> },
          { key: "hierarchy", label: "Hierarchy Tree View", icon: <Network size={13} /> },
          { key: "performance", label: "Leaders & Performance", icon: <TrendingUp size={13} /> },
          { key: "campaigns", label: "Campaign Audits", icon: <Briefcase size={13} /> },
          { key: "activity", label: "Activities Log", icon: <Activity size={13} /> }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSubTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg transition-colors duration-150 ${
              subTab === tab.key 
                ? "bg-gold-gradient text-luxury-dark shadow-gold-glow" 
                : "bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUBTAB CONTENT: DASHBOARD / ANALYTICS */}
      {subTab === "dashboard" && (
        <div className="flex flex-col gap-6">
          {/* Summary Cards Grid (12 items) */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {[
              { label: "Team Leaders", value: totalLeaders, desc: "Direct / Rank Promoters", icon: <Award className="text-purple-400" size={16} /> },
              { label: "Team Size", value: totalMembers, desc: "Total user records", icon: <Users className="text-luxury-gold" size={16} /> },
              { label: "Total Referrals", value: totalReferrals, desc: "Direct parent signups", icon: <Network className="text-indigo-400" size={16} /> },
              { label: "Active Members", value: totalActiveCount, desc: "Active in 7 days / Complete", icon: <UserCheck className="text-emerald-400" size={16} /> },
              { label: "Inactive Members", value: totalInactiveCount, desc: "No completions or logins", icon: <UserX className="text-red-400" size={16} /> },
              { label: "KYC Approved", value: approvedMembersCount, desc: "Completions verified", icon: <CheckCircle className="text-teal-400" size={16} /> },
              { label: "KYC Pending", value: pendingMembersCount, desc: "In submission queue", icon: <Clock className="text-amber-400" size={16} /> },
              { label: "Campaign Users", value: campaignParticipantsCount, desc: "Joined at least 1 task", icon: <Briefcase className="text-blue-400" size={16} /> },
              { label: "Total Completions", value: totalCompletions, desc: "Total tasks approved", icon: <Check className="text-emerald-500" size={16} /> },
              { label: "Team Overrides", value: `₹${totalTeamEarnings}`, desc: "Aggregated team income", icon: <DollarSign className="text-luxury-gold" size={16} /> },
              { label: "Top Team", value: topPerformingTeamName, desc: "Leader total accounts score", icon: <Sliders className="text-pink-400" size={16} /> },
              { label: "Fastest Growing", value: fastestGrowingTeamName, desc: "Most new recruits (7d)", icon: <Sparkles className="text-cyan-400" size={16} /> }
            ].map((card, i) => (
              <div key={i} className="glass-card-premium rounded-2xl p-4 border border-white/5 flex flex-col justify-between relative overflow-hidden bg-luxury-navy/40">
                <div className="absolute top-0 right-0 p-2.5 opacity-10">{card.icon}</div>
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">{card.label}</span>
                  <strong className="text-lg md:text-xl font-black text-white mt-1 block truncate" title={String(card.value)}>{card.value}</strong>
                </div>
                <p className="text-[8px] text-slate-400 mt-2 font-medium truncate" title={card.desc}>{card.desc}</p>
              </div>
            ))}
          </div>

          {/* Growth & Earnings Analytics Breakdown */}
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Growth Trend Analytics */}
            <div className="glass-card-premium rounded-3xl p-5 border border-white/10 flex flex-col gap-4">
              <h4 className="text-xs font-black text-luxury-gold uppercase tracking-wider flex items-center gap-1">
                <LineChart size={14} /> Team Growth &amp; Expansion
              </h4>
              <p className="text-[10px] text-slate-400">Recruitment counts over various timestamp thresholds.</p>
              
              <div className="flex flex-col gap-3.5 mt-2">
                {[
                  { label: "New Joins Today", val: joinedToday, max: joinedMonth || 1, color: "from-purple-500 to-indigo-500" },
                  { label: "New Joins This Week", val: joinedWeek, max: joinedMonth || 1, color: "from-luxury-gold to-yellow-500" },
                  { label: "New Joins This Month", val: joinedMonth, max: joinedMonth || 1, color: "from-emerald-500 to-teal-500" }
                ].map((row, i) => {
                  const pct = joinedMonth > 0 ? Math.round((row.val / joinedMonth) * 100) : 0;
                  return (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-bold text-slate-300">
                        <span>{row.label}</span>
                        <span className="text-white font-mono">{row.val} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-luxury-dark rounded-full overflow-hidden border border-white/5">
                        <div className={`h-full bg-gradient-to-r ${row.color}`} style={{ width: `${Math.min(100, Math.max(5, pct))}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-luxury-dark/30 border border-white/5 rounded-2xl p-3 flex flex-col gap-1 text-[10px] leading-relaxed text-slate-400 mt-2">
                <span className="text-slate-200 font-bold">Growth Momentum:</span>
                Recruitment rate is determined via real-time registration paths. Active campaigns directly drive these metrics upward.
              </div>
            </div>

            {/* Earnings Distribution Breakdown */}
            <div className="glass-card-premium rounded-3xl p-5 border border-white/10 flex flex-col gap-4">
              <h4 className="text-xs font-black text-luxury-gold uppercase tracking-wider flex items-center gap-1">
                <DollarSign size={14} /> Revenue &amp; Commission Payouts
              </h4>
              <p className="text-[10px] text-slate-400">Comparing direct task earnings against downline overrides.</p>
              
              <div className="flex flex-col gap-3.5 mt-2">
                {[
                  { label: "Direct & Referral Bounty", val: totalDirectEarnings, total: totalEarningSum || 1, color: "from-purple-600 to-purple-400" },
                  { label: "Team Overrides", val: totalOverrideEarnings, total: totalEarningSum || 1, color: "from-luxury-gold to-yellow-500" }
                ].map((row, i) => {
                  const pct = totalEarningSum > 0 ? Math.round((row.val / totalEarningSum) * 100) : 0;
                  return (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-bold text-slate-300">
                        <span>{row.label}</span>
                        <span className="text-white font-mono">₹{row.val} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-luxury-dark rounded-full overflow-hidden border border-white/5">
                        <div className={`h-full bg-gradient-to-r ${row.color}`} style={{ width: `${Math.min(100, Math.max(5, pct))}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-luxury-dark/30 border border-white/5 rounded-2xl p-3 text-[10px] text-slate-400 leading-relaxed mt-2 flex flex-col gap-1">
                <div className="flex justify-between">
                  <span>Aggregate Network Commissions:</span>
                  <span className="text-white font-bold font-mono">₹{totalEarningSum}</span>
                </div>
                Overrides comprise {totalEarningSum > 0 ? Math.round((totalOverrideEarnings / totalEarningSum) * 100) : 0}% of all payouts.
              </div>
            </div>

            {/* Top Earners VS Lowest Earners */}
            <div className="glass-card-premium rounded-3xl p-5 border border-white/10 flex flex-col gap-3">
              <h4 className="text-xs font-black text-luxury-gold uppercase tracking-wider flex items-center gap-1">
                <TrendingUp size={14} /> Top Performers Leaderboard
              </h4>
              <p className="text-[10px] text-slate-400">Promoter payouts hierarchy listing.</p>
              
              <div className="flex flex-col gap-2 mt-1">
                {topEarners.map((usr, i) => (
                  <div key={usr.uid} className="flex justify-between items-center bg-white/5 border border-white/5 rounded-xl p-2 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-slate-500 font-mono">#{i+1}</span>
                      <img 
                        src={usr.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(usr.name || "Leader")}&background=2E1065&color=C084FC`} 
                        alt="" 
                        className="w-5.5 h-5.5 rounded-full object-cover"
                      />
                      <span className="text-white font-bold truncate hover:underline cursor-pointer" onClick={() => setSelectedUser(usr)}>{usr.name}</span>
                    </div>
                    <span className="text-luxury-gold font-mono font-bold shrink-0">₹{usr.earnings?.total || 0}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUBTAB CONTENT: TEAM DIRECTORY TABLE */}
      {subTab === "directory" && (
        <div className="flex flex-col gap-5">
          {/* Controls & Filters Bar */}
          <div className="glass-card-premium rounded-3xl p-5 border border-white/10 flex flex-col gap-4">
            <div className="flex flex-wrap justify-between items-center gap-4">
              {/* Search input */}
              <div className="relative flex-1 min-w-[280px]">
                <Search size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by Name, User ID, Email, Phone, Code, or Sponsor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-luxury-dark border border-slate-700/60 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-luxury-gold"
                />
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-2 flex-wrap select-none">
                <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Export:</span>
                <button onClick={handleExportTeamReport} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors">
                  <DownloadCloud size={13} /> Team CSV
                </button>
                <button onClick={handleExportCampaignReport} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors">
                  <DownloadCloud size={13} /> Campaign CSV
                </button>
                <button onClick={handleExportEarningsReport} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors">
                  <DownloadCloud size={13} /> Earnings CSV
                </button>
                <button onClick={handleExportReferralReport} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors">
                  <DownloadCloud size={13} /> Referrals CSV
                </button>
              </div>
            </div>

            {/* Custom Multi-Filters grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-white/5 select-none">
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Rank Level</label>
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="w-full bg-luxury-dark border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200"
                >
                  <option value="all">All Levels</option>
                  <option value="1">Level 1 (Intern)</option>
                  <option value="2">Level 2 (Executive)</option>
                  <option value="3">Level 3 (Senior Executive)</option>
                  <option value="4">Level 4 (Assistant Supervisor)</option>
                  <option value="5">Level 5 (Supervisor)</option>
                  <option value="6">Level 6 (Assistant Manager)</option>
                  <option value="7">Level 7 (Manager)</option>
                  <option value="8">Level 8 (Senior Manager)</option>
                  <option value="9">Level 9 (Regional Manager)</option>
                  <option value="10">Level 10 (State Head)</option>
                  <option value="11">Level 11 (National Head)</option>
                  <option value="12">Level 12 (Diamond Manager)</option>
                  <option value="13">Level 13 (Platinum Manager)</option>
                  <option value="14">Level 14 (Elite Director)</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Approval Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-luxury-dark border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200"
                >
                  <option value="all">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Active State</label>
                <select
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value)}
                  className="w-full bg-luxury-dark border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200"
                >
                  <option value="all">All States</option>
                  <option value="active">Active (7d login/completion)</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Campaign Joined</label>
                <select
                  value={filterCampaign}
                  onChange={(e) => setFilterCampaign(e.target.value)}
                  className="w-full bg-luxury-dark border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200"
                >
                  <option value="all">All Campaigns</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Team Size</label>
                <select
                  value={filterSize}
                  onChange={(e) => setFilterSize(e.target.value)}
                  className="w-full bg-luxury-dark border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200"
                >
                  <option value="all">All Sizes</option>
                  <option value="small">Small (&lt; 10 members)</option>
                  <option value="medium">Medium (10 - 50 members)</option>
                  <option value="large">Large (50+ members)</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Earnings Range</label>
                <select
                  value={filterEarnings}
                  onChange={(e) => setFilterEarnings(e.target.value)}
                  className="w-full bg-luxury-dark border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200"
                >
                  <option value="all">All Ranges</option>
                  <option value="low">Low (&lt; ₹1,000)</option>
                  <option value="mid">Mid (₹1,000 - ₹5,000)</option>
                  <option value="high">High (₹5,000+)</option>
                </select>
              </div>
            </div>

          </div>

          {/* Directory table */}
          <div className="glass-card-premium rounded-3xl overflow-hidden border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 font-bold uppercase select-none">
                    <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("name")}>
                      Promoter Name {sortField === "name" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("userId")}>
                      User ID {sortField === "userId" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="p-4">Mobile &amp; Email</th>
                    <th className="p-4">Ref Code</th>
                    <th className="p-4">Parent / Sponsor</th>
                    <th className="p-4 text-center">Ranks Level</th>
                    <th className="p-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("teamSize")}>
                      Team Size {sortField === "teamSize" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="p-4 text-center">Direct Referrals</th>
                    <th className="p-4 text-center">Tasks Completion</th>
                    <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("earnings")}>
                      Total Earnings {sortField === "earnings" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="p-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("joinDate")}>
                      Join Date {sortField === "joinDate" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="p-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("lastActive")}>
                      Last Active {sortField === "lastActive" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-slate-500">
                        No team promoters match your search and filter parameters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((member) => (
                      <tr key={member.uid} className="hover:bg-white/5 transition cursor-pointer" onClick={() => { setSelectedUser(member); setDrawerTab("details"); }}>
                        <td className="p-4 flex items-center gap-2.5">
                          <img
                            src={member.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || "Leader")}&background=2E1065&color=C084FC`}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover border border-white/10"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <strong className="text-white block hover:underline hover:text-luxury-gold">{member.name}</strong>
                              <span className="text-[9px] text-yellow-400 font-bold font-mono bg-yellow-500/10 px-1.5 py-0.2 rounded">
                                {member.userId || "USRxxxx"}
                              </span>
                            </div>
                            {member.customRole && (
                              <span className="inline-flex px-1.5 py-0.2 rounded bg-purple-900/60 border border-purple-800 text-[8px] font-black text-purple-200 uppercase mt-0.5 mr-1">
                                {member.customRole}
                              </span>
                            )}
                            <div className="text-[9px] text-slate-500 select-all mt-0.5 hover:text-slate-300">
                              Link: <span className="font-mono text-slate-400 select-all">{`${window.location.origin}/#/register?ref=${member.referralCode || ""}`}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-slate-400">{member.userId || "USRxxxx"}</td>
                        <td className="p-4 font-mono text-slate-300">
                          <div>{member.mobile || "N/A"}</div>
                          <div className="text-[10px] text-slate-500 font-sans">{member.email}</div>
                        </td>
                        <td className="p-4 font-mono text-slate-400">{member.referralCode || "N/A"}</td>
                        <td className="p-4">
                          <strong className="text-slate-200 block text-[11px]">{member.sponsor?.name || "System Admin"}</strong>
                          <span className="text-[9px] text-slate-500 font-mono block">ID: {member.sponsor?.uid?.slice(0, 8) || "root"}</span>
                        </td>
                        <td className="p-4 text-center font-bold text-slate-300">{getRankName(member.level)}</td>
                        <td className="p-4 text-center font-black text-white">{member.totalTeamMembersCount || 0}</td>
                        <td className="p-4 text-center font-bold text-slate-400">{member.directReferralsCount || 0}</td>
                        <td className="p-4 text-center font-extrabold text-purple-300">
                          {Object.values(member.joinedCampaigns || {}).filter(c => c.status === "Approved").length} completed
                        </td>
                        <td className="p-4 text-right font-black text-luxury-gold text-sm">₹{member.earnings?.total || 0}</td>
                        <td className="p-4 text-center text-slate-400 font-mono text-[10px]">
                          {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="p-4 text-center text-slate-400 font-mono text-[10px]">
                          {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleDateString() : "N/A"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB CONTENT: HIERARCHY TREE VIEW */}
      {subTab === "hierarchy" && (
        <div className="glass-card-premium rounded-3xl p-6 border border-white/10">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-3 border-b border-white/5">
            <div>
              <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5">
                <Network size={16} className="text-luxury-gold" /> Recursive Downline Hierarchy Tree
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Visualize the parent-child relationships and ancestor chains of your team.</p>
            </div>

            {/* Tree root selector */}
            <div className="flex items-center gap-2 select-none">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Focus Root Leader:</span>
              <select
                value={selectedTreeRoot}
                onChange={(e) => setSelectedTreeRoot(e.target.value)}
                className="bg-luxury-dark border border-slate-700/60 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-luxury-gold"
              >
                <option value="all">Display All Top Leaders</option>
                {usersList
                  .filter(u => !u.parentUserId || u.parentUserId === "root" || u.sponsor?.uid === "root")
                  .map(root => (
                    <option key={root.uid} value={root.uid}>{root.name} ({root.userId})</option>
                  ))
                }
              </select>
            </div>
          </div>

          <div className="bg-luxury-dark/40 border border-white/5 rounded-2xl p-6 min-h-[350px] max-h-[600px] overflow-y-auto">
            {treeRoots.length === 0 ? (
              <div className="text-center text-slate-500 text-xs py-16">No network trees generated.</div>
            ) : (
              <div className="flex flex-col gap-4">
                {treeRoots.map(root => {
                  const hasChildren = treeHierarchyList.some(item => item.referrerUid === root.uid);
                  const isExpanded = !!expandedNodes[root.uid];
                  return (
                    <div key={root.uid} className="flex flex-col">
                      <div className="flex items-center gap-2.5 bg-luxury-navy/40 border border-white/10 p-3 rounded-2xl cursor-pointer hover:border-luxury-gold transition duration-200" onClick={() => setSelectedUser(root)}>
                        {hasChildren ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(root.uid);
                            }}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400"
                          >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        ) : (
                          <span className="w-6 h-6 flex items-center justify-center text-slate-600 font-bold">•</span>
                        )}
                        <img
                          src={root.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(root.name || "Leader")}&background=2E1065&color=C084FC`}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover border border-luxury-gold/50"
                        />
                        <div className="flex-1 min-w-0">
                          <strong className="text-xs font-bold text-white block truncate hover:underline">{root.name}</strong>
                          <span className="text-[9px] text-slate-500 font-mono block">
                            Root Leader | ID: {root.userId || "USRxxxx"} | {getRankName(root.level)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-luxury-gold font-bold block">₹{root.earnings?.total || 0}</span>
                          <span className="text-[8px] text-slate-500 uppercase font-semibold block">{root.totalTeamMembersCount || 0} Members</span>
                        </div>
                      </div>
                      
                      {isExpanded && treeHierarchyList
                        .filter(child => child.referrerUid === root.uid)
                        .map(child => (
                          <TreeItem
                            key={child.userId}
                            nodeId={child.userId}
                            hierarchyList={treeHierarchyList}
                            teamProfiles={teamProfilesMap}
                            expandedNodes={expandedNodes}
                            toggleExpand={toggleExpand}
                            getRankName={getRankName}
                            onSelectUser={setSelectedUser}
                          />
                        ))
                      }
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB CONTENT: LEADERS & PERFORMANCE */}
      {subTab === "performance" && (
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Leaders Management Section */}
          <div className="lg:col-span-2 glass-card rounded-3xl p-5 border border-white/10">
            <h3 className="font-display text-sm font-bold text-white mb-4 flex items-center gap-1.5">
              <UserCheck size={16} className="text-purple-400" /> Promoted Leadership Ranks
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 font-bold uppercase select-none">
                    <th className="pb-2.5">Leader Name</th>
                    <th className="pb-2.5">Direct Team</th>
                    <th className="pb-2.5 text-center">Total Team Size</th>
                    <th className="pb-2.5 text-center">Campaign Completions</th>
                    <th className="pb-2.5 text-right">Team Earnings</th>
                    <th className="pb-2.5 text-right pr-2">Leader Action Console</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leadersList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">No leaders recorded in downline.</td>
                    </tr>
                  ) : (
                    leadersList.map(leader => (
                      <tr key={leader.uid} className="hover:bg-white/[0.02]">
                        <td className="py-3.5 flex items-center gap-2">
                          <img
                            src={leader.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.name || "Leader")}&background=2E1065&color=C084FC`}
                            alt=""
                            className="w-6.5 h-6.5 rounded-full object-cover border border-white/10"
                          />
                          <div>
                            <strong className="text-white block text-[11px] hover:underline cursor-pointer" onClick={() => setSelectedUser(leader)}>{leader.name}</strong>
                            <span className="text-[9px] text-slate-500 font-mono block">Rank: {getRankName(leader.level)}</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-slate-300 font-bold">{leader.directReferralsCount || 0} directs</td>
                        <td className="py-3.5 text-center font-bold text-slate-200">{leader.totalTeamMembersCount || 0}</td>
                        <td className="py-3.5 text-center font-extrabold text-purple-300">{leader.totalAccounts || leader.approvedCount || 0}</td>
                        <td className="py-3.5 text-right font-black text-luxury-gold">₹{leader.teamEarnings || 0}</td>
                        <td className="py-3.5 text-right pr-2">
                          <div className="inline-flex gap-1.5">
                            
                            {/* Assign Role action */}
                            {editingRoleUserId === leader.uid ? (
                              <div className="flex gap-1 items-center" onClick={e => e.stopPropagation()}>
                                <input
                                  type="text"
                                  placeholder="e.g. Supervisor"
                                  value={customRoleInput}
                                  onChange={e => setCustomRoleInput(e.target.value)}
                                  className="bg-luxury-navy border border-slate-700/60 rounded px-1.5 py-0.5 text-[10px] text-white w-24 outline-none"
                                />
                                <button onClick={() => handleUpdateRole(leader.uid, customRoleInput)} className="bg-emerald-500 text-luxury-dark font-black px-1.5 py-0.5 rounded text-[9px]">✓</button>
                                <button onClick={() => setEditingRoleUserId(null)} className="bg-white/5 hover:bg-white/10 text-white px-1.5 py-0.5 rounded text-[9px]">✕</button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingRoleUserId(leader.uid);
                                  setCustomRoleInput(leader.customRole || "");
                                }}
                                className="py-1 px-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-[9px] font-bold text-slate-300 transition"
                              >
                                Role: {leader.customRole || "Assign"}
                              </button>
                            )}

                            {/* Promote / Demote Level */}
                            {editingLevelUserId === leader.uid ? (
                              <div className="flex gap-1 items-center" onClick={e => e.stopPropagation()}>
                                <input
                                  type="number"
                                  min={1}
                                  max={7}
                                  value={leaderLevelInput}
                                  onChange={e => setLeaderLevelInput(e.target.value)}
                                  className="bg-luxury-navy border border-slate-700/60 rounded px-1.5 py-0.5 text-[10px] text-white w-12 outline-none font-bold"
                                />
                                <button onClick={() => handleUpdateLeaderLevel(leader.uid, leaderLevelInput)} className="bg-emerald-500 text-luxury-dark font-black px-1.5 py-0.5 rounded text-[9px]">✓</button>
                                <button onClick={() => setEditingLevelUserId(null)} className="bg-white/5 hover:bg-white/10 text-white px-1.5 py-0.5 rounded text-[9px]">✕</button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingLevelUserId(leader.uid);
                                  setLeaderLevelInput(leader.level || 1);
                                }}
                                className="py-1 px-2 bg-luxury-navy border border-luxury-gold/30 hover:border-luxury-gold text-luxury-gold rounded text-[9px] font-bold transition"
                              >
                                Rank: Level {leader.level || 1}
                              </button>
                            )}

                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Performance Rate Panel */}
          <div className="glass-card-premium rounded-3xl p-5 border border-white/10 flex flex-col gap-4">
            <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5">
              <TrendingUp size={16} className="text-luxury-gold" /> Performance Ratios
            </h3>
            
            <div className="flex flex-col gap-4">
              {[
                { label: "Active Members Rate", val: totalActiveCount, total: totalMembers || 1, color: "from-emerald-600 to-emerald-400" },
                { label: "KYC Approval Ratio", val: approvedMembersCount, total: campaignParticipantsCount || 1, color: "from-purple-600 to-purple-400" },
                { label: "Submissions Conversion Rate", val: totalCompletions, total: campaignParticipantsCount || 1, color: "from-luxury-gold to-yellow-500" }
              ].map((row, i) => {
                const pct = Math.round((row.val / row.total) * 100);
                return (
                  <div key={i} className="bg-luxury-navy/40 border border-white/5 p-3.5 rounded-2xl flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>{row.label}</span>
                      <span className="text-white font-mono">{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-luxury-dark rounded-full overflow-hidden border border-white/5">
                      <div className={`h-full bg-gradient-to-r ${row.color}`} style={{ width: `${Math.min(100, Math.max(5, pct))}%` }} />
                    </div>
                    <div className="text-[9px] text-slate-500 font-semibold uppercase">
                      Count: {row.val} / {row.total}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* SUBTAB CONTENT: CAMPAIGN REPORTS */}
      {subTab === "campaigns" && (
        <div className="glass-card-premium rounded-3xl p-5 border border-white/10">
          <h3 className="font-display text-sm font-bold text-white mb-4 flex items-center gap-1.5">
            <Briefcase size={16} className="text-luxury-gold" /> Campaign Participation &amp; Conversion Analytics
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 font-bold uppercase select-none">
                  <th className="pb-2.5">Campaign Name</th>
                  <th className="pb-2.5 text-center">Reward (₹)</th>
                  <th className="pb-2.5 text-center">Total Participants</th>
                  <th className="pb-2.5 text-center">Pending Approvals</th>
                  <th className="pb-2.5 text-center">Approved Conversions</th>
                  <th className="pb-2.5 text-center">Rejected Submissions</th>
                  <th className="pb-2.5 text-right pr-2">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {campaigns.map(camp => {
                  const participants = usersList.filter(u => u.joinedCampaigns?.[camp.id]);
                  const pending = participants.filter(u => u.joinedCampaigns[camp.id].status === "Submitted").length;
                  const approved = participants.filter(u => u.joinedCampaigns[camp.id].status === "Approved").length;
                  const rejected = participants.filter(u => u.joinedCampaigns[camp.id].status === "Rejected").length;
                  const rate = participants.length > 0 ? Math.round((approved / participants.length) * 100) : 0;
                  
                  return (
                    <tr key={camp.id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5 font-bold text-white">{camp.name}</td>
                      <td className="py-3.5 text-center font-mono text-luxury-gold font-bold">₹{camp.reward}</td>
                      <td className="py-3.5 text-center text-slate-300 font-black">{participants.length}</td>
                      <td className="py-3.5 text-center text-amber-400 font-bold">{pending}</td>
                      <td className="py-3.5 text-center text-emerald-400 font-bold">{approved}</td>
                      <td className="py-3.5 text-center text-red-400 font-bold">{rejected}</td>
                      <td className="py-3.5 text-right text-sm font-black text-white pr-2">
                        <span className="inline-flex px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-mono">
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB CONTENT: ACTIVITIES TIMELINE */}
      {subTab === "activity" && (
        <div className="glass-card-premium rounded-3xl p-5 border border-white/10">
          {(() => {
            const filteredActivities = activitiesList.filter(act => {
              if (!activitySearchQuery) return true;
              const q = activitySearchQuery.toLowerCase();
              return (
                (act.userName || "").toLowerCase().includes(q) ||
                (act.action || "").toLowerCase().includes(q) ||
                (act.details || "").toLowerCase().includes(q) ||
                (act.userId || "").toLowerCase().includes(q)
              );
            });
            return (
              <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-5">
                  <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5">
                    <Activity size={16} className="text-purple-400" /> Platform-Wide Activities Timeline Log
                  </h3>
                  
                  {/* Search activities */}
                  <div className="relative w-full md:w-72">
                    <Search size={13} className="absolute left-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search by User, Action, Details..."
                      value={activitySearchQuery}
                      onChange={(e) => setActivitySearchQuery(e.target.value)}
                      className="w-full bg-luxury-dark border border-slate-700/60 rounded-xl pl-8 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-luxury-gold"
                    />
                    {activitySearchQuery && (
                      <button type="button" onClick={() => setActivitySearchQuery("")} className="absolute right-3 top-2 text-slate-500 hover:text-white text-xs">✕</button>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                  {activitiesList.length === 0 ? (
                    <div className="text-center text-slate-500 text-xs py-12">No activity events logged in database.</div>
                  ) : filteredActivities.length === 0 ? (
                    <div className="text-center text-slate-500 text-xs py-12">No activities match your search.</div>
                  ) : (
                    filteredActivities.slice(0, 80).map((act, i) => (
                      <div key={i} className="flex gap-3 bg-white/5 border border-white/5 rounded-xl p-3 items-start">
                        <div className="p-1.5 rounded-lg bg-purple-950 border border-purple-800 text-purple-300 shrink-0">
                          <Activity size={12} />
                        </div>
                        <div className="flex-1 min-w-0 text-xs">
                          <div className="flex justify-between items-center gap-2">
                            <strong className="text-white block truncate">{act.userName}</strong>
                            <span className="text-[10px] text-slate-500 font-mono shrink-0">
                              {act.timestamp ? new Date(act.timestamp.seconds ? act.timestamp.seconds * 1000 : act.timestamp).toLocaleString() : "N/A"}
                            </span>
                          </div>
                          <span className="inline-flex px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-slate-400 uppercase mt-1">
                            {act.action}
                          </span>
                          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{act.details}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* USER DETAILS DRAWER */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content glass-card border border-white/10 max-h-[95vh] overflow-y-auto w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <img
                  src={selectedUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name || "Leader")}&background=2E1065&color=C084FC`}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover border border-luxury-gold/50"
                />
                <div>
                  <h3 className="text-lg font-black text-white">{selectedUser.name}</h3>
                  <span className="text-[10px] text-slate-500 font-mono">ID: {selectedUser.userId || "USRxxxx"} | {getRankName(selectedUser.level)}</span>
                </div>
              </div>
              <button className="modal-close text-white" onClick={() => setSelectedUser(null)}>✕</button>
            </div>

            {/* Drawer Subtabs */}
            <div className="flex border-b border-white/5 gap-1 pb-1 mb-4 select-none">
              {[
                { key: "details", label: "Overview details" },
                { key: "campaigns", label: "Campaigns History" },
                { key: "earnings", label: "Earnings Payouts" },
                { key: "timeline", label: "Activity Log" }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setDrawerTab(tab.key)}
                  className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                    drawerTab === tab.key 
                      ? "border-b-2 border-luxury-gold text-luxury-gold" 
                      : "text-slate-400 hover:text-white"
                  } bg-transparent`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* DRAWER VIEW: CORE DETAILS */}
            {drawerTab === "details" && (
              <div className="flex flex-col gap-4 text-xs text-slate-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-luxury-dark/30 border border-white/5 p-3 rounded-2xl">
                    <span className="text-slate-500 font-bold block uppercase text-[9px] mb-1">Email Address</span>
                    <span className="text-white font-mono">{selectedUser.email}</span>
                  </div>
                  <div className="bg-luxury-dark/30 border border-white/5 p-3 rounded-2xl">
                    <span className="text-slate-500 font-bold block uppercase text-[9px] mb-1">Mobile Phone</span>
                    <span className="text-white font-mono">{selectedUser.mobile || "N/A"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-luxury-dark/30 border border-white/5 p-3 rounded-2xl">
                    <span className="text-slate-500 font-bold block uppercase text-[9px] mb-1">Referral Invitation Code</span>
                    <span className="text-white font-mono">{selectedUser.referralCode || "N/A"}</span>
                  </div>
                  <div className="bg-luxury-dark/30 border border-white/5 p-3 rounded-2xl">
                    <span className="text-slate-500 font-bold block uppercase text-[9px] mb-1">Parent Recruiter</span>
                    <span className="text-white">{selectedUser.sponsor?.name || "System Admin"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-luxury-dark/30 border border-white/5 p-3 rounded-2xl text-center">
                    <span className="text-slate-500 font-bold block uppercase text-[9px] mb-0.5">Sponsor Level</span>
                    <strong className="text-white text-sm">Lvl {selectedUser.level || 1}</strong>
                  </div>
                  <div className="bg-luxury-dark/30 border border-white/5 p-3 rounded-2xl text-center">
                    <span className="text-slate-500 font-bold block uppercase text-[9px] mb-0.5">Total Team Size</span>
                    <strong className="text-white text-sm">{selectedUser.totalTeamMembersCount || 0}</strong>
                  </div>
                  <div className="bg-luxury-dark/30 border border-white/5 p-3 rounded-2xl text-center">
                    <span className="text-slate-500 font-bold block uppercase text-[9px] mb-0.5">Completions Count</span>
                    <strong className="text-white text-sm">{selectedUser.totalAccounts || selectedUser.approvedCount || 0}</strong>
                  </div>
                </div>

                <div className="bg-luxury-dark/40 border border-white/5 p-3.5 rounded-2xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-2">Ancestor Chain (Referral Path)</span>
                  <div className="flex items-center gap-1.5 flex-wrap font-mono text-[10px]">
                    {(selectedUser.referralPath || []).map((uid, idx) => {
                      const prof = teamProfilesMap[uid];
                      return (
                        <div key={uid} className="flex items-center gap-1">
                          <span className="bg-white/5 px-2 py-0.5 rounded text-white border border-white/5 font-semibold">
                            {prof ? prof.name : uid.slice(0, 6)}
                          </span>
                          {idx < selectedUser.referralPath.length - 1 && <ChevronRight size={10} className="text-slate-600" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* DRAWER VIEW: CAMPAIGNS HISTORY */}
            {drawerTab === "campaigns" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-400 font-bold uppercase">
                      <th className="pb-2">Campaign Name</th>
                      <th className="pb-2 text-center">Status</th>
                      <th className="pb-2 text-center">Enrollment Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {Object.keys(selectedUser.joinedCampaigns || {}).length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-slate-500">No campaigns joined.</td>
                      </tr>
                    ) : (
                      Object.entries(selectedUser.joinedCampaigns || {}).map(([id, data]) => {
                        const camp = campaigns.find(c => c.id === id);
                        return (
                          <tr key={id}>
                            <td className="py-3 font-bold text-white">{camp ? camp.name : id}</td>
                            <td className="py-3 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded-full border text-[9px] font-black ${
                                data.status === "Approved" 
                                  ? "bg-emerald-950 border-emerald-800 text-emerald-300"
                                  : data.status === "Rejected"
                                    ? "bg-red-950 border-red-800 text-red-300"
                                    : data.status === "Submitted"
                                      ? "bg-amber-950 border-amber-800 text-amber-300"
                                      : "bg-blue-950 border-blue-800 text-blue-300"
                              }`}>
                                {data.status}
                              </span>
                            </td>
                            <td className="py-3 text-center font-mono text-[10px] text-slate-500">{data.joinedAt ? new Date(data.joinedAt).toLocaleDateString() : "N/A"}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* DRAWER VIEW: EARNINGS PAYOUTS */}
            {drawerTab === "earnings" && (
              <div className="flex flex-col gap-4 text-xs text-slate-300">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-luxury-dark/30 border border-white/5 p-3 rounded-2xl text-center">
                    <span className="text-slate-500 font-bold block uppercase text-[9px] mb-0.5">Direct Rewards</span>
                    <strong className="text-white text-sm font-mono">₹{selectedUser.directEarnings || 0}</strong>
                  </div>
                  <div className="bg-luxury-dark/30 border border-white/5 p-3 rounded-2xl text-center">
                    <span className="text-slate-500 font-bold block uppercase text-[9px] mb-0.5">Team Overrides</span>
                    <strong className="text-luxury-gold text-sm font-mono">₹{selectedUser.teamEarnings || 0}</strong>
                  </div>
                  <div className="bg-luxury-dark/30 border border-white/5 p-3 rounded-2xl text-center">
                    <span className="text-slate-500 font-bold block uppercase text-[9px] mb-0.5">Accumulated Total</span>
                    <strong className="text-white text-sm font-mono">₹{selectedUser.earnings?.total || 0}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="bg-luxury-dark/30 border border-white/5 p-3.5 rounded-2xl">
                    <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Available Wallet Balance</span>
                    <strong className="text-xl text-white font-mono block">₹{selectedUser.earnings?.balance || 0}</strong>
                  </div>
                  <div className="bg-luxury-dark/30 border border-white/5 p-3.5 rounded-2xl">
                    <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Paid Out To Date</span>
                    <strong className="text-xl text-slate-400 font-mono block">₹{selectedUser.earnings?.paid || 0}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* DRAWER VIEW: ACTIVITIES TIMELINE */}
            {drawerTab === "timeline" && (
              <div className="flex flex-col gap-3.5 max-h-[300px] overflow-y-auto">
                {activitiesList
                  .filter(act => act.userId === selectedUser.uid)
                  .map((act, i) => (
                    <div key={i} className="flex gap-2.5 bg-white/5 border border-white/5 rounded-xl p-2.5 items-start text-xs text-slate-300">
                      <div className="p-1 rounded bg-purple-950 border border-purple-800 text-purple-300 shrink-0">
                        <Activity size={10} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                          <span className="font-bold text-white uppercase text-[8px] bg-white/5 border border-white/5 px-1.5 py-0.2 rounded">{act.action}</span>
                          <span className="font-mono">{act.timestamp ? new Date(act.timestamp.seconds ? act.timestamp.seconds * 1000 : act.timestamp).toLocaleString() : "N/A"}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{act.details}</p>
                      </div>
                    </div>
                  ))
                }
                {activitiesList.filter(act => act.userId === selectedUser.uid).length === 0 && (
                  <div className="text-center text-slate-500 text-xs py-8">No activities logs compiled for this user.</div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

function TreeItem({ nodeId, hierarchyList, teamProfiles, expandedNodes, toggleExpand, getRankName, onSelectUser }) {
  const children = hierarchyList.filter(item => item.referrerUid === nodeId);
  const profile = teamProfiles[nodeId];
  if (!profile) return null;
  const hasChildren = children.length > 0;
  const isExpanded = !!expandedNodes[nodeId];

  return (
    <div className="flex flex-col ml-4 border-l border-white/5 pl-3 mt-1.5 select-none">
      <div className="flex items-center gap-2 bg-luxury-dark/30 hover:bg-white/5 border border-white/5 p-2 rounded-xl transition cursor-pointer" onClick={() => onSelectUser(profile)}>
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(nodeId);
            }}
            className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400"
          >
            {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>
        ) : (
          <span className="w-5 h-5 flex items-center justify-center text-slate-600 font-bold">•</span>
        )}
        <img
          src={profile.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || "Leader")}&background=2E1065&color=C084FC`}
          alt=""
          className="w-5.5 h-5.5 rounded-full object-cover border border-luxury-gold/30"
        />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-white block truncate hover:underline">{profile.name}</span>
          <span className="text-[9px] text-slate-500 font-mono block">
            ID: <span className="text-yellow-400 font-bold">{profile.userId || "USRxxxx"}</span> | {getRankName(profile.level)}
          </span>
          <span className="text-[8px] text-slate-500 block truncate select-all hover:text-slate-300">
            Link: {`${window.location.origin}/#/register?ref=${profile.referralCode || ""}`}
          </span>
        </div>
        <div className="text-right text-[10px] font-bold text-luxury-gold pr-1">
          ₹{profile.earnings?.total || 0}
        </div>
      </div>
      {isExpanded && children.map(child => (
        <TreeItem
          key={child.userId}
          nodeId={child.userId}
          hierarchyList={hierarchyList}
          teamProfiles={teamProfiles}
          expandedNodes={expandedNodes}
          toggleExpand={toggleExpand}
          getRankName={getRankName}
          onSelectUser={onSelectUser}
        />
      ))}
    </div>
  );
}
