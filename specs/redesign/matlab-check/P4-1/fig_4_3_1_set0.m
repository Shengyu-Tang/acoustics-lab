set(groot,'defaultFigureVisible','off');
% 4.3-1
% 参数块：修改后运行整个脚本即可重算；SI 单位（另注除外）。
rho = 1000; % 静态密度 (kg/m³)
c = 1500; % 介质声速 (m/s)
f = 1000; % 频率 (Hz)
a = 0.05; % a（见网页参数表；SI 单位或无量纲选择）
v = 0.01; % v（见网页参数表；SI 单位或无量纲选择）
d = 0.02; % 两源间距 (m)
Q = 0.00001; % 单源体积速度 (m³/s)
r = 10; % r（见网页参数表；SI 单位或无量纲选择）
theta = 30; % theta（见网页参数表；SI 单位或无量纲选择）
tView = 0; % tView（见网页参数表；SI 单位或无量纲选择）
% 以下为计算模型与绘图，可独立运行，无需网页。
model_x=cell(1,1); model_y=model_x;
set(groot,'defaultAxesFontName','Microsoft YaHei','defaultTextFontName','Microsoft YaHei');
set(groot,'defaultTextInterpreter','tex','defaultLegendInterpreter','tex','defaultAxesTickLabelInterpreter','tex');
figure('Color','w','Position',[80 80 640 520]);
w=2*pi*f; k=w/c; Z=rho*c; tau=w*tView;;[XX,YY]=meshgrid(linspace(-0.5,0.5,161),linspace(-0.5,0.5,81));ZZ=20*log10(max(1e-3,abs(p4Dipole(XX,YY,d,Q,f,rho,c))));
ratio=(k*d)^2/3;
pressure=rho*f*Q/(2*r)*k*d*abs(cosd(theta));
lecture_readouts=[(k*d)^2/3 rho*f*Q/(2*r)*k*d*abs(cosd(theta))];
subplot(1,1,1);
hold on;
field_x=linspace(-0.5,0.5,161); field_y=linspace(-0.5,0.5,81); field_z=ZZ;
im=imagesc(field_x,field_y,field_z);
model_fields{1}=struct('x',field_x,'y',field_y,'z',field_z);
if isprop(im,'Interpolation'), im.Interpolation='bilinear'; end
set(im,'HandleVisibility','off');
set(gca,'YDir','normal');
caxis([-60 40]);
% RdBu, identical 64 colors to browser
colormap(gca,[33 102 172;40 107 174;47 111 177;53 116 179;60 120 182;67 125 184;74 130 186;81 134 189;87 139 191;94 143 193;101 148 196;108 153 198;115 157 201;121 162 203;128 166 205;135 171 208;142 176 210;148 180 212;155 185 215;162 189 217;169 194 220;176 199 222;182 203 224;189 208 227;196 212 229;203 217 232;210 222 234;216 226 236;223 231 239;230 235 241;237 240 243;244 245 246;246 243 244;244 236 237;242 229 231;239 222 224;237 215 218;235 208 211;233 201 205;231 194 198;228 187 192;226 180 185;224 173 179;222 166 173;220 159 166;217 151 160;215 144 153;213 137 147;211 130 140;209 123 134;206 116 127;204 109 121;202 102 114;200 95 108;198 88 101;196 81 95;193 74 88;191 66 82;189 59 75;187 52 69;185 45 62;182 38 56;180 31 49;178 24 43]/255);
cb=colorbar; ylabel(cb,'声压幅值 (dB，参考 1 Pa)','Interpreter','tex');
x=[-d/2 d/2];
y=[0 0];
model_x{1,1}=x; model_y{1,1}=y;
plot(x,y,'LineStyle','none','Marker','o', 'MarkerIndices',[1 2],'Color',[0 0.4470588235294118 0.7411764705882353],'LineWidth',1.5,'DisplayName','反相点源对');
set(gca,'XScale','linear','YScale','linear');
xlim([-0.5 0.5]); ylim([-0.5 0.5]);
xticks([-0.5 -0.25 0 0.25 0.5]); yticks([-0.5 -0.25 0 0.25 0.5]);
set(gca,'XMinorTick','off','YMinorTick','off');
xlabel('位置 x (m)','Interpreter','tex'); ylabel('示意坐标 y (m)','Interpreter','tex');
title('偶极声压幅值（对数刻度，参考 1 Pa）','Interpreter','tex','FontSize',12);
box on; grid on; set(gca,'FontName','Microsoft YaHei','FontSize',11,'TickDir','in');
% 依当前参数重定标；原有 TeX、字体、图例与标线样式保留。
qa_domain=[-0.5 0.5]; xlim(qaAxisLimits(qa_domain,0)); set(gca,'XTickMode','auto','YTickMode','auto');
ylim([-0.5 0.5]);
daspect([1 1 1]);
model_limits{1}=struct('x',xlim,'y',ylim);

