Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;
public static class M {
  static bool[] Box(bool[] src, int W, int H, int r) {
    var tmp = new int[W*H];
    var res = new bool[W*H];
    // horizontal prefix sums
    for (int y=0;y<H;y++) {
      int[] ps = new int[W+1];
      for (int x=0;x<W;x++) ps[x+1]=ps[x]+(src[y*W+x]?1:0);
      for (int x=0;x<W;x++) { int a=Math.Max(0,x-r), b=Math.Min(W-1,x+r); tmp[y*W+x]=(ps[b+1]-ps[a])>0?1:0; }
    }
    for (int x=0;x<W;x++) {
      int[] ps = new int[H+1];
      for (int y=0;y<H;y++) ps[y+1]=ps[y]+tmp[y*W+x];
      for (int y=0;y<H;y++) { int a=Math.Max(0,y-r), b=Math.Min(H-1,y+r); res[y*W+x]=(ps[b+1]-ps[a])>0; }
    }
    return res;
  }
  public static string Run(string src, string maskOut) {
    var bmp = new Bitmap(src);
    int W = bmp.Width, H = bmp.Height;
    var bd = bmp.LockBits(new Rectangle(0,0,W,H), ImageLockMode.ReadOnly, PixelFormat.Format24bppRgb);
    var buf = new byte[bd.Stride*H];
    System.Runtime.InteropServices.Marshal.Copy(bd.Scan0, buf, 0, buf.Length);
    int stride = bd.Stride;
    bmp.UnlockBits(bd);
    var line = new bool[W*H];
    int nl = 0;
    for (int y=0;y<H;y++) for (int x=0;x<W;x++) {
      int i=y*stride+x*3; int b=buf[i], g=buf[i+1], r=buf[i+2];
      if (r>190 && g>190 && b<140 && (r-b)>90 && (g-b)>90) { line[y*W+x]=true; nl++; }
    }
    int R = 40;
    var d = Box(line, W, H, R);
    // flood fill outside from border
    var outside = new bool[W*H];
    var q = new Queue<int>();
    for (int x=0;x<W;x++){ foreach (int y in new[]{0,H-1}) { int k=y*W+x; if(!d[k]&&!outside[k]){outside[k]=true;q.Enqueue(k);} } }
    for (int y=0;y<H;y++){ foreach (int x in new[]{0,W-1}) { int k=y*W+x; if(!d[k]&&!outside[k]){outside[k]=true;q.Enqueue(k);} } }
    while(q.Count>0){ int k=q.Dequeue(); int x=k%W, y=k/W;
      if(x>0){int n=k-1; if(!d[n]&&!outside[n]){outside[n]=true;q.Enqueue(n);}}
      if(x<W-1){int n=k+1; if(!d[n]&&!outside[n]){outside[n]=true;q.Enqueue(n);}}
      if(y>0){int n=k-W; if(!d[n]&&!outside[n]){outside[n]=true;q.Enqueue(n);}}
      if(y<H-1){int n=k+W; if(!d[n]&&!outside[n]){outside[n]=true;q.Enqueue(n);}} }
    outside = Box(outside, W, H, R);
    long area=0; int minx=W,maxx=0,miny=H,maxy=0;
    for (int y=0;y<H;y++) for (int x=0;x<W;x++) if(!outside[y*W+x]) { area++; if(x<minx)minx=x; if(x>maxx)maxx=x; if(y<miny)miny=y; if(y>maxy)maxy=y; }
    // min-area rotated bbox
    double bestA=1e18, bestAng=0, bw=0, bh=0;
    for (int a=0;a<180;a++) {
      double th=a*Math.PI/180, c=Math.Cos(th), s=Math.Sin(th);
      double u0=1e18,u1=-1e18,v0=1e18,v1=-1e18;
      for (int y=miny;y<=maxy;y+=2) for (int x=minx;x<=maxx;x+=2) if(!outside[y*W+x]) {
        double u=x*c+y*s, v=-x*s+y*c; if(u<u0)u0=u; if(u>u1)u1=u; if(v<v0)v0=v; if(v>v1)v1=v; }
      double ar=(u1-u0)*(v1-v0); if(ar<bestA){bestA=ar;bestAng=a;bw=u1-u0;bh=v1-v0;}
    }
    // save mask
    var o = new Bitmap(W,H);
    for (int y=0;y<H;y++) for (int x=0;x<W;x++) o.SetPixel(x,y, line[y*W+x]?Color.Red:(!outside[y*W+x]?Color.LightGray:Color.White));
    o.Save(maskOut, ImageFormat.Png);
    return string.Format("img={0}x{1} linePx={2} interiorPx={3} bbox=({4},{5})-({6},{7}) rotBBox={8:F0}x{9:F0} ang={10}", W,H,nl,area,minx,miny,maxx,maxy,bw,bh,bestAng);
  }
}
"@
$sp = "C:\Users\Admin\AppData\Local\Temp\claude\C--Users-Admin\7c74404c-d150-47b2-9dce-db80f9c29f52\scratchpad"
[M]::Run("C:\Users\Admin\Downloads\7cd7ebb7-0a97-4b3e-99fe-3a582a49e08b.jpg", "$sp\mask.png")
