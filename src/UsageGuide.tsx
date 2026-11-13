import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const storageKey = 'martian-map-guide-dismissed-v1';
const steps = [
  {
    target: '.map-toolbar, .map-host',
    title: 'Get to know your Mars map',
    location: 'Map',
    instructions:
      'Drag to move around Mars and scroll to zoom. Use Mars globe for the full planet or Jezero view to explore the delta. The + and − buttons also control zoom.',
    tip: 'Using a keyboard? Focus the map, then use arrow keys to pan, + / − to zoom and H to return to Jezero.',
  },
  {
    target: '#expedition-base',
    title: 'Choose where to start',
    location: 'Plan → Set your base',
    instructions:
      'Choose Place base on map, then click the Mars surface. Or open Enter coordinates instead, enter latitude and longitude, and choose Set base coordinates. You can clear or change your base later.',
    tip: 'Coordinate entry also works when the interactive map is unavailable. Your simulated base and planning choices last until you reload the page.',
  },
  {
    target: '#destination-calculator > summary',
    title: 'Find a destination',
    location: 'Compare destinations',
    instructions:
      'Choose Compare destinations in the exploration steps to open the Top 10 calculator. With a base set, adjust the search radius and feature filters. Open Why this score? on a result to understand its distance and score range.',
    tip: 'Discover Mars features lets you browse the named-feature catalogue separately. Suggestions are provisional: terrain is unknown and study potential is a simulation heuristic.',
  },
  {
    target: '.world-layer-controls > summary',
    title: 'Explore map layers',
    location: 'Map layers',
    instructions:
      'Expand Mars-wide context to switch imagery, relief and geology on or off. Open Base imagery & Jezero detail for regional elevation and estimated slope.',
    tip: 'Check coverage labels and legends. Detailed Jezero products cover only that region.',
  },
  {
    target: '#evidence-inspector .evidence-heading',
    title: 'Look beneath the recommendation',
    location: 'Layers → Inspect the evidence',
    instructions:
      'Select a destination or a candidate science stop, then choose Inspect the evidence. Review documented facts, missing evidence and product sources. Use View layer on map to display a reviewed product, or toggle imagery, elevation and geology in Map layers.',
    tip: 'Sample highlights show approximate, unverified locations. Review Data & sources for provenance, and reopen this guide any time with How to use.',
  },
  {
    target: '#trip-planner .trip-heading',
    title: 'Plan the return as well',
    location: 'Trip → Your round trip',
    instructions:
      'Add a selected destination or the Jezero references to your trip. Reorder stops, review the return distance and optionally define mission settings for speed, work time and return reserve.',
    tip: 'Open field view for a science checklist and reference photos. Save locally, export JSON or print your plan. Distances remain estimates, and terrain feasibility stays unknown.',
  },
];

function shouldShowGuide() {
  try {
    return window.localStorage.getItem(storageKey) !== 'true';
  } catch {
    return true;
  }
}

