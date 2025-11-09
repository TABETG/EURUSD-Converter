import FxConverter from './components/FxConverter';

export default function App() {
  return (
    <div className="page">
      <div className="card">
        <FxConverter />
      </div>
      <footer className="footer">
        <small>EUR ⇄ USD — demo (client-side random walk)</small>
      </footer>
    </div>
  );
}
