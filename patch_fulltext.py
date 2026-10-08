import re

with open('src/pages/KbView.tsx', 'r') as f:
    content = f.read()

# 1. Add helper function at the top of KbView
helper_str = """
const stripHtml = (html: string) => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};
"""
content = content.replace("export default function KbView() {", helper_str + "\nexport default function KbView() {")

# 2. Update search logic in the modal
search_logic_old = """            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {notes.filter(n => n.title.toLowerCase().includes(globalSearchInput.toLowerCase())).length > 0 ? (
                notes.filter(n => n.title.toLowerCase().includes(globalSearchInput.toLowerCase())).map(note => (
                  <div
                    key={note.id}
                    onClick={() => {
                      setActiveNote(note.id);
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
            </div>"""

search_logic_new = """            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(() => {
                const searchLower = globalSearchInput.toLowerCase();
                const filteredNotes = notes.filter(n => {
                  const titleMatch = n.title.toLowerCase().includes(searchLower);
                  const contentMatch = stripHtml(n.content).toLowerCase().includes(searchLower);
                  return titleMatch || contentMatch;
                });

                if (filteredNotes.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>
                      Aucune note ne correspond à "{globalSearchInput}"
                    </div>
                  );
                }

                return filteredNotes.map(note => {
                  const plainContent = stripHtml(note.content);
                  const contentIndex = plainContent.toLowerCase().indexOf(searchLower);
                  
                  let snippet = null;
                  if (contentIndex !== -1 && !note.title.toLowerCase().includes(searchLower)) {
                    const start = Math.max(0, contentIndex - 30);
                    const end = Math.min(plainContent.length, contentIndex + searchLower.length + 30);
                    snippet = (start > 0 ? "..." : "") + plainContent.substring(start, end) + (end < plainContent.length ? "..." : "");
                  }

                  return (
                    <div
                      key={note.id}
                      onClick={() => {
                        setActiveNote(note.id);
                        setIsSearchModalOpen(false);
                        setGlobalSearchInput('');
                      }}
                      style={{
                        padding: '1rem',
                        background: 'var(--surface-hover)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--primary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FileText size={18} />
                        <span style={{ fontWeight: '500' }}>{note.title}</span>
                      </div>
                      {snippet && (
                        <div style={{ 
                          marginTop: '0.5rem', 
                          fontSize: '0.85rem', 
                          color: 'rgba(255,255,255,0.7)',
                          paddingLeft: '2rem',
                          fontStyle: 'italic'
                        }}>
                          "{snippet}"
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>"""

content = content.replace(search_logic_old, search_logic_new)

with open('src/pages/KbView.tsx', 'w') as f:
    f.write(content)

print("Patch applied")
