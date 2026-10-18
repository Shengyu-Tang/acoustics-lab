"""Independent numeric worksheet references (stdlib + mpmath Bessel functions)."""
from pathlib import Path
import math as m, cmath as cm, json
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'outputs/python'))
import mpmath as mp
Z1,Z2=1.5e6,415
def normal(a,b):return [(b-a)/(b+a),2*b/(a+b)]
def ob(a,b,c,d,t):
 s=d/c*m.sin(m.radians(t));ct=cm.sqrt(1-s*s).conjugate();ci=m.cos(m.radians(t))
 R=(b*ci-a*ct)/(b*ci+a*ct);D=1+R
 return abs(R),a/b*abs(D)**2*ct.real/ci
res,react=2,1;R=abs((complex(res,react)-1)/(complex(res,react)+1));G=(1+R)/(1-R)
f,c,rho=1000,343,1.21;k=2*m.pi*f/c;Z=rho*c
q=k*.1;z=Z*1j*q/(1+1j*q)
H=lambda n,x:complex(mp.hankel2(n,x))
zc=1j*Z*H(0,q)/H(1,q)
phase=343/m.sqrt(1-(343/1500)**2);group=343*m.sqrt(1-(343/1500)**2)
refs={
 '3.6.1':normal(1.5e6,3e6),'3.6.2':normal(1.5e6,3e6),'3.6.3':normal(Z1,Z2),'3.6.4':normal(1.5e6,4.6e7),
 '3.6.5':normal(Z1,Z2)+[4*Z1*Z2/(Z1+Z2)**2,-10*m.log10(4*Z1*Z2/(Z1+Z2)**2)],'3.6.6':[.75,2/1.5e6],
 '3.6.7':[m.degrees(m.asin(1/3)),ob(1.5e6,1e6,1500,1000,30)[0]],'3.6.8':[m.degrees(m.asin(1/3)),ob(1.5e6,1e6,1500,1000,30)[0]],
 '3.6.9':[m.degrees(m.asin(2/3)),m.degrees(m.asin(m.sqrt(.75/2)))],
 '3.6.10':[m.degrees(m.asin(343/1500)),1/m.sqrt((2*m.pi*1000/343*m.sin(m.pi/3))**2-(2*m.pi*1000/1500)**2)],
 '3.6.11':[2*m.pi*32.5,-32.5*.95*m.cos(m.radians(80))+m.sqrt(32.5**2-(32.5*.95*m.sin(m.radians(80)))**2)],
 '3.6.12':list(ob(1.5e6,1e6,1500,1000,30)),
 '3.7.1':[R,G],'3.7.2':[G,1-R*R],
 '3.8.1':[10,10/Z*m.sqrt(1+1/q**2)],'3.8.2':[z.real,z.imag],'3.8.3':[343,343*(1+1/(k*.05)**2)],
 '3.8.4':[1/(2*Z),2*m.pi/Z],
 '3.8.5':[m.sqrt(18)-m.sqrt(10),abs(cm.exp(-1j*2*m.pi*1000/1500*m.sqrt(10))/m.sqrt(10)-cm.exp(-1j*2*m.pi*1000/1500*m.sqrt(18))/m.sqrt(18))],
 '3.9.1':[float(mp.besselj(0,10)),float(mp.bessely(0,10))],
 '3.9.2':[abs(H(0,q)),abs(H(1,q))/Z],'3.9.3':[zc.real,zc.imag],
 '3.10.1':[343,2*m.pi],'3.10.2':[Z*.01,343],'3.10.3':[686,m.sqrt((4*m.pi)**2-(2*m.pi*500/343)**2)],
 '3.10.4':[686,m.degrees(m.asin(686/1200))],'3.10.5':[phase,group]
}
root=Path(__file__).resolve().parent.parent
(root/'scripts/p3-reference-answers.json').write_text(json.dumps(refs,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('27 worksheets, 54 independently computed reference answers')
