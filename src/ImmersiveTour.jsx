import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { IM, TH } from './data/media.js';
import { SCENES } from './data/scenes.js';

const sceneById = Object.fromEntries(SCENES.map((scene) => [scene.id, scene]));
const clamp = (value) => Math.max(-1, Math.min(1, value));
const DEFAULT_ZOOM = 1.16;

function BrandMark() {
  return (
    <svg viewBox="0 0 42 42" fill="none" aria-hidden="true">
      <text x="21" y="28" textAnchor="middle" fill="currentColor" fontFamily="Georgia, serif" fontSize="21" fontStyle="italic" letterSpacing="-3">CG</text>
    </svg>
  );
}

const ImmersiveTour = forwardRef(function ImmersiveTour(_, ref) {
  const stageRef = useRef(null);
  const camRef = useRef(null);
  const worldRef = useRef(null);
  const listButtonRef = useRef(null);
  const sceneRef = useRef(SCENES[0]);
  const pan = useRef({
    tx: 0,
    ty: 0,
    px: 0,
    py: 0,
    ox: 1,
    oy: 1,
    drag: false,
    sx: 0,
    sy: 0,
    x0: 0,
    y0: 0,
    lastFrame: 0,
  });
  const frameRef = useRef(0);
  const walkTokenRef = useRef(0);
  const busyRef = useRef(false);
  const zoomRef = useRef(DEFAULT_ZOOM);
  const timersRef = useRef(new Set());
  const hintTimerRef = useRef(0);
  const [currentId, setCurrentId] = useState(SCENES[0].id);
  const [seen, setSeen] = useState(() => new Set([SCENES[0].id]));
  const [locationOpen, setLocationOpen] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);
  const [cameraClass, setCameraClass] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tourStatus, setTourStatus] = useState('');
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [tourEntered, setTourEntered] = useState(false);

  const schedule = useCallback((callback, delay) => {
    const timer = window.setTimeout(() => {
      timersRef.current.delete(timer);
      callback();
    }, delay);
    timersRef.current.add(timer);
    return timer;
  }, []);

  const draw = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    const state = pan.current;
    world.style.transform = `translate(${-state.ox - state.px * state.ox}px, ${-state.oy - state.py * state.oy}px)`;
  }, []);

  const animateRef = useRef();
  animateRef.current = (now) => {
    frameRef.current = 0;
    const state = pan.current;
    const easing = 1 - Math.exp(-Math.min(now - state.lastFrame, 50) / 560);
    state.lastFrame = now;
    state.px += (state.tx - state.px) * easing;
    state.py += (state.ty - state.py) * easing;
    if (Math.abs(state.tx - state.px) < 0.001) state.px = state.tx;
    if (Math.abs(state.ty - state.py) < 0.001) state.py = state.ty;
    draw();
    if (state.px !== state.tx || state.py !== state.ty) {
      frameRef.current = window.requestAnimationFrame((time) => animateRef.current(time));
    }
  };

  const aim = useCallback((x, y) => {
    const state = pan.current;
    state.tx = x;
    state.ty = y;
    if (!frameRef.current) {
      state.lastFrame = performance.now();
      frameRef.current = window.requestAnimationFrame((time) => animateRef.current(time));
    }
  }, []);

  const layout = useCallback(() => {
    const stage = stageRef.current;
    const world = worldRef.current;
    if (!stage || !world) return;
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const image = IM[sceneRef.current.i];
    if (!width || !height || !image) return;
    const scale = Math.min(width / image.w, height / image.h) * zoomRef.current;
    const worldWidth = image.w * scale;
    const worldHeight = image.h * scale;
    world.style.width = `${worldWidth}px`;
    world.style.height = `${worldHeight}px`;
    pan.current.ox = (worldWidth - width) / 2;
    pan.current.oy = (worldHeight - height) / 2;
    draw();
  }, [draw]);

  const hideHint = useCallback(() => {
    window.clearTimeout(hintTimerRef.current);
    setHintVisible(false);
  }, []);

  const showHint = useCallback(() => {
    window.clearTimeout(hintTimerRef.current);
    setHintVisible(true);
    hintTimerRef.current = window.setTimeout(() => setHintVisible(false), 7000);
  }, []);

  const changeScene = useCallback((scene) => {
    sceneRef.current = scene;
    setCurrentId(scene.id);
    setSeen((previous) => new Set(previous).add(scene.id));
    zoomRef.current = DEFAULT_ZOOM;
    setZoom(DEFAULT_ZOOM);
    pan.current.tx = 0;
    pan.current.ty = 0;
    pan.current.px = 0;
    pan.current.py = 0;
  }, []);

  const walk = useCallback(
    (id, direction = 'f', element = null) => {
      const destination = sceneById[id];
      if (!destination || busyRef.current || id === sceneRef.current.id) return;

      busyRef.current = true;
      const token = ++walkTokenRef.current;
      setLocationOpen(false);
      hideHint();

      const stage = stageRef.current;
      const cam = camRef.current;
      const stageRect = stage?.getBoundingClientRect();
      const originRect = element?.getBoundingClientRect() ?? stageRect;
      if (cam && stageRect && originRect) {
        cam.style.transformOrigin = `${originRect.left + originRect.width / 2 - stageRect.left}px ${originRect.top + originRect.height / 2 - stageRect.top}px`;
      }

      setCameraClass(direction === 'b' ? 'out-b' : 'out-f');
      schedule(() => {
        if (token !== walkTokenRef.current) return;
        if (cam) cam.style.transformOrigin = '50% 50%';
        changeScene(destination);
        setCameraClass(direction === 'b' ? 'pre-b' : 'pre-f');
        window.requestAnimationFrame(() => {
          if (token !== walkTokenRef.current) return;
          if (cam) void cam.offsetWidth;
          setCameraClass('');
        });
        schedule(() => {
          if (token === walkTokenRef.current) busyRef.current = false;
          }, 920);
        }, 900);
    },
    [changeScene, hideHint, schedule],
  );

  const cancelWalk = useCallback(() => {
    walkTokenRef.current += 1;
    busyRef.current = false;
    setCameraClass('');
    if (camRef.current) camRef.current.style.transformOrigin = '50% 50%';
  }, []);

  const scrollToStage = useCallback((behavior = 'smooth') => {
    const stage = stageRef.current;
    if (!stage) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      stage.scrollIntoView({ behavior: 'auto', block: 'start' });
      return;
    }

    if (behavior === 'slow') {
      const startY = window.scrollY;
      const targetY = stage.getBoundingClientRect().top + window.scrollY;
      const distance = targetY - startY;
      const duration = 1450;
      const startTime = performance.now();

      const easeScroll = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        window.scrollTo(0, startY + distance * eased);
        if (progress < 1) window.requestAnimationFrame(easeScroll);
      };

      window.requestAnimationFrame(easeScroll);
      return;
    }

    stage.scrollIntoView({ behavior, block: 'start' });
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      cancelWalk,
      focusControls: () => listButtonRef.current?.focus({ preventScroll: true }),
      getCurrentImage: () => IM[sceneRef.current.i].src,
      goTo: (id) => walk(id, 'f'),
      enterFullscreen: toggleFullscreen,
      scrollToStage,
      showHint,
    }),
    [cancelWalk, scrollToStage, showHint, toggleFullscreen, walk],
  );

  useLayoutEffect(() => {
    layout();
  }, [currentId, layout]);

  useEffect(() => {
    window.addEventListener('resize', layout);
    const initialHintTimer = window.setTimeout(() => setHintVisible(false), 7000);
    return () => {
      window.removeEventListener('resize', layout);
      window.clearTimeout(initialHintTimer);
      window.clearTimeout(hintTimerRef.current);
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [layout]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !('IntersectionObserver' in window)) {
      setTourEntered(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTourEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18 },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') setLocationOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    function handleTourNavigation(event) {
      walk(event.detail, 'f');
    }
    function updateFullscreen() {
      setIsFullscreen(document.fullscreenElement === stageRef.current);
    }
    window.addEventListener('guimbras:tour', handleTourNavigation);
    document.addEventListener('fullscreenchange', updateFullscreen);
    return () => {
      window.removeEventListener('guimbras:tour', handleTourNavigation);
      document.removeEventListener('fullscreenchange', updateFullscreen);
    };
  }, [walk]);

  function changeZoom(amount) {
    zoomRef.current = Math.max(1, Math.min(1.8, zoomRef.current + amount));
    setZoom(zoomRef.current);
    layout();
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (stageRef.current?.requestFullscreen) {
        await stageRef.current.requestFullscreen();
      } else {
        setTourStatus('O modo de ecrã inteiro não está disponível neste dispositivo.');
        return;
      }
      setTourStatus('');
    } catch (error) {
      setTourStatus('Não foi possível ativar o ecrã inteiro neste dispositivo.');
      console.error('Falha ao alterar o modo de ecrã inteiro do tour:', error);
    }
  }

  function handlePointerDown(event) {
    if (event.target.closest('button,nav,header')) return;
    if (event.pointerType !== 'mouse') {
      pan.current.drag = true;
      pan.current.x0 = event.clientX;
      pan.current.y0 = event.clientY;
      pan.current.sx = pan.current.tx;
      pan.current.sy = pan.current.ty;
    }
  }

  function handlePointerMove(event) {
    if (event.target.closest('button,nav,header')) return;
    if (event.pointerType === 'mouse') {
      aim(
        clamp((event.clientX / window.innerWidth * 2 - 1) * 0.9),
        clamp((event.clientY / window.innerHeight * 2 - 1) * 0.9),
      );
    } else if (pan.current.drag) {
      aim(
        clamp(pan.current.sx - (event.clientX - pan.current.x0) / Math.max(pan.current.ox, 60)),
        clamp(pan.current.sy - (event.clientY - pan.current.y0) / Math.max(pan.current.oy, 60)),
      );
    }
  }

  const scene = sceneById[currentId];
  const sceneNumber = String(SCENES.findIndex((item) => item.id === currentId) + 1).padStart(2, '0');

  return (
    <section className="tour-section" id="tour" aria-labelledby="tour-title">
      <div className="tour-heading">
        <span className="section-kicker">Explore sem pressa</span>
        <h2 id="tour-title">Entre. Olhe à volta. Fique.</h2>
        <p>Percorra a casa ao seu ritmo. Arraste as fotografias e escolha um ponto para avançar entre os espaços.</p>
      </div>
      <section
        className={`tour${tourEntered ? ' tour-entered' : ''}`}
        id="stage"
        ref={stageRef}
        aria-label="Tour visual interativo das Casas das Guimbras"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => {
          pan.current.drag = false;
        }}
        onPointerCancel={() => {
          pan.current.drag = false;
        }}
      >
        <div id="cam" ref={camRef} className={cameraClass}>
          <div id="world" ref={worldRef}>
            <img id="img" src={IM[scene.i].preview} srcSet={IM[scene.i].srcSet} sizes="100vw" alt={`Fotografia: ${scene.n}`} />
            {scene.h.map(([target, label, x, y, direction]) => (
              <button
                key={`${scene.id}-${target}-${label}`}
                type="button"
                className={`hs ${direction || 'f'}${x > 68 ? ' l' : ''}`}
                style={{ left: `${x}%`, top: `${y}%` }}
                aria-label={label}
                onClick={(event) => walk(target, direction || 'f', event.currentTarget)}
              >
                <i aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="shade" />
        <header className="top">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true"><BrandMark /></span>
            <span className="brand-copy">
              <b>Casas das Guimbras</b>
              <small>Um lugar para abrandar</small>
            </span>
          </div>
          <div className="top-actions">
          <span className="status"><i aria-hidden="true" /> PERCURSO VISUAL</span>
          <div className="tour-tools" aria-label="Controlos da imagem">
            <button type="button" onClick={() => changeZoom(-0.2)} aria-label="Diminuir zoom" disabled={zoom <= 1}>−</button>
            <button type="button" onClick={() => changeZoom(0.2)} aria-label="Aumentar zoom" disabled={zoom >= 1.8}>+</button>
            <button type="button" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Sair do ecrã inteiro' : 'Ativar ecrã inteiro'}>
              {isFullscreen ? '⤢' : '⛶'}
            </button>
          </div>
            <button
              className="pill"
              id="lb"
              ref={listButtonRef}
              type="button"
              aria-controls="loc"
              aria-expanded={locationOpen}
              onClick={() => setLocationOpen((open) => !open)}
            >
              <span className="pill-label">Espaços</span>
              <span className="pill-count">{sceneNumber} / {SCENES.length}</span>
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="m3 6 5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </header>
        <div id="hint" aria-hidden="true" className={hintVisible ? '' : 'is-hidden'}>
          Arraste para explorar a fotografia&nbsp; · &nbsp;Escolha um ponto para avançar
        </div>
        <p className="tour-status" aria-live="polite">{tourStatus}</p>
        <section className="cap" aria-live="polite">
          <span className="cap-kicker">Casas das Guimbras</span>
          <h2>{scene.n}</h2>
          <p>{scene.d}</p>
        </section>
        <small className="cr">Fotografias das Casas das Guimbras</small>
        <nav
          id="loc"
          aria-label="Espaços da casa"
          aria-hidden={!locationOpen}
          inert={!locationOpen}
          className={locationOpen ? 'on' : ''}
        >
          <div className="loc-head">
            <div className="loc-title">
              <strong>Explore os espaços</strong>
              <span>Escolha um ponto para continuar o seu passeio.</span>
            </div>
            <span className="loc-progress" aria-live="polite">
              {seen.size} de {SCENES.length} espaços visitados
            </span>
          </div>
          <div className="st">
            {SCENES.map((item) => {
              const active = item.id === currentId;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`th${active ? ' cur' : ''}${seen.has(item.id) ? ' seen' : ''}`}
                  aria-label={`Visitar: ${item.n}`}
                  aria-current={active ? 'location' : undefined}
                  onClick={() => walk(item.id, 'f')}
                >
                  <img src={TH[item.i]} alt="" />
                  <span>{item.n}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </section>
    </section>
  );
});

export default ImmersiveTour;
