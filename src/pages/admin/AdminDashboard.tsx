import { GlassCard } from '@/components/shared/GlassCard';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge, RoleBadge } from '@/components/shared/Badges';
import { TxHashDisplay, DIDDisplay } from '@/components/shared/HashDisplays';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { mockUsers, mockBlockchainEvents, mockGasData, gasOperationBreakdown } from '@/utils/mockData';
import { Globe, HardDrive, Hexagon, Fuel, Users, ScrollText, Activity, ExternalLink } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const contracts = [
  { name: 'IdentityRegistry', address: '0x1234...abcd', block: 14522700, txCount: 45, version: 'v1.2.0' },
  { name: 'CourseRegistry', address: '0x5678...efgh', block: 14522710, txCount: 28, version: 'v1.1.0' },
  { name: 'ExamRegistry', address: '0x9abc...ijkl', block: 14522720, txCount: 67, version: 'v1.3.0' },
  { name: 'Verifier', address: '0xdef0...mnop', block: 14522730, txCount: 34, version: 'v2.0.0' },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6 max-w-7xl">
      <h1 className="text-2xl font-bold">System Dashboard</h1>

      {/* Health cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="space-y-2">
          <div className="flex items-center justify-between">
            <Globe className="h-5 w-5 text-success" />
            <StatusBadge variant="success" pulse>Online</StatusBadge>
          </div>
          <p className="text-sm font-medium">Smart Contracts</p>
          <p className="text-xs text-muted-foreground">✅ 4/4 Deployed</p>
        </GlassCard>
        <GlassCard className="space-y-2">
          <div className="flex items-center justify-between">
            <HardDrive className="h-5 w-5 text-secondary" />
            <StatusBadge variant="success" pulse>Connected</StatusBadge>
          </div>
          <p className="text-sm font-medium">IPFS / Pinata</p>
          <Progress value={46.8} className="h-1.5" />
          <p className="text-xs text-muted-foreground">234MB / 500MB</p>
        </GlassCard>
        <GlassCard className="space-y-2">
          <div className="flex items-center justify-between">
            <Hexagon className="h-5 w-5 text-primary" />
            <StatusBadge variant="success" pulse>Synced</StatusBadge>
          </div>
          <p className="text-sm font-medium">Polygon Network</p>
          <p className="text-xs text-muted-foreground">Block #14,523,891 · 1.2s avg</p>
        </GlassCard>
        <GlassCard className="space-y-2">
          <div className="flex items-center justify-between">
            <Fuel className="h-5 w-5 text-warning" />
            <span className="font-mono text-xs text-warning">0.000001 GWEI</span>
          </div>
          <p className="text-sm font-medium">Gas Price</p>
          <p className="text-xs text-muted-foreground">Ultra-low fees</p>
        </GlassCard>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="users"><Users className="h-3.5 w-3.5 mr-1" /> Users</TabsTrigger>
          <TabsTrigger value="audit"><ScrollText className="h-3.5 w-3.5 mr-1" /> Audit Log</TabsTrigger>
          <TabsTrigger value="gas"><Activity className="h-3.5 w-3.5 mr-1" /> Gas Analytics</TabsTrigger>
          <TabsTrigger value="contracts"><Globe className="h-3.5 w-3.5 mr-1" /> Contracts</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <GlassCard className="overflow-x-auto !p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">DID</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Reg. Block</th>
                  <th className="px-4 py-3 text-left font-medium">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {mockUsers.slice(0, 10).map(user => (
                  <tr key={user.did} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3"><DIDDisplay did={user.did} /></td>
                    <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                    <td className="px-4 py-3 font-mono text-xs">{user.registrationBlock.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(user.lastActive).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        </TabsContent>

        <TabsContent value="audit">
          <GlassCard className="overflow-x-auto !p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">Event</th>
                  <th className="px-4 py-3 text-left font-medium">Actor</th>
                  <th className="px-4 py-3 text-left font-medium">Details</th>
                  <th className="px-4 py-3 text-left font-medium">Block</th>
                  <th className="px-4 py-3 text-left font-medium">Tx Hash</th>
                  <th className="px-4 py-3 text-left font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {mockBlockchainEvents.map(evt => (
                  <tr key={evt.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <StatusBadge variant={
                        evt.type === 'ProofVerified' ? 'success' :
                        evt.type === 'AnswerSubmitted' ? 'warning' :
                        evt.type === 'GradeCommitted' ? 'info' : 'default'
                      }>{evt.type}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{evt.actorDid}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{evt.details}</td>
                    <td className="px-4 py-3 font-mono text-xs">{evt.blockNumber.toLocaleString()}</td>
                    <td className="px-4 py-3"><TxHashDisplay hash={evt.txHash} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(evt.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        </TabsContent>

        <TabsContent value="gas">
          <div className="grid md:grid-cols-2 gap-6">
            <GlassCard className="space-y-4">
              <h3 className="font-semibold">Gas Costs Over Time</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={mockGasData.slice(0, 14)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 18%)" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(220 9% 46%)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(220 9% 46%)', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'hsl(221 39% 11%)', border: '1px solid hsl(220 20% 18%)', borderRadius: '8px', fontSize: 12 }} />
                  <Legend />
                  <Line type="monotone" dataKey="chainedu" stroke="hsl(263 83% 58%)" name="ChainEdu (zkEVM)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ethereum" stroke="hsl(0 84% 60%)" name="Ethereum L1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </GlassCard>

            <GlassCard className="space-y-4">
              <h3 className="font-semibold">Per-Operation Breakdown</h3>
              <div className="space-y-3">
                {gasOperationBreakdown.map(op => (
                  <div key={op.operation} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <span className="text-sm">{op.operation}</span>
                    <div className="text-right">
                      <span className="font-mono text-xs text-primary">{op.chainEdu} POL</span>
                      <span className="text-xs text-muted-foreground mx-2">vs</span>
                      <span className="font-mono text-xs text-destructive">{op.ethereum} ETH</span>
                      <StatusBadge variant="success" className="ml-2">{op.savings}</StatusBadge>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="contracts">
          <div className="grid md:grid-cols-2 gap-4">
            {contracts.map(c => (
              <GlassCard key={c.name} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{c.name}</h3>
                  <StatusBadge variant="success" pulse>Active</StatusBadge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="font-mono text-xs">{c.address}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Deploy Block</span><span className="font-mono text-xs">{c.block.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Txns</span><span>{c.txCount}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">ABI Version</span><span>{c.version}</span></div>
                </div>
                <Button size="sm" variant="outline" className="w-full text-xs border-primary/30 text-primary">
                  <ExternalLink className="h-3 w-3 mr-1" /> View on Explorer
                </Button>
              </GlassCard>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
