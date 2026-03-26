import React, { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useWeb3 } from '@/hooks/useWeb3';
import { useContract } from '@/hooks/useContract';
import {
  generateRegistrationLink,
  getAllLinks,
  getPendingTeachers,
  getPendingStudents,
  approveUser,
  rejectUser,
  revokeLink,
  type RegistrationLink,
  type UserProfile
} from '@/utils/registrationLinks';
import { toast } from 'sonner';

export default function ManageUsers() {
  const { address } = useWallet();
  const { web3 } = useWeb3();
  const { getRoleManager } = useContract(web3);
  const [links, setLinks] = useState<RegistrationLink[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [fetchedLinks, teachers, students] = await Promise.all([
        getAllLinks(),
        getPendingTeachers(),
        getPendingStudents(),
      ]);
      setLinks(fetchedLinks);
      setPendingUsers([...teachers, ...students]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load data from IPFS');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateLink = async (role: 'teacher' | 'student') => {
    if (!address) return;
    try {
      const { url } = await generateRegistrationLink(role, address);
      toast.success(`Generated ${role} invite link!`);
      navigator.clipboard.writeText(url);
      toast('Link copied to clipboard');
      fetchData();
    } catch {
      toast.error('Failed to generate link');
    }
  };

  const handleApprove = async (user: UserProfile) => {
    if (!address || !web3) {
      toast.error('Wallet or Web3 not ready');
      return;
    }

    const toastId = toast.loading(`Approving ${user.name} on blockchain...`);

    try {
      // 1. Transaction to Smart Contract
      const roleManager = await getRoleManager();
      if (!roleManager) throw new Error('RoleManager contract not found');

      const txMethod = user.role === 'teacher' 
        ? roleManager.methods.grantTeacher(user.walletAddress)
        : roleManager.methods.grantStudent(user.walletAddress);

      await txMethod.send({ from: address });

      // 2. IPFS Update
      await approveUser(user.walletAddress, user.role, address);
      
      toast.success(`${user.name} approved as ${user.role}!`, { id: toastId });
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to approve user', { id: toastId });
    }
  };

  const handleReject = async (user: UserProfile) => {
    try {
      await rejectUser(user.walletAddress, user.role);
      toast.success(`${user.name} registration rejected.`);
      fetchData();
    } catch {
      toast.error('Failed to reject user');
    }
  };

  const handleRevoke = async (linkId: string) => {
    try {
      await revokeLink(linkId);
      toast.success('Link revoked.');
      fetchData();
    } catch {
      toast.error('Failed to revoke link');
    }
  };

  if (isLoading) return <div className="p-8 text-white">Loading Admin Data...</div>;

  return (
    <div className="p-8 space-y-8 text-white max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">User & Access Management</h1>
        <div className="flex gap-2">
           <StatusBadge variant="info">Admin Session</StatusBadge>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-8">
          {/* Pending Approvals */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
              Pending Approvals
            </h2>
            {pendingUsers.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-white/10 bg-white/5">
                <p className="text-gray-400">No pending registrations found in IPFS.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingUsers.map(user => (
                  <div key={user.walletAddress} className="p-5 bg-[#1a1c2e] border border-white/10 rounded-2xl flex items-center justify-between group hover:border-emerald-500/50 transition-all shadow-xl">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-lg">{user.name}</p>
                        <StatusBadge variant={user.role === 'teacher' ? 'secondary' : 'info'}>
                          {user.role.toUpperCase()}
                        </StatusBadge>
                      </div>
                      <p className="text-sm text-gray-400">{user.email} • {user.institution}</p>
                      <div className="flex items-center gap-1.5 pt-1">
                        <code className="text-[10px] text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/30">
                          {user.walletAddress}
                        </code>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleApprove(user)} 
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleReject(user)} 
                        className="px-5 py-2 bg-white/5 hover:bg-red-900/20 text-red-400 border border-white/10 rounded-xl font-medium transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Registration Links */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="w-1.5 h-6 bg-purple-500 rounded-full" />
              Invite Dashboard
            </h2>
            {links.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-white/10 bg-white/5">
                <p className="text-gray-400">No active invite links.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {links.map(l => (
                  <div key={l.linkId} className="p-4 bg-[#1a1c2e] border border-white/10 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${l.role === 'teacher' ? 'bg-purple-900/30' : 'bg-emerald-900/30'}`}>
                         <div className={`w-3 h-3 rounded-full ${l.role === 'teacher' ? 'bg-purple-400' : 'bg-emerald-400'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold capitalize">{l.role} Invite</p>
                        <p className="text-xs text-gray-500">
                          Expires: {new Date(l.expiresAt).toLocaleDateString()} • {l.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold">
                      {l.status === 'active' && (
                        <button onClick={() => handleRevoke(l.linkId)} className="text-red-400 hover:text-red-300 uppercase tracking-tight">Revoke</button>
                      )}
                      <button
                        onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/register/${l.linkId}`);
                            toast.success('Invite link copied', { icon: '📋' });
                        }}
                        className="px-4 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-600/30 transition-all"
                      >
                        COPY URL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-white/10 bg-[#121421] sticky top-24 shadow-2xl space-y-6">
            <h3 className="text-lg font-bold">Quick Actions</h3>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-900/10 border border-purple-500/20 space-y-3">
                <div>
                  <p className="font-bold text-purple-300">New Teacher Invite</p>
                  <p className="text-xs text-purple-400/80">Creates a single-use onboarding link for educators.</p>
                </div>
                <button
                  onClick={() => handleGenerateLink('teacher')}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold text-sm shadow-xl shadow-purple-900/30 transition-all active:scale-95"
                >
                  Generate Link
                </button>
              </div>

              <div className="p-4 rounded-xl bg-emerald-900/10 border border-emerald-500/20 space-y-3">
                <div>
                  <p className="font-bold text-emerald-300">New Student Invite</p>
                  <p className="text-xs text-emerald-400/80">Enables mass registration for academic sessions.</p>
                </div>
                <button
                  onClick={() => handleGenerateLink('student')}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold text-sm shadow-xl shadow-emerald-900/30 transition-all active:scale-95"
                >
                  Generate Link
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
               <div className="flex items-center gap-2 text-xs text-gray-500">
                 <Shield size={14} className="text-cyan-500" />
                 <span>On-chain authorization required for all approvals.</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ children, variant = 'info', pulse = false }: { children: React.ReactNode, variant?: 'success' | 'warning' | 'info' | 'secondary', pulse?: boolean }) {
  const styles = {
    info: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
    secondary: 'bg-purple-500/10 border-purple-500/30 text-purple-400'
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider flex items-center gap-1.5 ${styles[variant]}`}>
      {pulse && <span className="w-1 h-1 rounded-full bg-current animate-ping" />}
      {children}
    </span>
  );
}
