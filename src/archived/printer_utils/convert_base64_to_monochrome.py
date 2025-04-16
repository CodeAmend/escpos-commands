from PIL import Image

def resize_signature(input_path, output_path, new_width):
    with Image.open(input_path) as img:
        # Calculate new height maintaining aspect ratio
        width_percent = (new_width / float(img.size[0]))
        new_height = int((float(img.size[1]) * float(width_percent)))
        
        # Use LANCZOS resampling for high-quality downsampling
        resized_img = img.resize((new_width, new_height), Image.LANCZOS)
        
        # Enhance contrast to make signature more visible
        from PIL import ImageEnhance
        enhancer = ImageEnhance.Contrast(resized_img)
        enhanced_img = enhancer.enhance(2.0)  # Adjust factor as needed
        
        enhanced_img.save(output_path)

