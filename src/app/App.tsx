import { useEffect, useState } from 'react';
import { ButtonPage } from './pages/ButtonPage';
import { TextFieldPage } from './pages/TextFieldPage';
import { TextAreaPage } from './pages/TextAreaPage';
import { HeaderPage } from './pages/HeaderPage';
import { SidebarPage } from './pages/SidebarPage';
import { FigmaComponentsPage } from './pages/FigmaComponentsPage/FigmaComponentsPage';
import { ComponentPage } from './pages/ComponentPage/ComponentPage';
import { componentDocumentation } from './pages/ComponentPage/componentRegistry';

export default function App() {
  const getCurrentPage = (): string => {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith('figma-components')) return 'figma-components';
    if (hash.startsWith('textarea') || hash.startsWith('text-area')) return 'text-area';
    if (hash.startsWith('textfield') || hash.startsWith('text-field')) return 'text-field';
    return componentDocumentation.find((component) =>
      hash === component.slug || hash === component.routeSlug
    )?.routeSlug ?? 'button';
  };
  const [currentPage, setCurrentPage] = useState(getCurrentPage);

  useEffect(() => {
    const updatePage = () => {
      setCurrentPage(getCurrentPage());
    };

    window.addEventListener('hashchange', updatePage);
    return () => window.removeEventListener('hashchange', updatePage);
  }, []);

  const isTextFieldPage = currentPage === 'text-field';
  const isTextAreaPage = currentPage === 'text-area';
  const isFigmaComponentsPage = currentPage === 'figma-components';
  const genericComponent = componentDocumentation.find((component) =>
    component.routeSlug === currentPage &&
    !['button', 'textfield', 'textarea'].includes(component.routeSlug)
  );

  return (
    <div className="docs-shell">
      <HeaderPage />
      <div className="docs-layout" id="top">
        <SidebarPage currentPage={currentPage} />
        {isFigmaComponentsPage ? (
          <FigmaComponentsPage />
        ) : isTextAreaPage ? (
          <TextAreaPage />
        ) : isTextFieldPage ? (
          <TextFieldPage />
        ) : genericComponent ? (
          <ComponentPage component={genericComponent} />
        ) : (
          <ButtonPage />
        )}
        <aside className="docs-toc" aria-label="On this page">
          <h2>On this page</h2>
          {isFigmaComponentsPage ? (
            <nav>
              <a href="#figma-catalog">Components</a>
            </nav>
          ) : genericComponent ? (
            <nav>
              <a href="#component-installation">Installation</a>
              <a href="#component-examples">Live preview</a>
            </nav>
          ) : isTextAreaPage ? (
            <nav>
              <a href="#textarea-installation">Installation</a>
              <a href="#textarea-examples">States and sizes</a>
              <a className="docs-toc-nested" href="#textarea-playground">Try it out</a>
              <a href="#textarea-guidelines">Usage guidelines</a>
              <a href="#textarea-api">API reference</a>
            </nav>
          ) : isTextFieldPage ? (
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
