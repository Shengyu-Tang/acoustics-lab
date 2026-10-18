/** Native MATLAB special functions provide an independent implementation. */
export const P4_MATLAB = String.raw`
function [Rs,Xs,P,Ms]=p4Sphere(a,f,rho,c,v)
x=2*pi*f*a/c;S=4*pi*a^2;Rs=rho*c*S*x.^2./(1+x.^2);Xs=rho*c*S*x./(1+x.^2);P=.5*v^2*Rs;Ms=Xs./(2*pi*f);
end
function p=p4SphereP(r,a,f,rho,c,v)
k=2*pi*f/c;p=rho*c*v*1i*k*a^2./(r*(1+1i*k*a)).*exp(-1i*k*(r-a));
end
function p=p4Point(r,Q,f,rho,c)
p=1i*rho*f*Q./(2*r).*exp(-1i*2*pi*f/c*r);
end
function p=p4Array(x,y,N,d,Q,f,rho,c)
p=zeros(size(x+y));for nn=0:N-1,r=max(.005,hypot(x,y-(nn-(N-1)/2)*d));p=p+p4Point(r,Q,f,rho,c);end
end
function p=p4Dipole(x,y,d,Q,f,rho,c)
p=p4Point(max(.002,hypot(x-d/2,y)),Q,f,rho,c)-p4Point(max(.002,hypot(x+d/2,y)),Q,f,rho,c);
end
function D=p4PistonD(x)
D=ones(size(x));ii=abs(x)>1e-6;D(ii)=2*besselj(1,x(ii))./x(ii);
end
function p=p4Axis(z,a,f,rho,c,v)
k=2*pi*f/c;delta=a^2./(hypot(z,a)+z);p=rho*c*v.*exp(-1i*k*z).*(1-exp(-1i*k*delta));
end
function y=p4Green(k,r)
y=-1i/4*besselh(0,2,k*r);
end
function y=p4GreenD(k,r)
y=1i*k/4*besselh(1,2,k*r);
end
function value=p4Helm(x,y,a,f,c,N,exterior)
k=2*pi*f/c;value=zeros(size(x+y));
for ii=0:N-1,ph=2*pi*(ii+.5)/N;nx=cos(ph);ny=sin(ph);sx=a*nx;sy=a*ny;r=max(hypot(x-sx,y-sy),1e-8);
if exterior,p=p4Green(k,a);dp=p4GreenD(k,a);else,p=exp(-1i*k*sx);dp=-1i*k*nx*p;end
G=p4Green(k,r);dn=p4GreenD(k,r).*((sx-x)*nx+(sy-y)*ny)./r;
value=value+(G.*dp-p.*dn)*a*2*pi/N*(1-2*exterior);end
end
function p=p4Cyl(x,y,a,f,c,soft,part)
rr=hypot(x,y);theta=atan2(y,x);k=2*pi*f/c;ka=k*a;r=max(a,rr);ps=zeros(size(r));
for nn=0:ceil(ka+12),h=besselh(nn,2,ka);if nn==0,dh=-besselh(1,2,ka);dj=-besselj(1,ka);else,dh=besselh(nn-1,2,ka)-nn/ka*h;dj=besselj(nn-1,ka)-nn/ka*besselj(nn,ka);end
if soft,q=besselj(nn,ka)/h;else,q=dj/dh;end
ps=ps-(1+(nn>0))*q*(-1i)^nn*besselh(nn,2,k*r).*cos(nn*theta);end
pii=exp(-1i*k*x);if part==0,p=pii;elseif part==1,p=ps;else,p=pii+ps;end
if part~=0,p(rr<a*(1-1e-12))=0;end
end
function value=p4CylFar(ka,theta,soft)
value=zeros(size(theta));for nn=0:ceil(ka+12),h=besselh(nn,2,ka);if nn==0,dh=-besselh(1,2,ka);dj=-besselj(1,ka);else,dh=besselh(nn-1,2,ka)-nn/ka*h;dj=besselj(nn-1,ka)-nn/ka*besselj(nn,ka);end
if soft,q=besselj(nn,ka)/h;else,q=dj/dh;end;value=value-(1+(nn>0))*q*cos(nn*theta);end
end
function h=p4SphH(n,x)
h=sqrt(pi./(2*x)).*besselh(n+.5,2,x);
end
function [amp,sigma]=p4Rigid(ka,theta)
value=zeros(size(theta));sigma=0;P0=ones(size(theta));P1=cos(theta);
for nn=0:ceil(ka+12),h=p4SphH(nn,ka);if nn==0,dh=-p4SphH(1,ka);P=P0;else,dh=p4SphH(nn-1,ka)-(nn+1)/ka*h;if nn==1,P=P1;else,P=((2*nn-1)*cos(theta).*P1-(nn-1)*P0)/nn;P0=P1;P1=P;end;end
q=real(dh)/dh;value=value+(2*nn+1)*q.*P;sigma=sigma+(2*nn+1)*abs(q)^2;end
amp=abs(value)/ka;sigma=4*sigma/ka^2;
end
function y=p4Sigma(x)
y=arrayfun(@(q)p4SigmaOne(q),x);
end
function y=p4SigmaOne(x)
[~,y]=p4Rigid(x,0);
end
function g=p4Receive(x,disk)
if ~disk,g=1./(1+1i*x);return;end
tt=((1:512)-.5)/512;H=arrayfun(@(q)4*q/pi*mean(sqrt(1-tt.^2).*sin(2*q*tt)),x);g=2-besselj(1,2*x)./max(x,1e-20)+1i*H./max(x,1e-20);g(x==0)=1;
end
function [incident,received]=p4Pulse(t,f,a,c,disk)
incident=zeros(size(t));received=incident;for nn=1:16,weight=exp(-.5*((nn-5)/2)^2);w=2*pi*f*nn;gamma=p4Receive(w*a/c,disk);incident=incident+weight*cos(w*t);received=received+weight*real(gamma*exp(1i*w*t));end
end
function y=p4PulseOut(t,f,a,c,disk)
[~,y]=p4Pulse(t,f,a,c,disk);
end
function y=p4Relax(f,A,tau)
y=A*(2*pi*f).^2*tau./(1+(2*pi*f*tau).^2);
end
function y=p4Thorp(f)
q=f/1000;y=.11*q.^2./(1+q.^2)+44*q.^2./(4100+q.^2)+2.75e-4*q.^2+.003;
end
function [alpha,z]=p4Porous(f,d,sigma,rho,c)
X=rho*f/sigma;Zc=1+.0571*X.^(-.754)-1i*.087*X.^(-.732);kd=2*pi*f/c*d.*(1+.0978*X.^(-.7)-1i*.189*X.^(-.595));z=-1i*Zc.*cot(kd);alpha=4*real(z)./abs(z+1).^2;
end
function y=p4PorousRe(f,d,sigma,rho,c)
[~,z]=p4Porous(f,d,sigma,rho,c);y=real(z);
end
function y=p4PorousIm(f,d,sigma,rho,c)
[~,z]=p4Porous(f,d,sigma,rho,c);y=imag(z);
end
function y=p4PorousPeak(d,sigma,rho,c)
ff=linspace(400,4000,401);aa=p4Porous(ff,d,sigma,rho,c);[~,ii]=max(aa);y=ff(ii);
end
function y=p4PorousWidth(d,sigma,rho,c)
ff=linspace(400,4000,401);aa=p4Porous(ff,d,sigma,rho,c);inside=ff(aa>=max(aa)/2);y=inside(end)-inside(1);
end
`;
