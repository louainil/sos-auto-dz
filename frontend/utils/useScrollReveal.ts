import { useEffect } from 'react';

/**
 * useScrollReveal
 *
 * Queries all elements with the CSS class `scroll-reveal` and observes them
 * with an IntersectionObserver. When an element enters the viewport the hook
 * adds the `visible` class, which triggers the CSS transition defined in
 * index.css. The element is immediately unobserved afterwards for performance.
 *
 * @param deps - Dependency array (pass [] on initial mount, or include values
 *               that should re-trigger observation after a list re-render).
 */
const useScrollReveal = (deps: unknown[] = []) => {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('.scroll-reveal');

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

export default useScrollReveal;
