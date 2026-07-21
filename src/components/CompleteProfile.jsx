import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function CompleteProfile({ user, onCompleteProfile, showToast }) {
  const [form, setForm] = useState({
    mobile: user?.mobile || "",
    bankAccountName: user?.bankAccountName || "",
    bankName: user?.bankName || "",
    bankAccountNumber: user?.bankAccountNumber || "",
    bankIfscCode: user?.bankIfscCode || "",
    state: user?.state || "",
    city: user?.city || ""
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const tempErrors = {};
    if (!/^\d{10}$/.test(form.mobile.trim())) {
      tempErrors.mobile = "Mobile number must be exactly 10 digits.";
    }
    if (!form.bankAccountName.trim()) {
      tempErrors.bankAccountName = "Account Holder Name is required.";
    }
    if (!form.bankName.trim()) {
      tempErrors.bankName = "Bank Name is required.";
    }
    if (!form.bankAccountNumber.trim() || !/^\d{9,18}$/.test(form.bankAccountNumber.trim())) {
      tempErrors.bankAccountNumber = "Account Number must be between 9 and 18 digits.";
    }
    if (!form.bankIfscCode.trim() || !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(form.bankIfscCode.trim())) {
      tempErrors.bankIfscCode = "IFSC code is invalid (like SBIN0001234).";
    }
    if (!form.state.trim()) {
      tempErrors.state = "State is required.";
    }
    if (!form.city.trim()) {
      tempErrors.city = "City is required.";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast("Please correct the mistakes in the form.", "danger");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const updatedFields = {
        mobile: form.mobile.trim(),
        bankAccountName: form.bankAccountName.trim(),
        bankName: form.bankName.trim(),
        bankAccountNumber: form.bankAccountNumber.trim(),
        bankIfscCode: form.bankIfscCode.trim().toUpperCase(),
        state: form.state.trim(),
        city: form.city.trim(),
        profileCompleted: true,
        profileCompletedAt: new Date().toISOString()
      };
      
      await updateDoc(userRef, updatedFields);
      showToast("Profile completed successfully! Welcome to ReferX. 🎉", "success");
      
      if (onCompleteProfile) {
        onCompleteProfile(updatedFields);
      }
    } catch (err) {
      console.error("Error completing profile:", err);
      showToast("Failed to save profile. Please try again.", "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4 py-8 relative text-on-surface">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 w-80 h-80 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-lg glass-panel rounded-xl p-md md:p-lg border border-white/10 shadow-premium-card relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary-container to-secondary" />
        
        <div className="relative z-10 flex flex-col gap-md">
          {/* Header */}
          <div className="text-center flex flex-col items-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gold-gradient text-on-primary-container font-black mb-3 shadow-gold-glow">
              <span className="material-symbols-outlined text-[24px]">verified_user</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">
              Welcome, <span className="text-primary">{user?.name?.split(" ")[0] || "Leader"}</span>
            </h2>
            <p className="text-on-surface-variant text-body-sm mt-1.5 max-w-sm mx-auto">
              Complete your profile details to unlock tasks and start receiving bank payouts.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-primary">
              <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">lock</span>
              <p>
                Your details are 100% safe and secure. We need this information to send payments directly to your bank account.
              </p>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="text-xs font-bold text-on-surface flex items-center gap-1.5 mb-1.5 font-label-caps tracking-wider uppercase">
                <span className="material-symbols-outlined text-[16px] text-primary">phone_iphone</span> Mobile Number
              </label>
              <input
                type="tel"
                maxLength={10}
                required
                className={`w-full bg-surface-container-lowest/60 border ${errors.mobile ? "border-red-500 ring-1 ring-red-500" : "border-white/10 focus:border-primary focus:ring-primary"} rounded-xl px-4 py-3 text-sm text-on-surface placeholder-outline/40 focus:outline-none focus:ring-1 transition duration-200`}
                placeholder="e.g. 9876543210"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "") })}
              />
              {errors.mobile && (
                <span className="text-[10px] text-red-400 font-semibold mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">error</span> {errors.mobile}
                </span>
              )}
            </div>

            {/* Bank Name & Account Holder Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-on-surface flex items-center gap-1.5 mb-1.5 font-label-caps tracking-wider uppercase">
                  <span className="material-symbols-outlined text-[16px] text-primary">corporate_fare</span> Bank Name
                </label>
                <input
                  type="text"
                  required
                  className={`w-full bg-surface-container-lowest/60 border ${errors.bankName ? "border-red-500 ring-1 ring-red-500" : "border-white/10 focus:border-primary focus:ring-primary"} rounded-xl px-4 py-3 text-sm text-on-surface placeholder-outline/40 focus:outline-none focus:ring-1 transition duration-200`}
                  placeholder="e.g. State Bank of India"
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                />
                {errors.bankName && (
                  <span className="text-[10px] text-red-400 font-semibold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">error</span> {errors.bankName}
                  </span>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface flex items-center gap-1.5 mb-1.5 font-label-caps tracking-wider uppercase">
                  <span className="material-symbols-outlined text-[16px] text-primary">person</span> Account Holder Name
                </label>
                <input
                  type="text"
                  required
                  className={`w-full bg-surface-container-lowest/60 border ${errors.bankAccountName ? "border-red-500 ring-1 ring-red-500" : "border-white/10 focus:border-primary focus:ring-primary"} rounded-xl px-4 py-3 text-sm text-on-surface placeholder-outline/40 focus:outline-none focus:ring-1 transition duration-200`}
                  placeholder="e.g. Rahul Sharma"
                  value={form.bankAccountName}
                  onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })}
                />
                {errors.bankAccountName && (
                  <span className="text-[10px] text-red-400 font-semibold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">error</span> {errors.bankAccountName}
                  </span>
                )}
              </div>
            </div>

            {/* Account Number & IFSC */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-on-surface flex items-center gap-1.5 mb-1.5 font-label-caps tracking-wider uppercase">
                  <span className="material-symbols-outlined text-[16px] text-primary">tag</span> Account Number
                </label>
                <input
                  type="text"
                  required
                  className={`w-full bg-surface-container-lowest/60 border ${errors.bankAccountNumber ? "border-red-500 ring-1 ring-red-500" : "border-white/10 focus:border-primary focus:ring-primary"} rounded-xl px-4 py-3 text-sm text-on-surface placeholder-outline/40 focus:outline-none focus:ring-1 transition duration-200`}
                  placeholder="e.g. 123456789012"
                  value={form.bankAccountNumber}
                  onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })}
                />
                {errors.bankAccountNumber && (
                  <span className="text-[10px] text-red-400 font-semibold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">error</span> {errors.bankAccountNumber}
                  </span>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface flex items-center gap-1.5 mb-1.5 font-label-caps tracking-wider uppercase">
                  <span className="material-symbols-outlined text-[16px] text-primary">account_balance</span> Bank IFSC Code
                </label>
                <input
                  type="text"
                  required
                  className={`w-full bg-surface-container-lowest/60 border ${errors.bankIfscCode ? "border-red-500 ring-1 ring-red-500" : "border-white/10 focus:border-primary focus:ring-primary"} rounded-xl px-4 py-3 text-sm text-on-surface placeholder-outline/40 focus:outline-none focus:ring-1 transition duration-200`}
                  placeholder="e.g. SBIN0001234"
                  value={form.bankIfscCode}
                  onChange={(e) => setForm({ ...form, bankIfscCode: e.target.value })}
                />
                {errors.bankIfscCode && (
                  <span className="text-[10px] text-red-400 font-semibold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">error</span> {errors.bankIfscCode}
                  </span>
                )}
              </div>
            </div>

            {/* State / City */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* State */}
              <div>
                <label className="text-xs font-bold text-on-surface flex items-center gap-1.5 mb-1.5 font-label-caps tracking-wider uppercase">
                  <span className="material-symbols-outlined text-[16px] text-primary">corporate_fare</span> State
                </label>
                <input
                  type="text"
                  required
                  className={`w-full bg-surface-container-lowest/60 border ${errors.state ? "border-red-500 ring-1 ring-red-500" : "border-white/10 focus:border-primary focus:ring-primary"} rounded-xl px-4 py-3 text-sm text-on-surface placeholder-outline/40 focus:outline-none focus:ring-1 transition duration-200`}
                  placeholder="e.g. Maharashtra"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
                {errors.state && (
                  <span className="text-[10px] text-red-400 font-semibold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">error</span> {errors.state}
                  </span>
                )}
              </div>

              {/* City */}
              <div>
                <label className="text-xs font-bold text-on-surface flex items-center gap-1.5 mb-1.5 font-label-caps tracking-wider uppercase">
                  <span className="material-symbols-outlined text-[16px] text-primary">location_on</span> City
                </label>
                <input
                  type="text"
                  required
                  className={`w-full bg-surface-container-lowest/60 border ${errors.city ? "border-red-500 ring-1 ring-red-500" : "border-white/10 focus:border-primary focus:ring-primary"} rounded-xl px-4 py-3 text-sm text-on-surface placeholder-outline/40 focus:outline-none focus:ring-1 transition duration-200`}
                  placeholder="e.g. Mumbai"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
                {errors.city && (
                  <span className="text-[10px] text-red-400 font-semibold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">error</span> {errors.city}
                  </span>
                )}
              </div>
            </div>

            {/* Submit Control */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3.5 bg-gold-gradient text-on-primary-container rounded-xl text-xs font-bold shadow-gold-glow flex items-center justify-center gap-1.5 hover:opacity-95 hover:scale-[1.01] transition duration-200 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-on-primary-container rounded-full animate-spin" style={{ borderTopColor: "transparent" }} />
                  Saving details...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">check</span> Save Profile and Continue
                </>
              )}
            </button>
          </form>

          {/* Secure disclaimer */}
          <div className="text-center text-[10px] text-outline mt-2 border-t border-white/5 pt-4">
            🔒 100% Safe &amp; Secure | ReferX Member Area
          </div>
          
        </div>
      </div>
    </div>
  );
}
