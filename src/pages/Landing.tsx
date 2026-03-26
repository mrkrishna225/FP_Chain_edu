import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/context/WalletContext';
import {
  GraduationCap, Shield, Cpu, Globe, Lock, BookOpen,
  Users, Settings, ChevronRight, Zap, Eye, FileCheck,
  ArrowRight, Menu, X, Copy, ShieldCheck, Wallet, Moon, Sun,
  Package, Link as LinkIcon
} from 'lucide-react';
import type { Role } from '@/context/WalletContext';

/* ─── helpers ─── */
const truncate = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

/* ─── static data ─── */
const STATS = [
  { value: '100%', label: 'Tamper-Proof Grades' },
  { value: 'ZK', label: 'Privacy Preserved' },
  { value: 'IPFS', label: 'Decentralised Storage' },
  { value: '0ms', label: 'Trust Assumptions' },
];

const FEATURES = [
  { icon: Shield,    title: 'ZK-SNARK Privacy',       desc: 'Zero-knowledge proofs let students prove exam completion without revealing answers. Full cryptographic privacy by default.' },
  { icon: Globe,     title: 'IPFS Storage',            desc: 'Exam content lives on a decentralised file system — no single point of failure, censorship-resistant and permanent.' },
  { icon: Cpu,       title: 'Polygon zkEVM',           desc: "Smart contracts run on Polygon's zero-knowledge EVM rollup: Ethereum security at a fraction of the gas cost." },
  { icon: Lock,      title: 'DID Authentication',     desc: 'Self-sovereign identity via Decentralised Identifiers. No passwords, no third-party auth providers required.' },
  { icon: Eye,       title: 'On-Chain Audit Trail',   desc: 'Every grade, submission, and action is permanently recorded on-chain and publicly auditable.' },
  { icon: FileCheck, title: 'Verifiable Certificates', desc: 'Issue NFT certificates verifiable by anyone, anywhere, with zero trust required from issuers.' },
];

const STEPS = [
  { n: '01', title: 'Connect Wallet',   desc: 'Link your MetaMask wallet and get a DID auto-registered on Polygon zkEVM.' },
  { n: '02', title: 'Choose Your Role', desc: 'Admin, Instructor, or Student — your role is stored on-chain and verified cryptographically.' },
  { n: '03', title: 'Access Dashboard', desc: 'Enter your personalised dashboard and start learning, teaching, or administering.' },
  { n: '04', title: 'Prove & Earn',     desc: 'Submit ZK proofs of completion and receive tamper-proof certificates as NFTs.' },
];

const ROLES = [
  { role: 'STUDENT' as Role, icon: BookOpen, title: 'Student',    desc: 'Enrol in courses, take exams with privacy, collect ZK certificates.' },
  { role: 'TEACHER' as Role, icon: Users,    title: 'Instructor', desc: 'Publish courses on IPFS, create on-chain exams, verify grades.' },
  { role: 'ADMIN'   as Role, icon: Settings, title: 'Admin',      desc: 'Monitor system health, manage smart contracts and audit logs.' },
];

/* ─── theme colours (dark / light) ─── */
const T = {
  dark: {
    bg:          '#0b0f1a',
    surface:     '#111826',
    surfaceHigh: '#161d2e',
    border:      '#1e2a40',
    borderHov:   '#2e3f5c',
    text:        '#e8edf5',
    textSub:     '#8a96ab',
    textMuted:   '#4e5c72',
    accent:      '#3b6eff',
    accentText:  '#5c86ff',
    navBg:       'rgba(11,15,26,0.94)',
  },
  light: {
    bg:          '#f5f7fa',
    surface:     '#ffffff',
    surfaceHigh: '#eef1f7',
    border:      '#d5dae4',
    borderHov:   '#b0b9cc',
    text:        '#0d1220',
    textSub:     '#4a5568',
    textMuted:   '#8a96ab',
    accent:      '#2255e8',
    accentText:  '#1d4ed8',
    navBg:       'rgba(245,247,250,0.96)',
  },
};

