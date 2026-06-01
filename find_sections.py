import os

start_dir = r"g:\My Drive\Project Numetric Inc"
for root, dirs, files in os.walk(start_dir):
    for f in files:
        path = os.path.join(root, f)
        # Avoid checking large binary files or archives
        if f.endswith(('.png', '.gsheet', '.zip', '.py', '.xlsx', '.pdf')):
            continue
        try:
            with open(path, 'r', encoding='utf-8', errors='ignore') as file:
                content = file.read()
            if '--> -->' in content or '-->' * 2 in content:
                print(f"Found '--> -->' in file: {path}")
            
            # Check for multiple -->
            lines = content.split('\n')
            for idx, line in enumerate(lines, 1):
                if line.count('-->') > 1:
                    print(f"File {path}: Line {idx} has {line.count('-->')} comment ends: {line.strip()[:100]}")
        except Exception as e:
            pass
print("Search complete.")
