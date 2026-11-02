import { Link } from 'react-router-dom';
import { LegalLayout } from './LegalLayout';
import { LEGAL } from '../../lib/legal';

export function TermsPage() {
  return (
    <LegalLayout title="Termos de Uso">
      <p>
        Estes Termos de Uso regulam o acesso e a utilização do <strong>{LEGAL.product}</strong>, plataforma
        de aprovação de criativos operada por <strong>{LEGAL.company}</strong> ("nós"). Ao criar uma conta ou
        utilizar o serviço, você ("usuário") concorda integralmente com estes Termos e com a nossa{' '}
        <Link to="/privacidade">Política de Privacidade</Link>.
      </p>

      <h2>1. O serviço</h2>
      <p>
        O {LEGAL.product} permite que equipes de marketing organizem criativos em lotes, gerem links únicos de
        aprovação para seus clientes e acompanhem aprovações, reprovações, feedbacks e revisões em um painel
        centralizado. Os clientes finais acessam o link sem precisar de cadastro.
      </p>

      <h2>2. Conta e responsabilidades</h2>
      <ul>
        <li>Você deve ter 18 anos ou mais e fornecer informações verdadeiras no cadastro.</li>
        <li>Você é responsável por manter a confidencialidade da sua senha e por toda atividade realizada na sua conta.</li>
        <li>Os links de aprovação dão acesso aos criativos do lote a qualquer pessoa que os possua. Compartilhe-os apenas com quem deve avaliar o material.</li>
        <li>Contas podem ser criadas com e-mail e senha ou com login do Google.</li>
      </ul>

      <h2>3. Período de teste, planos e pagamento</h2>
      <ul>
        <li>Novas contas recebem um período de teste gratuito, sem cartão de crédito, com a duração informada no momento do cadastro.</li>
        <li>Ao fim do teste, o uso do painel exige a contratação de um plano pago, cobrado mensalmente e processado pela Stripe. Não armazenamos dados de cartão.</li>
        <li>A assinatura é renovada automaticamente a cada período. Você pode cancelar a qualquer momento pelo portal de faturamento; o acesso permanece até o fim do período já pago e não há reembolso proporcional, salvo quando exigido por lei.</li>
        <li>Podemos alterar preços mediante aviso prévio de pelo menos 30 dias por e-mail. A alteração vale a partir da renovação seguinte.</li>
        <li>Pagamentos recusados podem resultar na suspensão do acesso até a regularização.</li>
      </ul>

      <h2>4. Conteúdo do usuário</h2>
      <ul>
        <li>Os criativos, textos e feedbacks enviados à plataforma continuam sendo de propriedade do usuário ou de seus clientes. Você nos concede apenas a licença necessária para armazenar, processar e exibir esse conteúdo para prestar o serviço.</li>
        <li>Você declara ter os direitos necessários sobre todo conteúdo enviado e que ele não viola direitos de terceiros nem a legislação aplicável.</li>
        <li>Podemos remover conteúdo ilegal, ofensivo ou que viole estes Termos, e suspender contas envolvidas em abuso, spam, tentativas de acesso não autorizado ou uso que prejudique a plataforma.</li>
      </ul>

      <h2>5. Disponibilidade e suporte</h2>
      <p>
        Trabalhamos para manter o serviço disponível de forma contínua, mas ele é fornecido "no estado em que se
        encontra". Podem ocorrer interrupções para manutenção, atualizações ou por fatores fora do nosso controle.
        Recomendamos manter cópias dos seus arquivos originais. O suporte é feito por e-mail em{' '}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
      </p>

      <h2>6. Limitação de responsabilidade</h2>
      <p>
        Na máxima extensão permitida pela lei, não respondemos por lucros cessantes, perda de dados ou danos
        indiretos decorrentes do uso ou da impossibilidade de uso do serviço. Nossa responsabilidade total, em
        qualquer hipótese, limita-se ao valor pago por você nos 12 meses anteriores ao evento.
      </p>

      <h2>7. Encerramento</h2>
      <p>
        Você pode encerrar sua conta a qualquer momento solicitando pelo e-mail de suporte. Podemos encerrar ou
        suspender contas que violem estes Termos. Após o encerramento, os dados são excluídos conforme a Política
        de Privacidade.
      </p>

      <h2>8. Alterações destes Termos</h2>
      <p>
        Podemos atualizar estes Termos. Mudanças relevantes serão comunicadas por e-mail ou aviso na plataforma com
        antecedência razoável. O uso continuado após a vigência das alterações significa concordância.
      </p>

      <h2>9. Legislação e foro</h2>
      <p>
        Estes Termos são regidos pelas leis do {LEGAL.jurisdiction}. Fica eleito o foro do domicílio do usuário
        consumidor ou, nos demais casos, o foro da sede de {LEGAL.company}, para dirimir eventuais controvérsias.
      </p>

      <h2>10. Contato</h2>
      <p>
        Dúvidas sobre estes Termos: <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
      </p>
    </LegalLayout>
  );
}
