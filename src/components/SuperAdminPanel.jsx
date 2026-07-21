import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Wrench, Mail, MessageSquare, Save, Power, Check, Loader2 } from "lucide-react";

export default function SuperAdminPanel({ showToast }) {
  const [maintenance, setMaintenance] = useState({
    active: false,
    title: "Under Maintenance",
    message: "We are currently performing scheduled system updates. Please try again in a few minutes.",
    contactWhatsApp: "+91 8185892753",
    contactEmail: "support@referx.in"
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Local state for form fields to enable live preview editing before saving
  const [formFields, setFormFields] = useState({
    active: false,
    title: "",
    message: "",
    contactWhatsApp: "",
    contactEmail: ""
  });

  useEffect(() => {
    const docRef = doc(db, "settings", "maintenance");
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setMaintenance(data);
        setFormFields(data);
      } else {
        // Initialize if not exists
        const defaultData = {
          active: false,
          title: "Under Maintenance",
          message: "We are currently performing scheduled system updates. Please try again in a few minutes.",
          contactWhatsApp: "+91 8185892753",
          contactEmail: "support@referx.in"
        };
        setDoc(docRef, defaultData).catch(err => {
          console.error("Error creating default maintenance doc:", err);
        });
        setMaintenance(defaultData);
        setFormFields(defaultData);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error loading maintenance state:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleToggle = () => {
    setFormFields(prev => ({ ...prev, active: !prev.active }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormFields(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const docRef = doc(db, "settings", "maintenance");
      await setDoc(docRef, formFields);
      setSaveSuccess(true);
      if (showToast) {
        showToast("Maintenance settings saved successfully!", "success");
      }
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving maintenance settings:", err);
      if (showToast) {
        showToast("Failed to save maintenance settings: " + err.message, "danger");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-[#0D1526] border border-white/5 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-rose-500/10 blur-[80px]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
              Super Admin Area
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mt-3 tracking-tight">
            System Control Panel
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">
            Manage global maintenance state and customize the offline message shown to users.
          </p>
        </div>
      </div>

      {/* Grid: Edit Control & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Form Controls */}
        <form onSubmit={handleSave} className="lg:col-span-7 bg-[#0D1526]/30 border border-white/[0.05] rounded-3xl p-6 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.05]">
            <div>
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Maintenance Switch
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Instantly toggle website availability for all users.
              </p>
            </div>
            
            {/* Custom Toggle Switch */}
            <button
              type="button"
              onClick={handleToggle}
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none flex items-center px-1 ${
                formFields.active 
                  ? "bg-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.4)]" 
                  : "bg-slate-800"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-300 transform ${
                  formFields.active ? "translate-x-6" : "translate-x-0"
                }`}
              >
                <Power className={`w-3.5 h-3.5 ${formFields.active ? "text-rose-600" : "text-slate-500"}`} />
              </div>
            </button>
          </div>

          {/* Form Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Maintenance Screen Title
              </label>
              <input
                type="text"
                name="title"
                value={formFields.title}
                onChange={handleInputChange}
                required
                placeholder="e.g. Website Under Maintenance"
                className="w-full bg-[#060B18]/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Maintenance Screen Message
              </label>
              <textarea
                name="message"
                value={formFields.message}
                onChange={handleInputChange}
                required
                rows={4}
                placeholder="Write the message that users will see explaining the update..."
                className="w-full bg-[#060B18]/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-slate-600 resize-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Support WhatsApp
                </label>
                <input
                  type="text"
                  name="contactWhatsApp"
                  value={formFields.contactWhatsApp}
                  onChange={handleInputChange}
                  placeholder="e.g. +91 8185892753"
                  className="w-full bg-[#060B18]/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Support Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formFields.contactEmail}
                  onChange={handleInputChange}
                  placeholder="e.g. support@referx.in"
                  className="w-full bg-[#060B18]/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-slate-600"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.05]">
            <button
              type="submit"
              disabled={saving}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                saveSuccess
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:opacity-90 active:scale-95 shadow-lg shadow-indigo-500/20"
              } disabled:opacity-50`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Changes...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved Successfully!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save System Configurations
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Side: Live User-Panel Preview */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-[#0D1526]/10 border border-white/[0.05] rounded-3xl p-6 flex-1 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
                User Panel Preview
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Real-time preview of the screen shown to users when maintenance is ON.
              </p>
            </div>

            {/* Mockup Frame */}
            <div className="mt-4 flex-1 border border-white/10 rounded-2xl bg-[#060B18] overflow-hidden flex flex-col justify-center items-center p-6 text-center relative min-h-[350px]">
              {/* Mockup Topbar bar */}
              <div className="absolute top-0 left-0 w-full h-8 bg-[#0D1526] border-b border-white/5 flex items-center px-4 gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-[9px] text-slate-500 font-bold ml-2">User Maintenance Screen Preview</span>
              </div>

              {/* Glowing Background effect inside mockup */}
              <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-indigo-500/5 blur-[40px]" />
              <div className="absolute bottom-1/4 right-1/4 w-32 h-32 rounded-full bg-cyan-500/5 blur-[40px]" />

              <div className="relative z-10 flex flex-col items-center">
                {/* Wrench container */}
                <div className="mb-4 w-14 h-14 rounded-2xl bg-[#0D1526] border border-white/10 flex items-center justify-center shadow-lg">
                  <Wrench className="w-6 h-6 text-cyan-400 animate-bounce duration-[3000ms]" />
                </div>

                <div className="bg-[#0D1526]/30 border border-white/[0.03] rounded-2xl p-5 max-w-[280px]">
                  <h3 className="text-sm font-extrabold text-white tracking-tight line-clamp-2">
                    {formFields.title || "Under Maintenance"}
                  </h3>
                  
                  <p className="text-[10px] text-slate-400 mt-2 leading-relaxed line-clamp-4">
                    {formFields.message || "We are currently performing scheduled system updates. Please try again in a few minutes."}
                  </p>

                  <div className="h-px bg-white/[0.05] w-full my-3" />

                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Need Help?
                  </p>

                  <div className="flex flex-col gap-2">
                    {formFields.contactWhatsApp && (
                      <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[9px] font-bold bg-[#0A1A12] border border-emerald-500/20 text-emerald-400 cursor-not-allowed">
                        <MessageSquare className="w-3 h-3" />
                        WhatsApp Support
                      </div>
                    )}
                    {formFields.contactEmail && (
                      <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[9px] font-bold bg-[#0A1120] border border-sky-500/20 text-sky-400 cursor-not-allowed">
                        <Mail className="w-3 h-3" />
                        Email Support
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
