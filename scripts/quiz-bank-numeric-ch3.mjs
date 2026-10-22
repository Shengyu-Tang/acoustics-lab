// Independent classroom calculations: no website physics imports or expression eval.
import assert from 'node:assert/strict';
export const chapter3Units = {
  '': ['dimensionless', 1],
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