function R=dampingResistance(M,D,input,value)
if input==0,R=value;elseif input==1,R=2*M*value;else,R=sqrt(M*D)/value;end
end
function y=freeResponse(t,M,D,R,x0,v0)
w=sqrt(D/M); d=R/(2*M); q=d*d-w*w;
if abs(q)<1e-10*w*w
 y=exp(-d*t).*(x0+(v0+d*x0)*t);
elseif q<0
 wd=sqrt(-q); y=exp(-d*t).*(x0*cos(wd*t)+(v0+d*x0)/wd*sin(wd*t));
else
 h=sqrt(q); s1=-w*w/(d+h); s2=-d-h;
 y=((v0-s2*x0)*exp(s1*t)+(s1*x0-v0)*exp(s2*t))/(s1-s2);
end
end
function r=dampingReadouts(M,D,input,value)
w=sqrt(D/M); if input==0,R=value;elseif input==1,R=2*M*value;else,R=w*M/value;end
d=R/(2*M); Q=w*M/R; wd=sqrt(max(0,w*w-d*d));
if wd>0, decrement=2*pi*d/wd; cycles=wd/(2*d);else,decrement=NaN;cycles=NaN;end
r=[R d Q 1/d decrement cycles];
end
function r=stringReadouts(T,mu,L,h)
s=h*pi/L*cos(pi*[.4 .6]); left=-T*s(1)/hypot(1,s(1));right=T*s(2)/hypot(1,s(2));
r=[sqrt(T/mu) left right left+right abs(h)*pi/L];
end
function y=forced(t,M,D,R,F,ratio,x0,v0,component)
w0=sqrt(D/M); w=ratio*w0;
if R==0
 if abs(w-w0)<1e-9*w0,y=F/(2*M*w0)*t.*sin(w0*t);
 else,y=F/(M*(w0*w0-w*w))*(cos(w*t)-cos(w0*t));end
 return;
end
a=D-M*w*w; b=R*w; den=a*a+b*b; C=F*a/den; S=F*b/den;
steady=C*cos(w*t)+S*sin(w*t); transient=freeResponse(t,M,D,R,x0-C,v0-w*S);
if component==1,y=steady;elseif component==2,y=transient;else,y=steady+transient;end
end
function y=beatEnvelope(t,M,D,F,ratio)
w0=sqrt(D/M); w=ratio*w0;
if abs(w-w0)<1e-9*w0,y=F*t/(2*M*w0);
else,y=abs(2*F/(D-M*w*w)*sin((w-w0)*t/2));end
end
function y=pulseResponse(t,M,D,R,F,on,gap)
w=sqrt(D/M); y=zeros(size(t));
for i=0:1
 for j=0:1
  start=i*(on+gap)+j*on; sign=1-2*j; u=t-start; phase=w*start-pi/2;
  a=D-M*w*w; b=R*w; den=a*a+b*b;
  C=F*(a*cos(phase)+b*sin(phase))/den; S=F*(b*cos(phase)-a*sin(phase))/den;
  active=u>=0; z=u(active);
  y(active)=y(active)+sign*(C*cos(w*z)+S*sin(w*z)+freeResponse(z,M,D,R,-C,-w*S));
 end
end
end
function f=frequencyGrid(finish,M,D,R,N)
w=sqrt(D/M);z=R/(2*sqrt(M*D));s=sqrt(max(0,1-2*z*z));peaks=w/(2*pi);
if s>0,peaks=[w/(2*pi)*s w/(2*pi) w/(2*pi)/s];end
f=sort([linspace(0,finish,N) peaks(peaks>=0 & peaks<=finish)]);
end
function y=frequencyResponse(f,M,D,R,F,component)
w=2*pi*f; X=w*M-D./w;
X(f>0 & abs(X)<=8*eps.*max(abs(w*M),abs(D./w)))=0;
Z=hypot(R,X); v=F./Z; pv=-atan2(X,R);
switch component
 case 1,y=v./w; y(f==0)=F/D;
 case 2,y=v;
 case 3,y=w.*v;
 case 4,y=(pv-pi/2)*180/pi; y(f==0)=0;
 case 5,y=pv*180/pi; y(f==0)=90;
 case 6,y=(pv+pi/2)*180/pi; y(f==0)=180;
 case 7,y=Z;
 case 8,y=R+zeros(size(f));
 case 9,y=X;
 case 10,y=.5*R*v.^2;
