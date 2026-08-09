import { settingState } from "@states/stateSettings";

export const AppearanceSettings = () => {
  const { theme, setTheme, fontFamily, setFontFamily, fontSize, setFontSize } =
    settingState();

  return (
    <div className="space-y-6 text-sm text-gray-300 animate-fade-in">
      <div className="space-y-3">
        <h3 className="font-medium text-white mb-2">Theme</h3>
        <div className="flex gap-3 p-1 bg-white/5 border border-white/5 rounded-lg w-max">
          {["light", "dark", "system"].map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t as any)}
              className={`px-4 py-1.5 rounded-md text-xs capitalize transition-colors ${
                theme === t
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium text-white mb-2">Typography</h3>
        <div className="space-y-3 p-3 rounded-lg bg-white/5 border border-white/5">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              Font Family
            </label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-1.5 text-sm focus:outline-none text-gray-300"
            >
              <option value="Inter, sans-serif">Inter</option>
              <option value="Roboto, sans-serif">Roboto</option>
              <option value="Fira Code, monospace">
                Fira Code (Monospace)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              Font Size
            </label>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value as any)}
              className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-1.5 text-sm focus:outline-none text-gray-300"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
