import os
import re

bad_words = set()

for root, _, files in os.walk('e:/dropbox 2024/Dropbox/The Tropical Bakery/web-app/src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                words = re.findall(r'\b\w*[^\x00-\x7F]+\w*\b', content)
                for word in words:
                    bad_words.add(word)

for root, _, files in os.walk('e:/dropbox 2024/Dropbox/The Tropical Bakery/web-app/src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                words = re.findall(r'[A-Za-z]*[^\x00-\x7F]+[A-Za-z]*', content)
                for word in words:
                    bad_words.add(word)

print(sorted(list(bad_words)))
