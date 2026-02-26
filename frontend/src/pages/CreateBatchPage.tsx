import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Plus } from 'lucide-react';
import { getClients, createClient, createBatch, uploadCreatives } from '../lib/api';
import type { Client } from '../types';

export function CreateBatchPage() {
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov'],
    },
  });

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) return;

    try {
      const client = await createClient({ name: newClientName });
      setClients([client, ...clients]);
      setClientId(client.id);
      setNewClientName('');
      setShowNewClient(false);
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !clientId || files.length === 0) return;

    setLoading(true);

    try {
      const batch = await createBatch({ name, clientId });
      await uploadCreatives(batch.id, files);
      navigate(`/batches/${batch.id}`);
    } catch (error) {
      console.error('Error creating batch:', error);
      alert('Erro ao criar lote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl animate-fadeIn">
      <h1 className="text-2xl font-semibold text-text-primary mb-8">Criar Novo Lote</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
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
          />
        </div>

        {/* Client Selection */}
        <div>
          <label className="label">Cliente</label>
          {showNewClient ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="input flex-1"
                placeholder="Nome do novo cliente"
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreateClient}
                className="btn btn-primary"
              >
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
              Imagens (PNG, JPG, GIF) e vídeos (MP4, WebM)
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-glass-border"
                >
                  <div className="flex items-center gap-3">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-10 h-10 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-xs text-text-tertiary">
                        VID
                      </div>
                    )}
                    <span className="text-sm text-text-secondary truncate max-w-[200px]">
                      {file.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-1 text-text-muted hover:text-status-error transition-colors"
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
                Criando...
              </span>
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
