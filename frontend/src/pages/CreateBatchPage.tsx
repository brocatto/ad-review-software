import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Plus } from 'lucide-react';
import { getClients, createClient, createBatch, uploadCreatives, getErrorMessage } from '../lib/api';
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
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
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
    if (removed.preview) URL.revokeObjectURL(removed.preview);
    setFiles(files.filter((_, i) => i !== index));
  };

  const renameFile = (index: number, name: string) => {
    setFiles(files.map((f, i) => (i === index ? { ...f, name } : f)));
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) return;

    try {
      const client = await createClient({
        name: newClientName,
        email: newClientEmail.trim() || undefined,
      });
      setClients([client, ...clients]);
      setClientId(client.id);
      setNewClientName('');
      setNewClientEmail('');
      setShowNewClient(false);
    } catch (error) {
      alert(getErrorMessage(error, 'Erro ao criar cliente'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !clientId || files.length === 0) return;

    setLoading(true);

    try {
      const batch = await createBatch({ name, clientId });
      // The backend names each creative after the uploaded file name
      const renamed = files.map(({ file, name }) =>
        name.trim() && name !== file.name ? new File([file], name.trim(), { type: file.type }) : file,
      );
      await uploadCreatives(batch.id, renamed);
      navigate(`/batches/${batch.id}`);
    } catch (error) {
      console.error('Error creating batch:', error);
      alert(getErrorMessage(error, 'Erro ao criar lote'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-black mb-8">Criar Novo Lote</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Batch Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome do Lote
          </label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cliente
          </label>
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
              <input
                type="email"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                className="input flex-1"
                placeholder="E-mail (opcional)"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Criativos
          </label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-black bg-gray-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto mb-4 text-gray-400" size={32} />
            <p className="text-gray-600">
              {isDragActive
                ? 'Solte os arquivos aqui...'
                : 'Arraste arquivos ou clique para selecionar'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Imagens (PNG, JPG, GIF, WebP) e vídeos (MP4, WebM, MOV) · clique no nome para renomear
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {item.preview ? (
                      <img
                        src={item.preview}
                        alt={item.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                        VID
                      </div>
                    )}
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => renameFile(index, e.target.value)}
                      className="text-sm text-gray-700 bg-transparent border border-transparent hover:border-gray-200 focus:border-gray-300 focus:bg-white rounded px-2 py-1 flex-1 min-w-0 outline-none"
                      title="Clique para renomear"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-1 text-gray-400 hover:text-red-500"
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
            className="btn btn-primary flex-1 py-3 disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar Lote'}
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
