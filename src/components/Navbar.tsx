import { useState } from 'react';
import { Wallet, LayoutDashboard, ArrowLeftRight, SlidersHorizontal, Calculator, Users, Settings, Bell, Volume2, VolumeX, Moon, Sun, LogOut, MoreHorizontal } from 'lucide-react';

interface NavbarProps {
  activeTab: string; setActiveTab: (tab: string) => void; soundEnabled: boolean;
  onToggleSound: () => void; alertCount: number; onOpenAlerts: () => void;
  onOpenSettings: () => void;
  theme: 'light' | 'dark'; onToggleTheme: () => void;
  saveStatus: string; onLogout: () => Promise<void>;
}
export function Navbar(props: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const tabs = [
    { id: 'overview', label: 'Dashboard', short: 'Home', icon: LayoutDashboard },
    { id: 'transactions', label: 'Spending history', short: 'History', icon: ArrowLeftRight },
    { id: 'budget', label: 'Monthly budget', short: 'Budget', icon: SlidersHorizontal },
    { id: 'calculator', label: 'Calculators', short: 'Tools', icon: Calculator },
    { id: 'udhaar', label: 'Lend & borrow', short: 'Debts', icon: Users },
  ];
  return <aside className="sidebar">
    <a className="brand" href="#main"><span className="brand-icon"><Wallet size={23}/></span><span>PaisaPilot<small>Your money, your pace.</small></span></a>
    <div className="nav-caption">YOUR WORKSPACE</div>
    <div className="mobile-toolbar"><button className="icon-button" onClick={props.onToggleTheme} aria-label={props.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>{props.theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}</button><button className="icon-button mobile-menu-toggle" aria-label="Workspace options" aria-controls="workspace-options" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><MoreHorizontal size={22}/></button></div>
    <nav aria-label="Main navigation">{tabs.map(({ id, label, short, icon: Icon }) =>
      <button key={id} aria-label={label} onClick={() => { props.setActiveTab(id); setMenuOpen(false); window.scrollTo({ top: 0 }); }} className={props.activeTab === id ? 'nav-item active' : 'nav-item'} aria-current={props.activeTab === id ? 'page' : undefined}><Icon size={21}/><span className="desktop-nav-label">{label}</span><span className="mobile-nav-label" aria-hidden="true">{short}</span></button>)}</nav>
    <div className="sidebar-tip"><span className="tip-mark">&#10022;</span><strong>Small steps. Clearer spending.</strong><p>Set a budget. Log your day. Make room for what matters.</p></div>
    <div id="workspace-options" className={'sidebar-bottom' + (menuOpen ? ' mobile-open' : '')} onClick={() => setMenuOpen(false)}>
      <button className="nav-item theme-toggle" onClick={props.onToggleTheme} aria-label={props.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>{props.theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>} {props.theme === 'dark' ? 'Light mode' : 'Dark mode'}</button>
      <button className="nav-item" onClick={props.onOpenAlerts}><Bell size={18}/>Budget alerts{props.alertCount > 0 && <span className="count">{props.alertCount}</span>}</button>
      <button className="nav-item" onClick={props.onOpenSettings}><Settings size={18}/>Settings & backup</button>
      <button className="nav-item" onClick={props.onToggleSound}>{props.soundEnabled ? <Volume2 size={18}/> : <VolumeX size={18}/>}Sound {props.soundEnabled ? 'on' : 'off'}</button>
      <button className="nav-item" onClick={() => { void props.onLogout(); }}><LogOut size={18}/>Sign out</button>
    </div>
    <div className="local-label" role="status"><span/> {props.saveStatus}</div>
  </aside>;
}
