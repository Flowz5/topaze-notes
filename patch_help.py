import re

with open('src/pages/KbView.tsx', 'r') as f:
    content = f.read()

# 1. Imports
content = content.replace("Settings, UserMinus, Trash2, Download, FolderPlus", "Settings, UserMinus, Trash2, Download, FolderPlus, Info")

# 2. State
content = content.replace("const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);", "const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);\n  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);")

# 3. Button
button_old = """            <button 
              className="logout-btn" 
              style={{ padding: '0.5rem', borderRadius: '50%' }}
              onClick={openSettings}
            >
              <Settings size={18} />
            </button>"""
button_new = """            <button 
              className="logout-btn" 
              style={{ padding: '0.5rem', borderRadius: '50%', marginRight: '0.5rem' }}
              onClick={() => setIsHelpModalOpen(true)}
              title="Aide & Raccourcis"
            >
              <Info size={18} />
            </button>
            <button 
              className="logout-btn" 
              style={{ padding: '0.5rem', borderRadius: '50%' }}
              onClick={openSettings}
            >
              <Settings size={18} />
            </button>"""
content = content.replace(button_old, button_new)

# 4. Modal
modal_jsx = """
      {/* MODAL AIDE / INFO */}
      {isHelpModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <h3 className="modal-title">Bienvenue sur Topaze Notes 💎</h3>
            <div style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', fontSize: '0.95rem' }}>
              <p style={{ marginBottom: '1rem' }}>Voici quelques astuces pour utiliser l'application comme un pro :</p>
              
              <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <li style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: '12px' }}>
                  <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.5rem' }}>🔗 Liens Bidirectionnels (Backlinks)</strong>
                  Tape <kbd style={{ background: 'var(--surface)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>@</kbd> n'importe où dans tes notes pour faire le lien vers une autre note. Le graphe se mettra à jour automatiquement !
                </li>
                <li style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: '12px' }}>
                  <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.5rem' }}>🔍 Recherche Globale</strong>
                  Appuie sur <kbd style={{ background: 'var(--surface)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>Cmd + K</kbd> ou <kbd style={{ background: 'var(--surface)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>Ctrl + K</kbd> depuis n'importe où pour ouvrir la barre de recherche rapide et naviguer entre tes notes.
                </li>
                <li style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: '12px' }}>
                  <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.5rem' }}>✅ To-Do Lists</strong>
                  Tape <kbd style={{ background: 'var(--surface)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>[ ]</kbd> suivi d'un espace pour créer une liste de tâches interactive. Tu peux aussi utiliser le menu flottant.
                </li>
                <li style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: '12px' }}>
                  <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.5rem' }}>📂 Organisation</strong>
                  Tu peux glisser et déposer (Drag & Drop) tes notes et tes dossiers dans la barre latérale pour tout organiser à l'infini.
                </li>
              </ul>
            </div>
            
            <div className="modal-actions" style={{ marginTop: '2rem' }}>
              <button className="btn-cancel" onClick={() => setIsHelpModalOpen(false)}>
                J'ai compris !
              </button>
            </div>
          </div>
        </div>
      )}
"""
content = content.replace("{/* MODAL PARAMÈTRES */}", modal_jsx + "\n      {/* MODAL PARAMÈTRES */}")

with open('src/pages/KbView.tsx', 'w') as f:
    f.write(content)

print("Patch applied")
