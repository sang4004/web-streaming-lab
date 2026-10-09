import { useEffect, useRef, type ReactNode } from "react";
import { Link, useLocation } from "react-router";

interface PageLayoutProps {
  title: string;
  children: ReactNode;
  isBackLinkVisible?: boolean;
}

const PageLayout = ({
  title,
  children,
  isBackLinkVisible = true,
}: PageLayoutProps) => {
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = title;
    mainRef.current?.focus({ preventScroll: true });
  }, [title, pathname]);

  return (
    <main className="shell" ref={mainRef} tabIndex={-1}>
      {isBackLinkVisible && (
        <Link className="back-button" to="/">
          ← 실습 목록
        </Link>
      )}
      {children}
    </main>
  );
};

export default PageLayout;
