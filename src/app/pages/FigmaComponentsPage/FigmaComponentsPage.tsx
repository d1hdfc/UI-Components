import { figmaComponentCatalog } from '../../../figma/componentCatalog';
import './FigmaComponentsPage.scss';

const figmaFileUrl = `https://www.figma.com/design/${figmaComponentCatalog.fileKey}`;

export function FigmaComponentsPage() {
  const components = figmaComponentCatalog.components;

  return (
    <main className="docs-content figma-catalog-page" id="figma-catalog">
      <div className="docs-breadcrumbs">
        <a href="#button">Components</a><span>/</span><strong>Figma catalog</strong>
      </div>

      <header className="docs-heading">
        <div>
          <p className="docs-eyebrow">COMPONENTS</p>
          <div className="docs-title-row">
            <h1>Figma components</h1>
            <span className="docs-status"><i /> Synced</span>
          </div>
          <p className="docs-intro">
            Browse the component library alongside the Button, Text area, and Text field guides.
            Select any preview to open its source in Figma.
          </p>
          <div className="docs-heading-links">
            <a href={figmaFileUrl} target="_blank" rel="noopener noreferrer">
              Open Figma file <span aria-hidden="true">↗</span>
            </a>
            <span className="figma-catalog-version">Figma version {figmaComponentCatalog.version}</span>
          </div>
        </div>
      </header>

      <section className="docs-section">
        <div className="docs-section-heading">
          <div>
            <h2>Library components</h2>
            <p>Design previews from the connected Figma library.</p>
          </div>
          <span className="figma-catalog-count" aria-label={`${components.length} library items`}>
            {components.length} items
          </span>
        </div>

        {components.length > 0 ? (
          <div className="figma-component-grid">
            {components.map((component) => {
              const nodeUrl = `${figmaFileUrl}?node-id=${encodeURIComponent(component.nodeId.replace(':', '-'))}`;

              return (
                <article className="figma-component-card" key={component.key}>
                  <a
                    className="figma-component-preview"
                    href={nodeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${component.name} in Figma`}
                  >
                    {component.thumbnailUrl ? (
                      <img src={component.thumbnailUrl} alt="" loading="lazy" />
                    ) : (
                      <span className="figma-component-no-preview">Preview unavailable</span>
                    )}
                  </a>
                  <div className="figma-component-card-details">
                    <div>
                      <h3>{component.name}</h3>
                      <p>{component.pageName}</p>
                    </div>
                    <span className="figma-component-type">
                      {component.type === 'COMPONENT_SET' ? 'Component set' : 'Component'}
                    </span>
                  </div>
                  {component.description && (
                    <p className="figma-component-description">{component.description}</p>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="figma-catalog-empty">
            No components were found. Check the configured Figma file and run the sync again.
          </p>
        )}
      </section>
    </main>
  );
}
