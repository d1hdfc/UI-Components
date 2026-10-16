import { ButtonPage } from './pages/ButtonPage';
import { DocsHeader } from './components/DocsHeader';
import { DocsSidebar } from './components/DocsSidebar';

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
