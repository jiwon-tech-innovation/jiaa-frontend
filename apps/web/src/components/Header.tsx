"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HamburgerMenu } from "@repo/ui";
import "./header.css";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`header ${scrolled ? "scrolled" : ""}`}>
      <div className="container header-container">
        <div className="logo">
          <Link href="/">
            Jiaa
          </Link>
        </div>
        <nav className="nav">
          <div className="desktop-nav">
            <Link href="#" className="nav-link">기능</Link>
            <Link href="#" className="nav-link">지원</Link>
            {!isHomePage && (
              <>
                <Link href="/signin" className="nav-link">로그인</Link>
                <Link href="/signup" className="btn-signup">회원가입</Link>
              </>
            )}
            <Link href="#" className="btn-download">다운로드</Link>
          </div>

          <HamburgerMenu className="mobile-menu">
            <Link href="#" className="nav-link">기능</Link>
            <Link href="#" className="nav-link">지원</Link>
            {!isHomePage && (
              <>
                <Link href="/signin" className="nav-link">로그인</Link>
                <Link href="/signup" className="nav-link">회원가입</Link>
              </>
            )}
            <Link href="#" className="btn-download">다운로드</Link>
          </HamburgerMenu>
        </nav>
      </div>
    </header>
  );
}
