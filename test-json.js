function extractMentions(node) {
  let mentions = [];
  if (node.type === 'mention' && node.attrs && node.attrs.id) {
    mentions.push(node.attrs.id);
  }
  if (node.content) {
    node.content.forEach(child => {
      mentions = mentions.concat(extractMentions(child));
    });
  }
  return mentions;
}

const doc = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Hello ' },
        { type: 'mention', attrs: { id: '123', label: 'Titre' } }
      ]
    }
  ]
};

console.log(extractMentions(doc));
