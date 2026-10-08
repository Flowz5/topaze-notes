import re

with open('src/pages/KbView.tsx', 'r') as f:
    content = f.read()

# 1. Imports
content = content.replace("FolderPlus, Info", "FolderPlus, Info, Search")

# 2. State
content = content.replace("const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);", "const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);\n  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);\n  const [globalSearchInput, setGlobalSearchInput] = useState('');")

# 3. UseEffect for Cmd+K
use_effect = """
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
"""
content = content.replace("const handleRename = async (e: React.FormEvent) => {", use_effect + "\n  const handleRename = async (e: React.FormEvent) => {")

# 4. Button
button_old = """            <button 
              className="logout-btn" 
              style={{ padding: '0.5rem', borderRadius: '50%', marginRight: '0.5rem' }}
              onClick={() => setIsHelpModalOpen(true)}
              title="Aide & Raccourcis"
            >"""
button_new = """            <button 
              className="logout-btn" 
              style={{ padding: '0.5rem', borderRadius: '50%', marginRight: '0.5rem' }}
              onClick={() => setIsSearchModalOpen(true)}
              title="Rechercher (Cmd+K)"
            >
              <Search size={18} />
            </button>
            <button 
              className="logout-btn" 
              style={{ padding: '0.5rem', borderRadius: '50%', marginRight: '0.5rem' }}
              onClick={() => setIsHelpModalOpen(true)}
              title="Aide & Raccourcis"
            >"""
content = content.replace(button_old, button_new)

# 5. Modal JSX
modal_jsx = """
      {/* MODAL RECHERCHE GLOBALE */}
      {isSearchModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSearchModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', marginTop: '10vh', position: 'absolute', top: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-hover)', borderRadius: '99px', padding: '0.5rem 1rem', marginBottom: '1rem' }}>
              <Search size={20} color="var(--primary)" style={{ marginRight: '0.5rem' }} />
              <input
                autoFocus
                type="text"
                placeholder="Rechercher une note par titre..."
                value={globalSearchInput}
                onChange={e => setGlobalSearchInput(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  width: '100%',
                  outline: 'none',
                  fontSize: '1.1rem'
                }}
              />
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {notes.filter(n => n.title.toLowerCase().includes(globalSearchInput.toLowerCase())).length > 0 ? (
                notes.filter(n => n.title.toLowerCase().includes(globalSearchInput.toLowerCase())).map(note => (
                  <div
                    key={note.id}
                    onClick={() => {
                      setSelectedNoteId(note.id);
                      setIsSearchModalOpen(false);
                      setGlobalSearchInput('');
                    }}
                    style={{
                      padding: '1rem',
                      background: 'var(--surface-hover)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--primary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                  >
                    <FileText size={18} />
                    <span style={{ fontWeight: '500' }}>{note.title}</span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>
                  Aucune note ne correspond à "{globalSearchInput}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}
"""
content = content.replace("{/* MODAL AIDE / INFO */}", modal_jsx + "\n      {/* MODAL AIDE / INFO */}")

with open('src/pages/KbView.tsx', 'w') as f:
    f.write(content)

print("Patch applied")
