import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { ButtonPage } from './pages/ButtonPage/ButtonPage';
import { TextFieldPage } from './pages/TextFieldPage/TextFieldPage';
import { TextAreaPage } from './pages/TextAreaPage/TextAreaPage';
import { HeaderPage } from './pages/HeaderPage/HeaderPage';
import { SidebarPage } from './pages/SidebarPage/SidebarPage';
import { FigmaComponentsPage } from './pages/FigmaComponentsPage/FigmaComponentsPage';
import { ComponentPage } from './pages/ComponentPage/ComponentPage';
import { componentDocumentation } from './pages/ComponentPage/componentRegistry';
import { SyncToast } from './components/SyncToast';
import { useSyncWebSocket } from './hooks/useSyncWebSocket';

const componentPageModules = import.meta.glob<{
  componentSlug?: string;
  default?: ComponentType;
}>('./pages/*Page/*Page.tsx', { eager: true });
const componentPages = new Map(
  Object.values(componentPageModules)
    .filter((mod): mod is { componentSlug: string; default: ComponentType } =>
      Boolean(mod.componentSlug && mod.default)
    )
    .map(({ componentSlug, default: Page }) => [componentSlug, Page])
);

export default function App() {
  const { status: syncStatus, lastEvent } = useSyncWebSocket();

  const getCurrentPage = (): string => {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith('figma-components')) return 'figma-components';
    if (hash.startsWith('textarea') || hash.startsWith('text-area')) return 'text-area';
    if (hash.startsWith('textfield') || hash.startsWith('text-field')) return 'text-field';
    if (hash.startsWith('installation')) return 'installation';
    return componentDocumentation.find((component) =>
      hash === component.slug || hash === component.routeSlug
    )?.routeSlug ?? 'button';
  };

  const [currentPage, setCurrentPage] = useState(getCurrentPage);

  useEffect(() => {
    const updatePage = () => {
      const hash = window.location.hash.slice(1);
      const isRouteHash =
        !hash ||
        hash.startsWith('figma-components') ||
        hash.startsWith('textarea') ||
        hash.startsWith('text-area') ||
        hash.startsWith('textfield') ||
        hash.startsWith('text-field') ||
        hash.startsWith('installation') ||
        componentDocumentation.some((component) => hash === component.slug || hash === component.routeSlug);
      // In-page anchors (e.g. #component-docs, #md-figma-changelog-diff-status) scroll within the current page
      if (!isRouteHash && document.getElementById(hash)) return;
      setCurrentPage(getCurrentPage());
    };
    window.addEventListener('hashchange', updatePage);
    return () => window.removeEventListener('hashchange', updatePage);
  }, []);

  const isTextFieldPage = currentPage === 'text-field';
  const isTextAreaPage = currentPage === 'text-area';
  const isFigmaComponentsPage = currentPage === 'figma-components';
  const genericComponent = componentDocumentation.find(
    (component) =>
      component.routeSlug === currentPage &&
      !['button', 'textfield', 'textarea'].includes(component.routeSlug)
  );
  const DedicatedComponentPage = genericComponent
    ? componentPages.get(genericComponent.slug)
    : undefined;

  // Links into the rendered <component>.md (see MarkdownView.tsx / slugifyHeading)
  const markdownTocLinks: Array<{ href: string; label: string; nested?: boolean }> = [
    { href: '#component-docs', label: 'Documentation', nested: false },
    { href: '#md-figma-changelog-diff-status', label: 'Figma changelog', nested: true },
  ];

  // Dynamic TOC links based on page
  const tocLinks: Array<{ href: string; label: string; nested?: boolean }> = isFigmaComponentsPage
    ? [{ href: '#figma-catalog', label: 'Components' }]
    : genericComponent
    ? [
        ...markdownTocLinks,
        { href: '#component-installation', label: 'Installation' },
        { href: '#component-examples', label: 'Examples' },
        { href: '#component-guidelines', label: 'Usage guidelines' },
        { href: '#component-api', label: 'API reference' },
      ]
    : isTextAreaPage
    ? [
        ...markdownTocLinks,
        { href: '#textarea-installation', label: 'Installation' },
        { href: '#textarea-examples', label: 'States and sizes', nested: false },
        { href: '#textarea-playground', label: 'Try it out', nested: true },
        { href: '#textarea-guidelines', label: 'Usage guidelines' },
        { href: '#textarea-api', label: 'API reference' },
      ]
    : isTextFieldPage
    ? [
        ...markdownTocLinks,
        { href: '#textfield-installation', label: 'Installation' },
        { href: '#textfield-examples', label: 'Examples' },
        { href: '#textfield-playground', label: 'Try it out', nested: true },
        { href: '#textfield-guidelines', label: 'Usage guidelines' },
        { href: '#textfield-api', label: 'API reference' },
      ]
    : [
        ...markdownTocLinks,
        { href: '#installation', label: 'Installation' },
        { href: '#examples', label: 'Examples' },
        { href: '#variant-examples', label: 'Variants', nested: true },
        { href: '#size-examples', label: 'Sizes', nested: true },
        { href: '#icon-examples', label: 'Icons', nested: true },
        { href: '#state-examples', label: 'Loading and disabled', nested: true },
        { href: '#playground', label: 'Try it out' },
        { href: '#guidelines', label: 'Usage guidelines' },
        { href: '#api', label: 'API reference' },
      ];

  return (
    <div className="docs-shell">
      <HeaderPage
        syncStatus={syncStatus}
        currentPage={currentPage}
        onNav={(page: string) => setCurrentPage(page)}
      />
      <div className="docs-layout" id="top">
        <SidebarPage currentPage={currentPage} syncStatus={syncStatus} />

        {isFigmaComponentsPage ? (
          <FigmaComponentsPage />
        ) : isTextAreaPage ? (
          <TextAreaPage />
        ) : isTextFieldPage ? (
          <TextFieldPage />
        ) : genericComponent ? (
          DedicatedComponentPage ? (
            <DedicatedComponentPage />
          ) : (
            <ComponentPage component={genericComponent} />
          )
        ) : (
          <ButtonPage />
        )}

        <aside className="docs-toc" aria-label="On this page">
          <h2>On this page</h2>
          <nav>
            {tocLinks.map(({ href, label, nested }) => (
              <a
                key={href}
                href={href}
                className={nested ? 'docs-toc-nested' : ''}
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>
      </div>

      <SyncToast event={lastEvent} />
    </div>
  );
}
