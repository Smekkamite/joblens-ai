import "./styles.css";

function App() {
  return (
    <div className="joblens-root">
      <div className="joblens-card">
        <div className="joblens-header">
          <h1>JobLens AI</h1>
          <span className="joblens-badge">MVP</span>
        </div>

        <div className="joblens-section">
          <p className="joblens-label">Status</p>
          <p className="joblens-value">Extension injected successfully.</p>
        </div>

        <div className="joblens-section">
          <p className="joblens-label">Next step</p>
          <p className="joblens-value">Read and analyze LinkedIn job content.</p>
        </div>
      </div>
    </div>
  );
}

export default App;