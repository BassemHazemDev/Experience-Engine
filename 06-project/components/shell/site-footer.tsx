"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();

  // The Studio workbench (/studio) is a full-height interactive application
  // with an embedded Transition Inspector; suppress the document footer to prevent layout collisions.
  if (pathname === "/studio") {
    return null;
  }

  return (
    <footer className="studio-footer" role="contentinfo">
      <div className="studio-footer-inner">
        <div className="studio-footer-brand">
          <div className="studio-footer-title">
            <span className="site-brand-mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="studio-footer-name">Experience Engine Studio</span>
          </div>
          <p className="studio-footer-tagline">
            A framework-agnostic runtime protocol for composing and transitioning web experiences across culture, theme, and motion.
          </p>
          <div className="studio-footer-author">
            <Image
              src="/author-logo.png"
              alt="Bassem Hazem logo"
              width={22}
              height={22}
              className="studio-footer-author-logo"
            />
            <span>
              Built &amp; maintained by{" "}
              <a
                href="https://github.com/BassemHazemDev"
                target="_blank"
                rel="noopener noreferrer"
                className="studio-footer-author-link"
              >
                Bassem Hazem
              </a>
              {" "}·{" "}
              <a
                href="https://www.linkedin.com/in/bassem-hazem-7902b32a2/"
                target="_blank"
                rel="noopener noreferrer"
                className="studio-footer-author-link"
              >
                LinkedIn
              </a>
            </span>
          </div>
        </div>

        <div className="studio-footer-links">
          <div className="studio-footer-col">
            <h4>Showcase</h4>
            <ul>
              <li><Link href="/studio">Studio</Link></li>
              <li><Link href="/playground">Playground</Link></li>
              <li><Link href="/personalized">Personalized SSR</Link></li>
              <li><Link href="/case-study">Case Study</Link></li>
            </ul>
          </div>

          <div className="studio-footer-col">
            <h4>Architecture &amp; Research</h4>
            <ul>
              <li><Link href="/architecture">Architecture</Link></li>
              <li><Link href="/benchmark">Benchmark</Link></li>
              <li><Link href="/evidence">Evidence &amp; Scope</Link></li>
            </ul>
          </div>

          <div className="studio-footer-col">
            <h4>Public Project</h4>
            <ul>
              <li>
                <a href="https://github.com/BassemHazemDev/Experience-Engine" target="_blank" rel="noopener noreferrer">
                  GitHub: Experience-Engine
                </a>
              </li>
              <li>
                <a href="https://github.com/BassemHazemDev" target="_blank" rel="noopener noreferrer">
                  GitHub: @BassemHazemDev
                </a>
              </li>
              <li>
                <a href="https://www.linkedin.com/in/bassem-hazem-7902b32a2/" target="_blank" rel="noopener noreferrer">
                  LinkedIn: Bassem Hazem
                </a>
              </li>
              <li>
                <a href="https://www.npmjs.com/package/@experience-engine/core" target="_blank" rel="noopener noreferrer">
                  npm: core package
                </a>
              </li>
              <li>
                <a href="https://www.npmjs.com/package/@experience-engine/react" target="_blank" rel="noopener noreferrer">
                  npm: react package
                </a>
              </li>
              <li>
                <a href="https://studio.bassemhazem.com">
                  Live Studio
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="studio-footer-bottom">
        <p className="studio-footer-disclaimer">
          Experience Engine Studio is a research demonstration. Nova Commerce is fictional and its figures are demo data.
          Research claims are strictly scoped; see <Link href="/evidence">Evidence</Link> for boundaries.
        </p>
        <p className="studio-footer-copy">
          MIT © 2026 Bassem Hazem
        </p>
      </div>
    </footer>
  );
}
