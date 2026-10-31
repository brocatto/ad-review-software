import { useState, useEffect, useCallback } from 'react';
import { UserPlus, KeyRound } from 'lucide-react';
import { changePassword, getUsers, createUser, getCurrentUser, getErrorMessage } from '../lib/api';
import type { User } from '../types';

const roleLabel = (role: User['role']) => (role === 'ADMIN' ? 'Admin' : 'Gestor');

export function SettingsPage() {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="max-w-2xl space-y-8 animate-fadeIn">
      <h1 className="text-2xl font-semibold text-text-primary">Configurações</h1>

      <div className="card-static p-6">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound size={18} className="text-text-secondary" />
          <h2 className="text-lg font-semibold text-text-primary">Minha conta</h2>
        </div>
        <p className="text-sm text-text-tertiary mb-6">
          {currentUser?.fullName} · {currentUser?.email}
          {currentUser && ` · ${roleLabel(currentUser.role)}`}
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
        <label className="label">Senha atual</label>
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
        <label className="label">Nova senha</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="input"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <p className="text-xs text-text-muted mt-1">Mínimo de 8 caracteres</p>
      </div>
      <div>
        <label className="label">Confirmar nova senha</label>
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
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.text}
        </div>
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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setUsers(await getUsers());
    } catch (err) {
      console.error('Error loading users:', err);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const user = await createUser({ fullName: fullName.trim(), email: email.trim(), password, role });
      setUsers([...users, user]);
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('MANAGER');
      setMessage({ type: 'success', text: `Usuário ${user.fullName} criado` });
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Erro ao criar usuário') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-static p-6">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus size={18} className="text-text-secondary" />
        <h2 className="text-lg font-semibold text-text-primary">Usuários do time</h2>
      </div>

      <div className="divide-y divide-glass-border mb-6">
        {users.map((user) => (
          <div key={user.id} className="py-3 flex items-center justify-between">
            <div>
              <p className="text-text-primary">{user.fullName}</p>
              <p className="text-sm text-text-tertiary">{user.email}</p>
            </div>
            <span className="badge">{roleLabel(user.role)}</span>
          </div>
        ))}
      </div>

      <h3 className="font-medium text-text-primary mb-4">Adicionar usuário</h3>
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

        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {message.text}
          </div>
        )}

        <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-50">
          {saving ? 'Criando...' : 'Criar usuário'}
        </button>
      </form>
    </div>
  );
}
