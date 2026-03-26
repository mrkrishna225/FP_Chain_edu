import { useLocation, Link } from 'react-router-dom';
import { useWallet } from '@/context/WalletContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel,
  SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard, BookOpen, Zap, Clock, Shield, Link as LinkIcon,
  PlusCircle, FileText, ShieldCheck, HardDrive, Users, Globe,
  Activity, Fuel, ScrollText, GraduationCap,
} from 'lucide-react';

const navItems = {
  STUDENT: [
    { title: 'Dashboard', url: '/student/dashboard', icon: LayoutDashboard },
    { title: 'My Courses', url: '/student/courses', icon: BookOpen },
    { title: 'Active Exam', url: '/student/exam/exam-2', icon: Zap },
    { title: 'Submission History', url: '/student/submissions', icon: Clock },
    { title: 'My ZK Proofs', url: '/student/proofs', icon: Shield },
    { title: 'Blockchain Receipts', url: '/student/proofs', icon: LinkIcon },
  ],
  TEACHER: [
    { title: 'Dashboard', url: '/teacher/dashboard', icon: LayoutDashboard },
    { title: 'My Courses', url: '/teacher/courses', icon: BookOpen },
    { title: 'Exam Management', url: '/teacher/upload', icon: FileText },
    { title: 'Student Submissions', url: '/teacher/dashboard', icon: Users },
    { title: 'Grade Verification', url: '/teacher/dashboard', icon: ShieldCheck },
    { title: 'IPFS File Manager', url: '/teacher/upload', icon: HardDrive },
  ],
  ADMIN: [
    { title: 'System Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
    { title: 'All Users / DIDs', url: '/admin/users', icon: Users },
    { title: 'All Courses', url: '/admin/dashboard', icon: BookOpen },
    { title: 'All Exams', url: '/admin/dashboard', icon: FileText },
    { title: 'Global Audit Log', url: '/admin/audit', icon: ScrollText },
    { title: 'Smart Contract Status', url: '/admin/dashboard', icon: Globe },
    { title: 'Gas Analytics', url: '/admin/dashboard', icon: Fuel },
  ],
};

export function AppSidebar() {
  const { role } = useWallet();
  const location = useLocation();
  const items = role ? navItems[role] : [];

  return (
    <Sidebar className="border-r border-border bg-sidebar">
      <SidebarContent className="pt-2">
        <div className="px-4 py-3 flex items-center gap-2.5 mb-2">
          <div className="p-1.5 rounded-lg bg-primary/20">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-lg">Chain<span className="text-gradient">Edu</span></span>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + '/');
                const isLiveExam = item.title === 'Active Exam' && role === 'STUDENT';
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.url}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          isActive
                            ? 'bg-primary/15 text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        } ${isLiveExam ? 'btn-glow-amber' : ''}`}
                      >
                        <item.icon className={`h-4 w-4 ${isLiveExam ? 'text-warning' : ''}`} />
                        <span>{item.title}</span>
                        {isLiveExam && (
                          <span className="ml-auto w-2 h-2 rounded-full bg-warning pulse-glow-amber" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {role === 'TEACHER' && (
          <div className="px-4 mt-4">
            <Link to="/teacher/upload" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
              <PlusCircle className="h-4 w-4" /> Create Exam
            </Link>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
