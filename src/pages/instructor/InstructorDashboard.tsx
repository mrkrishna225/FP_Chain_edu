import { BookOpen, Users, FileText, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '@/components/shared/StatCard';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/Badges';
import { Button } from '@/components/ui/button';
import { mockCourses, mockExams } from '@/utils/mockData';

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const myCourses = mockCourses.filter(c => c.instructorDid.includes('Ab58'));

  return (
    <div className="space-y-6 max-w-7xl">
      <h1 className="text-2xl font-bold">Instructor Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Courses Created" value={myCourses.length} icon={BookOpen} accent="primary" />
        <StatCard title="Students Enrolled" value={52} icon={Users} accent="secondary" />
        <StatCard title="Pending Submissions" value={8} icon={FileText} accent="warning" />
        <StatCard title="ZK Proofs Verified" value={14} icon={ShieldCheck} accent="success" />
      </div>

      <h2 className="text-lg font-semibold">My Courses</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {myCourses.map(course => (
          <GlassCard key={course.id} hover className="space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold">{course.name}</h3>
              <span className="text-xs text-muted-foreground">{course.code}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" /> {course.studentCount} students
              <span className="mx-1">·</span>
              <FileText className="h-4 w-4" /> {course.examCount} exams
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 text-xs border-primary/30 text-primary"
                onClick={() => navigate('/instructor/courses')}>
                Manage
              </Button>
              <Button size="sm" variant="outline" className="flex-1 text-xs border-secondary/30 text-secondary"
                onClick={() => navigate(`/instructor/exam/${mockExams[0].id}`)}>
                Create Exam
              </Button>
              <Button size="sm" variant="outline" className="flex-1 text-xs border-warning/30 text-warning"
                onClick={() => navigate(`/instructor/submissions/${mockExams[1].id}`)}>
                Submissions
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>

      <h2 className="text-lg font-semibold">Exam Overview</h2>
      <GlassCard className="overflow-x-auto !p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-4 py-3 text-left font-medium">Exam</th>
              <th className="px-4 py-3 text-left font-medium">Course</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Submissions</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockExams.map(exam => (
              <tr key={exam.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{exam.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{exam.courseName}</td>
                <td className="px-4 py-3">
                  <StatusBadge
                    variant={exam.status === 'live' ? 'warning' : exam.status === 'closed' ? 'default' : 'info'}
                    pulse={exam.status === 'live'}>
                    {exam.status}
                  </StatusBadge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{exam.submissionCount}/{exam.totalStudents}</td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="ghost" className="text-xs text-primary"
                    onClick={() => navigate(`/instructor/submissions/${exam.id}`)}>
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
