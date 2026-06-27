import os
import re

for root, dirs, files in os.walk('.'):
    for file in files:
        if file.endswith('.html'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # fix jsdelivr
            content = re.sub(r'cdn\.js\?v=\d+delivr\.net', 'cdn.jsdelivr.net', content)
            
            # remove ?v= from all http/https CDN links
            content = re.sub(r'(https?://[^"\'\s]+(?:\.js|\.css))\?v=\d+', r'\1', content)
            
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
