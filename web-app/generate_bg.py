from PIL import Image, ImageDraw
import math

width, height = 1920, 1080
# Create a larger image to rotate
img_size = int(math.hypot(width, height)) * 2
img = Image.new('RGB', (img_size, img_size), '#fdfaf3')
draw = ImageDraw.Draw(img)

pattern_length = 16
# We need to cover the whole width
for x in range(0, img_size, pattern_length):
    # #ebd9b4 from x+10 to x+14 (width 4)
    draw.rectangle([x+10, 0, x+13, img_size], fill='#ebd9b4')
    # #c9a67a from x+14 to x+16 (width 2)
    draw.rectangle([x+14, 0, x+15, img_size], fill='#c9a67a')

# Rotate 45 degrees
rotated = img.rotate(45, resample=Image.BICUBIC, center=(img_size//2, img_size//2))

# Crop to the center
w_rot, h_rot = rotated.size
left = (w_rot - width) // 2
top = (h_rot - height) // 2
final_img = rotated.crop((left, top, left + width, top + height))

# Save the image
final_img.save('e:/dropbox 2024/Dropbox/The Tropical Bakery/web-app/public/diagonal_background.jpg', quality=95)
print("Image saved as public/diagonal_background.jpg")
