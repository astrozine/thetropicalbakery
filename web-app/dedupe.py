import os
import imagehash
from PIL import Image
import json

def visual_audit(directory):
    """Generate hashes for all images and group visually similar ones."""
    files = sorted([f for f in os.listdir(directory) if f.lower().endswith(('.png', '.jpg', '.jpeg'))])
    print(f"Scanning {len(files)} images...")
    
    hashes = []
    for filename in files:
        filepath = os.path.join(directory, filename)
        try:
            with Image.open(filepath) as img:
                hash_val = imagehash.phash(img)
                hashes.append((hash_val, filename))
        except Exception as e:
            print(f"Error processing {filename}: {e}")
    
    # Find groups of similar images
    used = set()
    groups = []
    for i, (h1, f1) in enumerate(hashes):
        if f1 in used:
            continue
        group = [f1]
        used.add(f1)
        for j, (h2, f2) in enumerate(hashes):
            if j <= i or f2 in used:
                continue
            distance = abs(h1 - h2)
            if distance <= 18:  # broader threshold
                group.append(f2)
                used.add(f2)
                print(f"  Similar: {f1} <-> {f2} (distance: {distance})")
        if len(group) > 1:
            groups.append(group)
    
    print(f"\nFound {len(groups)} groups of similar images:")
    for i, group in enumerate(groups):
        print(f"  Group {i+1}: {group}")
    
    return groups

if __name__ == "__main__":
    menu_dir = os.path.join(os.getcwd(), 'public', 'menu-items')
    groups = visual_audit(menu_dir)
