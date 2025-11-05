'use client';

import { useCallback, useRef, useState } from 'react';

export function useHorizontalScroll() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  const updatePosition = useCallback(() => {
    const node = containerRef.current;
    if (!node) return;
    const { scrollLeft, scrollWidth, clientWidth } = node;
    setIsAtStart(scrollLeft <= 0);
    setIsAtEnd(scrollLeft + clientWidth >= scrollWidth - 1);
  }, []);

  const scrollBy = useCallback((offset: number) => {
    const node = containerRef.current;
    if (!node) return;
    node.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(updatePosition, 150);
  }, [updatePosition]);

  const bind = {
    ref: containerRef,
    onScroll: updatePosition,
    className: 'scroll-smooth'
  } as const;

  return { bind, isAtStart, isAtEnd, scrollBy };
}
