import { ButtonPage } from './Docs/pages/ButtonPage';
import { DocsHeader } from './Docs/components/DocsHeader';
import { DocsSidebar } from './Docs/components/DocsSidebar';

export default function App() {
  return (
    <div className="docs-shell">
      <DocsHeader />
      <div className="docs-layout" id="top">
        <DocsSidebar />
        <ButtonPage />
      </div>
    </div>
  );
}
