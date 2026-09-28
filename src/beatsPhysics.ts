// Displacement is in mm; F0/K = 1 mm, f0 = 1 Hz, initially at rest.
export function forcedBeat(t:number,f:number){
 const w=2*Math.PI*f,w0=2*Math.PI,d=(w-w0)*t/2;
 const sinc=Math.abs(d)<1e-6?1-d*d/6:Math.sin(d)/d;
 const envelope=w0*w0*t/(w+w0)*sinc;
 return {x:envelope*Math.sin((w+w0)*t/2),envelope:Math.abs(envelope)};
}
