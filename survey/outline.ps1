param([double]$tol = 6)  # simplification tolerance in px (0.5 m/px)
$sp="C:\Users\Admin\AppData\Local\Temp\claude\C--Users-Admin\7c74404c-d150-47b2-9dce-db80f9c29f52\scratchpad"
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System; using System.Drawing; using System.Drawing.Imaging; using System.Collections.Generic; using System.Text; using System.Globalization;
public static class O {
  static void DP(List<double[]> p,int a,int b,double tol,List<int> keep){
    double mx=0; int idx=-1; double ax=p[a][0],ay=p[a][1],bx=p[b][0],by=p[b][1]; double L=Math.Sqrt((bx-ax)*(bx-ax)+(by-ay)*(by-ay))+1e-9;
    for(int i=a+1;i<b;i++){ double d=Math.Abs((bx-ax)*(ay-p[i][1])-(ax-p[i][0])*(by-ay))/L; if(d>mx){mx=d;idx=i;} }
    if(mx>tol){ DP(p,a,idx,tol,keep); keep.Add(idx); DP(p,idx,b,tol,keep); } }
  public static string Run(string sp,double tol){
    var b=new Bitmap(sp+"\\joint_mask.png"); int W=b.Width,H=b.Height; var m=new bool[W*H];
    var d=b.LockBits(new Rectangle(0,0,W,H),ImageLockMode.ReadOnly,PixelFormat.Format24bppRgb); var buf=new byte[d.Stride*H];
    System.Runtime.InteropServices.Marshal.Copy(d.Scan0,buf,0,buf.Length); for(int y=0;y<H;y++) for(int x=0;x<W;x++) m[y*W+x]=buf[y*d.Stride+x*3]>128; b.UnlockBits(d);
    Func<int,int,bool> M=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&m[y*W+x];
    // start: topmost-leftmost pixel; Moore-neighbour trace
    int sx=-1,sy=-1; for(int y=0;y<H&&sx<0;y++) for(int x=0;x<W;x++) if(m[y*W+x]){sx=x;sy=y;break;}
    int[] dx={1,1,0,-1,-1,-1,0,1}, dy={0,1,1,1,0,-1,-1,-1};
    var pts=new List<double[]>(); int cx=sx,cy=sy,dir=7; int guard=0;
    do { pts.Add(new double[]{cx,cy}); int start=(dir+6)%8; bool f=false;
      for(int k=0;k<8;k++){ int nd=(start+k)%8; int nx=cx+dx[nd],ny=cy+dy[nd]; if(M(nx,ny)){cx=nx;cy=ny;dir=nd;f=true;break;} }
      if(!f) break; } while((cx!=sx||cy!=sy)&&++guard<2000000);
    // split closed ring at farthest point from start for DP
    int far=0; double fd=0; for(int i=0;i<pts.Count;i++){ double dd=Math.Pow(pts[i][0]-sx,2)+Math.Pow(pts[i][1]-sy,2); if(dd>fd){fd=dd;far=i;} }
    pts.Add(pts[0]); var keep=new List<int>{0,far,pts.Count-1}; DP(pts,0,far,tol,keep); DP(pts,far,pts.Count-1,tol,keep); keep.Sort();
    var sb=new StringBuilder(); var ci=CultureInfo.InvariantCulture;
    // emit vertices as map coords: X = 699475+(col-1000)*0.5 ; Y = 3060900-(row-986.5)*0.5
    double area2=0; var v=new List<double[]>(); foreach(int i in keep){ if(i==pts.Count-1) continue; v.Add(new double[]{699475+(pts[i][0]+0.5-1000)*0.5, 3060900-(pts[i][1]+0.5-986.5)*0.5}); }
    for(int i=0;i<v.Count;i++){ var p=v[i]; var q=v[(i+1)%v.Count]; area2+=p[0]*q[1]-q[0]*p[1]; sb.AppendLine(string.Format(ci,"{0:F2},{1:F2}",p[0],p[1])); }
    System.IO.File.WriteAllText(sp+"\\outline_utm.csv","X,Y\r\n"+sb.ToString());
    return string.Format(ci,"trace pts {0}, vertices {1}, polygon area {2:F3} ha", pts.Count, v.Count, Math.Abs(area2)/2/1e4);
  } }
"@
[O]::Run($sp,$tol)
