# Write a clean DXF (R2013) from the entities extracted out of the DWG by LibreDWG's JSON output.
import json,sys,math,collections,ezdxf
D=json.load(open(sys.argv[1]));out=sys.argv[2]
doc=ezdxf.new('R2013',setup=True);doc.units=ezdxf.units.M;msp=doc.modelspace()
skip_owner={53,66,719}  # door/oblique arrow blocks and the tree block
def ok(e): return e['em']==2 or (e['own'] not in skip_owner and e['em']!=2)
def lay(n):
    n=n if n and n!='?' else 'WALL'
    n=n.replace('*','_')
    if n not in doc.layers: doc.layers.add(n)
    return n
c=collections.Counter()
for e in D['ents']:
    if not ok(e): continue
    a={'layer':lay(e['L'])};t=e['t']
    try:
        if t=='LINE': msp.add_line(e['start'][:2],e['end'][:2],dxfattribs=a)
        elif t=='LWPOLYLINE':
            ps=e.get('points',[]);bs=e.get('bulges') or [0]*len(ps)
            if len(ps)<2: continue
            pts=[(p[0],p[1],0,0,(bs[i] if i<len(bs) else 0)) for i,p in enumerate(ps)]
            msp.add_lwpolyline(pts,format='xyseb',close=bool(e.get('flag',0)&513),dxfattribs=a)
        elif t=='CIRCLE': msp.add_circle(e['center'][:2],e['radius'],dxfattribs=a)
        elif t=='ARC': msp.add_arc(e['center'][:2],e['radius'],math.degrees(e['start_angle']),math.degrees(e['end_angle']),dxfattribs=a)
        elif t=='TEXT':
            msp.add_text(e.get('text_value',''),height=e.get('height',.2),rotation=math.degrees(e.get('rotation',0)),dxfattribs=a).set_placement(e['ins_pt'][:2])
        elif t=='MTEXT':
            m=msp.add_mtext(e.get('text',''),dxfattribs=dict(a,char_height=e.get('height',.2),insert=tuple(e['ins_pt'][:2])+(0,)))
        else: continue
        c[t]+=1
    except Exception as ex: c['err_'+t]+=1
doc.saveas(out);print(dict(c))
