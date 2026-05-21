from pathlib import Path
s=Path('src/index.css').read_text(encoding='utf-8')
lines=s.splitlines()
for i,line in enumerate(lines,1):
    if line.strip().startswith('@layer'):
        start=i
        bal=0
        for j in range(i-1,len(lines)):
            bal += lines[j].count('{') - lines[j].count('}')
            if bal==0:
                end=j+1
                print(f'Layer start {start} ends {end}')
                break
        else:
            print('Layer at',start,'has no end')
