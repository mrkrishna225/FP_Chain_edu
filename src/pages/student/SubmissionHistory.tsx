import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/Badges';
import { TxHashDisplay, CIDDisplay } from '@/components/shared/HashDisplays';
import { mockSubmissions } from '@/utils/mockData';

export default function SubmissionHistory() {
  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-2xl font-bold">Submission History</h1>
      <GlassCard className="overflow-x-auto !p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-4 py-3 text-left font-medium">Exam</th>
              <th className="px-4 py-3 text-left font-medium">Course</th>
              <th className="px-4 py-3 text-left font-medium">Submitted</th>
              <th className="px-4 py-3 text-left font-medium">IPFS CID</th>
              <th className="px-4 py-3 text-left font-medium">Tx Hash</th>
              <th className="px-4 py-3 text-left font-medium">ZK Proof</th>
            </tr>
          </thead>
          <tbody>
            {mockSubmissions.slice(0, 8).map(sub => (
              <tr key={sub.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{sub.examName}</td>
                <td className="px-4 py-3 text-muted-foreground">{sub.courseName}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(sub.submissionTime).toLocaleDateString()}</td>
                <td className="px-4 py-3"><CIDDisplay cid={sub.ipfsCid} /></td>
                <td className="px-4 py-3"><TxHashDisplay hash={sub.txHash} /></td>
                <td className="px-4 py-3">
                  <StatusBadge variant={sub.zkProofStatus === 'verified' ? 'success' : sub.zkProofStatus === 'pending' ? 'warning' : 'error'} pulse>
                    {sub.zkProofStatus === 'verified' ? '✅ Verified' : sub.zkProofStatus === 'pending' ? '⏳ Pending' : '❌ Invalid'}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
