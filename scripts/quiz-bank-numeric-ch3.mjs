// Independent classroom calculations: no website physics imports or expression eval.
import assert from 'node:assert/strict';
export const chapter3Units = {
  'Pa/s^2': ['pressure-time-curvature',1],
  'm^2/s': ['velocity-potential',1],
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
};
export const chapter3Methods = {
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
