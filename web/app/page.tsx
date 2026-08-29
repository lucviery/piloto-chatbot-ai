import { Chat } from '../components/chat';

export default function Home() {
  return (
    <main className="shell">
      <section className="intro" aria-labelledby="page-title">
        <div className="brand-mark" aria-hidden="true">M</div>
        <p className="eyebrow">Piloto interno · IA local</p>
        <h1 id="page-title">Como posso ajudar?</h1>
        <p className="intro-copy">
          Converse com o assistente da Megauê. Nesta etapa, as respostas são produzidas localmente e podem levar alguns instantes.
        </p>
        <div className="privacy-note">
          <span className="status-dot" aria-hidden="true" />
          Modelo executado no ambiente do piloto
        </div>
      </section>
      <Chat />
    </main>
  );
}

