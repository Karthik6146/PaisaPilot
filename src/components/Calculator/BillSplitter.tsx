import React, { useState } from 'react';
import { Users, Split, CheckCircle2, UserPlus, Trash2, ArrowRight } from 'lucide-react';
import { localDate } from '../../utils/dates';
import { sound } from '../../utils/sound';

interface BillSplitterProps {
  onAddLentLoans: (
    loans: { personName: string; amount: number; note: string; dueDate: string }[]
  ) => void;
  currencySymbol: string;
}

export const BillSplitter: React.FC<BillSplitterProps> = ({ onAddLentLoans, currencySymbol }) => {
  const [totalBill, setTotalBill] = useState<string>('');
  const [eventTitle, setEventTitle] = useState<string>('');
  const [friends, setFriends] = useState<string[]>([]);
  const [newFriendName, setNewFriendName] = useState('');
  const [roundUp, setRoundUp] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const enteredBill = Number(totalBill);
  const billNum = Number.isFinite(enteredBill) && enteredBill > 0 && enteredBill <= 1e9 ? enteredBill : 0;
  // Total participants = You + friends
  const totalCount = friends.length + 1;

  let rawPerPerson = totalCount > 0 ? billNum / totalCount : 0;
  const perPerson = roundUp ? Math.ceil(rawPerPerson) : Math.round(rawPerPerson * 100) / 100;
  const yourShare = perPerson;

  const handleAddFriend = () => {
    if (!newFriendName.trim()) return;
    sound.click();
    setFriends([...friends, newFriendName.trim()]);
    setNewFriendName('');
  };

  const handleRemoveFriend = (idx: number) => {
    sound.click();
    setFriends(friends.filter((_, i) => i !== idx));
  };

  const handleCreateUdhaar = () => {
    if (!Number.isFinite(perPerson) || perPerson <= 0 || perPerson > 1e9 || !friends.length) return;
    sound.success();
    const today = new Date();
    // Default due date: 3 days from now
    const dueDateObj = new Date(today);
    dueDateObj.setDate(dueDateObj.getDate() + 3);
    const dueDateStr = localDate(dueDateObj);

    const records = friends.map((friend) => ({
      personName: friend,
      amount: perPerson,
      note: `Split share for "${eventTitle}" (${currencySymbol}${totalBill} total)`,
      dueDate: dueDateStr,
    }));

    onAddLentLoans(records);
    setIsGenerated(true);
    setTimeout(() => setIsGenerated(false), 2500);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-xl">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
          <Split className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-100 text-base">Personal Bill & Bill splitter</h3>
          <p className="text-xs text-slate-400">
            Split a bill evenly and track each person's share.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Inputs */}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Total Bill Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                {currencySymbol}
              </span>
              <input
                type="number"
                value={totalBill}
                onChange={(e) => setTotalBill(e.target.value)}
                placeholder="600"
                className="w-full pl-8 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Occasion / Reason</label>
            <input
              type="text"
              maxLength={100}
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="e.g. Swiggy Pizza / Canteen Chai"
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">
              Friends Involved ({friends.length} + You)
            </label>
            <div className="flex gap-1.5 mb-2">
              <input
                type="text"
                maxLength={100}
                value={newFriendName}
                onChange={(e) => setNewFriendName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
                placeholder="Friend's Name"
                className="flex-1 px-3 py-1.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleAddFriend}
                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-medium flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {/* Friends Pills */}
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-950/40 rounded-xl border border-slate-800/80">
              <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
                You (Payer)
              </span>
              {friends.map((friend, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700/60 flex items-center gap-1.5"
                >
                  {friend}
                  <button
                    onClick={() => handleRemoveFriend(idx)}
                    className="text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="roundUp"
              checked={roundUp}
              onChange={(e) => setRoundUp(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
            <label htmlFor="roundUp" className="text-xs text-slate-400 cursor-pointer">
              Round up each share to nearest whole rupee
            </label>
          </div>
        </div>

        {/* Right Split Summary */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Split Breakdown ({totalCount} People)
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
              <div className="text-xs text-emerald-300 mb-0.5">Each Person's Share</div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {currencySymbol}
                {perPerson.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Your share: {currencySymbol}
                {yourShare} | Friends owe you: {currencySymbol}
                {(perPerson * friends.length).toLocaleString()}
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 max-h-24 overflow-y-auto">
              {friends.map((f, i) => (
                <div key={i} className="flex justify-between py-1 border-b border-slate-800/40">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-slate-400" />
                    {f}
                  </span>
                  <span className="font-mono text-emerald-400 font-medium">
                    {currencySymbol}
                    {perPerson}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <button
              onClick={handleCreateUdhaar}
              disabled={friends.length === 0 || perPerson <= 0 || isGenerated}
              className={`w-full py-2.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all ${
                isGenerated
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {isGenerated ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Sent {friends.length} debts to Udhaar Tracker!
                </>
              ) : (
                <>
                  <span>Auto-Add {friends.length} Shares to Udhaar (Lent)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-500 text-center mt-1.5">
              Instantly tracks what your friends owe you with due dates and WhatsApp reminders.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

