import re

with open('src/components/TiptapEditor.tsx', 'r') as f:
    content = f.read()

content = content.replace("tippyOptions={{ duration: 100 } as any}", "")

with open('src/components/TiptapEditor.tsx', 'w') as f:
    f.write(content)

print("Patch applied")
