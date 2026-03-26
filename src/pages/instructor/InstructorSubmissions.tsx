import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/Badges';
import { TxHashDisplay, CIDDisplay, DIDDisplay } from '@/components/shared/HashDisplays';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { mockExams, mockSubmissions } from '@/utils/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function InstructorSubmissions() {
  const { examId } = useParams();
  const exam = mockExams.find(e => e.id === examId) || mockExams[1];
  const subs = mockSubmissions.filter(s => s.examId === exam.id || true).slice(0, 10);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  const gradeData = [
    { range: '90-100', count: 3 }, { range: '80-89', count: 5 },
    { range: '70-79', count: 4 }, { range: '60-69', count: 2 }, { range: '<60', count: 1 },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{exam.name}</h1>
          <p className="text-sm text-muted-foreground">{exam.courseName} · {subs.length} submissions</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge variant="success">Verified: {subs.filter(s => s.zkProofStatus === 'verified').length}</StatusBadge>
          <StatusBadge variant="warning">Pending: {subs.filter(s => s.zkProofStatus === 'pending').length}</StatusBadge>
        </div>
      </div>

      <GlassCard className="overflow-x-auto !p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-4 py-3 text-left font-medium">Student DID</th>
              <th className="px-4 py-3 text-left font-medium">Submitted</th>
              <th className="px-4 py-3 text-left font-medium">IPFS CID</th>
              <th className="px-4 py-3 text-left font-medium">ZK Proof</th>
              <th className="px-4 py-3 text-left font-medium">Grade Hash</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subs.map(sub => (
              <tr key={sub.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3"><DIDDisplay did={sub.studentDid} /></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(sub.submissionTime).toLocaleString()}</td>
                <td className="px-4 py-3"><CIDDisplay cid={sub.ipfsCid} /></td>
                <td className="px-4 py-3">
                  <StatusBadge
                    variant={sub.zkProofStatus === 'verified' ? 'success' : sub.zkProofStatus === 'pending' ? 'warning' : 'error'}
                    pulse>
                    {sub.zkProofStatus === 'verified' ? '✅ Verified' : sub.zkProofStatus === 'pending' ? '⏳ Pending' : '❌ Invalid'}
                  </StatusBadge>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {sub.gradeCommitment.slice(0, 10)}...
                </td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="ghost" className="text-xs text-primary"
                    onClick={() => setSelectedSub(selectedSub === sub.id ? null : sub.id)}>
                    Decrypt
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      {/* Analytics */}
      <div className="grid md:grid-cols-2 gap-6">
        <GlassCard className="space-y-4">
          <h3 className="font-semibold">Grade Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={gradeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 18%)" />
              <XAxis dataKey="range" tick={{ fill: 'hsl(220 9% 46%)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(220 9% 46%)', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'hsl(221 39% 11%)', border: '1px solid hsl(220 20% 18%)', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="hsl(263 83% 58%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="space-y-4">
          <h3 className="font-semibold">Submission Progress</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Submitted</span>
              <span>{exam.submissionCount} / {exam.totalStudents}</span>
            </div>
            <Progress value={(exam.submissionCount / exam.totalStudents) * 100} className="h-3" />
            <p className="text-xs text-muted-foreground">Average grade: 78.4</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
