import base64

image = open('/Users/johnnyzhong/terrahacks/Terrahacks2025/Screenshot 2025-07-13 at 4.04.42 PM.png', 'rb')
image_bytes = image.read()

# Convert bytes to base64 string
base64_string = base64.b64encode(image_bytes).decode('utf-8')

# Write base64 string to text file
with open('output.txt', 'w') as text_file:
    text_file.write(base64_string)