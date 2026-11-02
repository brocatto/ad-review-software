import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, ArrowRight, Link2, RefreshCw, MessageSquare, Menu, X as CloseIcon } from 'lucide-react';

// Reduced motion hook
const useReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to signup with email pre-filled
    navigate(`/signup?email=${encodeURIComponent(email)}`);
  };

  // Animation variants with reduced motion support
  const fadeInUp = reducedMotion
    ? { initial: {}, animate: {}, transition: {} }
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } };

  const fadeInLeft = reducedMotion
    ? { initial: {}, animate: {}, whileInView: {} }
    : { initial: { opacity: 0, x: -20 }, whileInView: { opacity: 1, x: 0 } };

  const fadeInRight = reducedMotion
    ? { initial: {}, animate: {}, whileInView: {} }
    : { initial: { opacity: 0, x: 20 }, whileInView: { opacity: 1, x: 0 } };

  const fadeInUpView = reducedMotion
    ? { initial: {}, whileInView: {} }
    : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 } };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {/* Header */}
      <header
        className="fixed top-3 sm:top-4 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 z-50 px-4 sm:px-6 py-3 sm:w-full sm:max-w-3xl"
        style={{
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
        }}
      >
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-lg min-h-[44px]">
            <span
              className="text-lg sm:text-xl font-semibold tracking-tight"
              style={{ color: '#ffffff' }}
            >
              AdReview<span style={{ fontWeight: 300 }}>OS</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#problema"
              className="text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded py-2"
              style={{ color: 'rgba(255, 255, 255, 0.6)', transition: 'color 0.2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'; }}
            >
              Problema
            </a>
            <a
              href="#solucao"
              className="text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded py-2"
              style={{ color: 'rgba(255, 255, 255, 0.6)', transition: 'color 0.2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'; }}
            >
              Solução
            </a>
            <a
              href="#como-funciona"
              className="text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded py-2"
              style={{ color: 'rgba(255, 255, 255, 0.6)', transition: 'color 0.2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'; }}
            >
              Como Funciona
            </a>
            <a
              href="#preco"
              className="text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded py-2"
              style={{ color: 'rgba(255, 255, 255, 0.6)', transition: 'color 0.2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'; }}
            >
              Preço
            </a>
            <a
              href="/login"
              className="text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded py-2"
              style={{ color: 'rgba(255, 255, 255, 0.6)', transition: 'color 0.2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'; }}
            >
              Entrar
            </a>
          </nav>

          {/* Desktop CTA */}
          <a
            href="/signup"
            className="hidden sm:flex px-4 sm:px-5 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 min-h-[44px] items-center"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              color: '#ffffff',
              transition: 'background 0.2s ease, border-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            Começar grátis
          </a>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden flex items-center justify-center w-11 h-11 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <CloseIcon className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="sm:hidden mt-4 pt-4 border-t border-white/10 flex flex-col gap-2">
            <a
              href="#problema"
              onClick={closeMobileMenu}
              className="text-base font-medium py-3 px-4 rounded-xl"
              style={{ color: 'rgba(255, 255, 255, 0.8)', background: 'rgba(255, 255, 255, 0.05)' }}
            >
              Problema
            </a>
            <a
              href="#solucao"
              onClick={closeMobileMenu}
              className="text-base font-medium py-3 px-4 rounded-xl"
              style={{ color: 'rgba(255, 255, 255, 0.8)', background: 'rgba(255, 255, 255, 0.05)' }}
            >
              Solução
            </a>
            <a
              href="#como-funciona"
              onClick={closeMobileMenu}
              className="text-base font-medium py-3 px-4 rounded-xl"
              style={{ color: 'rgba(255, 255, 255, 0.8)', background: 'rgba(255, 255, 255, 0.05)' }}
            >
              Como Funciona
            </a>
            <a
              href="#preco"
              onClick={closeMobileMenu}
              className="text-base font-medium py-3 px-4 rounded-xl"
              style={{ color: 'rgba(255, 255, 255, 0.8)', background: 'rgba(255, 255, 255, 0.05)' }}
            >
              Preço
            </a>
            <a
              href="/login"
              onClick={closeMobileMenu}
              className="text-base font-medium py-3 px-4 rounded-xl"
              style={{ color: 'rgba(255, 255, 255, 0.8)', background: 'rgba(255, 255, 255, 0.05)' }}
            >
              Entrar
            </a>
            <a
              href="/signup"
              onClick={closeMobileMenu}
              className="text-base font-semibold py-3 px-4 rounded-xl mt-2 text-center"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff'
              }}
            >
              Começar grátis
            </a>
          </nav>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 py-16 sm:py-20 pt-28 sm:pt-32">
        {/* Background gradient orbs */}
        <div
          className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'rgba(255, 255, 255, 0.05)' }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-48 sm:w-80 h-48 sm:h-80 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: 'rgba(255, 255, 255, 0.03)' }}
          aria-hidden="true"
        />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Eyebrow Badge */}
          <motion.div
            {...fadeInUp}
            className="mb-6 sm:mb-8"
          >
            <span
              className="inline-block px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium tracking-wide"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'rgba(255, 255, 255, 0.6)'
              }}
            >
              Para agências, designers e social media
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-7xl mb-4 sm:mb-6 px-2"
            style={{
              fontWeight: 200,
              lineHeight: 1.15,
              letterSpacing: '-0.5px',
              textWrap: 'balance'
            }}
          >
            Aprovar artes pelo WhatsApp
            <br />
            <span style={{ fontWeight: 600 }}>é uma bagunça.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.2 }}
            className="text-base sm:text-xl md:text-2xl mb-8 sm:mb-12 max-w-3xl mx-auto px-2"
            style={{
              fontWeight: 300,
              color: 'rgba(255, 255, 255, 0.7)',
              lineHeight: 1.5
            }}
          >
            Um link. Tudo centralizado. Infinitos ciclos de feedback.
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            <span style={{ color: '#ffffff', fontWeight: 400 }}>Simples assim.</span>
          </motion.p>

          {/* CTA Form */}
          <motion.div
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.3 }}
            className="mb-10 sm:mb-16"
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:gap-4 max-w-md mx-auto px-2">
              <label htmlFor="hero-email" className="sr-only">Seu email</label>
              <input
                id="hero-email"
                type="email"
                name="email"
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com…"
                required
                className="flex-1 px-5 py-4 text-white text-base focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  fontSize: '16px',
                  outline: 'none',
                  minHeight: '52px',
                  transition: 'background 0.2s ease, border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              />
              <button
                type="submit"
                className="px-6 sm:px-8 py-4 font-semibold flex items-center justify-center gap-2 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] active:scale-[0.98]"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '14px',
                  color: '#ffffff',
                  fontSize: '16px',
                  cursor: 'pointer',
                  outline: 'none',
                  minHeight: '52px',
                  transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                Começar grátis
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>
            <p className="text-xs sm:text-sm mt-4" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
              Trial gratuito. Sem cartão de crédito.
            </p>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0 }}
            animate={reducedMotion ? {} : { opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xs sm:text-sm px-4"
            style={{ color: 'rgba(255, 255, 255, 0.5)' }}
          >
            Criado por quem vive isso todo dia em uma aceleradora de performance
          </motion.div>
        </div>
      </section>

      {/* Problem Agitation Section */}
      <section id="problema" className="py-16 sm:py-32 px-4 sm:px-6 scroll-mt-20 sm:scroll-mt-24" style={{ background: '#1a1a1a' }}>
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-2xl sm:text-4xl md:text-5xl text-center mb-10 sm:mb-20"
            style={{ fontWeight: 300, letterSpacing: '-0.5px', textWrap: 'balance' }}
          >
            Reconhece esse <span style={{ fontWeight: 600 }}>caos</span>?
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-8">
            {/* Problem Cards */}
            {[
              {
                icon: <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />,
                title: "WhatsApp virando depósito de arte",
                description: "Artes enviadas soltas no grupo, links do Drive perdidos no meio de 200 mensagens"
              },
              {
                icon: <X className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />,
                title: "Cliente responde só metade",
                description: "Enviou 10 artes, cliente aprovou 3, reprovou 2, e as outras 5? Mistério."
              },
              {
                icon: <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />,
                title: "Feedback fragmentado",
                description: '"Mudei de ideia daquela arte que mandei ontem" — Qual? Quando? Onde?'
              },
              {
                icon: <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />,
                title: "Ciclos infinitos de confusão",
                description: "Ajustou, mandou de novo, cliente esqueceu o contexto, recomeça do zero"
              }
            ].map((problem, index) => (
              <motion.div
                key={index}
                {...fadeInUpView}
                viewport={{ once: true }}
                transition={reducedMotion ? {} : { duration: 0.5, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
                className="p-5 sm:p-8"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
                }}
              >
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mb-4 sm:mb-6"
                  style={{
                    background: 'rgba(255, 107, 107, 0.1)',
                    border: '1px solid rgba(255, 107, 107, 0.2)',
                    borderRadius: '50%',
                    color: '#ff6b6b'
                  }}
                >
                  {problem.icon}
                </div>
                <h3 className="text-lg sm:text-xl mb-2 sm:mb-3" style={{ fontWeight: 500 }}>{problem.title}</h3>
                <p className="text-sm sm:text-base" style={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 300, lineHeight: 1.6 }}>
                  {problem.description}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            {...fadeInUpView}
            viewport={{ once: true }}
            transition={reducedMotion ? {} : { duration: 0.6, delay: 0.4 }}
            className="mt-10 sm:mt-16 text-center px-2"
          >
            <p className="text-lg sm:text-2xl md:text-3xl" style={{ fontWeight: 300, color: 'rgba(255, 255, 255, 0.7)' }}>
              Resultado: <span style={{ color: '#ffffff', fontWeight: 600 }}>Retrabalho, stress, e deadlines perdidos.</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solucao" className="py-16 sm:py-32 px-4 sm:px-6 scroll-mt-20 sm:scroll-mt-24" style={{ background: '#2d2d2d' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-20">
            <h2
              className="text-2xl sm:text-4xl md:text-5xl mb-4 sm:mb-6"
              style={{ fontWeight: 300, letterSpacing: '-0.5px', textWrap: 'balance' }}
            >
              Existe um jeito <span style={{ fontWeight: 600 }}>muito mais simples</span>
            </h2>
            <p
              className="text-base sm:text-xl max-w-2xl mx-auto px-2"
              style={{ fontWeight: 300, color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6 }}
            >
              AdReviewOS centraliza todo o processo de aprovação em um único link.
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              Sem gambiarra. Sem caos. Sem perder tempo.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-8 mb-10 sm:mb-20">
            {[
              {
                icon: <Link2 className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />,
                title: "Um link só",
                description: "Cria um lote, gera um link, envia pro cliente. Tudo em um lugar. Sempre."
              },
              {
                icon: <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />,
                title: "Infinitos ciclos",
                description: "Ajustou? Sobe a nova versão. O MESMO link se atualiza. Cliente vê o histórico."
              },
              {
                icon: <Check className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />,
                title: "Feedback objetivo",
                description: "Cliente aprova ou reprova cada arte individualmente. Zero confusão."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                {...fadeInUpView}
                viewport={{ once: true }}
                transition={reducedMotion ? {} : { duration: 0.5, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
                className="text-center p-5 sm:p-8"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
                }}
              >
                <div
                  className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mb-4 sm:mb-6 mx-auto"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '50%',
                    color: '#ffffff'
                  }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl mb-2 sm:mb-3" style={{ fontWeight: 500 }}>{feature.title}</h3>
                <p className="text-sm sm:text-base" style={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 300, lineHeight: 1.6 }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="como-funciona" className="py-16 sm:py-32 px-4 sm:px-6 scroll-mt-20 sm:scroll-mt-24" style={{ background: '#1a1a1a' }}>
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-2xl sm:text-4xl md:text-5xl text-center mb-10 sm:mb-20"
            style={{ fontWeight: 300, letterSpacing: '-0.5px', textWrap: 'balance' }}
          >
            Como <span style={{ fontWeight: 600 }}>funciona</span>
          </h2>

          <div className="space-y-4 sm:space-y-8">
            {[
              {
                step: "01",
                title: "Cria o lote de artes",
                description: "Faz upload das artes que quer enviar pro cliente. Quantas quiser."
              },
              {
                step: "02",
                title: "Gera o link de aprovação",
                description: "Sistema cria um link único. Envia pro cliente (WhatsApp, email, tanto faz)."
              },
              {
                step: "03",
                title: "Cliente aprova ou reprova",
                description: "Interface mobile-first tipo Tinder. Swipe, approve, reject. Simples."
              },
              {
                step: "04",
                title: "Você vê tudo centralizado",
                description: "Feedback organizado por arte. Sabe exatamente o que ajustar."
              },
              {
                step: "05",
                title: "Ajusta e atualiza",
                description: "Sobe a nova versão. MESMO link. Cliente vê o histórico. Repete até aprovar."
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                {...fadeInLeft}
                viewport={{ once: true }}
                transition={reducedMotion ? {} : { duration: 0.5, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
                className="flex gap-4 sm:gap-8 items-start p-4 sm:p-6"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px'
                }}
              >
                <div
                  className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-lg sm:text-2xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '50%',
                    fontWeight: 300,
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}
                  aria-hidden="true"
                >
                  {step.step}
                </div>
                <div className="flex-1 pt-1 sm:pt-3">
                  <h3 className="text-lg sm:text-2xl mb-1 sm:mb-2" style={{ fontWeight: 500 }}>{step.title}</h3>
                  <p
                    className="text-sm sm:text-lg"
                    style={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 300, lineHeight: 1.6 }}
                  >
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder Social Proof */}
      <section className="py-16 sm:py-32 px-4 sm:px-6" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            {...fadeInUpView}
            viewport={{ once: true }}
            transition={reducedMotion ? {} : { duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="p-6 sm:p-12 text-center"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 sm:mb-8"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '50%'
              }}
              aria-hidden="true"
            />
            <blockquote>
              <p
                className="text-base sm:text-xl md:text-2xl mb-6 sm:mb-8"
                style={{ fontWeight: 300, color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6 }}
              >
                "Criei o AdReviewOS porque eu VIVIA esse caos todo dia na minha aceleradora.
                <br className="hidden sm:block" /><br className="hidden sm:block" />
                <span className="sm:hidden"> </span>
                Cansado de perder artes no WhatsApp, construí isso pra mim.
                <br className="hidden sm:block" /><br className="hidden sm:block" />
                <span className="sm:hidden"> </span>
                <span style={{ color: '#ffffff', fontWeight: 500 }}>Agora uso em todos os clientes. Zero stress."</span>
              </p>
              <footer style={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 300 }}>
                <cite style={{ fontStyle: 'normal' }}>
                  Fundador, AdReviewOS
                  <br />
                  <span className="text-xs sm:text-sm" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                    Aceleradora de Performance Marketing para Ecommerce
                  </span>
                </cite>
              </footer>
            </blockquote>
          </motion.div>
        </div>
      </section>

      {/* Before/After Comparison */}
      <section className="py-16 sm:py-32 px-4 sm:px-6" style={{ background: '#2d2d2d' }}>
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-2xl sm:text-4xl md:text-5xl text-center mb-10 sm:mb-20"
            style={{ fontWeight: 300, letterSpacing: '-0.5px', textWrap: 'balance' }}
          >
            Antes vs. <span style={{ fontWeight: 600 }}>Depois</span>
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-8">
            {/* Before */}
            <motion.div
              {...fadeInLeft}
              viewport={{ once: true }}
              transition={reducedMotion ? {} : { duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              className="p-5 sm:p-10"
              style={{
                background: 'rgba(255, 107, 107, 0.1)',
                border: '1px solid rgba(255, 107, 107, 0.2)',
                borderRadius: '20px'
              }}
            >
              <div className="flex items-center gap-3 mb-5 sm:mb-8">
                <X className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#ff6b6b' }} aria-hidden="true" />
                <h3 className="text-xl sm:text-2xl" style={{ fontWeight: 500, color: 'rgba(255, 107, 107, 0.8)' }}>Antes</h3>
              </div>
              <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base" style={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 300 }}>
                {[
                  "Artes perdidas no WhatsApp",
                  "Feedback fragmentado",
                  "Cliente responde só parte",
                  "Retrabalho constante",
                  "Sem histórico de versões",
                  "Stress e deadlines perdidos"
                ].map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span style={{ color: '#ff6b6b' }} className="flex-shrink-0" aria-hidden="true">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* After */}
            <motion.div
              {...fadeInRight}
              viewport={{ once: true }}
              transition={reducedMotion ? {} : { duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              className="p-5 sm:p-10"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="flex items-center gap-3 mb-5 sm:mb-8">
                <Check className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#4CAF50' }} aria-hidden="true" />
                <h3 className="text-xl sm:text-2xl" style={{ fontWeight: 500, color: '#ffffff' }}>Depois</h3>
              </div>
              <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base" style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 300 }}>
                {[
                  "Tudo centralizado em um link",
                  "Feedback organizado por arte",
                  "Cliente aprova cada uma",
                  "Contexto em cada ajuste",
                  "Histórico de versões",
                  "Paz e entregas no prazo"
                ].map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" style={{ color: '#4CAF50' }} aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="preco" className="py-16 sm:py-32 px-4 sm:px-6 scroll-mt-20 sm:scroll-mt-24" style={{ background: '#1a1a1a' }}>
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-2xl sm:text-4xl md:text-5xl text-center mb-4 sm:mb-6"
            style={{ fontWeight: 300, letterSpacing: '-0.5px', textWrap: 'balance' }}
          >
            Preço <span style={{ fontWeight: 600 }}>simples</span>
          </h2>
          <p
            className="text-base sm:text-xl text-center mb-10 sm:mb-16 max-w-2xl mx-auto px-2"
            style={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 300 }}
          >
            Sem pegadinhas. Sem limites escondidos. Um preço, tudo incluso.
          </p>

          <motion.div
            {...fadeInUpView}
            viewport={{ once: true }}
            transition={reducedMotion ? {} : { duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-sm sm:max-w-md mx-auto p-6 sm:p-10"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="text-center mb-6 sm:mb-8">
              <span
                className="inline-block px-4 py-1.5 mb-4 text-xs sm:text-sm font-medium"
                style={{
                  background: 'rgba(76, 175, 80, 0.2)',
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                  borderRadius: '20px',
                  color: '#4CAF50'
                }}
              >
                30 dias grátis
              </span>
              <h3 className="text-xl sm:text-2xl mb-2" style={{ fontWeight: 500 }}>Plano Pro</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl sm:text-5xl" style={{ fontWeight: 600 }}>R$ 99</span>
                <span className="text-sm sm:text-base" style={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 300 }}>/mês</span>
              </div>
            </div>

            <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
              {[
                'Lotes ilimitados',
                'Criativos ilimitados',
                'Clientes ilimitados',
                'Notificações Slack',
                'Histórico completo',
                'Suporte prioritário'
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm sm:text-base">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color: '#4CAF50' }} aria-hidden="true" />
                  <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 300 }}>{feature}</span>
                </li>
              ))}
            </ul>

            <a
              href="/signup"
              className="block w-full py-4 text-center font-semibold text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:scale-[0.98]"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '14px',
                color: '#ffffff',
                minHeight: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              Começar trial grátis
            </a>

            <p className="text-center mt-4 text-xs sm:text-sm" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
              Sem cartão de crédito pra testar
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-32 px-4 sm:px-6" style={{ background: '#2d2d2d' }}>
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-2xl sm:text-4xl md:text-5xl text-center mb-10 sm:mb-20"
            style={{ fontWeight: 300, letterSpacing: '-0.5px', textWrap: 'balance' }}
          >
            Perguntas <span style={{ fontWeight: 600 }}>frequentes</span>
          </h2>

          <div className="space-y-3 sm:space-y-6">
            {[
              {
                q: "O cliente precisa criar conta?",
                a: "Não. O cliente só clica no link e já consegue aprovar/reprovar. Zero fricção."
              },
              {
                q: "Funciona no celular?",
                a: "Sim. A interface do cliente é mobile-first, pensada pra aprovar com swipe tipo Tinder."
              },
              {
                q: "Posso ter quantos ciclos de ajuste?",
                a: "Infinitos. Cada ajuste vira uma nova versão no mesmo link."
              },
              {
                q: "E se o cliente quiser mudar feedback?",
                a: "Ele vê o histórico de versões e pode reavaliar. Tudo fica registrado."
              },
              {
                q: "Preciso de cartão pra testar?",
                a: "Não. Trial gratuito sem cartão. Testa com seus clientes reais."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                {...fadeInUpView}
                viewport={{ once: true }}
                transition={reducedMotion ? {} : { duration: 0.5, delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
                className="p-5 sm:p-8"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
                }}
              >
                <h3 className="text-base sm:text-xl mb-2 sm:mb-3" style={{ fontWeight: 500 }}>{faq.q}</h3>
                <p className="text-sm sm:text-base" style={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 300, lineHeight: 1.6 }}>
                  {faq.a}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id="cta" className="py-16 sm:py-32 px-4 sm:px-6 scroll-mt-16 sm:scroll-mt-20" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            {...fadeInUpView}
            viewport={{ once: true }}
            transition={reducedMotion ? {} : { duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            <h2
              className="text-2xl sm:text-4xl md:text-6xl mb-4 sm:mb-6"
              style={{ fontWeight: 300, letterSpacing: '-0.5px', textWrap: 'balance' }}
            >
              Chega de <span style={{ fontWeight: 600 }}>caos no WhatsApp</span>
            </h2>
            <p
              className="text-base sm:text-xl md:text-2xl mb-8 sm:mb-12 max-w-2xl mx-auto px-2"
              style={{ fontWeight: 300, color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.5 }}
            >
              Comece a aprovar artes de forma profissional hoje.
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              <span style={{ color: '#ffffff', fontWeight: 400 }}>Trial gratuito. Sem cartão.</span>
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:gap-4 max-w-md mx-auto mb-6 sm:mb-8 px-2">
              <label htmlFor="footer-email" className="sr-only">Seu email</label>
              <input
                id="footer-email"
                type="email"
                name="email"
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com…"
                required
                className="flex-1 px-5 py-4 text-white text-base focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  fontSize: '16px',
                  outline: 'none',
                  minHeight: '52px',
                  transition: 'background 0.2s ease, border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              />
              <button
                type="submit"
                className="px-6 sm:px-8 py-4 font-semibold flex items-center justify-center gap-2 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] active:scale-[0.98]"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '14px',
                  color: '#ffffff',
                  fontSize: '16px',
                  cursor: 'pointer',
                  outline: 'none',
                  minHeight: '52px',
                  transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                Começar agora
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" style={{ color: '#4CAF50' }} aria-hidden="true" />
                <span>Trial gratuito</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" style={{ color: '#4CAF50' }} aria-hidden="true" />
                <span>Sem cartão</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" style={{ color: '#4CAF50' }} aria-hidden="true" />
                <span>Cancele quando quiser</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-8 sm:py-12 px-4 sm:px-6 pb-24 sm:pb-12"
        style={{
          background: '#1a1a1a',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs sm:text-sm" style={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 300 }}>
            © 2026 AdReviewOS. Feito para quem está cansado do caos.
          </p>
          <p className="mt-3 text-xs sm:text-sm" style={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 300 }}>
            <a href="/termos" className="hover:text-white transition-colors">Termos de Uso</a>
            <span className="mx-2">·</span>
            <a href="/privacidade" className="hover:text-white transition-colors">Política de Privacidade</a>
            <span className="mx-2">·</span>
            <a href="mailto:contato@adreviewos.com" className="hover:text-white transition-colors">contato@adreviewos.com</a>
          </p>
        </div>
      </footer>

      {/* Mobile Sticky CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 sm:hidden p-3"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <a
          href="/signup"
          className="flex items-center justify-center gap-2 w-full py-4 font-semibold text-base rounded-xl active:scale-[0.98]"
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            minHeight: '52px',
            transition: 'transform 0.15s ease'
          }}
        >
          Começar grátis
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
