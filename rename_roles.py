import os
import re

replacements = {
    r"role === 'N1'": "role === 'NIVEL1'",
    r"userRole === 'N1'": "userRole === 'NIVEL1'",
    r"role: 'N1'": "role: 'NIVEL1'",
    r"role: 'ANALISTA'": "role: 'NIVEL2'",
    r"useState\('N1'\)": "useState('NIVEL1')",
    r'<option value="N1">N1': '<option value="NIVEL1">Nível 1',
    r'<option value="ANALISTA">Analista': '<option value="NIVEL2">Nível 2',
    r"'ADMIN' : 'N1'": "'ADMIN' : 'NIVEL1'",
    r"@default\(N1\)": "@default(NIVEL1)"
}

files_to_check = [
    'prisma/schema.prisma',
    'prisma/seed.ts',
    'src/auth.ts',
    'src/components/layout/Header.tsx',
    'src/app/page.tsx',
    'src/app/scripts/[id]/page.tsx',
    'src/app/register/page.tsx',
    'src/app/api/users/route.ts',
    'src/app/api/categorias/route.ts',
    'src/app/api/tags/route.ts',
    'src/app/api/scripts/route.ts',
    'src/app/register/form.tsx'
]

base_path = r"c:\Users\mateus.pereira\Documents\app\base-sql"

for filepath in files_to_check:
    full_path = os.path.join(base_path, filepath.replace('/', '\\'))
    if os.path.exists(full_path):
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = content
        for k, v in replacements.items():
            new_content = re.sub(k, v, new_content)
            
        if filepath == 'prisma/schema.prisma':
            new_content = new_content.replace('  N1\n  ANALISTA', '  NIVEL1\n  NIVEL2')
            
        if new_content != content:
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filepath}")
