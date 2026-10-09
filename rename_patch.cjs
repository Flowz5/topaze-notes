const fs = require('fs');
let code = fs.readFileSync('src/pages/KbView.tsx', 'utf8');

const renameFn = `
  const handleRenameFolder = async (folderId: string, oldName: string) => {
    if (!id) return;
    const newName = window.prompt('Nouveau nom du dossier :', oldName);
    if (!newName || newName.trim() === '' || newName === oldName) return;
    try {
      await updateDoc(doc(db, \`knowledgeBases/\${id}/folders\`, folderId), { name: newName.trim() });
    } catch (err) {
      console.error(err);
      alert('Erreur lors du renommage du dossier.');
    }
  };
`;
code = code.replace('const createNoteInFirestore =', renameFn + '\n  const createNoteInFirestore =');

const renameBtn = `<button className="add-note-btn" title="Renommer le dossier" onClick={(e) => { e.stopPropagation(); handleRenameFolder(folder.id, folder.name); }}><Edit2 size={14} /></button>`;
code = code.replace('<button className="add-note-btn" title="Ajouter une note"', renameBtn + '\n                <button className="add-note-btn" title="Ajouter une note"');

fs.writeFileSync('src/pages/KbView.tsx', code);
