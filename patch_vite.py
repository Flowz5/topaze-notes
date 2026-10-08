import re

with open('vite.config.ts', 'r') as f:
    content = f.read()

content = content.replace("registerType: 'autoUpdate',", "registerType: 'autoUpdate',\n      workbox: { maximumFileSizeToCacheInBytes: 5000000 },")

with open('vite.config.ts', 'w') as f:
    f.write(content)

print("Patch applied")
