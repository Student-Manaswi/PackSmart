from pathlib import Path
lines=Path('src/index.css').read_text(encoding='utf-8').splitlines()
bal=0
for i,l in enumerate(lines,1):
    bal+=l.count('{')-l.count('}')
    if i<=220 and bal>0:
        print(i, bal, l)
    if i==220:
        break
print('...')
print('balance at 220',bal)
