import json,sys,collections
src,dst=sys.argv[1],sys.argv[2]
d=json.loads(open(src,'rb').read().decode('utf-8','replace'),strict=False)
o=d['OBJECTS']
byh={x['handle'][-1]:x for x in o if 'handle' in x}
def lname(e):
    l=e.get('layer'); 
    if not l: return '?'
    x=byh.get(l[-1]); return x.get('name','?') if x else '?'
blocks={}  # block_header handle -> list of entities
out=[]
for e in o:
    t=e.get('entity')
    if not t or t in('BLOCK','ENDBLK'): continue
    r={'t':t,'L':lname(e),'own':e.get('ownerhandle',[0])[-1],'em':e.get('entmode')}
    for k in('start','end','center','radius','start_angle','end_angle','points','ins_pt','text_value','height','rotation','scale','text','x_axis_dir','rect_width','bulges','def_pt','xline1_pt','xline2_pt','act_measurement','user_text','text_midpt','const_width','flag','elevation'):
        if k in e: r[k]=e[k]
    if t=='INSERT': 
        b=byh.get(e['block_header'][-1]); r['blk']=b.get('name') if b else None; r['bh']=e['block_header'][-1]
    out.append(r)
bh={x['handle'][-1]:x.get('name') for x in o if x.get('object')=='BLOCK_HEADER'}
json.dump({'ents':out,'bh':bh},open(dst,'w'))
c=collections.Counter((r['em'],r['L']) for r in out)
for k,v in sorted(c.items(),key=lambda kv:-kv[1])[:60]: print(k,v)
print(bh)
