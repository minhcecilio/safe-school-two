import re

def check_duplicate_decls(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    decls = {}
    for idx, line in enumerate(lines, 1):
        matches = re.findall(r'\b(?:const|let|var|function)\s+([a-zA-Z_][a-zA-Z0-9_]*)', line)
        for v in matches:
            if v in decls:
                print(f'{filename}: Duplicate declaration of "{v}" at line {idx} (previously at line {decls[v]})')
            else:
                decls[v] = idx

check_duplicate_decls('src/js/firebaseConfig.js')
check_duplicate_decls('safe-school-two/src/js/firebaseConfig.js')
