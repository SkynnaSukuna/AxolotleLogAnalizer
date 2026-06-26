/**
 * Lightweight virtual scrolling list.
 *
 * Renders only the items that fit the visible viewport plus an overscan
 * buffer, keeping the DOM small even for 50k+ rows.
 *
 * All items have a fixed height (`itemHeight`) and are absolutely
 * positioned inside a scrollable container whose total height equals
 * `items.length * itemHeight`.
 */

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import type { ReactNode, CSSProperties } from 'react';

export interface VirtualListHandle {
  /** Smooth-scroll to the item at the given index */
  scrollToIndex: (index: number, behavior?: ScrollBehavior) => void;
}

interface VirtualListProps {
  items: unknown[];
  itemHeight: number;
  renderItem: (item: unknown, index: number, style: CSSProperties) => ReactNode;
  overscan?: number;
  className?: string;
  style?: CSSProperties;
}

const DEFAULT_OVERSCAN = 5;

export const VirtualList = forwardRef<VirtualListHandle, VirtualListProps>(
  (props, ref) => {
    const {
      items,
      itemHeight,
      renderItem,
      overscan = DEFAULT_OVERSCAN,
      className,
      style,
    } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    /** Expose scroll-to-index via ref for parent callers */
    useImperativeHandle(ref, () => ({
      scrollToIndex: (index: number, behavior: ScrollBehavior = 'smooth') => {
        const node = containerRef.current;
        if (!node) return;
        node.scrollTo({ top: index * itemHeight, behavior });
      },
    }));

    /** Track container height via ResizeObserver */
    useEffect(() => {
      const node = containerRef.current;
      if (!node) return;

      const onResize = () => setContainerHeight(node.clientHeight);
      onResize();

      const observer = new ResizeObserver(onResize);
      observer.observe(node);
      return () => observer.disconnect();
    }, []);

    const handleScroll = useCallback(() => {
      const node = containerRef.current;
      if (node) setScrollTop(node.scrollTop);
    }, []);

    const totalHeight = items.length * itemHeight;

    // Visible range (clamped + overscan)
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
    );

    const visibleNodes: ReactNode[] = [];
    for (let i = startIndex; i < endIndex; i++) {
      visibleNodes.push(
        renderItem(items[i], i, {
          position: 'absolute',
          top: i * itemHeight,
          left: 0,
          right: 0,
          height: itemHeight,
        }),
      );
    }

    return (
      <div
        ref={containerRef}
        className={className}
        style={{
          overflow: 'auto',
          position: 'relative',
          willChange: 'scroll-position',
          ...style,
        }}
        onScroll={handleScroll}
      >
        {/* Spacer div defines the full scrollable extent */}
        <div
          style={{
            height: totalHeight,
            position: 'relative',
          }}
        >
          {visibleNodes}
        </div>
      </div>
    );
  },
);
