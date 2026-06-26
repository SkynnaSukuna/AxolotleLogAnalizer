/**
 * Types for block-based Minecraft log viewing.
 */

/** Block colour category */
export type BlockType = 'info' | 'warn' | 'error';

/** A contiguous group of log lines sharing the same severity level */
export interface LogBlock {
  id: number;
  type: BlockType;
  /** Raw lines belonging to this block */
  lines: string[];
  /** Index of the first line in the original log */
  startIndex: number;
  /** Index of the last line in the original log */
  endIndex: number;
}

/** A single log line rendered inside a block (always expanded) */
export interface DisplayLine {
  kind: 'line';
  blockId: number;
  blockType: BlockType;
  text: string;
  isBlockStart: boolean;
  originalIndex: number;
}

/** A collapsed error-block summary */
export interface CollapsedError {
  kind: 'collapsed';
  block: LogBlock;
  summaryText: string;
  lineCount: number;
}

/** Union of all items the virtual list can render */
export type VirtualItem = DisplayLine | CollapsedError;

/** Top-level tabs */
export type TabType = 'all' | 'errors' | 'warnings';
