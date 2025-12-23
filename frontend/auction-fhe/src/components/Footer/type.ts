import type { FooterProps as RcProps } from 'rc-footer';
import type { ReactNode } from 'react';
import type { FlexboxProps } from 'react-layout-kit';

export interface FooterColumn {
  title: string;
  items?: {
    title: string;
    url?: string;
    description?: string;
    openExternal?: boolean;
  }[];
}

export interface FooterProps {
  columns?: FooterColumn[];
  bottom?: string;
  theme?: 'light' | 'dark';
  contentMaxWidth?: number;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
