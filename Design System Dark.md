# Design System - Dark Glassmorphism

Este documento define o design system a ser seguido neste projeto. Todas as decisões de UI/UX devem aderir a estas especificações.

---

## 1. Cores

### Background
```css
--color-bg-primary: #1a1a1a;
--color-bg-secondary: #2d2d2d;
--color-bg-gradient: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
```

### Glassmorphism
```css
--glass-bg: rgba(255, 255, 255, 0.05);
--glass-bg-hover: rgba(255, 255, 255, 0.08);
--glass-bg-active: rgba(255, 255, 255, 0.12);
--glass-border: rgba(255, 255, 255, 0.1);
--glass-border-hover: rgba(255, 255, 255, 0.2);
--glass-border-active: rgba(255, 255, 255, 0.3);
```

### Texto (hierarquia por opacidade)
```css
--text-primary: #ffffff;
--text-secondary: rgba(255, 255, 255, 0.7);
--text-tertiary: rgba(255, 255, 255, 0.5);
--text-muted: rgba(255, 255, 255, 0.4);
--text-disabled: rgba(255, 255, 255, 0.3);
--text-placeholder: rgba(255, 255, 255, 0.3);
```

### Status/Semânticas
```css
--color-success: #4CAF50;
--color-success-bg: rgba(76, 175, 80, 0.2);
--color-error: #ff6b6b;
--color-error-bg: rgba(255, 107, 107, 0.1);
--color-warning: #ffb347;
--color-info: rgba(100, 200, 255, 0.8);
```

### Overlay
```css
--overlay-light: rgba(0, 0, 0, 0.5);
--overlay-medium: rgba(0, 0, 0, 0.7);
--overlay-dark: rgba(0, 0, 0, 0.8);
```

---

## 2. Tipografia

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Font Sizes
```css
--text-xs: 10px;
--text-sm: 12px;
--text-base: 14px;
--text-md: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 32px;
--text-4xl: 48px;
--text-5xl: 72px;
```

### Font Weights
```css
--font-thin: 200;
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

### Line Heights
```css
--leading-tight: 1.1;    /* headings grandes */
--leading-snug: 1.25;    /* headings */
--leading-normal: 1.5;   /* body text */
--leading-relaxed: 1.6;  /* texto longo */
```

### Letter Spacing
```css
--tracking-tight: -0.5px;   /* headings grandes */
--tracking-normal: 0;       /* body */
--tracking-wide: 0.5px;     /* labels */
--tracking-wider: 2px;      /* uppercase labels */
--tracking-widest: 3px;     /* badges */
```

### Text Rendering (aplicar no body)
```css
font-synthesis: none;
text-rendering: optimizeLegibility;
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

---

## 3. Espaçamento

### Scale
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
```

### Padding de Componentes
```css
/* Botões */
--btn-padding-sm: 8px 12px;
--btn-padding-md: 14px 24px;
--btn-padding-lg: 18px 40px;

/* Inputs */
--input-padding: 14px 20px;

/* Cards */
--card-padding-sm: 20px;
--card-padding-md: 24px 30px;
--card-padding-lg: 32px 40px;
--card-padding-xl: 50px 40px;
```

---

## 4. Border Radius

```css
--radius-xs: 4px;
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 20px;
--radius-2xl: 24px;
--radius-3xl: 32px;
--radius-full: 50%;
```

### Uso Recomendado
| Elemento | Radius |
|----------|--------|
| Badges, chips | 12px |
| Botões pequenos | 12px |
| Botões médios/grandes | 16px |
| Inputs | 14-16px |
| Cards pequenos | 16-20px |
| Cards médios | 24px |
| Cards principais | 32px |
| Modais | 32px |
| Circular | 50% |

---

## 5. Sombras

```css
/* Sutis */
--shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.2);

/* Padrão (cards) */
--shadow-md: 0 8px 32px rgba(0, 0, 0, 0.37);

/* Elevada (hover) */
--shadow-lg: 0 12px 40px rgba(0, 0, 0, 0.5);

/* Extra elevada (modais) */
--shadow-xl: 0 20px 60px rgba(0, 0, 0, 0.5);

/* Botões hover */
--shadow-btn: 0 8px 16px rgba(0, 0, 0, 0.3);

/* Glow (elementos destacados) */
--shadow-glow: 0 0 12px rgba(255, 255, 255, 0.3);

/* Inset (borda interna de luz) */
--shadow-inset: inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
--shadow-inset-hover: inset 0 1px 0 0 rgba(255, 255, 255, 0.15);
```

### Combinação Padrão para Cards Glass
```css
box-shadow:
  0 8px 32px rgba(0, 0, 0, 0.37),
  inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
