"""Independent SI calculations; no application modules or saved answers used."""
import sys,json,math,cmath
pi=math.pi
def absorption(f,d,sigma,rho,c):
    X=rho*f/sigma
    Zc=1+.0571*X**(-.754)-1j*.087*X**(-.732)
    k=2*pi*f/c*(1+.0978*X**(-.7)-1j*.189*X**(-.595))
    z=-1j*Zc/cmath.tan(k*d)
    return 4*z.real/abs(z+1)**2
def solve(id,p):
    locals().update(p)
    if id=='ocean':
        def beam(f):return 2*math.degrees(math.asin(min(1,1.61633*p['c']/(2*pi*f*p['a']))))
        def ab(f):
            q=(f/1000)**2
            return .11*q/(1+q)+44*q/(4100+q)+.000275*q+.003
        def loss(f):return 20*math.log10(p['r'])+ab(f)*p['r']/1000
        chosen=next((f for f in sorted([p['low'],p['high']]) if beam(f)<=p['beamLimit'] and loss(f)<=p['lossLimit']),0)
        return [beam(p['low']),ab(p['high']),loss(p['high']),beam(p['high']),chosen]
    if id=='building':
        ab=lambda f,d:absorption(f,d,p['sigma'],p['rho'],p['c'])
        d=next((mm/1000 for mm in range(20,math.floor(p['maximum']*1000+1e-9)+1) if min(ab(f,mm/1000) for f in range(500,2001,10))>p['minimum']),0)
        a=ab(500,p['d'])
        return [math.sqrt(1-a),a,ab(2000,p['d']),d]
    if id=='industry':
        w=2*pi*p['n']/60
        def response(D):return p['F0']/abs(complex(D-p['M']*w*w,p['Rm']*w))
        def tr(D):return abs(complex(D,p['Rm']*w))/abs(complex(D-p['M']*w*w,p['Rm']*w))
        chosen=next((D for D in [p['D'],p['newD']] if response(D)<p['limit'] and tr(D)<=p['tLimit']),0)
        r=math.sqrt(max(0,(p['F0']/p['limit'])**2-(p['D']-p['M']*w*w)**2))/w
        return [math.sqrt(p['D']/p['M'])/(2*pi),math.sqrt(p['M']*p['D'])/p['Rm'],response(p['D'])*1000,r,response(p['newD'])*1000,tr(p['newD']),chosen]
    if id=='ultrasound':
        t=1-((p['Zsteel']-p['Zwater'])/(p['Zsteel']+p['Zwater']))**2
        wavelength=p['c']/p['high']
        chosen=next((f for f in sorted([p['low'],p['high']]) if p['cycles']*p['cs']/(2*f)<=p['resolutionLimit'] and p['z']>=20*p['a']**2*f/p['c']),0)
        return [t,wavelength,p['a']**2/wavelength-wavelength/4,20*p['a']**2/wavelength,p['cycles']*p['cs']/(2*p['high']),chosen]
    if id=='music':
        f=math.sqrt(p['T']/p['mu'])/(2*p['L'])
        tail=lambda f,q: math.log(1000)*q/(pi*f)
        tension=4*p['mu']*p['L']**2*p['target']**2
        new=tail(p['target'],p['designQ'])
        return [f,tail(f,p['Q']),tension,pi*p['target']*p['tailLimit']/math.log(1000),new,p['designQ'] if tension<=p['tensionLimit'] and new<=p['tailLimit'] else 0]
    if id=='measurement':
        k=2*pi*p['maximumF']/p['c'];ka=k*p['a']
        a=math.sqrt(10**(p['lossLimit']/10)-1)/k
        pressure=1e-6*10**(p['level']/20)
        voltage=pressure*10**((p['sensitivity']+120)/20)/math.sqrt(1+ka*ka)
        d=next((d for d in [.03,.02,.01,.005] if d<=2*a),0)
        return [ka,10*math.log10(1+ka*ka),pressure,a,voltage,d]
    if id=='transport':
        r=math.hypot(p['xobs'],p['d']);vr=p['v']*p['xobs']/r
        L=p['L0']-20*math.log10(r/p['r0'])
        total=10*math.log10(10**(L/10)+10**(p['background']/10))
        rmin=p['r0']*math.sqrt(10**(p['L0']/10)/(10**(p['limit']/10)-10**(p['background']/10)))
        return [p['f']/(1-vr/p['c'])-p['f'],p['f']/(1+vr/p['c']),L,total,rmin,p['proposed'] if p['proposed']>=rmin else 0]
    if id=='duct':
        fc=p['c']/(2*p['h']);rp=abs((complex(p['res'],p['react'])-1)/(complex(p['res'],p['react'])+1))
        h=p['safety']*p['c']/(2*p['f'])
        chosen=next((v for v in [.35,.3,.25,.2,.15,.1] if v<=h),0)
        return [fc,p['c']*math.sqrt(1-(fc/p['testF'])**2),rp,1-rp*rp,h,chosen]
    if id=='grin-lens':
        n=p['c']/p['cl'];R=math.floor(p['focus']*(n-1)*1000+.5)/1000
        theta=math.asin(n*p['a']/R)-math.asin(p['a']/R);focus=p['a']/math.tan(theta)
        beam=lambda f:2*math.degrees(math.asin(min(1,1.61633*p['c']/(2*pi*f*p['a']))))
        chosen=next((f for f in sorted([p['low'],p['high']]) if beam(f)<=p['beamLimit']),0) if abs(focus/p['focus']-1)<=p['errorLimit'] else 0
        return [n,R,math.degrees(theta),focus,beam(p['high']),chosen]
    raise ValueError(id)
inputs=json.load(open(sys.argv[1],encoding='utf-8'))
json.dump([dict(id=x['id'],set=x['set'],answers=solve(x['id'],x['p'])) for x in inputs],sys.stdout)
