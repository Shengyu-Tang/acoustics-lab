"""Independent high-precision references. Only read the source input snapshot."""
from pathlib import Path
import json,math,sys
sys.path.insert(0,str(Path.cwd()/'outputs/python'))
import mpmath as m
m.mp.dps=45
pi=m.pi
inputs=json.loads(Path('outputs/P4/example-inputs.json').read_text(encoding='utf8'))
def H(n,x):return m.besselj(n,x)-1j*m.bessely(n,x)
def cyl(ka,kr,th,soft=False):
 total=0
 for n in range(int(m.ceil(ka))+20):
  j=m.besselj(n,ka);h=H(n,ka)
  dj=(m.besselj(n-1,ka)-m.besselj(n+1,ka))/2
  dh=(H(n-1,ka)-H(n+1,ka))/2
  total-= (1 if n==0 else 2)*(-1j)**n*(j/h if soft else dj/dh)*H(n,kr)*m.cos(n*th)
 return total
def sph(n,x):return m.sqrt(pi/(2*x))*H(n+m.mpf('.5'),x)
def sigmaSphere(ka,a):
 total=0
 for n in range(int(m.ceil(ka))+20):
  dh=-sph(1,ka) if n==0 else sph(n-1,ka)-(n+1)/ka*sph(n,ka)
  total+=(2*n+1)*abs(m.re(dh)/dh)**2
 return 4*pi*a*a*total/ka**2
def green(k,r):return -1j/4*H(0,k*r)
def greenD(k,r):return 1j*k/4*H(1,k*r)
def helm(x,y,a,k,N,exterior):
 total=0
 for i in range(int(N)):
  ph=2*pi*(i+m.mpf('.5'))/N;nx,ny=m.cos(ph),m.sin(ph);sx,sy=a*nx,a*ny
  r=m.sqrt((x-sx)**2+(y-sy)**2)
  pressure=green(k,a) if exterior else m.exp(-1j*k*sx)
  dp=greenD(k,a) if exterior else -1j*k*nx*pressure
  dn=greenD(k,r)*((sx-x)*nx+(sy-y)*ny)/r
  total+=(green(k,r)*dp-pressure*dn)*2*pi*a/N*(-1 if exterior else 1)
 return total
refs={}
for item in inputs:
 id=item['id'];p={k:m.mpf(str(v)) for k,v in item['p'].items()}
 f,c,rho=p['f'],p['c'],p['rho'];k=2*pi*f/c;a=p.get('a',0);v=p.get('v',0);S=4*pi*a*a;ka=k*a
 Rs=rho*c*S*ka**2/(1+ka**2);Xs=rho*c*S*ka/(1+ka**2);power=v*v*Rs/2
 ans={}
 if id=='4.1':ans=dict(efficiency=100*Rs/(Rs+p['Rm']),radiated=power)
 elif id=='4.2.1':
  P=rho*c*v*k*a*a/(p['r']*m.sqrt(1+ka**2));ans=dict(pressure=P,intensity=P*P/(2*rho*c))
 elif id=='4.2.2':ans=dict(resistance=Rs,mass=Xs/(2*pi*f),power=power)
 elif id=='4.2.3':
  Q=p['Q'];r=p['r'];P=0
  for n in range(int(p['N'])):
   rr=m.sqrt(r*r+((n-(p['N']-1)/2)*p['d'])**2);P+=1j*rho*f*Q/(2*rr)*m.exp(-1j*k*rr)
  ans=dict(singlePressure=rho*f*Q/(2*r),pressure=abs(P),strength=Q)
 elif id=='4.3':ans=dict(ratio=(k*p['d'])**2/3,pressure=rho*f*p['Q']/(2*p['r'])*k*p['d']*abs(m.cos(p['theta']*pi/180)))
 elif id=='4.4.1':
  P=helm(p['xobs'],p['yobs'],a,k,p['N'],False);exact=m.exp(-1j*k*p['xobs']);ans=dict(realPressure=m.re(P),errorPercent=100*abs(P-exact))
 elif id=='4.4.2':ans=dict(wavelength=c/f,pressure=abs(helm(p['r'],0,a,k,p['N'],True)))
 elif id=='4.4.3':
  half=m.findroot(lambda x:2*m.besselj(1,x)/x-1/m.sqrt(2),m.mpf('1.6'))
  ans=dict(wavelength=c/f,size=ka,nullAngle=m.asin(m.besseljzero(1,1)/ka)*180/pi,beamwidth=2*m.asin(half/ka)*180/pi)
 elif id=='4.4.4':
  lam=c/f;z=p['zobs'];P=2*rho*c*v*abs(m.sin(k/2*(m.sqrt(z*z+a*a)-z)));far=rho*f*pi*a*a*v/z
  ans=dict(lastMax=a*a/lam-lam/4,rayleigh=4*a*a/lam,pressure=P,error=100*abs(far/P-1))
 elif id=='5.1':
  total=m.exp(1j*ka)+cyl(ka,ka,pi);ans=dict(frontPressure=p['pa']*abs(total),gain=abs(total))
 elif id=='5.2':
  sigma=sigmaSphere(ka,a);ans=dict(crossSection=sigma,scatteredPower=p['pa']**2/(2*rho*c)*sigma)
 elif id=='5.3':
  coeff=0;th=p['theta']*pi/180
  for n in range(int(m.ceil(ka))+20):coeff-=(1 if n==0 else 2)*m.besselj(n,ka)/H(n,ka)*m.cos(n*th)
  P=p['pa']*m.sqrt(2/(pi*k*p['r']))*abs(coeff);ans=dict(pressure=P,intensity=P*P/(2*rho*c))
 elif id=='6.1':ans=dict(coefficient=1/m.sqrt(1+ka*ka),maximumRadius=c/(2*pi*f)*m.sqrt(p['criterion']**-2-1))
 elif id=='6.2':
  r=m.sqrt(p['xB']**2+p['yB']**2);ans=dict(distance=r,pressure=rho*f*p['Q']/(2*r))
 elif id=='7.1':
  db=20/m.log(10)*p['alpha'];ans=dict(dbPerM=db,loss=20*m.log10(p['r'])+db*p['r'],pressure=p['pa']/p['r']*m.exp(-p['alpha']*p['r']))
 elif id=='7.2':
  F=f/1000;alpha=m.mpf('.11')*F*F/(1+F*F)+44*F*F/(4100+F*F)+m.mpf('.000275')*F*F+m.mpf('.003')
  ans=dict(absorption=alpha,absorbed=alpha*p['r']/1000,receivedLevel=p['SL']-20*m.log10(p['r'])-alpha*p['r']/1000)
 elif id=='7.3':
  X=rho*f/p['sigma'];zc=1+m.mpf('.0571')*X**(-m.mpf('.754'))-1j*m.mpf('.087')*X**(-m.mpf('.732'))
  kc=k*(1+m.mpf('.0978')*X**(-m.mpf('.7'))-1j*m.mpf('.189')*X**(-m.mpf('.595')))
  z=-1j*zc*m.cot(kc*p['d']);R=(z-1)/(z+1);ans=dict(reflection=abs(R),absorption=1-abs(R)**2)
 else:raise ValueError(id)
 refs[id]=[float(ans[x['key']]) for x in item['answers']]
 for x,e in zip(item['answers'],refs[id]):
  assert abs(x['value']-e)<=max(1e-10,.005*abs(e)),(id,x,e)
Path('scripts/p4-reference-answers.json').write_text(json.dumps(refs,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('PASS: 17 lectures,',sum(map(len,refs.values())),'independent 45-digit example answers <0.5%.')

