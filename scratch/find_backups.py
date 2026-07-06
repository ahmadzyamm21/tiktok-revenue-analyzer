import json

# Let's inspect the actual files they have in Downloads or check the localStorage if we can find any backup
# Wait, let's search if they have a backup file in Downloads!
import os
downloads_dir = r'C:\Users\ahmad\Downloads'
for root, dirs, files in os.walk(downloads_dir):
    for f in files:
        if 'backup' in f.lower() or 'tiktok' in f.lower():
            print(os.path.join(root, f))