end
end
function y=instantPower(t,f,M,D,R,F)
v=frequencyResponse(f,M,D,R,F,2); phase=frequencyResponse(f,M,D,R,F,5)*pi/180;
y=F*cos(2*pi*f*t).*v.*cos(2*pi*f*t+phase);
end
function y=stringBoundary(x,h,F,T,k,L,w,t,boundary)
if boundary==0,y=h*sin(pi*x)*cos(w*t);
elseif boundary==1,y=F/(T*k*cos(k*L))*sin(k*L*x)*cos(w*t);
elseif boundary==2,y=h*sin(k*L*x)/sin(k*L)*cos(w*t);
else,y=.1/w*sin(k*L*x)/sin(k*L)*sin(w*t);end
end
function b=pluckB(n,h,p)
b=2*h*sin(n*pi*p)./(pi*pi*n.^2*p*(1-p));
end
function y=pluckSum(x,t,c,L,h,p,direction)
y=zeros(size(x));
for n=1:12
 k=n*pi/L; w=c*k; b=pluckB(n,h,p);
 if direction==0,y=y+b*sin(n*pi*x)*cos(w*t);
 else,y=y+b/2*sin(n*pi*x+direction*w*t);end
end
end
function y=endResponse(f,c,L,rigidity,F)
k=2*pi*f/c; y=F*abs(tan(k*L)./(rigidity*k));
y(f==0)=F*L/rigidity; y(abs(cos(k*L))<1e-12)=NaN;
end
function y=loadedFrequency(mass,rho,S,L,c)
y=zeros(size(mass));
for j=1:numel(mass)
 r=rodRoots(rho*S*L/max(1e-9,mass(j))); y(j)=r(1)*c/(2*pi*L);
end
end
function roots=rodRoots(alpha)
roots=zeros(1,3);
for n=0:2
 lo=n*pi+1e-12; hi=n*pi+pi/2-1e-12;
 for i=1:70
  mid=(lo+hi)/2; if tan(mid)*mid<alpha,lo=mid;else,hi=mid;end
 end
 roots(n+1)=(lo+hi)/2;
end
end
function y=tanGaps(x)
y=tan(x); y(abs(cos(x))<1e-12)=NaN;
end
function y=divideGaps(alpha,x)
y=alpha./x; y(x==0)=NaN;
end
function points=arrowPoints(a,b,yPerX)
dx=b(1)-a(1); dy=(b(2)-a(2))/yPerX; h=.15;
points=[a;b;b(1)-h*dx+h*dy/2,b(2)-(h*dy+h*dx/2)*yPerX;b;b(1)-h*dx-h*dy/2,b(2)-(h*dy-h*dx/2)*yPerX];
end
function finish=niceEnd(hi)
raw=hi/5; decade=10^floor(log10(raw)); candidates=[1 2 2.5 5 10]*decade;
best=Inf; step=candidates(1);
for s=candidates
 count=ceil(hi/s-1e-10)+1; score=abs(count-6)+100*(count<4 || count>8);
 if score<best,best=score;step=s;end
