import os
import re

b2b_dir = r"E:\dropbox 2024\Dropbox\The Tropical Bakery\web-app\src\app\b2b"

for folder in os.listdir(b2b_dir):
    page_path = os.path.join(b2b_dir, folder, "page.tsx")
    if not os.path.isfile(page_path):
        continue
    
    with open(page_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract title
    title_match = re.search(r'<h1[^>]*>(.*?)</h1>', content)
    if not title_match:
        print(f"No h1 found in {folder}")
        continue
    title_text = title_match.group(1)

    # 1. We look for className="liquid-glass-card fade-in" style={{...}}
    # We will use regex to find the start of the card
    card_start_match = re.search(r'(<div\s+className="liquid-glass-card fade-in"\s+style={{[^}]*}}>)', content)
    
    if card_start_match:
        old_card_div_full = card_start_match.group(1)
        
        # We replace flexDirection: 'row' with flexDirection: 'column' and gap: '3rem' with gap: '2rem'
        new_card_div = old_card_div_full.replace("flexDirection: 'row'", "flexDirection: 'column'").replace("gap: '3rem'", "gap: '2rem'")
        
        # 2. Insert Banner and inner flex row
        banner_html = f'''{new_card_div}
          
          <div style={{{{ textAlign: 'center', borderBottom: '2px solid rgba(212,175,55,0.3)', paddingBottom: '1.5rem', width: '100%', marginBottom: '1rem' }}}}>
            <h1 style={{{{ fontSize: '3rem', color: '#3c2a21', fontFamily: 'var(--font-heading)', margin: 0 }}}}>{title_text}</h1>
          </div>

          <div style={{{{ display: 'flex', flexDirection: 'row', gap: '3rem', flexWrap: 'wrap', alignItems: 'center' }}}}>'''
              
        content = content.replace(old_card_div_full, banner_html)
        
        # 3. Remove the old <h1> completely (and its surrounding spaces if any)
        content = re.sub(r'<h1[^>]*>.*?</h1>\s*', '', content)
        
        # 4. Add the closing </div> for the inner flex row before the end of the card
        # The card closing </div> is just before {/* Treat Gallery Strip */}
        content = content.replace('        </div>\n      </div>\n\n      {/*', '        </div>\n        </div>\n      </div>\n\n      {/*')

        with open(page_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {folder}")
    else:
        print(f"Skipped {folder} (could not find old card div)")
