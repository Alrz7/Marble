// SettingsPage.tsx
import { useEffect, useState } from "react";
import {
  X,
  SlidersHorizontal,
  Shield,
  User,
  Palette,
  Info,
} from "lucide-react";
import { GeneralSettings } from "./GeneralSettings";
import { PrivacySettings } from "./PrivacySettings";
import { AccountSettings } from "./AccountSettings";
import { AppearanceSettings } from "./AppearanceSettings";
import { AboutSettings } from "./AboutSettings";
import {
  isSettingsDirty,
  resetSettingsToLastRecord,
  saveSettings,
  settingState,
} from "@states/stateSettings";
import { AppState } from "@states/stateCommon";

type Tab = "general" | "privacy" | "account" | "appearance" | "about";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [needToSave, setNeedToSave] = useState<boolean>(false);
  const { setIsSettingOpen } = AppState();
  const settings = settingState();

  useEffect(() => {
    const isdirty = isSettingsDirty();
    isdirty ? setNeedToSave(true) : setNeedToSave(false);
  }, [settings]);

  const tabs = [
    { id: "general" as const, label: "General", icon: SlidersHorizontal },
    { id: "privacy" as const, label: "Privacy", icon: Shield },
    { id: "account" as const, label: "Account", icon: User },
    { id: "appearance" as const, label: "Appearance", icon: Palette },
    { id: "about" as const, label: "About", icon: Info },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return <GeneralSettings />;
      case "privacy":
        return <PrivacySettings />;
      case "account":
        return <AccountSettings />;
      case "appearance":
        return <AppearanceSettings />;
      case "about":
        return <AboutSettings />;
      default:
        return <GeneralSettings />;
    }
  };
  return (
    // Backdrop: Blurs the entire background app
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/12 backdrop-blur-sm animate-fade-in">
      {/* Modal Container: Scales perfectly with app size (85% of window), with safe minimums */}
      <div className="w-[85%] h-[85%] min-w-150 min-h-100 flex flex-col bg-primary/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-black/20">
          <h2 className="text-sm font-semibold text-gray-200">Settings</h2>
          <button
            onClick={() => setIsSettingOpen(false)}
            className="p-1 rounded-md hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-48 space-y-2 flex flex-col py-3 px-2 border-r border-white/5 bg-black/10 shrink-0">
            <nav className="flex flex-col space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                    activeTab === tab.id
                      ? "bg-white/10 text-white font-medium shadow-sm"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                  }`}
                >
                  <tab.icon className="w-4 h-4 opacity-70" />
                  {tab.label}
                </button>
              ))}
            </nav>
            {needToSave == true ? (
              <div className="space-y-1">
                <button
                  onClick={() => {
                    saveSettings();
                    setNeedToSave(false);
                  }}
                  className="p-1 w-full rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-center text-sm"
                >
                  Save changes
                </button>
                <button
                  onClick={() => {
                    resetSettingsToLastRecord();
                    setNeedToSave(false);
                  }}
                  className="p-1 w-full rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-center text-sm"
                >
                  cancel
                </button>
              </div>
            ) : null}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
