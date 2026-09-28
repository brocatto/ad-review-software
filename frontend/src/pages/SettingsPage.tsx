import { useState, useEffect } from 'react';
import { changePassword, getUsers, createUser, getCurrentUser, getErrorMessage } from '../lib/api';
import type { User } from '../types';

export function SettingsPage() {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold text-black">Configurações</h1>

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-1">Minha conta</h2>
        <p className="text-sm text-gray-500 mb-6">
          {currentUser?.fullName} · {currentUser?.email}
        </p>
        <ChangePasswordForm />
      </div>

      {isAdmin && <UsersSection />}
    </div>
  );
}

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' });
      return;
    }

    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Senha alterada com sucesso' });
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Erro ao alterar senha') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Senha atual</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="input"
          autoComplete="current-password"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Nova senha</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="input"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <p className="text-xs text-gray-400 mt-1">Mínimo de 8 caracteres</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar nova senha</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="input"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}

      <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-50">
        {saving ? 'Salvando...' : 'Alterar senha'}
      </button>
    </form>
  );
}

function UsersSection() {
  const [users, setUsers] = useState<User[]>([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<User['role']>('MANAGER');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setUsers(await getUsers());
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const user = await createUser({ fullName, email, password, role });
      setUsers([...users, user]);
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('MANAGER');
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao criar usuário'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-4">Usuários do time</h2>

      <div className="divide-y divide-gray-100 mb-6">
        {users.map((user) => (
          <div key={user.id} className="py-3 flex items-center justify-between">
            <div>
              <p className="text-black">{user.fullName}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
            <span className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-1">
              {user.role === 'ADMIN' ? 'Admin' : 'Gestor'}
            </span>
          </div>
        ))}
      </div>

      <h3 className="font-medium mb-4">Adicionar usuário</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="input"
          placeholder="Nome completo"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          placeholder="E-mail"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          placeholder="Senha inicial (mínimo 8 caracteres)"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as User['role'])}
          className="input"
        >
          <option value="MANAGER">Gestor</option>
          <option value="ADMIN">Admin</option>
        </select>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-50">
          {saving ? 'Criando...' : 'Criar usuário'}
        </button>
      </form>
    </div>
  );
}
