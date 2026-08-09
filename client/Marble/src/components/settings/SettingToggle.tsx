export const SettingToggle = ({ 
  enabled, 
  onChange 
}: { 
  enabled: boolean; 
  onChange: (val: boolean) => void 
}) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        enabled ? 'bg-blue-700/50' : 'bg-gray-600/50'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out mt-px ml-px ${
          enabled ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
};