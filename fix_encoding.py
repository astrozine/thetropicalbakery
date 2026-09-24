import os

def fix_mojibake(filepath):
    with open(filepath, 'rb') as f:
        raw = f.read()
    try:
        # The file was saved as UTF-8 but containing CP1252 interpretations of UTF-8.
        # First, we read the current UTF-8 string:
        text = raw.decode('utf-8')
        
        # Then we encode it back to CP1252 to recover the original UTF-8 bytes:
        original_bytes = text.encode('cp1252')
        
        # Then we decode those original bytes as UTF-8 to get the true text:
        fixed_text = original_bytes.decode('utf-8')
        
        # Write back correctly
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(fixed_text)
        print(f"Fixed {filepath}")
    except Exception as e:
        # Skip files that aren't mojibaked in this specific way
        pass

for root, _, files in os.walk('e:/dropbox 2024/Dropbox/The Tropical Bakery/web-app/src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts') or file.endswith('.css'):
            fix_mojibake(os.path.join(root, file))
