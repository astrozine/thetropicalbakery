from PIL import Image

def crop_transparent(img_path):
    img = Image.open(img_path).convert("RGBA")
    
    # Get bounding box of non-transparent pixels
    bbox = img.getbbox()
    
    if bbox:
        cropped_img = img.crop(bbox)
        cropped_img.save(img_path)
        print(f"Successfully cropped {img_path} to {bbox}")
    else:
        print(f"Image {img_path} is completely transparent or empty.")

if __name__ == '__main__':
    crop_transparent('e:/dropbox 2024/Dropbox/The Tropical Bakery/web-app/public/hero-logo-transparent.png')
