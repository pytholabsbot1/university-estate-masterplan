# render entities to SVG within bbox: render.py ents.json out.svg [x0 y0 x1 y1] [px]
import json,sys,math,html
D=json.load(open(sys.argv[1])); E=D['ents']
inmodel=[e for e in E if e['own']==2 or e['em']==2 and e['own'] not in D['bh']]
bb=list(map(float,sys.argv[3:7])) if len(sys.argv)>6 else None
W=int(sys.argv[7]) if len(sys.argv)>7 else 3000
pts=[]
def P(p): return (p[0],p[1])
segs=[];txt=[]
for e in E:
    if e['em']!=2: continue
    t=e['t']
    if t=='LINE': segs.append((P(e['start']),P(e['end']),e['L']))
    elif t=='LWPOLYLINE':
        ps=[P(p) for p in e.get('points',[])]
        for a,b in zip(ps,ps[1:]): segs.append((a,b,e['L']))
        if e.get('flag',0)&512 or e.get('flag',0)&1: 
            if len(ps)>2: segs.append((ps[-1],ps[0],e['L']))
    elif t in('CIRCLE','ARC'):
        c=e['center'];r=e['radius'];a0=e.get('start_angle',0);a1=e.get('end_angle',2*math.pi)
        if a1<a0: a1+=2*math.pi
        n=24;pp=[(c[0]+r*math.cos(a0+(a1-a0)*i/n),c[1]+r*math.sin(a0+(a1-a0)*i/n)) for i in range(n+1)]
        for a,b in zip(pp,pp[1:]): segs.append((a,b,e['L']))
    elif t in('TEXT','MTEXT'):
        v=e.get('text_value') or e.get('text') or ''
        txt.append((P(e['ins_pt']),v,e.get('height',0.2),e.get('rotation',0),e['L']))
if not bb:
    xs=[p[0] for s in segs for p in s[:2]];ys=[p[1] for s in segs for p in s[:2]]
    xs.sort();ys.sort();n=len(xs)
    bb=[xs[int(n*.01)],ys[int(n*.01)],xs[int(n*.99)],ys[int(n*.99)]]
    print('bbox',bb)
x0,y0,x1,y1=bb;s=W/(x1-x0);H=int((y1-y0)*s)
col={'SITE_PLAN':'#000','win':'#06c','door':'#c60','column':'#a00','STAIRS':'#080','elevation':'#909','ELE':'#909','ELE-2':'#909','ELE-3':'#909'}
o=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><rect width="100%" height="100%" fill="#fff"/>']
def T(p): return ((p[0]-x0)*s,(y1-p[1])*s)
for a,b,L in segs:
    if not(min(a[0],b[0])<=x1 and max(a[0],b[0])>=x0 and min(a[1],b[1])<=y1 and max(a[1],b[1])>=y0): continue
    A=T(a);B=T(b);o.append(f'<line x1="{A[0]:.1f}" y1="{A[1]:.1f}" x2="{B[0]:.1f}" y2="{B[1]:.1f}" stroke="{col.get(L,"#888")}" stroke-width="1"/>')
for p,v,h,r,L in txt:
    if not(x0<=p[0]<=x1 and y0<=p[1]<=y1): continue
    A=T(p);fs=max(h*s,7)
    o.append(f'<text x="{A[0]:.1f}" y="{A[1]:.1f}" font-size="{fs:.1f}" fill="#d00" transform="rotate({-math.degrees(r):.1f} {A[0]:.1f} {A[1]:.1f})" font-family="sans-serif">{html.escape(v[:60])}</text>')
o.append('</svg>');open(sys.argv[2],'w').write(''.join(o))
