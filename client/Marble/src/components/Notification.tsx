import { useEffect } from "react";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { notifState } from "@states/stateNotif";

export default function Notification() {
  const { notifQueue, currentNotif, setCurrentNotif, popNotification } =
    notifState();

  useEffect(() => {
    if (notifQueue.length > 0 && currentNotif === null) {
      // here we can either just choose the fist notif in the queue to implement the
      // fifo queue or we can pass the notifList to a validational function to pick up
      // the notifs from thire type by a priority like errors > warnings > success ? info
      const picked = notifQueue.at(0);
      if (picked) {
        setCurrentNotif(picked);
        popNotification(notifQueue);
      }
    }
  }, [notifQueue, currentNotif]);

  // dimiss
  useEffect(() => {
    if (!currentNotif) return;
    const timer = setTimeout(() => {
      setCurrentNotif(null);
    }, currentNotif.timeOut ?? 3000);
    return () => clearTimeout(timer);
  }, [currentNotif]);

  const getStyles = () => {
    switch (currentNotif?.type) {
      case "error":
        return {
          bgGradient: "from-red-500/10 to-red-500/5",
          borderColor: "border-red-500/30",
          iconColor: "text-red-400",
          textColor: "text-red-50",
          icon: AlertCircle,
          accentBg: "bg-red-500/20",
        };
      case "success":
        return {
          bgGradient: "from-emerald-500/10 to-emerald-500/5",
          borderColor: "border-emerald-500/30",
          iconColor: "text-emerald-400",
          textColor: "text-emerald-50",
          icon: CheckCircle,
          accentBg: "bg-emerald-500/20",
        };
      case "warning":
        return {
          bgGradient: "from-amber-500/10 to-amber-500/5",
          borderColor: "border-amber-500/30",
          iconColor: "text-amber-400",
          textColor: "text-amber-50",
          icon: AlertTriangle,
          accentBg: "bg-amber-500/20",
        };
      default:
        return {
          bgGradient: "from-gray-500/10 to-gray-500/5",
          borderColor: "border-gray-500/30",
          iconColor: "text-gray-400",
          textColor: "text-gray-50",
          icon: Info,
          accentBg: "bg-gray-500/20",
        };
    }
  };

  if (!currentNotif) return null;

  const styles = getStyles();
  const IconComponent = styles.icon;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div
        className={`
          bg-linear-to-br ${styles.bgGradient}
          backdrop-blur-xl
          border ${styles.borderColor}
          rounded-xl
          shadow-2xl
          flex items-start gap-4
          px-5 py-4
          min-w-70
          max-w-[90vw]
          sm:max-w-105
          pointer-events-auto
          hover:shadow-3xl
          transition-shadow
          duration-300
        `}
        style={{
          animation: `slideDownFade 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, 
                     fadeOutUp 0.4s ease-in-out 2.6s forwards`,
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Icon Container */}
        <div className={`${styles.accentBg} rounded-lg p-2.5 shrink-0`}>
          <IconComponent className={`${styles.iconColor} w-5 h-5`} />
        </div>

        {/* Content */}
        <div className="flex-1 pt-0.5">
          <p className={`${styles.textColor} text-sm font-medium leading-snug`}>
            {currentNotif?.message}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={() => setCurrentNotif(null)}
          className="shrink-0 text-gray-400 hover:text-gray-200 transition-colors duration-200 p-1 hover:bg-white/5 rounded-lg"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <style>{`
        @keyframes slideDownFade {
          0% {
            opacity: 0;
            transform: translateY(-24px) scale(0.92);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
        }

        @keyframes fadeOutUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(-16px) scale(0.96);
            visibility: hidden;
          }
        }
      `}</style>
    </div>
  );
}
