import { useEffect, useRef, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import ImmersiveTour from './ImmersiveTour.jsx';
import { IM } from './data/media.js';
import './styles.css';

const gallery = [
  { image: IM.exterior, title: 'A casa junto à piscina', className: 'gallery-tall' },
  { image: IM.livingRoom, title: 'Sala de estar' },
  { image: IM.pool, title: 'Piscina exterior', className: 'gallery-wide' },
  { image: IM.kitchenCounter, title: 'Cozinha' },
  { image: IM.mainBedroom, title: 'Quarto principal', className: 'gallery-tall' },
  { image: IM.garden, title: 'Jardim' },
  { image: IM.bathroom, title: 'Casa de banho' },
  { image: IM.terrace, title: 'Terraço' },
];

const amenities = [
  ['pool', 'Piscina exterior', 'Um espaço ao ar livre para os dias de sol.'],
  ['kitchen', 'Cozinha', 'Um espaço funcional para preparar refeições.'],
  ['bed', 'Quartos confortáveis', 'Espaços pensados para descansar.'],
  ['bath', 'Casa de banho', 'Comodidade e simplicidade durante a estadia.'],
  ['leaf', 'Espaços exteriores', 'Jardim e áreas para aproveitar a natureza.'],
  ['sofa', 'Sala de estar', 'Um ponto de encontro para partilhar bons momentos.'],
];

const experiences = [
  { image: IM.gardenPath, title: 'Natureza', text: 'Desacelere entre espaços verdes e paisagens tranquilas.' },
  { image: IM.waterfall, title: 'Ar livre', text: 'Descubra caminhos e recantos naturais na região.' },
  { image: IM.readingRoom, title: 'Tempo em família', text: 'Aproveite a casa, a piscina e os momentos sem pressa.' },
];

function BrandMark() {
  return (
    <svg viewBox="0 0 42 42" fill="none" aria-hidden="true">
      <text x="21" y="28" textAnchor="middle" fill="currentColor" fontFamily="Georgia, serif" fontSize="21" fontStyle="italic" letterSpacing="-3">CG</text>
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13 7c0 3.2-5 7-5 7S3 10.2 3 7a5 5 0 1 1 10 0Z" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="7" r="1.8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function FeatureIcon({ name }) {
  const paths = {
    pool: <><path d="M3 12c1.2 0 1.2 1 2.4 1s1.2-1 2.4-1 1.2 1 2.4 1 1.2-1 2.4-1 1.2 1 2.4 1" /><path d="M5 10V4.5a1.5 1.5 0 0 1 3 0V10m0-4h3.5a1.5 1.5 0 0 1 0 3H8" /></>,
    kitchen: <><path d="M3 7h10l-1 7H4L3 7Z" /><path d="M5 7V4m3 3V3m3 4V4M2 14h12" /></>,
    bed: <><path d="M2 12V6m0 5h12v3M2 9h4a2 2 0 0 1 2 2m0-2h4a2 2 0 0 1 2 2" /></>,
    bath: <><path d="M3 8V5a2 2 0 0 1 4 0v1m-5 2h12v2a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8Zm3 6v1m6-1v1" /></>,
    leaf: <><path d="M13.5 2.5C7 2.5 3 5.3 3 9.5A3.5 3.5 0 0 0 6.5 13c4.2 0 7-4 7-10.5Z" /><path d="M2 14c2-3 4-4.5 7-6" /></>,
    sofa: <><path d="M3 9V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2a2 2 0 0 1 2 2v3H1v-3a2 2 0 0 1 2-2Zm0 0h10M3 14v1m10-1v1" /></>,
  };
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2">
        {paths[name]}
      </g>
    </svg>
  );
}

export default function App() {
  const tourRef = useRef(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const touchStartRef = useRef(null);

  useEffect(() => {
    if (selectedPhoto === null) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function handleKeyDown(event) {
      if (event.key === 'Escape') setSelectedPhoto(null);
      if (event.key === 'ArrowRight') setSelectedPhoto((index) => (index + 1) % gallery.length);
      if (event.key === 'ArrowLeft') setSelectedPhoto((index) => (index - 1 + gallery.length) % gallery.length);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedPhoto]);

  function handleFeatureClick(event, sceneId) {
    event.preventDefault();
    document.getElementById('stage')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
    window.dispatchEvent(new CustomEvent('guimbras:tour', { detail: sceneId }));
  }

  function handleStartTour(event) {
    event.preventDefault();
    tourRef.current?.cancelWalk();
    tourRef.current?.showHint();
    tourRef.current?.scrollToStage('slow');
    window.setTimeout(() => {
      void tourRef.current?.enterFullscreen();
    }, 1250);
  }

  function handleSectionLink(event, sectionId) {
    event.preventDefault();
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'center',
    });
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: 'Casas das Guimbras',
    description: 'Alojamento local com piscina, espaços interiores acolhedores e envolvente natural.',
    image: gallery.map(({ image }) => new URL(image.src, window.location.href).href),
    amenityFeature: amenities.map(([name]) => ({ '@type': 'LocationFeatureSpecification', name })),
  };

  return (
    <>
      <main className="site">
        <section className="landing-hero" id="inicio">
          <div className="landing-backdrop" style={{ backgroundImage: `url("${IM.pool.preview}")` }} aria-hidden="true" />
          <img className="landing-image" src={IM.pool.preview} srcSet={IM.pool.srcSet} sizes="100vw" alt="" aria-hidden="true" fetchPriority="high" />
          <div className="landing-shade" aria-hidden="true" />
          <header className="site-header">
            <a className="site-brand" href="#inicio" aria-label="Casas das Guimbras, início">
              <span className="brand-mark" aria-hidden="true"><BrandMark /></span>
              <span className="brand-copy">
                <b>Casas das Guimbras</b>
                <small>Um lugar para abrandar</small>
              </span>
            </a>
            <nav className="site-nav" aria-label="Navegação principal">
              <a href="#casa" onClick={(event) => handleSectionLink(event, 'casa')}>A casa</a>
              <a href="#galeria" onClick={(event) => handleSectionLink(event, 'galeria')}>Galeria</a>
              <a className="site-nav-cta" href="#reservas" onClick={(event) => handleSectionLink(event, 'reservas')}>Agendar <ArrowIcon /></a>
            </nav>
          </header>
          <div className="hero-content">
            <span className="hero-kicker">Casas das Guimbras · Portugal</span>
            <h1>O tempo abranda.<br />A natureza aproxima.</h1>
            <p>Uma casa para descansar, partilhar e aproveitar os dias com espaço para respirar.</p>
            <div className="hero-actions">
              <a className="hero-cta" href="#stage" onClick={handleStartTour}>Tour Virtual <span aria-hidden="true">↓</span></a>
              <a className="hero-secondary" href="https://www.google.com/maps/search/?api=1&query=Casas+das+Guimbras%2C+Portugal" target="_blank" rel="noopener noreferrer">
                <span className="hero-location-icon"><LocationIcon /></span>
                <span className="hero-location-copy"><small>Localização</small><strong>Onde estamos</strong></span>
                <span className="hero-location-arrow" aria-hidden="true"><ArrowIcon /></span>
              </a>
            </div>
          </div>
          <div className="hero-location"><strong>Casas das Guimbras</strong><span>Um refúgio em Portugal</span></div>
        </section>

        <section className="experience" id="casa">
          <div className="experience-inner">
            <div className="experience-head">
              <div>
                <span className="section-kicker">A casa</span>
                <h2>Um refúgio<br />feito para ficar.</h2>
              </div>
              <p className="experience-intro">
                Entre espaços acolhedores e uma envolvente verde, as Casas das Guimbras convidam
                a trocar a pressa por dias tranquilos, refeições partilhadas e tempo ao ar livre.
              </p>
            </div>
            <div className="feature-grid" id="espacos">
              {[
                { scene: 'sala', image: IM.livingRoom, title: 'Conforto por dentro', text: 'Espaços interiores para descansar e estar em boa companhia.' },
                { scene: 'cozinha', image: IM.kitchenCounter, title: 'À volta da mesa', text: 'Uma cozinha para preparar e partilhar as suas refeições.' },
                { scene: 'piscina', image: IM.pool, title: 'Dias ao ar livre', text: 'Piscina e espaços exteriores para aproveitar o sol.' },
              ].map((feature) => (
                <a className="feature-card" href="#tour" key={feature.title} onClick={(event) => handleFeatureClick(event, feature.scene)}>
                  <img src={feature.image.preview} loading="lazy" decoding="async" alt={feature.title} />
                  <span className="feature-copy"><strong>{feature.title}</strong><span>{feature.text}</span></span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="gallery-section" id="galeria" aria-labelledby="gallery-title">
          <div className="section-heading">
            <div><span className="section-kicker">Galeria</span><h2 id="gallery-title">Conheça cada detalhe.</h2></div>
            <p>Uma primeira visita aos espaços e à paisagem das Casas das Guimbras.</p>
          </div>
          <div className="gallery-grid">
            {gallery.map(({ image, title, className = '' }, index) => (
              <button
                className={`gallery-item ${className}`}
                key={title}
                type="button"
                onClick={() => setSelectedPhoto(index)}
                aria-label={`Ampliar fotografia: ${title}`}
              >
                <img src={image.preview} alt={title} loading="lazy" decoding="async" />
                <span>{title}</span>
              </button>
            ))}
          </div>
        </section>

        <ImmersiveTour ref={tourRef} />

        <section className="amenities-section" id="comodidades">
          <div className="section-heading">
            <div><span className="section-kicker">Comodidades</span><h2>O essencial para<br />se sentir em casa.</h2></div>
            <p>Espaços e detalhes que fazem parte da experiência das Casas das Guimbras.</p>
          </div>
          <div className="amenity-grid">
            {amenities.map(([icon, title, text]) => (
              <article className="amenity-card" key={title}>
                <span className="amenity-icon"><FeatureIcon name={icon} /></span>
                <h3>{title}</h3><p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="experiences-section" id="experiencias">
          <div className="section-heading">
            <div><span className="section-kicker">À sua maneira</span><h2>Mais do que uma estadia.</h2></div>
            <p>Faça de cada dia o seu próprio plano: dentro de casa, junto à piscina ou a descobrir a natureza.</p>
          </div>
          <div className="experience-cards">
            {experiences.map((item) => (
              <article className="experience-card" key={item.title}>
                <img src={item.image.preview} alt="" loading="lazy" decoding="async" />
                <div><span className="section-kicker">{item.title}</span><p>{item.text}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="location-section" id="localizacao" aria-labelledby="location-title">
          <div className="location-inner">
            <div className="location-copy">
              <span className="section-kicker">Localização</span>
              <h2 id="location-title">Perto do que importa.</h2>
              <p>Consulte o mapa para procurar Casas das Guimbras e planear a sua chegada. A morada exata deverá ser confirmada antes da viagem.</p>
              <a className="location-cta" href="https://www.google.com/maps/search/?api=1&query=Casas+das+Guimbras%2C+Portugal" target="_blank" rel="noopener noreferrer">
                Abrir no Google Maps <ArrowIcon />
              </a>
            </div>
            <div className="location-map">
              <iframe
                title="Mapa de pesquisa das Casas das Guimbras em Portugal"
                src="https://maps.google.com/maps?hl=pt&q=Casas%20das%20Guimbras%2C%20Portugal&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        <section className="booking-section" id="reservas" aria-labelledby="booking-title">
          <div className="booking-copy">
            <span className="section-kicker">A sua próxima pausa</span>
            <h2 id="booking-title">Reserve a sua<br />próxima estadia.</h2>
            <p>Escolha a plataforma da sua preferência e consulte disponibilidade, datas e condições diretamente no anúncio oficial.</p>
            <a href="#inicio" className="booking-back">Casas das Guimbras <span aria-hidden="true">↗</span></a>
          </div>
          <div className="booking-platforms" aria-label="Plataformas de reserva">
            <a className="booking-platform airbnb" href="https://www.airbnb.com/rooms/12678708" target="_blank" rel="noopener noreferrer">
              <span className="platform-mark">A</span>
              <span className="platform-copy">
                <small>Reservar no</small>
                <strong>Airbnb</strong>
              </span>
              <span className="platform-action">Ver disponibilidade <ArrowIcon /></span>
            </a>
            <a className="booking-platform booking" href="https://www.booking.com/hotel/pt/quinta-das-guimbras.pt-pt.html" target="_blank" rel="noopener noreferrer">
              <span className="platform-mark">B</span>
              <span className="platform-copy">
                <small>Reservar no</small>
                <strong>Booking.com</strong>
              </span>
              <span className="platform-action">Ver disponibilidade <ArrowIcon /></span>
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="footer-brand" href="#inicio">Casas das Guimbras</a>
        <nav aria-label="Navegação do rodapé">
          <a href="#casa" onClick={(event) => handleSectionLink(event, 'casa')}>A casa</a><a href="#reservas" onClick={(event) => handleSectionLink(event, 'reservas')}>Reservas</a>
        </nav>
        <span>© {new Date().getFullYear()} Casas das Guimbras</span>
      </footer>

      {selectedPhoto !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Galeria de fotografias" onClick={() => setSelectedPhoto(null)}>
          <button type="button" className="lightbox-close" onClick={() => setSelectedPhoto(null)} aria-label="Fechar galeria">×</button>
          <button type="button" className="lightbox-arrow previous" aria-label="Fotografia anterior" onClick={(event) => { event.stopPropagation(); setSelectedPhoto((selectedPhoto - 1 + gallery.length) % gallery.length); }}>‹</button>
          <figure
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => { touchStartRef.current = event.touches[0].clientX; }}
            onTouchEnd={(event) => {
              const start = touchStartRef.current;
              if (start === null) return;
              const distance = event.changedTouches[0].clientX - start;
              if (Math.abs(distance) > 48) {
                setSelectedPhoto((selectedPhoto + (distance < 0 ? 1 : -1) + gallery.length) % gallery.length);
              }
              touchStartRef.current = null;
            }}
          >
            <img src={gallery[selectedPhoto].image.src} alt={gallery[selectedPhoto].title} />
            <figcaption>{gallery[selectedPhoto].title} <span>{selectedPhoto + 1} / {gallery.length}</span></figcaption>
          </figure>
          <button type="button" className="lightbox-arrow next" aria-label="Fotografia seguinte" onClick={(event) => { event.stopPropagation(); setSelectedPhoto((selectedPhoto + 1) % gallery.length); }}>›</button>
        </div>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <Analytics />
    </>
  );
}
