import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import { Check, X } from 'lucide-react';
import { getPublicBatch, approveCreative, rejectCreative, getFileUrl } from '../lib/api';
import type { Batch, Creative } from '../types';

export function ApprovalPage() {
  const { accessToken } = useParams<{ accessToken: string }>();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [pendingCreative, setPendingCreative] = useState<Creative | null>(null);

  useEffect(() => {
    if (accessToken) loadBatch();
  }, [accessToken]);

  const loadBatch = async () => {
    try {
      const data = await getPublicBatch(accessToken!);
      setBatch(data);

    } catch (error) {
      console.error('Error loading batch:', error);
    } finally {
      setLoading(false);
    }
  };

  const pendingCreatives = batch?.creatives?.filter(
    (c) => c.approval?.status === 'PENDING'
  ) || [];

  const currentCreative = pendingCreatives[0];
  const totalPending = pendingCreatives.length;
  const totalCreatives = batch?.creatives?.length || 0;
  const completed = totalCreatives - totalPending;

  const handleApprove = async () => {
    if (!currentCreative || !accessToken) return;

    try {
      await approveCreative(accessToken, currentCreative.id);
      loadBatch();
    } catch (error) {
      console.error('Error approving:', error);
    }
  };

  const handleReject = () => {
    if (!currentCreative) return;
    setPendingCreative(currentCreative);
    setShowFeedback(true);
  };

  const submitRejection = async () => {
    if (!pendingCreative || !accessToken) return;

    try {
      await rejectCreative(accessToken, pendingCreative.id, feedback);
      setShowFeedback(false);
      setFeedback('');
      setPendingCreative(null);
      loadBatch();
    } catch (error) {
      console.error('Error rejecting:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-text-secondary">Carregando...</div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-text-primary text-center">
          <p className="text-xl mb-2">Lote não encontrado</p>
          <p className="text-text-tertiary">Verifique se o link está correto</p>
        </div>
      </div>
    );
  }

  if (totalPending === 0) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-status-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-status-success" />
          </div>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">Concluído!</h1>
          <p className="text-text-secondary">
            Todos os {totalCreatives} criativos foram avaliados.
          </p>
          <p className="text-text-muted mt-4 text-sm">
            Obrigado pelo seu feedback!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header */}
      <header className="p-4 text-center">
        <h1 className="text-text-primary font-medium">{batch.name}</h1>
        <p className="text-text-muted text-sm mt-1">
          {completed} de {totalCreatives} avaliados
        </p>
        {/* Progress bar */}
        <div className="mt-3 h-1 bg-glass-border rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${(completed / totalCreatives) * 100}%` }}
          />
        </div>
      </header>

      {/* Card Stack */}
      <div className="flex-1 flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {currentCreative && (
            <SwipeCard
              key={currentCreative.id}
              creative={currentCreative}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="p-6 flex justify-center gap-8">
        <button
          onClick={handleReject}
          className="w-16 h-16 bg-glass rounded-full border border-glass-border flex items-center justify-center text-status-error hover:bg-status-error/20 hover:border-status-error/40 transition-all duration-200"
        >
          <X size={32} />
        </button>
        <button
          onClick={handleApprove}
          className="w-16 h-16 bg-glass rounded-full border border-glass-border flex items-center justify-center text-status-success hover:bg-status-success/20 hover:border-status-success/40 transition-all duration-200"
        >
          <Check size={32} />
        </button>
      </div>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-[8px] flex items-end sm:items-center justify-center z-[1000]">
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            className="bg-glass backdrop-blur-[20px] border border-glass-border rounded-t-[32px] sm:rounded-[32px] w-full sm:max-w-md p-8 mx-4 shadow-xl"
          >
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              Por que reprovar?
            </h2>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="input h-32 resize-none"
              placeholder="Descreva o que precisa ser ajustado..."
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowFeedback(false);
                  setFeedback('');
                  setPendingCreative(null);
                }}
                className="btn btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={submitRejection}
                className="btn btn-primary flex-1 !bg-status-error/20 !border-status-error/30 !text-status-error hover:!bg-status-error/30"
              >
                Reprovar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function SwipeCard({
  creative,
  onApprove,
  onReject,
}: {
  creative: Creative;
  onApprove: () => void;
  onReject: () => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  const approveOpacity = useTransform(x, [0, 100], [0, 1]);
  const rejectOpacity = useTransform(x, [-100, 0], [1, 0]);

  const bind = useDrag(
    ({ down, movement: [mx], velocity: [vx] }) => {
      if (!down) {
        if (Math.abs(mx) > 100 || Math.abs(vx) > 0.5) {
          if (mx > 0) {
            onApprove();
          } else {
            onReject();
          }
        }
        x.set(0);
      } else {
        x.set(mx);
      }
    },
    { axis: 'x' }
  );

  const bindProps = bind();

  return (
    <motion.div
      {...(bindProps as any)}
      style={{ x, rotate, opacity }}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="relative w-full max-w-sm aspect-[3/4] touch-none"
    >
      {/* Card */}
      <div className="absolute inset-0 bg-bg-secondary rounded-[32px] border border-glass-border overflow-hidden shadow-2xl">
        {creative.fileType === 'IMAGE' ? (
          <img
            src={getFileUrl(creative.fileUrl)}
            alt={creative.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : creative.fileType === 'VIDEO' ? (
          <video
            src={getFileUrl(creative.fileUrl)}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-primary p-8">
            <p className="text-center">{creative.name}</p>
          </div>
        )}

        {/* Overlays */}
        <motion.div
          style={{ opacity: approveOpacity }}
          className="absolute inset-0 bg-status-success/20 flex items-center justify-center"
        >
          <div className="bg-status-success text-white px-6 py-3 rounded-full font-semibold text-lg transform rotate-12">
            APROVADO
          </div>
        </motion.div>

        <motion.div
          style={{ opacity: rejectOpacity }}
          className="absolute inset-0 bg-status-error/20 flex items-center justify-center"
        >
          <div className="bg-status-error text-white px-6 py-3 rounded-full font-semibold text-lg transform -rotate-12">
            REPROVADO
          </div>
        </motion.div>

        {/* Name */}
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-bg-primary/90 to-transparent">
          <div className="flex items-center gap-2">
            <p className="text-text-primary font-medium truncate">{creative.name}</p>
            {creative.currentVersion > 1 && (
              <span className="badge text-xs">
                v{creative.currentVersion} - Atualizado
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
