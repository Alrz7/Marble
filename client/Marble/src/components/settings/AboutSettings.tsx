export const AboutSettings = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-fade-in py-4">
      
      <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center shadow-lg">
        <span className="text-2xl font-bold text-white">S</span>
      </div>

      <div className="max-w-xs space-y-2">
        <h2 className="text-lg font-medium text-white">Marble</h2>
        <p className="text-xs text-gray-400 leading-relaxed">
          Zero-Knowledge, end-to-end encrypted workspace. Built with Tauri and Go.
        </p>
        <p className="text-[10px] font-mono text-gray-500">v1.0.0-beta</p>
      </div>

      <div className="pt-6 border-t border-white/5 w-full max-w-50 flex flex-col items-center gap-3">
        {/* <span className="text-xs text-gray-500">Made by Alrz7</span> */}
        <a 
          href="https://github.com/Alrz7/marble" 
          target="_blank" 
          rel="noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white transition-all text-xs"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
          </svg>
          GitHub
        </a>
      </div>
    </div>
  );
};