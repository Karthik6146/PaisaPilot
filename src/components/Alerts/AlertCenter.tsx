import React from 'react';
import { AlertTriangle, ShieldAlert, Info, CheckCircle, Bell, X, ArrowRight } from 'lucide-react';
import { AlertItem } from '../../types/finance';
import { sound } from '../../utils/sound';

interface AlertCenterProps {
  alerts: AlertItem[];
  onDismiss: (id: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const AlertCenter: React.FC<AlertCenterProps> = ({
  alerts,
  onDismiss,
  onNavigateToTab,
}) => {
  if (alerts.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
        <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
        <h4 className="font-semibold text-slate-200 text-sm">No Active Alerts</h4>
        <p className="text-xs text-slate-400 mt-1">Your pocket funds and debts are under control!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-purple-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Active Alerts & Notifications ({alerts.length})
          </h4>
        </div>
      </div>

      <div className="space-y-2">
        {alerts.map((item) => {
          let borderClass = 'border-slate-800';
          let bgClass = 'bg-slate-900/80';
          let icon = <Info className="w-5 h-5 text-blue-400 shrink-0" />;

          if (item.type === 'danger') {
            borderClass = 'border-rose-500/30';
            bgClass = 'bg-rose-950/20';
            icon = <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />;
          } else if (item.type === 'warning') {
            borderClass = 'border-amber-500/30';
            bgClass = 'bg-amber-950/20';
            icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
          } else if (item.type === 'success') {
            borderClass = 'border-emerald-500/30';
            bgClass = 'bg-emerald-950/20';
            icon = <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />;
          }

          return (
            <div
              key={item.id}
              className={`border ${borderClass} ${bgClass} rounded-2xl p-3.5 flex items-start justify-between gap-3 backdrop-blur-md transition-all`}
            >
              <div className="flex items-start gap-3">
                {icon}
                <div>
                  <h5 className="font-semibold text-slate-100 text-xs sm:text-sm">{item.title}</h5>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{item.message}</p>

                  {item.actionLabel && (
                    <button
                      onClick={() => {
                        sound.click();
                        if (item.actionLabel?.includes('WhatsApp') || item.actionLabel?.includes('Pay')) {
                          onNavigateToTab('udhaar');
                        } else if (item.actionLabel?.includes('AI')) {
                          onNavigateToTab('ai');
                        } else {
                          onNavigateToTab('budget');
                        }
                      }}
                      className="mt-2 text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  sound.click();
                  onDismiss(item.id);
                }}
                className="text-slate-500 hover:text-slate-300 p-1 rounded-lg transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

