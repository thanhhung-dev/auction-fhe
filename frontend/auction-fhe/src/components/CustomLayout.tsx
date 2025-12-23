'use client';

import { createStyles } from 'antd-style';
import { ReactNode } from 'react';
import NavBar from './NavBar';
import Footer, { FooterProps } from './Footer';

const useStyles = createStyles(({ css, token }) => ({
  wrapper: css`
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    width: 100%;
  `,

  header: css`
    position: sticky;
    top: 0;
    z-index: 100;
    border-bottom: 1px solid ${token.colorBorder};
  `,

  main: css`
  min-height: 80vh;
  `,

  footer: css`
  width: 100%;
  `,
}));

const footerColumns: FooterProps["columns"] = [
  {
    title: "Company",
    items: [
      { title: "Features", url: "/features" },
      { title: "Pricing", url: "/pricing" },
    ],
  },
  {
    title: "Resources",
    items: [
      { title: "Insights", url: "/insights" },
      { title: "Review", url: "/review" },
    ],
  },
  {
    title: "Legal",
    items: [{ title: "Testimonials", url: "/testimonials" }],
  },
];


interface LayoutProps {
  children: ReactNode;
}

export default function CustomLayout({ children }: LayoutProps) {
  const { styles } = useStyles();

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <NavBar />
      </header>
      <main className={styles.main}>
        {children}
      </main>
      <footer className={styles.footer}>
        <Footer
          className={styles.footer}
          columns={footerColumns}
          bottom="© 2025 AuctionFHE, Inc. All rights reserved"
        ></Footer>
    </footer>
    </div >
  );
}