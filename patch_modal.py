import re

with open('src/pages/KbView.tsx', 'r') as f:
    content = f.read()

# Emojis in Title
content = content.replace("Bienvenue sur Topaze Notes 💎", "Bienvenue sur Topaze Notes")

# Emojis in List Titles
content = content.replace("🔗 Liens Bidirectionnels (Backlinks)", "Liens Bidirectionnels (Backlinks)")
content = content.replace("🔍 Recherche Globale", "Recherche Globale")
content = content.replace("📂 Organisation", "Organisation")

# Replace Todo by Markdown Syntax
todo_old = """<strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.5rem' }}>✅ To-Do Lists</strong>
                  Tape <kbd style={{ background: 'var(--surface)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>[ ]</kbd> suivi d'un espace pour créer une liste de tâches interactive. Tu peux aussi utiliser le menu flottant."""
todo_new = """<strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.5rem' }}>Syntaxe Markdown</strong>
                  L'éditeur supporte la syntaxe Markdown standard : <b>gras</b> avec <kbd style={{ background: 'var(--surface)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>**</kbd>, <i>italique</i> avec <kbd style={{ background: 'var(--surface)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>*</kbd>, titres avec <kbd style={{ background: 'var(--surface)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>#</kbd>, blocs de code avec <kbd style={{ background: 'var(--surface)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>```</kbd>, et listes de tâches avec <kbd style={{ background: 'var(--surface)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>[ ]</kbd>."""
content = content.replace(todo_old, todo_new)

with open('src/pages/KbView.tsx', 'w') as f:
    f.write(content)

print("Patch applied")
