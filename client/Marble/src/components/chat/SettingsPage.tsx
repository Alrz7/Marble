import { useState } from "react";
import { X, Moon, Bell, Lock, User } from "lucide-react";

interface SettingsPageProps {
  onClose: () => void;
}

export default function SettingsPage({ onClose }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<"general" | "notifications" | "privacy" | "appearance">("general");

  const tabs = [
    { id: "general" as const, label: "General", icon: User },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "privacy" as const, label: "Privacy", icon: Lock },
    { id: "appearance" as const, label: "Appearance", icon: Moon },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="glass-panel-strong rounded-2xl w-full max-w-2xl max-h-[32rem] flex flex-col shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-foreground">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-40 border-r border-white/5">
            <nav className="flex flex-col p-2 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-sm font-medium ${
                    activeTab === tab.id
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 marble-scrollbar">
            {activeTab === "general" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-4">Account</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">Username</label>
                      <input type="text" placeholder="Your username" className="marble-input w-full" />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">Email</label>
                      <input type="email" placeholder="your@email.com" className="marble-input w-full" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-4">Preferences</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Auto-play media</span>
                    <input type="checkbox" className="w-4 h-4 rounded border-border accent-primary" />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-4">Backup</h3>
                  <button className="marble-button-secondary text-sm">Export Chat History</button>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-4">Message Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Sound</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border accent-primary" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Desktop notifications</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border accent-primary" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-4">Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Show typing indicator</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border accent-primary" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Show read receipts</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border accent-primary" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-4">Search</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Allow search indexing</span>
                    <input type="checkbox" className="w-4 h-4 rounded border-border accent-primary" />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-4">Status</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Show online status</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border accent-primary" />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-4">Group Invites</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Allow group invites from anyone</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border accent-primary" />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-4">Blocked Users</h3>
                  <button className="marble-button-secondary text-sm">Manage blocked users</button>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-4">Theme</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="theme" defaultChecked className="w-4 h-4 accent-primary" />
                      <span className="text-sm text-foreground">Dark Mode</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="theme" className="w-4 h-4 accent-primary" />
                      <span className="text-sm text-foreground">System Default</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-4">Display</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Compact mode</span>
                      <input type="checkbox" className="w-4 h-4 rounded border-border accent-primary" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-4">Font Size</h3>
                  <select className="marble-input w-full">
                    <option>Small</option>
                    <option selected>Normal</option>
                    <option>Large</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
