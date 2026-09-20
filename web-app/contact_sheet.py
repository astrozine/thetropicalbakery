import os
from PIL import Image
import math

def create_contact_sheet(directory, output_path, cols=5, thumb_size=200):
    """Create a contact sheet of all images for visual inspection."""
    files = sorted([f for f in os.listdir(directory) if f.lower().endswith(('.png', '.jpg', '.jpeg'))])
    n = len(files)
    rows = math.ceil(n / cols)
    
    # Create the contact sheet
    sheet_width = cols * (thumb_size + 10) + 10
    sheet_height = rows * (thumb_size + 40) + 10
    sheet = Image.new('RGB', (sheet_width, sheet_height), 'white')
    
    from PIL import ImageDraw, ImageFont
    draw = ImageDraw.Draw(sheet)
    
    for idx, filename in enumerate(files):
        filepath = os.path.join(directory, filename)
        try:
            with Image.open(filepath) as img:
                img.thumbnail((thumb_size, thumb_size))
                row = idx // cols
                col = idx % cols
                x = 10 + col * (thumb_size + 10)
                y = 10 + row * (thumb_size + 40)
                sheet.paste(img, (x, y))
                # Draw the index number
                draw.text((x, y + thumb_size + 2), f"#{idx}: {filename[:20]}", fill='black')
        except Exception as e:
            print(f"Error processing {filename}: {e}")
    
    sheet.save(output_path)
    print(f"Contact sheet saved to {output_path}")
    print(f"Total images: {n}")
    for idx, f in enumerate(files):
        print(f"  #{idx}: {f}")

if __name__ == "__main__":
    menu_dir = os.path.join(os.getcwd(), 'public', 'menu-items')
    create_contact_sheet(menu_dir, 'contact_sheet.jpg')
