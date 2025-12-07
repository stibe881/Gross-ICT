import os
from PIL import Image

def convert_to_webp(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                file_path = os.path.join(root, file)
                file_name, _ = os.path.splitext(file)
                output_path = os.path.join(root, f"{file_name}.webp")
                
                try:
                    with Image.open(file_path) as img:
                        img.save(output_path, 'WEBP', quality=85)
                        print(f"Converted: {file_path} -> {output_path}")
                except Exception as e:
                    print(f"Error converting {file_path}: {e}")

if __name__ == "__main__":
    convert_to_webp('/home/ubuntu/gross_ict/client/public/images')
