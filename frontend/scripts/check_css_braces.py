from pathlib import Path
p=Path('src/index.css')
s=p.read_text(encoding='utf-8')
open_count=s.count('{')
close_count=s.count('}')
print('open',open_count,'close',close_count)
oc=0
cc=0
lines=s.splitlines()
for i,line in enumerate(lines, start=1):
    oc += line.count('{')
    cc += line.count('}')
    if oc == open_count:
        print('last open brace at line', i)
        print('line:', line)
        break
# print tail
print('\nlast 10 lines:')
for i in range(max(0,len(lines)-10), len(lines)):
    print(i+1, lines[i])
