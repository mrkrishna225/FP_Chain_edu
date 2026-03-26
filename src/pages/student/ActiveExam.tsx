import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/Badges';
import { TxHashDisplay, CIDDisplay } from '@/components/shared/HashDisplays';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Flag, Check, Lock, Upload, Shield, Link as LinkIcon, Download, ExternalLink } from 'lucide-react';

import { useWeb3 } from '@/hooks/useWeb3';
import { useContract } from '@/hooks/useContract';
import { getIPFSClient, ipfsCat, ipfsAdd } from '@/utils/ipfs';
import { decryptAES, encryptAES, examPassword, resultPassword, sha256Hex } from '@/utils/aes';
import { mfsWriteJSON, mfsReadJSON } from '@/utils/mfs';
import toast from 'react-hot-toast';

export default function ActiveExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { account, web3 } = useWeb3();
  const { getExamManager, getResultLedger } = useContract(web3);

  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState(null);
  const [questions, setQuestions] = useState([]);
  
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionStep, setSubmissionStep] = useState(0);
  const [finalResult, setFinalResult] = useState(null);

  // Buffer sync mechanism using real IPFS MFS
  const mfsBufferPath = `/chainedu/buffer/${account?.slice(0, 10)}_${examId}.json`;

  const syncToBuffer = async (newAnswers) => {
    try {
      await mfsWriteJSON(mfsBufferPath, newAnswers);
    } catch (e) {
      console.warn("Buffer sync failed", e);
    }
  };

  const loadExam = useCallback(async () => {
    if (!account) return;
    try {
      setLoading(true);
      const examManager = await getExamManager();
      if (!examManager) throw new Error("Contract not ready");

      const eData = await examManager.methods.getExam(examId).call();
      
      const teacherAddr = eData.teacher.toLowerCase();
      const pwd = examPassword(teacherAddr);

      // Decrypt paper
      const cipherPaper = await ipfsCat(eData.paperCID);
      const parsedPaper = JSON.parse(await decryptAES(cipherPaper, pwd, teacherAddr));
      
      setQuestions(parsedPaper);
      setExamData({
        name: eData.name,
        teacher: teacherAddr,
        answerCID: eData.answerCID,
        startTime: Number(eData.startTime),
        duration: Number(eData.duration)
      });

      // Recover buffer if exists
      try {
        const buffered = await mfsReadJSON(mfsBufferPath);
        if (buffered) {
           setAnswers(buffered);
           toast.success("Recovered buffered answers from IPFS");
        }
      } catch (e) {
        // No buffer, that's fine
      }

      // Time left calculation
      const endMs = (Number(eData.startTime) + Number(eData.duration)) * 1000;
      let left = Math.floor((endMs - Date.now()) / 1000);
      if(left < 0) left = 0;
      setTimeLeft(left);

      setLoading(false);
    } catch (err) {
      toast.error("Error loading exam: " + err.message);
      setLoading(false);
    }
  }, [account, examId, getExamManager, mfsBufferPath]);

  useEffect(() => {
    loadExam();
  }, [loadExam]);

  useEffect(() => {
    if (submitted || submitting || timeLeft <= 0 || loading) return;
    const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, [submitted, submitting, timeLeft, loading]);

  const selectAnswer = (qIdx, optIdx) => {
    setAnswers(prev => {
      const next = { ...prev, [qIdx]: optIdx };
      syncToBuffer(next);
      return next;
    });
  };

  const toggleFlag = (qIdx) => {
    setFlagged(prev => { const n = new Set(prev); n.has(qIdx) ? n.delete(qIdx) : n.add(qIdx); return n; });
  };

  const handleSubmit = async () => {
    if(!account || !examData) return;
    try {
      setSubmitting(true);
      setSubmissionStep(0); // Answers Collected

      const pwd = examPassword(examData.teacher);
      
      // Step 1: Decrypt answers, calculate score locally
      setSubmissionStep(1); // Encrypting
      const cipherAnswers = await ipfsCat(examData.answerCID);
      const answerKey = JSON.parse(await decryptAES(cipherAnswers, pwd, examData.teacher));
      
      let score = 0;
      const totalQuestions = questions.length;
      
      // We map numeric indices (0-3) to 'Option1'-'Option4'
      const optionMap = ['Option1', 'Option2', 'Option3', 'Option4'];
      
      const evaluation = questions.map((q, idx) => {
          const studentAnsIdx = answers[idx];
          const studentAnsStr = studentAnsIdx !== undefined ? optionMap[studentAnsIdx] : null;
          const correctAnsStr = answerKey[idx];
          if(studentAnsStr === correctAnsStr) score++;
          
          return {
             question: q.question,
             selected: studentAnsStr || 'None',
             correct: correctAnsStr,
             isCorrect: studentAnsStr === correctAnsStr
          };
      });

      const resultPayload = {
         examId,
         student: account,
         score,
         totalQuestions,
         evaluation
      };

      // Encrypt result with STUDENT'S wallet address
      setSubmissionStep(2); // Uploading
      const resPwd = resultPassword(account);
      const encResult = await encryptAES(JSON.stringify(resultPayload), resPwd, account);
      const resultCID = await ipfsAdd(encResult);

      setSubmissionStep(3); // Hashing
      const hashStr = await sha256Hex(account + examId + score + encResult);
      const bytes32Hash = '0x' + hashStr.slice(0, 64);

      setSubmissionStep(4); // Blockchain
      const resultLedger = await getResultLedger();
      const tx = await resultLedger.methods.submitResult(
        account,
        examId,
        bytes32Hash,
        resultCID,
        score,
        totalQuestions
      ).send({ from: account });

      // Clear buffer
      try {
         const client = getIPFSClient();
         await client.files.rm(mfsBufferPath);
      } catch(e){}

      setFinalResult({ txHash: tx.transactionHash, cid: resultCID, score, totalQuestions });
      setSubmitting(false);
      setSubmitted(true);

    } catch(err) {
      toast.error('Submission failed: ' + err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-cyan-400">Loading Exam Data & Decrypting...</div>;
  }

  if (submitted && finalResult) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <GlassCard className="max-w-lg w-full text-center space-y-6">
          <div className="text-6xl">🎉</div>
          <h1 className="text-2xl font-bold">Exam Submitted & Secured On-Chain</h1>
          
          <div className="bg-cyan-900/40 border border-cyan-500/50 p-6 rounded-xl space-y-2">
            <h2 className="text-sm font-bold text-cyan-300 uppercase tracking-wider">Your Score</h2>
            <div className="text-4xl font-bold text-cyan-100">{finalResult.score} / {finalResult.totalQuestions}</div>
            <p className="text-xs text-cyan-500 pt-2 text-left">The detailed answer sheet is encrypted securely via AES-256 and only you and your teacher can view it.</p>
          </div>

          <StatusBadge variant="success" pulse>✅ Verified on Blockchain</StatusBadge>
          
          <div className="space-y-3 text-left">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Tx Hash</span>
              <TxHashDisplay hash={finalResult.txHash} />
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">IPFS CID</span>
              <CIDDisplay cid={finalResult.cid} />
            </div>
          </div>
          
          <Button onClick={() => navigate('/student/dashboard')} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white">
            Return to Dashboard
          </Button>
        </GlassCard>
      </div>
    );
  }

  if (submitting) {
    const steps = [
      { label: 'Answers Collected', icon: Check, log: `${Object.keys(answers).length} answers packaged` },
      { label: 'Auto-Grading & Encrypting', icon: Lock, log: 'AES-256-CBC encryption applied' },
      { label: 'Uploading to IPFS', icon: Upload, log: 'Network transmission in progress...' },
      { label: 'Generating Anchors', icon: Shield, log: 'SHA-256 Hash ready' },
      { label: 'Submitting to Blockchain', icon: LinkIcon, log: 'Awaiting MetaMask Confirmation...' },
    ];
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <GlassCard className="max-w-2xl w-full space-y-6">
          <h2 className="text-xl font-bold text-center">Submitting Immutable Exam...</h2>
          <div className="space-y-4">
            {steps.map((step, i) => {
              const done = submissionStep > i;
              const active = submissionStep === i;
              return (
                <div key={i} className={`flex items-start gap-4 p-3 rounded-lg transition-all ${done ? 'bg-success/10 border border-success/30' : active ? 'bg-cyan-500/10 border border-cyan-500/50' : 'bg-muted/30 border border-transparent'}`}>
                  <div className={`p-2 rounded-lg ${done ? 'bg-success/20 text-success' : active ? 'bg-cyan-500/20 text-cyan-400 animate-pulse' : 'bg-muted text-muted-foreground'}`}>
                    <step.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${done ? 'text-success' : active ? 'text-cyan-400' : 'text-muted-foreground'}`}>
                      {done ? '✅' : active ? '⏳' : '⬜'} {step.label}
                    </p>
                    {(done || active) && (
                      <p className="font-mono text-xs text-muted-foreground mt-1 bg-background/50 rounded px-2 py-1">
                        {step.log}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <Progress value={(submissionStep / 4) * 100} className="h-2 bg-gray-800" />
        </GlassCard>
      </div>
    );
  }

  const q = questions[currentQ];
  const allAnswered = questions.every((_, i) => answers[i] !== undefined);
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isLowTime = timeLeft < 300;

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold">{examData?.name}</h1>
          <p className="text-xs text-muted-foreground text-cyan-400">Buffered in real-time to IPFS MFS</p>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl glass-card border ${isLowTime ? 'border-red-500/50 text-red-400 animate-pulse' : 'border-gray-800 text-white'}`}>
          <span className="text-2xl font-bold font-mono">
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
        </div>

        <Button onClick={handleSubmit} disabled={!allAnswered}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold disabled:opacity-50 transition-colors">
          Submit Exam
        </Button>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400">Question {currentQ + 1} of {questions.length}</span>
        <Progress value={((currentQ + 1) / questions.length) * 100} className="h-1.5 flex-1 bg-gray-800" />
      </div>

      <div className="grid lg:grid-cols-[1fr_200px] gap-4">
        {/* Question */}
        <GlassCard className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
              Question {currentQ + 1}
            </span>
            <Button variant="ghost" size="sm" onClick={() => toggleFlag(currentQ)}
              className={flagged.has(currentQ) ? 'text-amber-500 hover:text-amber-400' : 'text-gray-500 hover:text-white'}>
              <Flag className="h-4 w-4 mr-1" /> {flagged.has(currentQ) ? 'Flagged' : 'Flag'}
            </Button>
          </div>

          <p className="text-lg font-medium leading-relaxed text-white">{q?.question}</p>

          <div className="grid gap-3">
             {/* Map standard fields back to array */}
            {[q?.option1, q?.option2, q?.option3, q?.option4].map((opt, i) => (
              <button key={i} onClick={() => selectAnswer(currentQ, i)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  answers[currentQ] === i
                    ? 'border-cyan-500 bg-cyan-900/30 text-white shadow-[0_0_15px_rgba(0,212,255,0.2)]'
                    : 'border-gray-800 hover:border-gray-600 hover:bg-white/5 text-gray-300'
                }`}>
                <span className="font-mono text-xs mr-3 text-cyan-600 font-bold bg-cyan-900/40 px-2 py-1 rounded">{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            ))}
          </div>

          <div className="flex justify-between pt-2">
             <Button variant="outline" className="border-gray-700 hover:bg-gray-800 text-gray-300" disabled={currentQ === 0} onClick={() => setCurrentQ(c => c - 1)}>
               <ChevronLeft className="h-4 w-4 mr-1" /> Previous
             </Button>
             <Button variant="outline" className="border-gray-700 hover:bg-gray-800 text-gray-300" disabled={currentQ === questions.length - 1} onClick={() => setCurrentQ(c => c + 1)}>
               Next <ChevronRight className="h-4 w-4 ml-1" />
             </Button>
          </div>
        </GlassCard>

        {/* Question navigator */}
        <GlassCard className="space-y-3 h-fit border-gray-800 bg-[#0d1526]/80">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Navigator</h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((_, i) => (
              <button key={i} onClick={() => setCurrentQ(i)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  currentQ === i ? 'border-2 border-cyan-400 bg-cyan-900/50 text-cyan-300' :
                  answers[i] !== undefined ? 'bg-cyan-700/60 text-white shadow-[0_0_10px_rgba(0,212,255,0.3)]' :
                  flagged.has(i) ? 'bg-amber-600/60 text-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.2)]' :
                  'bg-gray-800/80 text-gray-500 hover:bg-gray-700'
                }`}>
                {i + 1}
              </button>
            ))}
          </div>
          <div className="text-xs space-y-2 text-gray-500 pt-4 border-t border-gray-800 mt-4">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-cyan-700/60 shadow-[0_0_5px_rgba(0,212,255,0.5)]" /> Answered</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-amber-600/60 shadow-[0_0_5px_rgba(245,158,11,0.5)]" /> Flagged</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded border border-gray-700 bg-gray-900" /> Unanswered</div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
