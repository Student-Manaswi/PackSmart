from pathlib import Path
s=Path('src/index.css').read_text(encoding='utf-8')
bal=0
maxbal=0
maxi=0
lines=s.splitlines()
for i,l in enumerate(lines,1):
    bal += l.count('{') - l.count('}')
    if bal>maxbal:
        maxbal=bal; maxi=i
    if bal<0:
        print('Negative balance at',i);
        break
print('final balance',bal)
print('max balance',maxbal,'at line',maxi)
print('line',maxi,lines[maxi-1])
for j in range(max(0,maxi-3), maxi+3):
    print(j+1, lines[j])
