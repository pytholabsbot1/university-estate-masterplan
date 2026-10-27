param([string]$img, [string]$seedsFile, [string]$out, [double]$res = 0.5, [int]$close = 4)
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;
using System.Text;
public static class F {
  static bool[] Box(bool[] src, int W, int H, int r) {
    var tmp = new bool[W*H]; var res = new bool[W*H];
    for (int y=0;y<H;y++){ int[] ps=new int[W+1]; for(int x=0;x<W;x++) ps[x+1]=ps[x]+(src[y*W+x]?1:0);
      for(int x=0;x<W;x++){int a=Math.Max(0,x-r),b=Math.Min(W-1,x+r); tmp[y*W+x]=ps[b+1]-ps[a]>0;} }
    for (int x=0;x<W;x++){ int[] ps=new int[H+1]; for(int y=0;y<H;y++) ps[y+1]=ps[y]+(tmp[y*W+x]?1:0);
      for(int y=0;y<H;y++){int a=Math.Max(0,y-r),b=Math.Min(H-1,y+r); res[y*W+x]=ps[b+1]-ps[a]>0;} }
    return res;
  }
  static bool[] Not(bool[] a){ var r=new bool[a.Length]; for(int i=0;i<a.Length;i++) r[i]=!a[i]; return r; }
  public static string Run(string src, string seeds, string outp, double res, int close) {
    var bmp = new Bitmap(src); int W=bmp.Width, H=bmp.Height;
    var bd = bmp.LockBits(new Rectangle(0,0,W,H), ImageLockMode.ReadOnly, PixelFormat.Format24bppRgb);
    var buf = new byte[bd.Stride*H]; System.Runtime.InteropServices.Marshal.Copy(bd.Scan0, buf, 0, buf.Length);
    int st = bd.Stride; bmp.UnlockBits(bd);
    var fillable = new bool[W*H];
    for (int y=0;y<H;y++) for (int x=0;x<W;x++){ int i=y*st+x*3; int b=buf[i],g=buf[i+1],r=buf[i+2];
      fillable[y*W+x] = r>215 && g>195 && b>130 && b<225 && (r-b)>25; }
    var sel = new bool[W*H]; var sb = new StringBuilder();
    foreach (var line in System.IO.File.ReadAllLines(seeds)) {
      var t=line.Trim(); if(t==""||t.StartsWith("#")) continue;
      var p=t.Split(','); string name=p[0]; int sx=int.Parse(p[1]), sy=int.Parse(p[2]);
      // nudge to nearest fillable pixel within 12 px
      int k0=-1; for(int rr=0;rr<=12&&k0<0;rr++) for(int dy=-rr;dy<=rr&&k0<0;dy++) for(int dx=-rr;dx<=rr&&k0<0;dx++){
        int xx=sx+dx,yy=sy+dy; if(xx>=0&&yy>=0&&xx<W&&yy<H&&fillable[yy*W+xx]) k0=yy*W+xx; }
      if(k0<0){ sb.AppendLine(name+",NOSEED"); continue; }
      var vis=new bool[W*H]; var q=new Queue<int>(); q.Enqueue(k0); vis[k0]=true; long n=0; bool edge=false;
      while(q.Count>0){ int k=q.Dequeue(); n++; int x=k%W,y=k/W; if(x==0||y==0||x==W-1||y==H-1) edge=true;
        int[] nb={x>0?k-1:-1,x<W-1?k+1:-1,y>0?k-W:-1,y<H-1?k+W:-1};
        foreach(int m in nb) if(m>=0&&!vis[m]&&fillable[m]){vis[m]=true;q.Enqueue(m);} }
      if (p.Length>=7) { // keep only the side of line A->B where the seed lies
        double ax=double.Parse(p[3]),ay=double.Parse(p[4]),bx=double.Parse(p[5]),by=double.Parse(p[6]);
        Func<int,int,double> side=(x,y)=>(bx-ax)*(y-ay)-(by-ay)*(x-ax);
        double s0=side(sx,sy); n=0;
        for(int i=0;i<W*H;i++) if(vis[i]){ if(side(i%W,i/W)*s0>0) n++; else vis[i]=false; }
      }
      for(int i=0;i<W*H;i++) if(vis[i]) sel[i]=true;
      sb.AppendLine(string.Format("{0},{1:F4} ha{2}", name, n*res*res/10000.0, edge?",TOUCHES_EDGE":""));
    }
    // close (dilate then erode) to absorb boundary lines/labels, then fill holes
    var d = Box(sel,W,H,close); var c = Not(Box(Not(d),W,H,close));
    var outside=new bool[W*H]; var q2=new Queue<int>();
    for(int x=0;x<W;x++) foreach(int y in new[]{0,H-1}){int k=y*W+x; if(!c[k]&&!outside[k]){outside[k]=true;q2.Enqueue(k);}}
    for(int y=0;y<H;y++) foreach(int x in new[]{0,W-1}){int k=y*W+x; if(!c[k]&&!outside[k]){outside[k]=true;q2.Enqueue(k);}}
    while(q2.Count>0){int k=q2.Dequeue(); int x=k%W,y=k/W; int[] nb={x>0?k-1:-1,x<W-1?k+1:-1,y>0?k-W:-1,y<H-1?k+W:-1};
      foreach(int m in nb) if(m>=0&&!c[m]&&!outside[m]){outside[m]=true;q2.Enqueue(m);} }
    long area=0; for(int i=0;i<W*H;i++) if(!outside[i]) area++;
    sb.AppendLine(string.Format("UNION,{0:F4} ha,{1} px", area*res*res/10000.0, area));
    var o=new Bitmap(src);
    var ob=o.LockBits(new Rectangle(0,0,W,H), ImageLockMode.ReadWrite, PixelFormat.Format24bppRgb);
    var obuf=new byte[ob.Stride*H]; System.Runtime.InteropServices.Marshal.Copy(ob.Scan0, obuf, 0, obuf.Length);
    for(int y=0;y<H;y++) for(int x=0;x<W;x++) if(!outside[y*W+x]){ int i=y*ob.Stride+x*3; obuf[i]=(byte)(obuf[i]/2); obuf[i+1]=(byte)(obuf[i+1]/2+60); obuf[i+2]=(byte)(obuf[i+2]/3);}
    System.Runtime.InteropServices.Marshal.Copy(obuf,0,ob.Scan0,obuf.Length); o.UnlockBits(ob); o.Save(outp, ImageFormat.Png);
    // save raw mask too
    var mk=new Bitmap(W,H); var mb=mk.LockBits(new Rectangle(0,0,W,H), ImageLockMode.WriteOnly, PixelFormat.Format24bppRgb);
    var mbuf=new byte[mb.Stride*H]; for(int y=0;y<H;y++) for(int x=0;x<W;x++){byte v=(byte)(outside[y*W+x]?0:255); int i=y*mb.Stride+x*3; mbuf[i]=v;mbuf[i+1]=v;mbuf[i+2]=v;}
    System.Runtime.InteropServices.Marshal.Copy(mbuf,0,mb.Scan0,mbuf.Length); mk.UnlockBits(mb); mk.Save(outp.Replace(".png","_mask.png"), ImageFormat.Png);
    return sb.ToString();
  }
}
"@
[F]::Run($img, $seedsFile, $out, $res, $close)
