$sp="C:\Users\Admin\AppData\Local\Temp\claude\C--Users-Admin\7c74404c-d150-47b2-9dce-db80f9c29f52\scratchpad"
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System; using System.Drawing; using System.Drawing.Imaging; using System.Text; using System.Collections.Generic;
public static class J {
  static byte[] Load(string f, out int W, out int H, out int st){ var b=new Bitmap(f); W=b.Width;H=b.Height;
    var d=b.LockBits(new Rectangle(0,0,W,H),ImageLockMode.ReadOnly,PixelFormat.Format24bppRgb); st=d.Stride;
    var buf=new byte[st*H]; System.Runtime.InteropServices.Marshal.Copy(d.Scan0,buf,0,buf.Length); b.UnlockBits(d); b.Dispose(); return buf; }
  public static string Run(string sp){
    int W,H,st; const int OFF=762, TOP=80, LEFT=48; double res=0.5;
    // map coords: X = 699475 + (col-1000)*0.5 ; Y = 3060900 - (row - 986.5)*0.5 in the joint (Sadruddin) frame
    var dm=Load(sp+"\\dariya_fill_mask.png",out W,out H,out st); var sm=Load(sp+"\\sadr_fill_mask.png",out W,out H,out st);
    var di=Load(sp+"\\dariya_r05.png",out W,out H,out st); var si=Load(sp+"\\sadr_r05.png",out W,out H,out st);
    int JH=H+OFF; var m=new bool[W*JH]; var img=new byte[st*JH];
    for(int i=0;i<img.Length;i++) img[i]=255;
    for(int y=TOP;y<H;y++) for(int x=LEFT;x<W;x++){ int i=y*st+x*3;
      if(sm[i]>128) m[y*W+x]=true;
      for(int c=0;c<3;c++){ int j=y*st+x*3+c; if(si[i+c]<img[j]) img[j]=si[i+c]; } }
    for(int y=TOP;y<H;y++) for(int x=LEFT;x<W;x++){ int i=y*st+x*3; int yy=y+OFF;
      if(dm[i]>128) m[yy*W+x]=true;
      for(int c=0;c<3;c++){ int j=yy*st+x*3+c; if(di[i+c]<img[j]) img[j]=di[i+c]; } }
    // close the 1-2px seam between villages (r=3) without growing outer edge
    var mm=new bool[W*JH]; Array.Copy(m,mm,m.Length);
    for(int y=3;y<JH-3;y++) for(int x=3;x<W-3;x++){ int k=y*W+x; if(m[k]) continue;
      bool up=false,dn=false,lf=false,rt=false; for(int d=1;d<=3;d++){ up|=m[k-d*W]; dn|=m[k+d*W]; lf|=m[k-d]; rt|=m[k+d]; }
      if((up&&dn)||(lf&&rt)) mm[k]=true; }
    m=mm;
    long area=0; int minx=W,maxx=0,miny=JH,maxy=0;
    for(int y=0;y<JH;y++) for(int x=0;x<W;x++) if(m[y*W+x]){ area++; if(x<minx)minx=x; if(x>maxx)maxx=x; if(y<miny)miny=y; if(y>maxy)maxy=y; }
    var sb=new StringBuilder();
    sb.AppendLine(string.Format("TOTAL {0:F3} ha = {1:F2} acre = {2:F0} sq yd = {3:F0} m2", area*0.25/1e4, area*0.25/4046.86, area*0.25/0.83613, area*0.25));
    sb.AppendLine(string.Format("Axis bbox: E-W {0:F0} m, N-S {1:F0} m", (maxx-minx+1)*res, (maxy-miny+1)*res));
    double bestA=1e18,ba=0,bw=0,bh=0;
    for(int a=0;a<180;a++){ double th=a*Math.PI/180,c=Math.Cos(th),s=Math.Sin(th); double u0=1e18,u1=-1e18,v0=1e18,v1=-1e18;
      for(int y=miny;y<=maxy;y+=2) for(int x=minx;x<=maxx;x+=2) if(m[y*W+x]){ double u=x*c+y*s,v=-x*s+y*c; if(u<u0)u0=u;if(u>u1)u1=u;if(v<v0)v0=v;if(v>v1)v1=v; }
      double ar=(u1-u0)*(v1-v0); if(ar<bestA){bestA=ar;ba=a;bw=(u1-u0)*res;bh=(v1-v0)*res;} }
    sb.AppendLine(string.Format("Min rotated bbox: {0:F0} x {1:F0} m at {2} deg", bw,bh,ba));
    // E-W widths every 25 m going south
    for(int y=miny;y<=maxy;y+=50){ int a0=-1,a1=-1,cnt=0; for(int x=0;x<W;x++) if(m[y*W+x]){ if(a0<0)a0=x; a1=x; cnt++; }
      sb.AppendLine(string.Format("  {0,4:F0} m from north: span {1,4:F0} m, solid {2,4:F0} m", (y-miny)*res, (a1-a0+1)*res, cnt*res)); }
    { var mk=new Bitmap(W,JH,PixelFormat.Format24bppRgb); var md=mk.LockBits(new Rectangle(0,0,W,JH),ImageLockMode.WriteOnly,PixelFormat.Format24bppRgb);
      var mb=new byte[md.Stride*JH]; for(int y=0;y<JH;y++) for(int x=0;x<W;x++){ byte v=(byte)(m[y*W+x]?255:0); int i=y*md.Stride+x*3; mb[i]=v;mb[i+1]=v;mb[i+2]=v; }
      System.Runtime.InteropServices.Marshal.Copy(mb,0,md.Scan0,mb.Length); mk.UnlockBits(md); mk.Save(sp+"\\joint_mask.png",ImageFormat.Png); }
    // outline in red, area tinted
    for(int y=1;y<JH-1;y++) for(int x=1;x<W-1;x++){ int k=y*W+x; int j=y*st+x*3; if(!m[k]) continue;
      bool edge=!m[k-1]||!m[k+1]||!m[k-W]||!m[k+W];
      if(edge){ for(int dy=-2;dy<=2;dy++) for(int dx=-2;dx<=2;dx++){ int jj=(y+dy)*st+(x+dx)*3; img[jj]=0;img[jj+1]=0;img[jj+2]=220; } }
      else { img[j]=(byte)(img[j]*0.75); img[j+1]=(byte)Math.Min(255,img[j+1]*0.9+20); } }
    // crop to bbox + 60px margin
    int cx0=Math.Max(0,minx-60), cy0=Math.Max(0,miny-60), cx1=Math.Min(W-1,maxx+60), cy1=Math.Min(JH-1,maxy+60);
    int CW=cx1-cx0+1, CH=cy1-cy0+1; var ob=new Bitmap(CW,CH,PixelFormat.Format24bppRgb);
    var od=ob.LockBits(new Rectangle(0,0,CW,CH),ImageLockMode.WriteOnly,PixelFormat.Format24bppRgb); var obuf=new byte[od.Stride*CH];
    for(int y=0;y<CH;y++) Array.Copy(img,(y+cy0)*st+cx0*3,obuf,y*od.Stride,CW*3);
    System.Runtime.InteropServices.Marshal.Copy(obuf,0,od.Scan0,obuf.Length); ob.UnlockBits(od); ob.Save(sp+"\\joint_parcel.png",ImageFormat.Png);
    sb.AppendLine(string.Format("Crop origin col {0}, row {1}; NW map corner X={2:F1} Y={3:F1} (UTM43N m, 0.5 m/px)", cx0,cy0, 699475+(cx0-1000)*0.5, 3060900-(cy0-986.5)*0.5));
    return sb.ToString(); }
}
"@
[J]::Run($sp)
