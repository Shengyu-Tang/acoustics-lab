/** Same SI definitions as the lecture readout table, evaluated by the exported model. */
export const matlabReadouts: Record<string, string> = {
  "1.1.1": "[w0/(2*pi) T0 hypot(x0,v0/w0) atan2(-v0/w0,x0)]",
  "1.1.2": "[w0*A w0^2*A D*A^2/2]",
  "1.1.3": "[d s1 (-d-sqrt(d^2-w0^2)) -1/s1]",
  "1.1.4": "[wd w0 (1-wd/w0)*100 pi/wd 1/d]",
  "1.1.5": "dampingReadouts(M,D,input,value)",
  "1.2.1": "[w0/(2*pi) ratio*w0/(2*pi) 2*pi/(abs(ratio-1)*w0)]",
  "1.2.2":
    "[wd/(2*pi) ratio*w0/(2*pi) F0/hypot(D-M*(ratio*w0)^2,Rm*ratio*w0) abs(forced(8/d,M,D,Rm,F0,ratio,x0,v0,2))]",
  "1.2.3": "[d log(20)/d pi/d log(20)/d/T0 (1-exp(-d*pulseCycles*T0))*100]",
  "2.1": "stringReadouts(T,mu,L,height)",
  "2.2": "[sqrt(T/mu)/(2*L) 3*sqrt(T/mu)/(2*L) sqrt(T/mu)/(4*L) pluckB(2,height,pluck)]",
  "2.3":
    "[sqrt(E*1e9/rho) sigma*1e6*S (sigma+gradient*.2*L)*1e6*S gradient*1e6/rho rodRoots(rho*S*L/tipMass)*sqrt(E*1e9/rho)/(2*pi*L)]",
  "2.4": "[sqrt(E*1e9/rho) sqrt(E*1e9/rho)/(2*L) sqrt(E*1e9/rho)/(4*L) L/2]",
};
