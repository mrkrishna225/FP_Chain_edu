import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/Badges';
import { CIDDisplay, TxHashDisplay } from '@/components/shared/HashDisplays';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Plus, GripVertical, Upload, Trash2, Shield } from 'lucide-react';

import { useWallet } from '@/context/WalletContext';
import { useWeb3 } from '@/hooks/useWeb3';
import { useContract } from '@/hooks/useContract';
import { ipfsAdd } from '@/utils/ipfs';
import { encryptAES, examPassword } from '@/utils/aes';
import { toast } from 'sonner';

interface Question {
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctIndex: number; // 0-3
}

export default function ExamManagement() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { address } = useWallet();
  const { web3 } = useWeb3();
  const { getExamManager } = useContract(web3);

  const [name, setName] = useState('New Exam');
  const [duration, setDuration] = useState(60);
  const [questions, setQuestions] = useState<Question[]>([
    { question: '', option1: '', option2: '', option3: '', option4: '', correctIndex: 0 }
  ]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState('');
  const [result, setResult] = useState<{ paperCID: string; answerCID: string; txHash?: string } | null>(null);

  const addQuestion = () => {
    setQuestions([...questions, { question: '', option1: '', option2: '', option3: '', option4: '', correctIndex: 0 }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const next = [...questions];
    next[index] = { ...next[index], [field]: value };
    setQuestions(next);
  };

  const handlePublish = async () => {
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }
    if (questions.some(q => !q.question.trim())) {
      toast.error('Please fill all questions');
      return;
    }

    try {
      setIsUploading(true);
      
      // 1. Prepare data
      setUploadStep('Encrypting Paper...');
      const paperData = questions.map(q => ({
        question: q.question,
        option1: q.option1,
        option2: q.option2,
        option3: q.option3,
        option4: q.option4
      }));

      const optionMap = ['Option1', 'Option2', 'Option3', 'Option4'];
      const answerData = questions.map(q => optionMap[q.correctIndex]);

      const pwd = examPassword(address);

      // 2. Encrypt
      const encPaper = await encryptAES(JSON.stringify(paperData), pwd, address);
      const encAnswers = await encryptAES(JSON.stringify(answerData), pwd, address);

      // 3. Upload to IPFS
      setUploadStep('Uploading to IPFS...');
      const paperCID = await ipfsAdd(encPaper);
      const answerCID = await ipfsAdd(encAnswers);

      setResult({ paperCID, answerCID });

      // 4. Contract Call
      setUploadStep('Waiting for Transaction...');
      const examManager = await getExamManager();
      if (!examManager) throw new Error('Contract not found');

      // For demo, we allow all for now or empty array
      const tx = await examManager.methods.scheduleExam(
        paperCID,
        answerCID,
        name,
        Math.floor(Date.now() / 1000), // start now
        duration * 60,
        [] // allowedStudents (empty means anyone registered)
      ).send({ from: address });

      setResult(prev => prev ? { ...prev, txHash: tx.transactionHash } : null);
      toast.success('Exam published successfully!');
      
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to publish exam');
    } finally {
      setIsUploading(false);
      setUploadStep('');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Exam Builder</h1>
        {isUploading && (
           <div className="flex items-center gap-2 text-primary animate-pulse">
             <div className="w-2 h-2 rounded-full bg-primary" />
             <span className="text-sm font-medium">{uploadStep}</span>
           </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-6">
        {/* Left: Builder */}
        <div className="space-y-4">
          <GlassCard className="space-y-4">
            <Input 
              placeholder="Exam Title" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="bg-muted/50 border-border text-lg font-semibold" 
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Duration (mins)</span>
                <Input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} className="bg-muted/50 border-border" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Question Count</span>
                <Input type="number" value={questions.length} disabled className="bg-muted/50 border-border" />
              </div>
            </div>
          </GlassCard>

          {questions.map((q, i) => (
            <GlassCard key={i} className="space-y-3 relative group">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <span className="text-sm font-medium text-muted-foreground">Q{i + 1}</span>
                <StatusBadge variant="info">MCQ</StatusBadge>
                <button 
                  onClick={() => removeQuestion(i)}
                  className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <Textarea 
                placeholder="Type your question here..." 
                value={q.question}
                onChange={e => updateQuestion(i, 'question', e.target.value)}
                className="bg-muted/50 border-border min-h-[80px]" 
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((num) => {
                  const field = `option${num}` as keyof Question;
                  const isCorrect = q.correctIndex === (num - 1);
                  return (
                    <div key={num} className="relative">
                      <Input 
                        placeholder={`Option ${num}`}
                        value={q[field] as string}
                        onChange={e => updateQuestion(i, field, e.target.value)}
                        className={`bg-muted/50 transition-all pr-10 ${isCorrect ? 'border-success ring-1 ring-success/20' : 'border-border'}`}
                      />
                      <button
                        onClick={() => updateQuestion(i, 'correctIndex', num - 1)}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center transition-colors ${
                          isCorrect ? 'bg-success text-white' : 'bg-muted hover:bg-muted-foreground/20 text-muted-foreground'
                        }`}
                      >
                        {isCorrect ? <Check size={14} /> : <span className="text-[10px] font-bold">{String.fromCharCode(64+num)}</span>}
                      </button>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          ))}

          <Button variant="outline" className="w-full border-dashed border-border text-muted-foreground h-12"
            onClick={addQuestion}>
            <Plus className="h-4 w-4 mr-2" /> Add Question
          </Button>

          <Button 
            onClick={handlePublish}
            disabled={isUploading}
            className="w-full bg-primary btn-glow h-12 text-lg font-bold"
          >
            {isUploading ? <Upload className="h-5 w-5 mr-2 animate-bounce" /> : <Shield className="h-5 w-5 mr-2" />}
            Encrypt & Publish to Blockchain
          </Button>
        </div>

        {/* Right: Status */}
        <div className="space-y-4">
          <GlassCard className="space-y-4 sticky top-24">
            <h3 className="font-semibold">Publication Result</h3>
            
            {result ? (
               <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-success/10 border border-success/30 flex items-center gap-2">
                    <Check className="text-success h-4 w-4" />
                    <span className="text-sm font-medium text-success">Deployed Locally</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paper CID</span>
                    </div>
                    <CIDDisplay cid={result.paperCID} />

                    <div className="flex justify-between mt-2">
                      <span className="text-muted-foreground">Answer CID</span>
                    </div>
                    <CIDDisplay cid={result.answerCID} />

                    {result.txHash && (
                      <>
                        <div className="flex justify-between mt-2">
                          <span className="text-muted-foreground">Final Tx Hash</span>
                        </div>
                        <TxHashDisplay hash={result.txHash} />
                      </>
                    )}
                  </div>
               </div>
            ) : (
              <div className="text-center py-8 space-y-2">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto opacity-20" />
                <p className="text-sm text-muted-foreground">Fill in the details and publish to see the blockchain anchors.</p>
              </div>
            )}

            <div className="chain-separator" />
            
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              * The exam paper is encrypted using AES-256-CBC with your wallet address as part of the key.
              Only verified students will be able to decrypt the questions once the exam window starts.
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

// Inline Check icon for simplicity
function Check({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} height={size} 
      viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" strokeWidth="3" 
      strokeLinecap="round" strokeLinejoin="round" 
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
