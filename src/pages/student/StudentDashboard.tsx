import { BookOpen, CheckCircle, Shield, Link as LinkIcon } from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/Badges';
import { TxHashDisplay } from '@/components/shared/HashDisplays';
import { Button } from '@/components/ui/button';
import { mockCourses, mockExams, mockBlockchainEvents } from '@/utils/mockData';
import { useNavigate } from 'react-router-dom';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const enrolledCourses = mockCourses.slice(0, 3);
  const upcomingExams = mockExams;

  return (
    <div className="space-y-6 max-w-7xl">
      <h1 className="text-2xl font-bold">Student Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Enrolled Courses" value={3} icon={BookOpen} accent="primary" />
        <StatCard title="Exams Completed" value={2} icon={CheckCircle} accent="secondary" />
        <StatCard title="ZK Proofs Generated" value={2} icon={Shield} accent="success" />
        <StatCard title="On-Chain Submissions" value={5} icon={LinkIcon} accent="warning" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Courses */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">My Courses</h2>
          {enrolledCourses.map(course => (
            <GlassCard key={course.id} hover className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{course.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{course.instructorName}</p>
                </div>
                <StatusBadge variant="success">Enrolled</StatusBadge>
              </div>
              <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => navigate('/student/courses')}>
                Enter Course
              </Button>
            </GlassCard>
          ))}
        </div>

        {/* Upcoming Exams Timeline */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Upcoming Exams</h2>
          <div className="relative pl-6 space-y-6">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
            {upcomingExams.map(exam => {
              const statusVariant = exam.status === 'live' ? 'warning' : exam.status === 'closed' ? 'default' : 'info';
              return (
                <div key={exam.id} className="relative">
                  <div className={`absolute -left-4 top-2 w-3 h-3 rounded-full border-2 ${
                    exam.status === 'live' ? 'bg-warning border-warning pulse-glow-amber' :
                    exam.status === 'closed' ? 'bg-muted-foreground border-muted-foreground' :
                    'bg-secondary border-secondary'
                  }`} />
                  <GlassCard className="space-y-2 !p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm">{exam.name}</h3>
                      <StatusBadge variant={statusVariant} pulse={exam.status === 'live'}>
                        {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                      </StatusBadge>
                    </div>
                    <p className="text-xs text-muted-foreground">{exam.courseName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(exam.startTime).toLocaleDateString()} — {exam.duration} min
                    </p>
                    {exam.status === 'live' && (
                      <Button size="sm" className="bg-warning text-warning-foreground hover:bg-warning/90 btn-glow-amber"
                        onClick={() => navigate(`/student/exam/${exam.id}`)}>
                        Join Exam
                      </Button>
                    )}
                  </GlassCard>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Blockchain Activity */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Recent Blockchain Activity</h2>
        <GlassCard className="overflow-x-auto !p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Action</th>
                <th className="px-4 py-3 text-left font-medium">Tx Hash</th>
                <th className="px-4 py-3 text-left font-medium">Block</th>
                <th className="px-4 py-3 text-left font-medium">Time</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockBlockchainEvents.slice(0, 5).map(evt => (
                <tr key={evt.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <StatusBadge variant={evt.type === 'ProofVerified' ? 'success' : evt.type === 'AnswerSubmitted' ? 'warning' : 'info'}>
                      {evt.type}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3"><TxHashDisplay hash={evt.txHash} /></td>
                  <td className="px-4 py-3 font-mono text-xs">{evt.blockNumber.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(evt.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusBadge variant="success" pulse>Confirmed</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      </div>
    </div>
  );
}
