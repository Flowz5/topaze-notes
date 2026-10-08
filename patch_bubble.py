import re

with open('src/components/TiptapEditor.tsx', 'r') as f:
    content = f.read()

# Replace the incorrect import
content = content.replace("tippyOptions={{ duration: 100 }}", "")

with open('src/components/TiptapEditor.tsx', 'w') as f:
    f.write(content)

print("Patch applied")
