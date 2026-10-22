// Independent classroom calculations: no website physics imports or expression eval.
import assert from 'node:assert/strict';
export const chapter3Units = {
  'Pa/s^2': ['pressure-time-curvature',1],
  'm^2/s': ['velocity-potential',1],
  'mm/s': ['velocity',.001],
  'J/m^2': ['fluence',1],
  'Pa/m-imag': ['imaginary-pressure-gradient',1],
  'kg/(m^2*s)': ['mass-flux', 1],
  'kg/(m^3*s)': ['mass-flux-gradient', 1],
  'Pa/m': ['pressure-gradient', 1],
  'Pa*s/m': ['specific-impedance', 1],
  'J/m^3': ['energy-density', 1],
  'W/m^2': ['intensity', 1],
  'mW/m^2': ['intensity', .001],
  W: ['power', 1],
  'm^2': ['area', 1],
  'm^3': ['volume', 1],
  dB: ['level', 1],
  rad: ['angle', 1],
  deg: ['angle', Math.PI/180],
  'kg/m^2': ['surface-mass',1],
};
export const chapter3Methods = {
  'cylindrical-outgoing-potential-amplitude': {
    inputs:{a:'velocity-potential',q:'velocity-potential'},unit:'velocity-potential',formula:String.raw`$C_{\mathrm{out}}=(a+q)/2\quad(\widehat\phi=aJ_0-jqY_0)$`,
    compute:({a,q})=>{assert.ok(a>q&&q>0);return a/2+q/2;},
  },
  'cylindrical-velocity-table': {
    inputs:{k:'curvature',A:'velocity-potential',J1:'dimensionless',Y1:'dimensionless'},unit:'velocity',formula:String.raw`$u_a=kA\sqrt{J_1^2(kr)+Y_1^2(kr)}$`,
    compute:({k,A,J1,Y1})=>{assert.ok(k>0&&A>0);return k*A*Math.hypot(J1,Y1);},
  },
  'geometric-intensity-exponent': {
    inputs:{r1:'length',r2:'length',I1:'intensity',I2:'intensity'},unit:'dimensionless',formula:String.raw`$n=\frac{\ln(I_1/I_2)}{\ln(r_2/r_1)}\quad(I\propto r^{-n})$`,
    compute:({r1,r2,I1,I2})=>{assert.ok(r2>r1&&r1>0&&I1>I2&&I2>0);return (Math.log(I1)-Math.log(I2))/(Math.log(r2)-Math.log(r1));},
  },
  'spherical-pulse-nearfield-ratio': {
    inputs:{ell:'length',r:'length'},unit:'dimensionless',formula:String.raw`$\eta=\frac{|F|}{r|F^{\prime}|}=\frac{\ell}{r}$`,
    compute:({ell,r})=>{assert.ok(ell>0&&r>0);return ell/r;},
  },
  'radius-from-spherical-impedance': {
    inputs:{R:'specific-impedance',X:'specific-impedance',c:'velocity',f:'frequency'},unit:'length',formula:String.raw`$r=\frac{c_0}{2\pi f}\frac{R_a}{X_a}$`,
    compute:({R,X,c,f})=>{assert.ok(R>0&&X>0&&c>0&&f>0);const kr=R/X;return kr/(2*Math.PI*f/c);},
  },
  'velocity-phase-speed-distance': {
    inputs:{c:'velocity',f:'frequency',epsilon:'dimensionless'},unit:'length',formula:String.raw`$r_{\min}=\frac{c_0}{2\pi f\sqrt\varepsilon}$`,
    compute:({c,f,epsilon})=>{assert.ok(c>0&&f>0&&epsilon>0);return c/f/(2*Math.PI)/Math.sqrt(epsilon);},
  },
  'spherical-reverse-flow-fraction': {
    inputs:{kr:'dimensionless'},unit:'dimensionless',formula:String.raw`$\eta_-=\frac{\arctan[1/(kr)]}{\pi}$`,
    compute:({kr})=>{assert.ok(kr>0);return Math.atan2(1,kr)/Math.PI;},
  },
  'hard-image-notch-residual': {
    inputs:{rd:'length',ri:'length'},unit:'dimensionless',formula:String.raw`$\frac{|P_{\mathrm{tot}}|}{|P_d|}=\left|1-\frac{r_d}{r_i}\right|\quad(k(r_i-r_d)=\pi)$`,
    compute:({rd,ri})=>{assert.ok(ri>rd&&rd>0);return (ri-rd)/ri;},
  },
  'surface-reactance-from-reflection': {
    inputs:{Z0:'specific-impedance',r:'dimensionless',phi:'angle'},unit:'specific-impedance',formula:String.raw`$X_s=\frac{2Z_0|R_p|\sin\phi}{1-2|R_p|\cos\phi+|R_p|^2}$`,
    compute:({Z0,r,phi})=>{assert.ok(Z0>0&&r>0&&r<1);const den=(1-r*Math.cos(phi))**2+(r*Math.sin(phi))**2;return 2*Z0*r*Math.sin(phi)/den;},
  },
  'reflection-phase-from-minimum-shift': {
    inputs:{shift:'length',lambda:'length'},unit:'angle',formula:String.raw`$\Delta\phi=\frac{4\pi\Delta d}{\lambda}$`,
    compute:({shift,lambda})=>{assert.ok(lambda>0&&shift>0&&shift<lambda/2);return 2*(2*Math.PI/lambda)*shift;},
  },
  'oblique-footprint': {
    inputs:{area:'area',theta:'angle'},unit:'area',formula:String.raw`$S_{\mathrm{foot}}=S_i/\cos\theta_i$`,
    compute:({area,theta})=>{assert.ok(area>0&&theta>=0&&theta<Math.PI/2);return area/Math.cos(theta);},
  },
  'oblique-impedance-inversion': {
    inputs:{Z1:'specific-impedance',R:'dimensionless',ci:'dimensionless',ct:'dimensionless'},unit:'specific-impedance',formula:String.raw`$Z_2=Z_1\frac{\cos\theta_t}{\cos\theta_i}\frac{1+R_p}{1-R_p}$`,
    compute:({Z1,R,ci,ct})=>{assert.ok(Z1>0&&Math.abs(R)<1&&ci>0&&ci<=1&&ct>0&&ct<=1);return Z1*ct*(1+R)/(ci*(1-R));},
  },
  'critical-angle-aperture-margin': {
    inputs:{c1:'velocity',c2:'velocity',center:'angle'},unit:'angle',formula:String.raw`$\Delta\theta_{\max}=\arcsin(c_1/c_2)-\theta_{\mathrm{center}}$`,
    compute:({c1,c2,center})=>{assert.ok(c2>c1&&c1>0&&center>=0&&center<Math.asin(c1/c2));return Math.asin(c1/c2)-center;},
  },
  'evanescent-kinetic-ratio': {
    inputs:{kt:'curvature',k:'curvature'},unit:'dimensionless',formula:String.raw`$\frac{\overline w_{k,n}}{\overline w_{k,t}}=\frac{k_t^2-k^2}{k_t^2}$`,
    compute:({kt,k})=>{assert.ok(kt>k&&k>0);return 1-(k/kt)**2;},
  },
  'multiple-reflection-loss': {
    inputs:{R:'dimensionless',N:'dimensionless'},unit:'level',formula:String.raw`$\Delta L=-20N\log_{10}|R_p|$`,
    compute:({R,N})=>{assert.ok(R>0&&R<1&&Number.isInteger(N)&&N>0);return -10*Math.log10((R*R)**N);},
  },
  'reflection-from-beam-intensities': {
    inputs:{tI:'dimensionless',ci:'dimensionless',ct:'dimensionless'},unit:'dimensionless',formula:String.raw`$|R_p|=\sqrt{1-t_I\frac{\cos\theta_t}{\cos\theta_i}}$`,
    compute:({tI,ci,ct})=>{assert.ok(tI>0&&ci>0&&ci<=1&&ct>0&&ct<=1&&tI*ct/ci<1);return Math.sqrt((ci-tI*ct)/ci);},
  },
  'sheet-pressure-jump': {
    inputs:{mu:'surface-mass',f:'frequency',u:'velocity'},unit:'pressure',formula:String.raw`$|\Delta p|=\mu(2\pi f)u_a$`,
    compute:({mu,f,u})=>{assert.ok(mu>0&&f>0&&u>0);return mu*u*f*(2*Math.PI);},
  },
  'interface-reflection-phase': {
    inputs:{phase:'angle',k:'curvature',d:'length'},unit:'angle',formula:String.raw`$\phi_0=\phi_{-d}+2kd$`,
    compute:({phase,k,d})=>{assert.ok(k>0&&d>=0);return phase+2*k*d;},
  },
  'contrast-from-velocity-transmission': {
    inputs:{Du:'dimensionless'},unit:'dimensionless',formula:String.raw`$\frac{Z_2}{Z_1}=\frac2{D_u}-1$`,
    compute:({Du})=>{assert.ok(Du>0&&Du<1);return (2-Du)/Du;},
  },
  'rigid-contrast-bound': {
    inputs:{epsilon:'dimensionless'},unit:'dimensionless',formula:String.raw`$\left(\frac{Z_2}{Z_1}\right)_{\min}=\frac2\varepsilon-1$`,
    compute:({epsilon})=>{assert.ok(epsilon>0&&epsilon<1);return (2-epsilon)/epsilon;},
  },
  'two-interface-first-pass-gain': {
    inputs:{Z1:'specific-impedance',Zm:'specific-impedance',Z3:'specific-impedance'},unit:'dimensionless',formula:String.raw`$G=\frac{[4Z_1Z_m/(Z_1+Z_m)^2][4Z_mZ_3/(Z_m+Z_3)^2]}{4Z_1Z_3/(Z_1+Z_3)^2}$`,
    compute:({Z1,Zm,Z3})=>{assert.ok(Z1>0&&Zm>Z1&&Z3>Zm);const t=(a,b)=>1-((b-a)/(b+a))**2;return t(Z1,Zm)*t(Zm,Z3)/t(Z1,Z3);},
  },
  'soft-standing-potential-fraction': {
    inputs:{f:'frequency',c:'velocity',d:'length'},unit:'dimensionless',formula:String.raw`$\frac{\overline w_p}{\overline w}=\sin^2\left(\frac{2\pi f d}{c_0}\right)$`,
    compute:({f,c,d})=>{assert.ok(f>0&&c>0&&d>0);return Math.sin(2*Math.PI*f*d/c)**2;},
  },
  'evanescent-distance': {
    inputs:{kt:'curvature',k:'curvature',ratio:'dimensionless'},unit:'length',formula:String.raw`$z=\frac{-\ln\eta}{\sqrt{k_t^2-k^2}}$`,
    compute:({kt,k,ratio})=>{assert.ok(kt>k&&k>0&&ratio>0&&ratio<1);return Math.log(1/ratio)/Math.sqrt((kt-k)*(kt+k));},
  },
  'vector-phase-lag': {
    inputs:{kx:'curvature',ky:'curvature',kz:'curvature',dx:'length',dy:'length',dz:'length'},unit:'angle',formula:String.raw`$\Delta\phi=k_x\Delta x+k_y\Delta y+k_z\Delta z$`,
    compute:({kx,ky,kz,dx,dy,dz})=>kx*dx+ky*dy+kz*dz,
  },
  'forward-amplitude-from-cauchy-data': {
    inputs:{p:'pressure',d:'imaginary-pressure-gradient',k:'curvature'},unit:'pressure',formula:String.raw`$A=\frac12\left(P+\frac Dk\right)\quad(\widehat p^{\prime}(0)=-jD)$`,
    compute:({p,d,k})=>{assert.ok(k>0&&p>0&&d>0);return .5*(p+d/k);},
  },
  'phase-sampling-spacing': {
    inputs:{c:'velocity',fmax:'frequency'},unit:'length',formula:String.raw`$d_{\max}=\frac{c_0}{2f_{\max}}$`,
    compute:({c,fmax})=>{assert.ok(c>0&&fmax>0);return c/fmax/2;},
  },
  'mean-absolute-particle-speed': {
    inputs:{pa:'pressure',Z0:'specific-impedance'},unit:'velocity',formula:String.raw`$\langle|u|\rangle=\frac{2p_a}{\pi Z_0}$`,
    compute:({pa,Z0})=>{assert.ok(pa>0&&Z0>0);return (2/Math.PI)*(pa/Z0);},
  },
  'reflection-from-local-impedance': {
    inputs:{Z:'specific-impedance',Z0:'specific-impedance'},unit:'dimensionless',formula:String.raw`$R=\frac{Z-Z_0}{Z+Z_0}$`,
    compute:({Z,Z0})=>{assert.ok(Z>Z0&&Z0>0);return 1-2*Z0/(Z+Z0);},
  },
  'rectangular-pulse-fluence': {
    inputs:{pa:'pressure',Z0:'specific-impedance',dt:'time'},unit:'fluence',formula:String.raw`$F=\frac{p_a^2\tau}{Z_0}$`,
    compute:({pa,Z0,dt})=>{assert.ok(pa>0&&Z0>0&&dt>0);return pa/Z0*pa*dt;},
  },
  'source-level-subtraction': {
    inputs:{total:'level',background:'level'},unit:'level',formula:String.raw`$L_{p,s}=10\log_{10}\left(10^{L_{p,\mathrm{tot}}/10}-10^{L_{p,b}/10}\right)$`,
    compute:({total,background})=>{assert.ok(total>background);return total+10*Math.log10(1-10**((background-total)/10));},
  },
  'stored-acoustic-energy': {
    inputs:{rho0:'density',c:'velocity',pe:'pressure',ue:'velocity',volume:'volume'},unit:'energy',formula:String.raw`$\overline E=\frac V2\left(\rho_0u_e^2+\frac{p_e^2}{\rho_0c_0^2}\right)$`,
    compute:({rho0,c,pe,ue,volume})=>{assert.ok(rho0>0&&c>0&&volume>0&&pe>=0&&ue>=0);return volume*(rho0*ue*ue+pe*pe/(rho0*c*c))/2;},
  },
  'energy-fill-time': {
    inputs:{volume:'volume',dw:'energy-density',pin:'power',pout:'power'},unit:'time',formula:String.raw`$\Delta t=\frac{V\Delta\overline w}{\overline P_{\mathrm{in}}-\overline P_{\mathrm{out}}}$`,
    compute:({volume,dw,pin,pout})=>{assert.ok(volume>0&&dw>0&&pin>pout&&pout>=0);return volume*dw/(pin-pout);},
  },
  'level-fluence': {
    inputs:{level:'level',Iref:'intensity',dt:'time'},unit:'fluence',formula:String.raw`$F=I_{\mathrm{ref}}10^{L_I/10}\Delta t$`,
    compute:({level,Iref,dt})=>{assert.ok(Iref>0&&dt>0);return Iref*Math.pow(10,level/10)*dt;},
  },
  'radial-pressure-curvature': {
    inputs:{c:'velocity',g:'pressure-gradient',r:'length'},unit:'pressure-time-curvature',formula:String.raw`$\partial_t^2p=\frac{2c_0^2}{r}\partial_r p\quad(\partial_r^2p=0)$`,
    compute:({c,g,r})=>{assert.ok(c>0&&g>0&&r>0);return 2*c*c*g/r;},
  },
  'potential-displacement': {
    inputs:{phi:'velocity-potential',c:'velocity'},unit:'length',formula:String.raw`$\xi_a=\frac{\Phi_a}{c_0}$`,
    compute:({phi,c})=>{assert.ok(phi>0&&c>0);return phi/c;},
  },
  'particle-cycle-path': {
    inputs: {xi:'length'}, unit:'length', formula:String.raw`$s_{\mathrm{cycle}}=4\xi_a$`,
    compute:({xi})=>{assert.ok(xi>0);return 4*xi;},
  },
  'rms-compression': {
    inputs:{rhoPeak:'density',rho0:'density'},unit:'dimensionless',formula:String.raw`$s_e=\frac{\rho_{l,a}}{\sqrt2\rho_0}$`,
    compute:({rhoPeak,rho0})=>{assert.ok(rho0>rhoPeak&&rhoPeak>0);return Math.SQRT1_2*rhoPeak/rho0;},
  },
  'acoustic-mach': {
    inputs:{u:'velocity',c:'velocity'},unit:'dimensionless',formula:String.raw`$\mathrm{Ma}_a=u_a/c_0$`,
    compute:({u,c})=>{assert.ok(c>u&&u>0);return u/c;},
  },
  'face-mass-flux': {
    inputs:{J0:'mass-flux',g:'mass-flux-gradient',dx:'length'},unit:'mass-flux',formula:String.raw`$J_+=J_0+\frac{g\Delta x}{2}$`,
    compute:({J0,g,dx})=>{assert.ok(dx>0);return J0+.5*g*dx;},
  },
  'density-from-divergence-amplitude': {
    inputs:{rho0:'density',divA:'rate',f:'frequency'},unit:'density',formula:String.raw`$\rho_{l,a}=\frac{\rho_0 D_a}{2\pi f}$`,
    compute:({rho0,divA,f})=>{assert.ok(rho0>0&&divA>0&&f>0);return rho0*divA/f/(2*Math.PI);},
  },
  'bulk-modulus': {
    inputs:{rho0:'density',c:'velocity'},unit:'pressure',formula:String.raw`$K_s=\rho_0c_0^2$`,
    compute:({rho0,c})=>{assert.ok(rho0>0&&c>0);return c*c*rho0;},
  },
  'thermal-frequency-bound': {
    inputs:{tau:'time',criterion:'dimensionless'},unit:'frequency',formula:String.raw`$f_{\min}=\frac{q}{2\pi\tau_{\mathrm{th}}}$`,
    compute:({tau,criterion})=>{assert.ok(tau>0&&criterion>0);return criterion/tau/(2*Math.PI);},
  },
  'pressure-gradient-impulse': {
    inputs:{g:'pressure-gradient',dt:'time',rho0:'density'},unit:'velocity',formula:String.raw`$|\Delta u_x|=\frac{|G|\Delta t}{\rho_0}$`,
    compute:({g,dt,rho0})=>{assert.ok(dt>0&&rho0>0&&g!==0);return Math.abs(g)*dt/rho0;},
  },
};
