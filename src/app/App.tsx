import { useEffect, useState } from 'react';
import { ButtonPage } from './pages/ButtonPage';
import { TextFieldPage } from './pages/TextFieldPage';
import { DocsHeader } from './components/DocsHeader';
import { DocsSidebar } from './components/DocsSidebar';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'button' | 'textfield'>(() =>
    window.location.hash.startsWith('#textfield') ? 'textfield' : 'button'
  );

  useEffect(() => {
    const updatePage = () => {
      setCurrentPage(window.location.hash.startsWith('#textfield') ? 'textfield' : 'button');
    };

    window.addEventListener('hashchange', updatePage);
    return () => window.removeEventListener('hashchange', updatePage);
  }, []);

  const isTextFieldPage = currentPage === 'textfield';

  return (
    <div className="docs-shell">
      <DocsHeader />
      <div className="docs-layout" id="top">
        <DocsSidebar currentPage={currentPage} />
        {isTextFieldPage ? <TextFieldPage /> : <ButtonPage />}
        <aside className="docs-toc" aria-label="On this page">
          <h2>On this page</h2>
          {isTextFieldPage ? (
            <nav>
              <a href="#textfield-installation">Installation</a>
              <a href="#textfield-examples">Examples</a>
              <a className="docs-toc-nested" href="#textfield-playground">Try it out</a>
              <a href="#textfield-guidelines">Usage guidelines</a>
              <a href="#textfield-api">API reference</a>
            </nav>
          ) : (
            <nav>
              <a href="#installation">Installation</a>
              <a href="#examples">Examples</a>
              <a className="docs-toc-nested" href="#variant-examples">Variants</a>
              <a className="docs-toc-nested" href="#size-examples">Sizes</a>
              <a className="docs-toc-nested" href="#icon-examples">Icons</a>
              <a className="docs-toc-nested" href="#state-examples">Loading and disabled</a>
              <a href="#playground">Try it out</a>
              <a href="#guidelines">Usage guidelines</a>
              <a href="#api">API reference</a>
            </nav>
          )}
        </aside>
      </div>
    </div>
  );
}
