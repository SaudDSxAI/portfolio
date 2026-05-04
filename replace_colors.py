import os

replacements = [
    ("bg-yellow-500 hover:bg-yellow-600 text-black", "bg-black hover:bg-zinc-800 text-white"),
    ("bg-yellow-500 text-black", "bg-black text-white"),
    ("bg-yellow-500/90 text-black", "bg-black/90 text-white"),
    ("text-yellow-400", "text-black"),
    ("text-yellow-300", "text-black"),
    ("text-yellow-500", "text-black"),
    ("text-yellow-600", "text-black"),
    ("text-yellow-700", "text-black"),
    ("border-yellow-400", "border-black"),
    ("border-yellow-500", "border-black"),
    ("ring-yellow-500", "ring-black"),
    ("bg-yellow-400", "bg-black"),
    ("bg-yellow-500", "bg-black"),
    ("bg-yellow-600", "bg-zinc-800"),
    ("hover:border-yellow-500", "hover:border-black"),
    ("hover:text-yellow-300", "hover:text-black"),
    ("hover:text-yellow-700", "hover:text-black"),
    ("marker:text-yellow-500", "marker:text-black"),
    ("yellow-500/10", "black/10"),
    ("yellow-500/20", "black/20"),
    ("yellow-500/25", "black/25"),
    ("yellow-500/30", "black/30"),
    ("yellow-400/30", "black/30"),
    ("yellow-500/40", "black/40"),
    ("yellow-500/50", "black/50"),
    ("yellow-500/90", "black/90"),
]

def apply_replacements(content):
    for old, new in replacements:
        content = content.replace(old, new)
    # catch any remaining yellow
    content = content.replace("yellow-500", "black")
    content = content.replace("yellow", "black")
    return content

for root, _, files in os.walk("frontend/src"):
    for file in files:
        if file.endswith((".js", ".jsx", ".css")):
            path = os.path.join(root, file)
            with open(path, "r") as f:
                content = f.read()
            
            new_content = apply_replacements(content)
            
            if content != new_content:
                with open(path, "w") as f:
                    f.write(new_content)
                print(f"Updated {path}")

# Also update main.py
with open("main.py", "r") as f:
    content = f.read()
new_content = apply_replacements(content)
if content != new_content:
    with open("main.py", "w") as f:
        f.write(new_content)
    print("Updated main.py")
