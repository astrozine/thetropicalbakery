from PIL import Image

def remove_black_background(input_path, output_path, threshold=20):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        # If the pixel is dark (r, g, b < threshold) make it transparent
        if item[0] < threshold and item[1] < threshold and item[2] < threshold:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print("Saved transparent image to", output_path)

if __name__ == "__main__":
    remove_black_background(
        "C:/Users/User/.gemini/antigravity-ide/brain/a6b65201-3157-48a5-ae4c-06509061f6a6/.user_uploaded/media_1789724698986.png",
        "E:/dropbox 2024/Dropbox/The Tropical Bakery/web-app/public/hero-logo-transparent.png",
        threshold=40
    )