export function UsageGuide() {
  const [open, setOpen] = useState(shouldShowGuide);
  const [step, setStep] = useState(0);
  const launcher = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const current = steps[step];
  const card = useRef<HTMLElement>(null);
  const spotlight = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    let frame = 0;
    let target: Element | null = null;
    let needsScroll = true;
    function position() {
      // Prefer the navigation buttons once the map finishes loading.
      const nextTarget =
        current.target === '.map-toolbar, .map-host'
          ? (document.querySelector('.map-toolbar') ??
            document.querySelector('.map-host'))
          : document.querySelector(current.target);
      if (!nextTarget || !card.current || !spotlight.current) return;
      if (target !== nextTarget) {
        if (target) observer.unobserve(target);
        target = nextTarget;
        observer.observe(target);
        needsScroll = true;
      }
      const panel = card.current;
      const panelHeight = panel.getBoundingClientRect().height;
      if (needsScroll) {
        needsScroll = false;
        const bounds = target.getBoundingClientRect();
        const availableHeight = window.innerHeight - panelHeight - 48;
        const desiredTop = Math.max(16, (availableHeight - bounds.height) / 2);
        window.scrollBy({ top: bounds.top - desiredTop, behavior: 'instant' });
      }
      const bounds = target.getBoundingClientRect();
      const left = Math.max(8, bounds.left - 6);
      const top = Math.max(8, bounds.top - 6);
      const right = Math.min(window.innerWidth - 8, bounds.right + 6);
      const bottom = Math.min(window.innerHeight - 8, bounds.bottom + 6);
      Object.assign(spotlight.current.style, {
        left: `${left}px`,
        top: `${top}px`,
        width: `${Math.max(0, right - left)}px`,
        height: `${Math.max(0, bottom - top)}px`,
      });
      const width = panel.getBoundingClientRect().width;
      let x = Math.max(12, Math.min(left, window.innerWidth - width - 12));
      let y = bottom + 14;
      if (y + panelHeight > window.innerHeight - 12) {
        if (top - panelHeight - 14 >= 12) y = top - panelHeight - 14;
        else if (right + width + 26 < window.innerWidth) {
          x = right + 14;
          y = Math.max(
            12,
            Math.min(top, window.innerHeight - panelHeight - 12),
          );
        } else {
          y = Math.max(12, window.innerHeight - panelHeight - 12);
        }
      }
      Object.assign(panel.style, { left: `${x}px`, top: `${y}px` });
      spotlight.current.dataset.target = current.target;
    }
    function schedule() {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(position);
    }
    const observer = new window.ResizeObserver(schedule);
    if (card.current) observer.observe(card.current);
    const mutation = new window.MutationObserver(schedule);
    const map = document.getElementById('exploration-map');
    if (step === 0 && map)
      mutation.observe(map, { childList: true, subtree: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    position();
    heading.current?.focus({ preventScroll: true });
    return () => {
      observer.disconnect();
      mutation.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
    };
  }, [open, step, current.target]);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(storageKey, 'true');
    } catch {
      // Keep dismissal available when browser storage is blocked.
    }
    setOpen(false);
    launcher.current?.focus({ preventScroll: true });
    launcher.current?.scrollIntoView({ block: 'nearest' });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        dismiss();
      }
    }
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [open, dismiss]);

  function changeStep(next: number) {
    setStep(next);
  }

  return (
    <div className="usage-guide">
      <button
        ref={launcher}
        className="guide-launcher"
        type="button"
        aria-expanded={open}
        aria-controls="usage-guide-content"
        onClick={() => {
          setStep(0);
          setOpen(true);
        }}
      >
        How to use
      </button>
      {open &&
        createPortal(
          <div className="guide-overlay">
            <div
              ref={spotlight}
              className="guide-spotlight"
              aria-hidden="true"
            />
            <section
              ref={card}
              id="usage-guide-content"
              className="guide-card"
              aria-label="How to use Marsway"
            >
              <div className="guide-topline">
                <p className="eyebrow">QUICK START · {steps.length} STEPS</p>
                <button type="button" onClick={dismiss}>
                  Skip tutorial
                </button>
              </div>
              <div aria-live="polite" aria-atomic="true">
                <p className="guide-location">
                  Step {step + 1} of {steps.length} · {current.location}
                </p>
                <h2 ref={heading} tabIndex={-1}>
                  {current.title}
                </h2>
                <p className="guide-instructions">{current.instructions}</p>
                <p className="guide-tip">{current.tip}</p>
              </div>
              <div className="guide-actions">
                <button
                  type="button"
                  disabled={step === 0}
                  onClick={() => changeStep(step - 1)}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="guide-next"
                  onClick={() =>
                    step === steps.length - 1 ? dismiss() : changeStep(step + 1)
                  }
                >
                  {step === steps.length - 1 ? 'Finish tutorial' : 'Next'}
                </button>
              </div>
            </section>
          </div>,
          document.body,
        )}
    </div>
  );
}