```

---

## 6. Transições

### Timing Function Padrão
```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Durações
```css
--duration-fast: 0.15s;
--duration-normal: 0.2s;
--duration-slow: 0.3s;
--duration-slower: 0.4s;
```

### Transições Prontas
```css
--transition-fast: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
--transition-normal: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 7. Z-Index Scale

```css
--z-base: 0;
--z-dropdown: 10;
--z-sticky: 100;
--z-fixed: 500;
--z-modal-backdrop: 900;
--z-modal: 1000;
--z-tooltip: 1100;
--z-toast: 1200;
```

---

## 8. Breakpoints

```css
/* Mobile first approach */
--breakpoint-sm: 480px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
```

### Media Queries
```css
@media (max-width: 768px) { /* Tablet e menor */ }
@media (max-width: 480px) { /* Mobile */ }
@media (hover: none) and (pointer: coarse) { /* Touch devices */ }
```

---

## 9. Componentes Base

### Glass Card
```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 32px;
  padding: 32px 40px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.37),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-card:hover {
  transform: translateY(-5px);
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.15);
}
```

### Button Primary
```css
.btn-primary {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 14px 24px;
  color: #ffffff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
  background: rgba(255, 255, 255, 0.25);
}
```

### Button Secondary
```css
.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 14px 24px;
  color: rgba(255, 255, 255, 0.7);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}
```

### Icon Button
```css
.btn-icon {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}
```

### Input
```css
.input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 14px 20px;
  color: #ffffff;
  font-family: inherit;
  font-size: 14px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}
```

### Textarea
```css
.textarea {
  width: 100%;
  min-height: 120px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 14px 20px;
  color: #ffffff;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.textarea:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}
```

### Label
```css
.label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
}
```

### Badge/Chip
```css
.badge {
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
}
```

### Divider
```css
.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 24px 0;
}
```

### Modal Overlay
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 32px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 10. Animações

### Keyframes
```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide Up (modais, toasts) */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Slide Down (dropdowns) */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Float (elementos decorativos) */
@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}

/* Pulse (loading, destaque) */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Shake (erro) */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

/* Success Pop */
@keyframes successPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
```

### Transforms de Interação
```css
/* Hover lift */
transform: translateY(-2px);  /* sutil */
transform: translateY(-5px);  /* pronunciado */

/* Hover scale */
transform: scale(1.05);  /* botões */
transform: scale(1.1);   /* ícones */

/* Active press */
transform: translateY(0);
transform: scale(0.98);
```

---

## 11. Responsividade

### Ajustes Mobile (≤480px)
```css
/* Padding reduzido */
--card-padding: 20px 16px;
--btn-padding: 12px 20px;

/* Fontes menores */
--text-heading: 32px;  /* de 48px */
--text-subheading: 18px;  /* de 24px */

/* Botões full-width */
.btn { width: 100%; }

/* Gaps reduzidos */
gap: 16px;  /* de 24px */
```

### Ajustes Tablet (≤768px)
```css
/* Padding intermediário */
--card-padding: 24px 20px;

/* Layout single-column quando necessário */
grid-template-columns: 1fr;
flex-direction: column;
```

### Touch Devices
```css
@media (hover: none) and (pointer: coarse) {
  /* Remover hover transforms */
  .element:hover {
    transform: none;
  }

  /* Touch feedback */
  -webkit-tap-highlight-color: transparent;
}
```

---

## 12. CSS Reset Recomendado

```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-text-size-adjust: 100%;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #1a1a1a;
  color: rgba(255, 255, 255, 0.87);
  line-height: 1.5;
  min-height: 100vh;
}

button {
  font-family: inherit;
  cursor: pointer;
}

input, textarea, select {
  font-family: inherit;
}

a {
  color: inherit;
  text-decoration: none;
}

img {
  max-width: 100%;
  display: block;
}
```

---

## 13. Princípios de Design

1. **Consistência**: Todos os elementos seguem o mesmo padrão glassmorphism
2. **Hierarquia**: Usar opacidade para criar níveis de importância visual
3. **Movimento**: Transições suaves com `cubic-bezier(0.4, 0, 0.2, 1)`
4. **Minimalismo**: Cores limitadas, foco em branco sobre fundo escuro
5. **Acessibilidade**: Contraste suficiente, áreas de toque adequadas (min 44px)
6. **Responsividade**: Mobile-first, breakpoints em 480px e 768px

---

## Checklist de Implementação

- [ ] Importar fonte Inter do Google Fonts
- [ ] Aplicar CSS reset
- [ ] Definir variáveis CSS no `:root`
- [ ] Criar classes base de componentes
- [ ] Implementar animações keyframe
- [ ] Testar em diferentes breakpoints
- [ ] Verificar suporte a `backdrop-filter` (fallback se necessário)
