import React from "react";
import {
  Bell,
  Check,
  Award,
  Users,
  AlertTriangle,
  X,
  CheckCheck,
} from "lucide-react";
import { db } from "../firebase";
import { doc, updateDoc, writeBatch } from "firebase/firestore";

export default function Notifications({ notifications = [], showNotifications, setShowNotifications, user }) {
  const unreadCount = (notifications || []).filter((n) => !n.read).length;

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), { read: true });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.read);
      if (unread.length === 0) return;
      const batch = writeBatch(db);
      unread.forEach((n) => batch.update(doc(db, "notifications", n.id), { read: true }));
      await batch.commit();
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const getIcon = (type) => {
    const iconMap = {
      campaign_approved: <Award size={14} className="text-emerald-400" />,
      campaign_rejected: <AlertTriangle size={14} className="text-red-400" />,
      campaign_submitted: <Award size={14} className="text-amber-400" />,
      referral_approved: <Check size={14} className="text-emerald-400" />,
      referral_rejected: <X size={14} className="text-red-400" />,
      referral_started: <Users size={14} className="text-indigo-400" />,
      promotion: <Award size={14} className="text-luxury-gold" />
    };
    return iconMap[type] || <Bell size={14} className="text-slate-400" />;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "Just now";
    try {
      let date;
      if (timestamp.toDate && typeof timestamp.toDate === "function") {
        date = timestamp.toDate();
      } else if (timestamp.seconds !== undefined) {
        date = new Date(timestamp.seconds * 1000);
      } else {
        date = new Date(timestamp);
      }
      
      if (isNaN(date.getTime())) {
        return "Just now";
      }
      
      const diffMs = new Date() - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    } catch (err) {
      console.warn("formatTime error:", err);
      return "Just now";
    }
  };

  const iconBg = (type) => {
    if (type?.includes("approved") || type === "promotion") return "bg-emerald-950/40 border border-emerald-900";
    if (type?.includes("rejected")) return "bg-red-950/40 border border-red-900";
    if (type?.includes("submitted")) return "bg-amber-950/40 border border-amber-900";
    return "bg-indigo-950/40 border border-indigo-900";
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:border-luxury-gold hover:text-white transition text-slate-300 relative click-physics"
        onClick={() => setShowNotifications(!showNotifications)}
        aria-label="Toggle notifications"
        id="notification-bell-btn"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-luxury-dark leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-3 w-[280px] sm:w-80 bg-luxury-navy rounded-2xl border border-white/10 overflow-hidden z-[200] shadow-premium-card">
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-white/5 bg-white/5">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-red-500/10 text-red-400 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-red-950">
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] text-luxury-gold font-bold flex items-center gap-1 hover:text-white transition"
              >
                <CheckCheck size={11} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex flex-col max-h-72 overflow-y-auto divide-y divide-white/5">
            {(notifications || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <Bell size={24} className="opacity-20 mb-1.5" />
                <span className="text-xs">No notifications yet</span>
              </div>
            ) : (
              (notifications || []).map((notif) => (
                <button
                  key={notif.id}
                  className={`w-full flex items-start gap-3 p-3 text-left transition hover:bg-white/5 ${!notif.read ? "bg-white/[0.02]" : ""}`}
                  onClick={() => !notif.read && markAsRead(notif.id)}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg(notif.type)}`}>
                    {getIcon(notif.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed ${!notif.read ? "font-bold text-white" : "text-slate-400"}`}>
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-500 mt-1 block">{formatTime(notif.createdAt)}</span>
                  </div>

                  {!notif.read && (
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