end
finish=str2double(sprintf('%.13g',ceil(hi/step-1e-10)*step));
end
function lim=p2NiceLimits(lo,hi)
raw=(hi-lo)/5;decade=10^floor(log10(raw));steps=[1 2 2.5 5 10]*decade;
counts=ceil(hi./steps-1e-10)-floor(lo./steps+1e-10)+1;
scores=abs(counts-6)+100*(counts<4 | counts>8);[score,ii]=min(scores);exact=abs(lo./steps-round(lo./steps))<1e-9 & abs(hi./steps-round(hi./steps))<1e-9;jj=find(scores==score & exact,1);if ~isempty(jj),ii=jj;end;st=steps(ii);
lim=[floor(lo/st+1e-10)*st ceil(hi/st-1e-10)*st];
end
function L=p2SourceLevel(n,L1)
L=L1+10*log10(max(n,eps));L(n<=0)=NaN;
end
function [R,D,ct]=p3Oblique(Z1,Z2,c1,c2,theta)
theta=min(theta,89.999999);st=c2/c1*sind(theta);ct=conj(sqrt(complex(1-st.^2)));
R=(Z2*cosd(theta)-Z1*ct)./(Z2*cosd(theta)+Z1*ct);D=1+R;
end
function [th0,thc]=p3Angles(Z1,Z2,c1,c2)
q=c2/c1;s2=(Z1^2-Z2^2)/(Z1^2*q^2-Z2^2);th0=NaN;thc=NaN;
if q>1,thc=asind(1/q);end
if s2>=0&&s2<1&&s2*q*q<1,th0=asind(sqrt(s2));end
end
function c=p3Critical(c1,c2)
if c2>c1,c=asind(c1/c2);else,c=NaN;end
end
function t=p3Refraction(c1,c2,theta)
s=c2/c1*sind(theta);if s<=1,t=asind(s);else,t=NaN;end
end
function a=p3ModeAngle(mode,c,h,f)
if f>mode*c/(2*h),a=asind(mode*c/(2*h*f));else,a=NaN;end
end
function b=p3Brewster(Z1,Z2,c1,c2)
[b,~]=p3Angles(Z1,Z2,c1,c2);
end
function t=p3Power(Z1,Z2,c1,c2,theta)
[R,D,ct]=p3Oblique(Z1,Z2,c1,c2,theta);t=Z1/Z2*abs(D).^2.*real(ct)./cosd(min(theta,89.999999));
end
function y=p3Source(x,source,offset,width,a1,a2,a3)
if source==0,y=ones(size(x));elseif source==1,y=exp(-((x-offset)/width).^2);else,y=1+a1*cos(pi*x)+a2*cos(2*pi*x)+a3*cos(3*pi*x);end
end
function co=p3Coefficients(source,offset,width,a1,a2,a3)
if source==0,co=[1 0 0 0 0 0];elseif source==2,co=[1 a1 a2 a3 0 0];else
x=linspace(0,1,401);v=p3Source(x,source,offset,width,a1,a2,a3);co=zeros(1,6);
for nn=0:5,co(nn+1)=trapz(x,v.*cos(nn*pi*x))*(1+(nn>0));end
end
end
function v=p3GuideSpeed(f,n,h,c,group)
fc=n*c/(2*h);g=sqrt(max(0,1-(fc./f).^2));if group,v=g;else,v=1./g;end;v(f<=fc)=NaN;
end
function d=p3Depth(theta,c1,c2,f)
s=c2/c1*sind(theta);d=c2./(2*pi*f*sqrt(max(0,s.^2-1)));d(s<=1)=NaN;
end
function s=answerNumber(v)
s=sprintf('%.4g',v);
if isfinite(v) && v~=0 && (abs(v)<.001 || abs(v)>=10000)
 e=floor(log10(abs(v)));a=str2double(sprintf('%.4g',v/10^e));
 if abs(a)>=10,a=a/10;e=e+1;end
 s=[sprintf('%.4g',a) char(92) 'times10^{' num2str(e) '}'];
end
end
function y=p3Mask(y,mask)
y(~mask)=NaN;
end
function y=p3FiniteSPL(amplitude)
y=20*log10(amplitude/(sqrt(2)*1e-6));y(amplitude==0)=NaN;
end
function R=p3Boundary(boundary)
Rs=[0 .6 -.6 1 -1];R=Rs(boundary+1);
end
function pts=p3Rays(radius,source,launch)
v=[cosd(launch) sind(launch)];pt=[radius*source 0];pts=pt;
for ii=1:16
 d=dot(pt,v);L=-d+sqrt(max(0,d^2+radius^2-dot(pt,pt)));pt=pt+L*v;pt=radius*pt/norm(pt);pts=[pts;pt];v=v-2*dot(v,pt/radius)*pt/radius;v=v/norm(v);
end
end
function lim=currentAmplitudeLimits(values,bars,logarithmic)
values=values(isfinite(values));
if logarithmic,values=values(values>0);end
if isempty(values),if logarithmic,lim=[1e-6 1];else,lim=[0 1];end;return;end
lo=min(values);hi=max(values);
if logarithmic,lim=[10^floor(log10(lo*.9)) 10^ceil(log10(hi*1.1))];return;end
if bars,if hi>0,lim=p2NiceLimits(0,hi*1.08);else,lim=[0 1];end;return;end
if lo==hi,pad=abs(lo)*.15;if pad==0,pad=1;end;lo=lo-pad;hi=hi+pad;
else,pad=(hi-lo)*.08;if lo~=0,lo=lo-pad;end;if hi~=0,hi=hi+pad;end;end
lim=p2NiceLimits(lo,hi);
end
function lim=qaAmplitudeLimits(values,fallback,bars,logarithmic)
if isempty(values),lim=fallback;else,lim=currentAmplitudeLimits(values,bars,logarithmic);end
end
function lim=qaAxisLimits(domain,logarithmic)
if logarithmic,lim=[10^floor(log10(domain(1))) 10^ceil(log10(domain(2)))];
elseif isequal(domain,[0 90]) || isequal(domain,[0 180]) || isequal(domain,[0 360]) || isequal(domain,[-90 90]),lim=domain;
else,lim=p2NiceLimits(domain(1),domain(2));end
end


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
