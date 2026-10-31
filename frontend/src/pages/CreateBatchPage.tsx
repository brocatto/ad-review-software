import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Plus } from 'lucide-react';
import {
  getClients,
  createClient,
  createBatch,
  uploadCreatives,
  getErrorMessage,
} from '../lib/api';
import type { Client } from '../types';

interface PendingFile {
  file: File;
  name: string;
  preview?: string;
}

export function CreateBatchPage() {
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  // Set once the batch row exists so a failed upload can be retried without duplicating it
  const [createdBatchId, setCreatedBatchId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getClients()
      .then(setClients)
      .catch((err) => console.error('Error loading clients:', err));
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [
      ...prev,
      ...acceptedFiles.map((file) => ({
        file,
        name: file.name,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      })),
    ]);
  }, []);

  // Release image previews when leaving the page
  const filesRef = useRef(files);
  filesRef.current = files;
  useEffect(() => {
    return () => filesRef.current.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov'],
    },
  });

  const removeFile = (index: number) => {
    const removed = files[index];
    if (removed?.preview) URL.revokeObjectURL(removed.preview);
    setFiles(files.filter((_, i) => i !== index));
  };

  const renameFile = (index: number, newName: string) => {
    setFiles(files.map((f, i) => (i === index ? { ...f, name: newName } : f)));
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) return;
    setError('');

    try {
      const client = await createClient({
        name: newClientName.trim(),
        email: newClientEmail.trim() || undefined,
      });
      setClients([client, ...clients]);
      setClientId(client.id);
      setNewClientName('');
      setNewClientEmail('');
      setShowNewClient(false);
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao criar cliente'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !clientId || files.length === 0) return;

    setLoading(true);
    setError('');

    try {
      const batchId = createdBatchId ?? (await createBatch({ name, clientId })).id;
      setCreatedBatchId(batchId);

      // The backend names each creative after the uploaded file name
      const renamed = files.map(({ file, name: fileName }) => {
        const trimmed = fileName.trim();
        return trimmed && trimmed !== file.name
          ? new File([file], trimmed, { type: file.type })
          : file;
      });
      await uploadCreatives(batchId, renamed);
      navigate(`/batches/${batchId}`);
    } catch (err) {
      console.error('Error creating batch:', err);
      setError(getErrorMessage(err, 'Erro ao criar lote'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl animate-fadeIn">
      <h1 className="text-2xl font-semibold text-text-primary mb-8">Criar Novo Lote</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="alert alert-error">{error}</div>}

        {/* Batch Name */}
        <div>
          <label className="label">Nome do Lote</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Ex: Campanha Black Friday"
            required
            disabled={!!createdBatchId}
          />
        </div>

        {/* Client Selection */}
        <div>
          <label className="label">Cliente</label>
          {showNewClient ? (
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="input flex-1 min-w-[180px]"
                placeholder="Nome do novo cliente"
                autoFocus
              />
              <input
                type="email"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                className="input flex-1 min-w-[180px]"
                placeholder="E-mail (opcional)"
              />
              <button type="button" onClick={handleCreateClient} className="btn btn-primary">
                Criar
              </button>
              <button
                type="button"
                onClick={() => setShowNewClient(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="input flex-1"
                required
                disabled={!!createdBatchId}
              >
                <option value="">Selecione um cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewClient(true)}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Plus size={16} />
                Novo
              </button>
            </div>
          )}
        </div>

        {/* File Upload */}
        <div>
          <label className="label">Criativos</label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? 'border-white/40 bg-white/10'
                : 'border-glass-border hover:border-white/20 hover:bg-white/5'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto mb-4 text-text-tertiary" size={32} />
            <p className="text-text-secondary">
              {isDragActive
                ? 'Solte os arquivos aqui...'
                : 'Arraste arquivos ou clique para selecionar'}
            </p>
            <p className="text-sm text-text-muted mt-2">
              Imagens (PNG, JPG, GIF, WebP) e vídeos (MP4, WebM, MOV) · clique no nome para renomear
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-3 p-3 bg-white/5 rounded-xl border border-glass-border"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {item.preview ? (
                      <img
                        src={item.preview}
                        alt={item.name}
                        className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-xs text-text-tertiary flex-shrink-0">
                        VID
                      </div>
                    )}
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => renameFile(index, e.target.value)}
                      className="text-sm text-text-secondary bg-transparent border border-transparent hover:border-glass-border focus:border-white/30 focus:text-text-primary rounded-lg px-2 py-1 flex-1 min-w-0 outline-none transition-colors"
                      title="Clique para renomear"
                      aria-label={`Nome do criativo ${index + 1}`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-1 text-text-muted hover:text-status-error transition-colors flex-shrink-0"
                    aria-label="Remover arquivo"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || !name || !clientId || files.length === 0}
            className="btn btn-primary flex-1"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enviando...
              </span>
            ) : createdBatchId ? (
              'Tentar enviar novamente'
            ) : (
              'Criar Lote'
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/batches')}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
