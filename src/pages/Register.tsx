/**
 * src/pages/Register.tsx
 *
 * Public page — accessible at /register/:linkId
 *
 * Flow:
 *  1. Validate linkId from IPFS
 *  2. Show role info + MetaMask connect button
 *  3. User fills name, email, institution
 *  4. Submit → stored in IPFS as pending profile
 *  5. Show success + "awaiting approval" message
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  validateRegistrationLink,
  registerUser,
  type RegistrationLink,
} from '@/utils/registrationLinks';
import { useWallet } from '@/context/WalletContext';
// ─── Component ───────────────────────────────────────────────

type PageState =
  | 'loading'
  | 'invalid-link'
  | 'connect-wallet'
  | 'already-registered'
  | 'fill-form'
  | 'submitting'
  | 'success'
  | 'error';

export default function Register() {
  const { linkId } = useParams<{ linkId: string }>();
  const navigate = useNavigate();
  const { connectWallet, address, isConnected, isConnecting } = useWallet();

  const getEthereum = () => typeof window !== 'undefined' ? (window as any).ethereum : null;

  const [pageState, setPageState] = useState<PageState>('loading');
  const [link, setLink] = useState<RegistrationLink | null>(null);
  const [invalidReason, setInvalidReason] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [submitError, setSubmitError] = useState('');

  // ─── Step 1: Validate link ──────────────────────────────────
  useEffect(() => {
    if (!linkId) {
      setInvalidReason('No registration link provided.');
      setPageState('invalid-link');
      return;
    }

    validateRegistrationLink(linkId).then(({ valid, link: l, reason }) => {
      if (!valid || !l) {
        setInvalidReason(reason ?? 'Invalid registration link.');
        setPageState('invalid-link');
        return;
      }
      setLink(l);
      if (isConnected && address) {
        setPageState('fill-form');
      } else {
        setPageState('connect-wallet');
      }
    }).catch(() => {
      setInvalidReason('Could not validate link.');
      setPageState('invalid-link');
    });
  }, [linkId, isConnected, address]);

  // ─── Step 2: Connect MetaMask ───────────────────────────────
  const handleConnectWallet = async () => {
    await connectWallet();
  };

  useEffect(() => {
    if (isConnected && address && pageState === 'connect-wallet') {
       setPageState('fill-form');
    }
  }, [isConnected, address, pageState]);

  // ─── Step 3: Submit registration ───────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkId || !address || !link) return;

    if (!name.trim() || !email.trim() || !institution.trim()) {
      setSubmitError('All fields are required.');
      return;
    }

    setPageState('submitting');
    setSubmitError('');

    const result = await registerUser(linkId, address, name, email, institution);

    if (result.success) {
      setPageState('success');
    } else {
      setSubmitError(result.error ?? 'Registration failed. Please try again.');
      setPageState('fill-form');
    }
  };

  // ─── Role badge colours ─────────────────────────────────────
  const roleColour = link?.role === 'teacher'
    ? 'from-purple-500 to-violet-600'
    : 'from-emerald-500 to-teal-600';

  const roleLabel = link?.role === 'teacher' ? '👩‍🏫 Teacher' : '🎓 Student';

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#060b18] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-cyan-400 font-mono text-sm mb-4 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            ChainEdu — Decentralized LMS
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {pageState === 'success' ? '🎉 Registration Submitted!' : 'Create Your Account'}
          </h1>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">

          {/* ── Loading ─────────────────────────────────────── */}
          {pageState === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Validating registration link...</p>
            </div>
          )}

          {/* ── Invalid link ─────────────────────────────────── */}
          {pageState === 'invalid-link' && (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">🔗</div>
              <h2 className="text-xl font-bold text-red-400 mb-3">Invalid Link</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">{invalidReason}</p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors border border-white/20"
              >
                ← Back to Home
              </button>
            </div>
          )}

          {/* ── Connect Wallet ─────────────────────────────────── */}
          {pageState === 'connect-wallet' && link && (
            <div className="space-y-6">
              <div className={`flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r ${roleColour} bg-opacity-20 border border-white/20`}>
                <span className="text-2xl">{link.role === 'teacher' ? '👩‍🏫' : '🎓'}</span>
                <div>
                  <p className="font-bold text-white">{roleLabel} Registration</p>
                  <p className="text-xs text-white/70">
                    Link expires: {new Date(link.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="text-sm text-gray-400 leading-relaxed">
                Connect your MetaMask wallet to continue. Your wallet address will be your permanent identity on ChainEdu.
              </div>

              {!getEthereum() && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <p className="text-yellow-400 text-xs">
                    ⚠ MetaMask not detected.{' '}
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Install MetaMask
                    </a>{' '}
                    and refresh this page.
                  </p>
                </div>
              )}

              <button
                onClick={handleConnectWallet}
                className="w-full py-4 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all duration-200 shadow-lg shadow-cyan-500/20 hover:scale-[1.02]"
              >
                🦊 Connect with MetaMask
              </button>
            </div>
          )}

          {/* ── Fill Form ─────────────────────────────────────── */}
          {pageState === 'fill-form' && link && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Wallet display */}
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <code className="text-cyan-300 text-xs flex-1 break-all">{address}</code>
              </div>

              <div className={`text-xs font-semibold px-3 py-1 rounded-full inline-block bg-gradient-to-r ${roleColour} text-white`}>
                {roleLabel}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Institution / Organization *</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="University / School / Company"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-colors"
                />
              </div>

              {submitError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-red-400 text-sm">{submitError}</p>
                </div>
              )}

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                ℹ Your registration will be reviewed by an admin before you can access the platform. You'll be notified when approved.
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all duration-200 shadow-lg shadow-cyan-500/20 hover:scale-[1.02]"
              >
                Submit Registration →
              </button>
            </form>
          )}

          {/* ── Submitting ─────────────────────────────────────── */}
          {pageState === 'submitting' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-300 font-medium">Storing your profile in IPFS...</p>
              <p className="text-gray-500 text-xs">This may take a moment</p>
            </div>
          )}

          {/* ── Success ─────────────────────────────────────────── */}
          {pageState === 'success' && (
            <div className="text-center space-y-5 py-4">
              <div className="text-6xl mb-2">✅</div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">You're registered!</h2>
                <p className="text-gray-400 text-sm">
                  Your profile has been stored securely in IPFS. An admin will review and approve your account.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Role</span>
                  <span className="text-white font-medium capitalize">{link?.role}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Wallet</span>
                  <code className="text-cyan-300 text-xs">{address?.slice(0, 6)}...{address?.slice(-4)}</code>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Status</span>
                  <span className="text-amber-400 font-medium">⏳ Pending Approval</span>
                </div>
              </div>

              <p className="text-gray-500 text-xs">
                Once approved, you can login at{' '}
                <button onClick={() => navigate('/')} className="text-cyan-400 hover:underline">
                  the main site
                </button>
                {' '}using your wallet address.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-6">
          🔒 Data stored on IPFS · Role secured on blockchain · Powered by ChainEdu
        </p>
      </div>
    </div>
  );
}