/* ──────────── COMPONENT ──────────── */
export default function Landing() {
  const { isConnected, address, did, role, connectWallet, isConnecting } = useWallet();
  const navigate = useNavigate();

  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chainedu-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  const [menuOpen, setMenuOpen]   = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [copied,   setCopied]     = useState(false);

  const c = dark ? T.dark : T.light;

  /* persist theme */
  useEffect(() => {
    localStorage.setItem('chainedu-theme', dark ? 'dark' : 'light');
  }, [dark]);

  /* scroll sentinel */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 48);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  /* auto-redirect to dashboard when role is assigned */
  useEffect(() => {
    if (isConnected && role && role !== 'NONE') {
      const path = role === 'TEACHER' ? 'instructor' : role.toLowerCase();
      // slight delay for better UX
      const timer = setTimeout(() => navigate(`/${path}/dashboard`), 600);
      return () => clearTimeout(timer);
    }
  }, [isConnected, role, navigate]);

  const copyAddr   = () => {
    if (address) { navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  /* ── shared inline style atoms ── */
  const card = {
    background: c.surface,
    border: `1px solid ${c.border}`,
    borderRadius: 6,
    padding: '28px 24px',
    transition: 'border-color 0.18s, box-shadow 0.18s',
  } as React.CSSProperties;

  const btnPrimary: React.CSSProperties = {
    display:        'inline-flex',
    alignItems:     'center',
    gap:            8,
    background:     c.accent,
    color:          '#fff',
    border:         'none',
    borderRadius:   4,
    padding:        '12px 28px',
    fontSize:       15,
    fontWeight:     600,
    cursor:         'pointer',
    letterSpacing:  '0.01em',
    transition:     'opacity 0.15s',
  };

  const btnGhost: React.CSSProperties = {
    display:      'inline-flex',
    alignItems:   'center',
    gap:          8,
    background:   'transparent',
    color:        c.text,
    border:       `1px solid ${c.border}`,
    borderRadius: 4,
    padding:      '12px 28px',
    fontSize:     15,
    fontWeight:   600,
    cursor:       'pointer',
    transition:   'border-color 0.15s, background 0.15s',
  };

  const nav: React.CSSProperties = {
    position:      'fixed',
    top:           0, left: 0, right: 0,
    zIndex:        200,
    background:    scrolled ? c.navBg : 'transparent',
    backdropFilter: scrolled ? 'blur(14px)' : 'none',
    borderBottom:  scrolled ? `1px solid ${c.border}` : '1px solid transparent',
    transition:    'background 0.3s, border-color 0.3s',
  };

  const label: React.CSSProperties = {
    display:       'inline-flex',
    alignItems:    'center',
    gap:           6,
    background:    dark ? 'rgba(59,110,255,0.1)' : 'rgba(34,85,232,0.08)',
    border:        `1px solid ${dark ? 'rgba(59,110,255,0.25)' : 'rgba(34,85,232,0.2)'}`,
    borderRadius:  3,
    padding:       '4px 12px',
    fontSize:      11,
    fontWeight:    700,
    color:         c.accentText,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    marginBottom:  20,
  };

  const divider: React.CSSProperties = {
    height:     1,
    background: c.border,
    margin:     '24px 0',
  };

  return (
    <div style={{ background: c.bg, color: c.text, minHeight: '100vh', fontFamily: "'Inter','Segoe UI',sans-serif", overflowX: 'hidden', transition: 'background 0.25s, color 0.25s' }}>

      {/* ═══ NAV ═══ */}
      <nav style={nav}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: c.accent, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={18} color="#fff" />
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.4px', color: c.text }}>Chain<span style={{ color: c.accentText }}>Edu</span></span>
          </div>

          {/* Desktop links */}
          <div id="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
            {['Features', 'How it Works', 'Roles'].map(i => (
              <a key={i} href={`#${i.toLowerCase().replace(/ /g, '-')}`}
                style={{ fontSize: 14, fontWeight: 500, color: c.textSub, textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = c.text)}
                onMouseLeave={e => (e.currentTarget.style.color = c.textSub)}
              >{i}</a>
            ))}
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Theme toggle */}
            <button onClick={() => setDark(d => !d)} aria-label="Toggle theme"
              style={{ background: 'transparent', border: `1px solid ${c.border}`, borderRadius: 4, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: c.textSub, transition: 'border-color 0.15s' }}>
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button id="launch-btn"
              onClick={() => document.getElementById('connect-section')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ ...btnPrimary, padding: '8px 20px', fontSize: 14, borderRadius: 4 }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              Launch App
            </button>

            {/* Mobile burger */}
            <button id="mobile-menu-btn" onClick={() => setMenuOpen(v => !v)}
              style={{ background: 'transparent', border: `1px solid ${c.border}`, borderRadius: 4, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: c.text, display: 'none' }}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div style={{ background: c.surface, borderTop: `1px solid ${c.border}`, padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {['Features', 'How it Works', 'Roles'].map(i => (
              <a key={i} href={`#${i.toLowerCase().replace(/ /g, '-')}`}
                onClick={() => setMenuOpen(false)}
                style={{ fontSize: 15, fontWeight: 500, color: c.text, textDecoration: 'none' }}>{i}</a>
            ))}
          </div>
        )}
      </nav>

      {/* ═══ HERO ═══ */}
      <section style={{ paddingTop: 128, paddingBottom: 80, maxWidth: 1180, margin: '0 auto', padding: '128px 24px 80px' }}>
        <div id="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>

          {/* Left copy */}
          <div>
            <div style={label}><Zap size={11} /> Powered by Polygon zkEVM</div>

            <h1 style={{ fontSize: 'clamp(2rem, 4.5vw, 3.6rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-1px', color: c.text, margin: '0 0 20px' }}>
              The Future of<br />
              <span style={{ color: c.accentText }}>Decentralised</span> Education
            </h1>

            <p style={{ fontSize: 17, lineHeight: 1.75, color: c.textSub, margin: '0 0 36px', maxWidth: 460 }}>
              Privacy-preserving exams powered by <strong style={{ color: c.text }}>ZK-SNARKs</strong>, content stored on <strong style={{ color: c.text }}>IPFS</strong>, and every grade verified on <strong style={{ color: c.text }}>Polygon zkEVM</strong>. No trust required.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
              <button id="hero-connect-btn"
                onClick={() => document.getElementById('connect-section')?.scrollIntoView({ behavior: 'smooth' })}
                style={btnPrimary}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                Connect Wallet <ArrowRight size={16} />
              </button>
            </div>

            {/* Tech badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { icon: Lock,         label: 'DID Auth' },
                { icon: Package,      label: 'IPFS Storage' },
                { icon: LinkIcon,     label: 'Polygon Verified' },
                { icon: ShieldCheck,  label: 'ZK Proofs' },
              ].map(({ icon: Icon, label: lb }) => (
                <span key={lb} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: c.textSub, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 4, padding: '5px 10px' }}>
                  <Icon size={12} /> {lb}
                </span>
              ))}
            </div>
          </div>

          {/* Right — Connect card */}
          <div id="connect-section">
            <ConnectCard
              dark={dark} c={c}
              isConnected={isConnected} address={address ?? ''} did={did ?? ''} role={role} isConnecting={isConnecting}
              copied={copied}
              onConnect={connectWallet} onCopy={copyAddr}
              onProceed={() => navigate(`/${role === 'TEACHER' ? 'instructor' : role?.toLowerCase()}/dashboard`)}
              card={card} btnPrimary={btnPrimary}
            />
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section style={{ borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}`, background: c.surface, padding: '0' }}>
        <div id="stats-grid" style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {STATS.map(({ value, label: lb }, i) => (
            <div key={lb} style={{ padding: '36px 24px', textAlign: 'center', borderRight: i < 3 ? `1px solid ${c.border}` : 'none' }}>
              <div style={{ fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 900, color: c.accentText, letterSpacing: '-0.5px', marginBottom: 6 }}>{value}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lb}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" style={{ padding: '96px 24px', maxWidth: 1180, margin: '0 auto' }}>
        <SectionHead label="Core Technology" title="Enterprise-Grade Security" sub="Every component is built with cryptographic guarantees — not promises." c={c} />

        <div id="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: c.border, border: `1px solid ${c.border}` }}>
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <div key={title}
              style={{ background: c.surface, padding: '32px 28px', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = c.surfaceHigh)}
              onMouseLeave={e => (e.currentTarget.style.background = c.surface)}>
              <div style={{ width: 40, height: 40, background: dark ? 'rgba(59,110,255,0.1)' : 'rgba(34,85,232,0.07)', border: `1px solid ${dark ? 'rgba(59,110,255,0.2)' : 'rgba(34,85,232,0.15)'}`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Icon size={19} color={c.accentText} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 10 }}>{title}</h3>
              <p style={{ fontSize: 13.5, lineHeight: 1.7, color: c.textSub, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" style={{ background: c.surface, borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}`, padding: '96px 24px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <SectionHead label="Process" title="Up and Running in Minutes" sub="Four seamless steps from wallet connection to your first on-chain exam." c={c} />

          <div id="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, border: `1px solid ${c.border}` }}>
            {STEPS.map(({ n, title, desc }, i) => (
              <div key={n} style={{ padding: '36px 28px', borderRight: i < 3 ? `1px solid ${c.border}` : 'none' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: c.accentText, letterSpacing: '0.12em', marginBottom: 14 }}>STEP {n}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.7, color: c.textSub, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ROLES ═══ */}
      <section id="roles" style={{ padding: '96px 24px', maxWidth: 1180, margin: '0 auto' }}>
        <SectionHead label="Roles" title="Built for Every Participant" sub="Three distinct roles, one unified blockchain-backed ecosystem." c={c} />

        <div id="roles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {ROLES.map(({ role: r, icon: Icon, title, desc }) => (
            <div key={r} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 20 }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = c.borderHov; (e.currentTarget as HTMLDivElement).style.boxShadow = dark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = c.border; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
              <div style={{ width: 44, height: 44, background: dark ? 'rgba(59,110,255,0.1)' : 'rgba(34,85,232,0.07)', border: `1px solid ${dark ? 'rgba(59,110,255,0.2)' : 'rgba(34,85,232,0.15)'}`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={21} color={c.accentText} />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: c.text, marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.7, color: c.textSub, margin: 0 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section style={{ background: c.surface, borderTop: `1px solid ${c.border}` }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '96px 24px', textAlign: 'center' }}>
          <div style={{ ...label, justifyContent: 'center', marginBottom: 20 }}><Zap size={11} /> Join the Revolution</div>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 900, letterSpacing: '-0.5px', color: c.text, margin: '0 0 16px' }}>
            Ready to Learn Without<br />Trusting Anyone?
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: c.textSub, margin: '0 0 36px' }}>
            Connect your wallet and experience the world's first truly decentralised, privacy-preserving education platform.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button id="cta-connect-btn"
              onClick={() => document.getElementById('connect-section')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ ...btnPrimary, padding: '13px 32px', fontSize: 15 }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              <Wallet size={16} /> Launch App
            </button>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ borderTop: `1px solid ${c.border}`, padding: '28px 24px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, background: c.accent, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={14} color="#fff" />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: c.text }}>ChainEdu</span>
          </div>
          <p style={{ fontSize: 12, color: c.textMuted }}>Secured by Ethereum · ZK-SNARKs · IPFS · Polygon zkEVM</p>
          <p style={{ fontSize: 12, color: c.textMuted }}>© 2025 ChainEdu. All rights reserved.</p>
        </div>
      </footer>

      {/* ═══ Responsive CSS ═══ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; }

        /* Mobile: stack hero */
        @media (max-width: 860px) {
          #hero-grid        { grid-template-columns: 1fr !important; gap: 40px !important; }
          #features-grid    { grid-template-columns: 1fr !important; }
          #steps-grid       { grid-template-columns: 1fr !important; }
          #roles-grid       { grid-template-columns: 1fr !important; }
          #stats-grid       { grid-template-columns: repeat(2,1fr) !important; }
          #nav-links        { display: none !important; }
          #mobile-menu-btn  { display: flex !important; }
          #launch-btn       { display: none !important; }
        }
        @media (max-width: 480px) {
          #stats-grid       { grid-template-columns: 1fr !important; }
        }
        /* Override features grid border on mobile */
        @media (max-width: 860px) {
          #features-grid > div { border-right: none !important; border-bottom: 1px solid var(--sep); }
          #steps-grid    > div { border-right: none !important; border-bottom: 1px solid var(--sep); }
        }
      `}</style>
    </div>
  );
}

/* ─── Section Header ─── */
function SectionHead({ label, title, sub, c }: { label: string; title: string; sub: string; c: typeof T.dark }) {
  return (
    <div style={{ marginBottom: 52 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: c.accentText, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>{label}</div>
      <h2 style={{ fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', fontWeight: 900, letterSpacing: '-0.4px', color: c.text, margin: '0 0 12px' }}>{title}</h2>
      <p style={{ fontSize: 16, color: c.textSub, maxWidth: 500, margin: 0, lineHeight: 1.7 }}>{sub}</p>
    </div>
  );
}

/* ─── Connect Card ─── */
function ConnectCard({ dark, c, isConnected, address, did, role, isConnecting, copied, onConnect, onCopy, onProceed, card, btnPrimary }: {
  dark: boolean; c: typeof T.dark;
  isConnected: boolean; address: string; did: string; role: Role | null; isConnecting: boolean; copied: boolean;
  onConnect: () => void; onCopy: () => void; onProceed: () => void;
  card: React.CSSProperties; btnPrimary: React.CSSProperties;
}) {
  const DEMO_ROLES = [
    { role: 'STUDENT' as Role, icon: BookOpen, title: 'Student' },
    { role: 'TEACHER' as Role, icon: Users,    title: 'Instructor' },
    { role: 'ADMIN'   as Role, icon: Settings, title: 'Admin' },
  ];

  const row: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 12px',
    background: c.surfaceHigh,
    border: `1px solid ${c.border}`,
    borderRadius: 4,
    marginBottom: 8,
  };

  return (
    <div style={{ ...card, padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 38, height: 38, background: dark ? 'rgba(59,110,255,0.12)' : 'rgba(34,85,232,0.08)', border: `1px solid ${dark ? 'rgba(59,110,255,0.2)' : 'rgba(34,85,232,0.15)'}`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Wallet size={18} color={c.accentText} />
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: c.text, margin: 0 }}>Connect Wallet</p>
          <p style={{ fontSize: 12, color: c.textMuted, margin: 0 }}>MetaMask · WalletConnect · Demo</p>
        </div>
      </div>

      {!isConnected ? (
        <>
          {/* MetaMask button */}
          <button id="metamask-btn" onClick={onConnect} disabled={isConnecting}
            style={{ ...btnPrimary, width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15, borderRadius: 4, opacity: isConnecting ? 0.6 : 1, cursor: isConnecting ? 'not-allowed' : 'pointer' }}
            onMouseEnter={e => { if(!isConnecting) e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={e => { if(!isConnecting) e.currentTarget.style.opacity = '1' }}>
            <span style={{ fontSize: 18 }}>🦊</span> {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </button>
        </>
      ) : role === null ? (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
           <p style={{ fontSize: 14, color: c.textSub }}>Detecting your on-chain role...</p>
        </div>
      ) : role === 'NONE' ? (
        <>
          {/* Wallet info */}
          <div style={row}>
            <span style={{ fontSize: 12, color: c.textMuted }}>Wallet</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'monospace', color: c.text }}>
              {truncate(address)}
              <button onClick={onCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, display: 'flex' }}>
                {copied ? <span style={{ fontSize: 11, color: '#22c55e' }}>✓</span> : <Copy size={12} />}
              </button>
            </span>
          </div>

          <div style={{ textAlign: 'center', padding: '16px 0', border: `1px solid ${c.border}`, borderRadius: '4px', background: c.bg, marginTop: '16px' }}>
            <p style={{ fontSize: 14, color: c.textSub, margin: 0 }}>Unregistered Address.</p>
            <p style={{ fontSize: 12, color: c.textMuted, marginTop: '8px' }}>Active invite link required to register.</p>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
           <div style={{ ...row, marginBottom: 20 }}>
             <span style={{ fontSize: 12, color: c.textMuted }}>Connected as</span>
             <span style={{ fontSize: 14, fontWeight: 700, color: c.accentText }}>{role}</span>
           </div>
           <button onClick={onProceed}
              style={{ ...btnPrimary, width: '100%', justifyContent: 'center' }}>
              Go to Dashboard <ArrowRight size={16} />
           </button>
        </div>
      )}
    </div>
  );
}
