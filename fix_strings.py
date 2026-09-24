import os

replacements = {
    'Ã¡': 'á',
    'Ã¢': 'â',
    'Ã£': 'ã',
    'Ã§': 'ç',
    'Ã©': 'é',
    'Ãª': 'ê',
    'Ã­': 'í',
    'Ã³': 'ó',
    'Ã´': 'ô',
    'Ãµ': 'õ',
    'Ãº': 'ú',
    'Ã‡': 'Ç',
    'Ã‰': 'É',
    'ÃŠ': 'Ê',
    'Ã“': 'Ó',
    'Ã”': 'Ô',
    'Ã•': 'Õ',
    'Ãš': 'Ú',
    'Ã€': 'À',
    'Ã ': 'Á',
    'Ã‚': 'Â',
    'Ãƒ': 'Ã',
    'Olǭ': 'Olá',
    'prǭtico': 'prático',
    'rǭpida': 'rápida',
    'prǭtica': 'prática',
    'Saudǭvel': 'Saudável',
    'Culinǭria': 'Culinária',
    'Bǭsica': 'Básica',
    'fǭcil': 'fácil',
    'mǭgico': 'mágico',
    'Mǭgico': 'Mágico',
    'Fǭcil': 'Fácil',
    'Ã³rico': 'órico',
    'PeÃ§a': 'Peça'
}

for root, _, files in os.walk('e:/dropbox 2024/Dropbox/The Tropical Bakery/web-app/src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for bad, good in replacements.items():
                new_content = new_content.replace(bad, good)
                
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed string encoding in {filepath}")
