import { Link } from 'react-router-dom';
import { LegalLayout } from './LegalLayout';
import { LEGAL } from '../../lib/legal';

export function PrivacyPage() {
  return (
    <LegalLayout title="Política de Privacidade">
      <p>
        Esta Política explica como o <strong>{LEGAL.product}</strong>, operado por{' '}
        <strong>{LEGAL.company}</strong>, trata dados pessoais, em conformidade com a Lei Geral de Proteção de
        Dados (Lei 13.709/2018, "LGPD"). Ela complementa os <Link to="/termos">Termos de Uso</Link>.
      </p>

      <h2>1. Quem somos e como falar conosco</h2>
      <p>
        {LEGAL.company} é a controladora dos dados das contas da plataforma. Para exercer seus direitos ou tirar
        dúvidas, escreva para <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
      </p>

      <h2>2. Dados que coletamos</h2>
      <ul>
        <li><strong>Cadastro:</strong> nome, e-mail e senha (armazenada apenas como hash). No login com Google, recebemos nome, e-mail e o identificador da conta Google.</li>
        <li><strong>Uso da plataforma:</strong> clientes cadastrados, lotes, criativos enviados, aprovações, reprovações, feedbacks e o histórico de atividades, com data e hora.</li>
        <li><strong>Pagamento:</strong> a cobrança é processada pela Stripe. Guardamos apenas o identificador do cliente e o status da assinatura. Dados de cartão nunca passam pelos nossos servidores.</li>
        <li><strong>Dados técnicos:</strong> endereço IP e dados de navegação necessários para segurança, limitação de requisições e diagnóstico de erros.</li>
        <li><strong>Pessoas que avaliam criativos pelo link:</strong> registramos as decisões e os feedbacks escritos, sem exigir cadastro. O responsável por esse conteúdo é o usuário que gerou o link.</li>
      </ul>

      <h2>3. Para que usamos os dados</h2>
      <ul>
        <li>Prestar o serviço: autenticar, armazenar criativos, registrar aprovações e manter o histórico (execução de contrato).</li>
        <li>Enviar e-mails transacionais: confirmação de conta, redefinição de senha, avisos de cobrança e de fim do período de teste (execução de contrato e legítimo interesse).</li>
        <li>Cobrar assinaturas e cumprir obrigações fiscais (execução de contrato e obrigação legal).</li>
        <li>Garantir segurança, prevenir fraudes e abuso, e corrigir erros (legítimo interesse).</li>
        <li>Não vendemos dados pessoais nem usamos seu conteúdo para publicidade de terceiros.</li>
      </ul>

      <h2>4. Com quem compartilhamos</h2>
      <p>Usamos operadores que tratam dados em nosso nome, somente para as finalidades acima:</p>
      <ul>
        <li><strong>Stripe</strong> (pagamentos), <strong>Resend</strong> (envio de e-mails), <strong>Google</strong> (login social, quando você opta por ele).</li>
        <li>Provedores de hospedagem e armazenamento de arquivos, como Railway, Vercel e Cloudinary, que podem manter dados em servidores fora do Brasil, com salvaguardas contratuais adequadas.</li>
        <li>Ferramentas de monitoramento de erros, quando ativadas, recebem apenas dados técnicos do erro.</li>
        <li>Autoridades, quando houver obrigação legal ou ordem judicial.</li>
      </ul>

      <h2>5. Cookies e armazenamento local</h2>
      <p>
        O painel guarda no navegador apenas o necessário para manter você conectado (token de sessão e dados
        básicos do perfil). A página pública de aprovação não usa cookies de rastreamento. Não utilizamos cookies
        de publicidade.
      </p>

      <h2>6. Retenção</h2>
      <ul>
        <li>Dados da conta e conteúdo: enquanto a conta existir. Após o encerramento, excluímos ou anonimizamos em até 90 dias, salvo retenção exigida por lei (por exemplo, registros fiscais).</li>
        <li>Tokens de confirmação e redefinição de senha expiram automaticamente e são descartados após o uso.</li>
        <li>Registros técnicos de segurança são mantidos por período limitado.</li>
      </ul>

      <h2>7. Seus direitos (art. 18 da LGPD)</h2>
      <p>
        Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade, exclusão,
        informação sobre compartilhamentos e revogação de consentimento. Basta escrever para{' '}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>. Respondemos no prazo legal.
      </p>

      <h2>8. Segurança</h2>
      <p>
        Adotamos medidas técnicas e organizacionais proporcionais ao risco: criptografia em trânsito (HTTPS),
        senhas armazenadas com hash, controle de acesso por conta, limitação de requisições e registro de
        atividades. Nenhum sistema é totalmente seguro; em caso de incidente relevante, comunicaremos os afetados e
        a ANPD conforme a lei.
      </p>

      <h2>9. Crianças e adolescentes</h2>
      <p>O serviço é destinado a profissionais e empresas e não é dirigido a menores de 18 anos.</p>

      <h2>10. Alterações</h2>
      <p>
        Esta Política pode ser atualizada. Mudanças relevantes serão comunicadas por e-mail ou aviso na plataforma.
        A data da última atualização aparece no topo desta página.
      </p>
    </LegalLayout>
  );
}
