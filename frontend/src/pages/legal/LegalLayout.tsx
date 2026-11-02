import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LEGAL } from '../../lib/legal';

export function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <header className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-4 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          {LEGAL.product}
        </Link>
        <nav className="flex items-center gap-4 text-sm text-text-tertiary">
          <Link to="/termos" className="hover:text-text-primary transition-colors">
            Termos de Uso
          </Link>
          <Link to="/privacidade" className="hover:text-text-primary transition-colors">
            Privacidade
          </Link>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 animate-fadeIn">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>
        <article className="card-static p-6 sm:p-10 legal-prose">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">{title}</h1>
          <p className="text-sm text-text-muted mb-8">Última atualização: {LEGAL.updatedAt}</p>
          {children}
        </article>
      </main>

      <style>{`
        .legal-prose h2 { font-size: 1.125rem; font-weight: 600; margin: 2rem 0 0.75rem; color: #fff; }
        .legal-prose p, .legal-prose li { color: rgba(255,255,255,0.72); line-height: 1.7; font-size: 0.95rem; }
        .legal-prose p { margin-bottom: 0.9rem; }
        .legal-prose ul { list-style: disc; padding-left: 1.4rem; margin-bottom: 0.9rem; }
        .legal-prose li { margin-bottom: 0.35rem; }
        .legal-prose a { color: #fff; text-decoration: underline; }
        .legal-prose strong { color: #fff; font-weight: 500; }
      `}</style>
    </div>
  );
}
