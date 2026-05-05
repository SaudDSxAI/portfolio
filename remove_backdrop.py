import os
import re
from pathlib import Path

def remove_backdrop_blur(directory):
    pattern = re.compile(r'\bbackdrop-blur-(?:sm|md|lg|xl|2xl|3xl|none)\b')
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.jsx'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r') as f:
                    content = f.read()
                
                new_content = pattern.sub('', content)
                # also remove plain backdrop-blur
                new_content = re.sub(r'\bbackdrop-blur\b', '', new_content)
                
                # clean up multiple spaces
                new_content = re.sub(r' +', ' ', new_content)
                
                if content != new_content:
                    with open(filepath, 'w') as f:
                        f.write(new_content)
                    print(f"Updated {filepath}")

remove_backdrop_blur('frontend/src/components')
