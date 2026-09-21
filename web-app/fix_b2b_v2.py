import os

pages = {
    'affiliates': 'Afiliados de Saúde',
    'airbnbs': 'Anfitriões do Airbnb',
    'bakeries': 'Padarias & Lojas',
    'hotels': 'Hotéis Boutique',
    'pousadas': 'Pousadas Charmosas',
    'restaurants': 'Restaurantes',
    'travel-managers': 'Gestores de Viagens'
}

base_dir = r'E:\dropbox 2024\Dropbox\The Tropical Bakery\web-app\src\app\[locale]\b2b'

for folder, title in pages.items():
    filepath = os.path.join(base_dir, folder, 'page.tsx')
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # The script left this empty block in the card:
        empty_block = """          <div style={{ textAlign: 'center', borderBottom: '2px solid rgba(212,175,55,0.3)', paddingBottom: '1.5rem', width: '100%', marginBottom: '1rem' }}>
            </div>"""
        
        if empty_block in content:
            # We want to place the title ABOVE the card, right after the container div
            container_tag = '<div className="container" style={{ padding: \'6rem 2rem\' }}>'
            
            new_header = f"""<div className="container" style={{{{ padding: '6rem 2rem' }}}}>
        {{/* Dynamic Header inserted by fix script */}}
        <div className="w-full text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-[#4a3b32] mb-6">
            {title}
          </h1>
          <div className="w-24 h-1 bg-[#d4af37] mx-auto mb-8"></div>
        </div>"""
            
            # Replace the container start tag with container + new header
            content = content.replace(container_tag, new_header)
            
            # Remove the empty block from inside the card
            content = content.replace(empty_block, "")
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed {folder}")
        else:
            print(f"Empty block not found in {folder}, might be already fixed.")
    else:
        print(f"File not found: {filepath}")
