set(groot,'defaultFigureVisible','off');
% 琴弦调音、允许张力与余韵时间设计
% 参数块：修改后运行整个脚本即可重算；SI 单位（另注除外）。
rho = 1000; % 静态密度 (kg/m³)
c = 343; % 介质声速 (m/s)
f = 330; % 频率 (Hz)
L = 0.73; % 有效弦长 (m)
mu = 0.00045; % 线密度 (kg/m)
T = 79; % 当前张力 (N)
Q = 1360; % 当前品质因数 (—)
target = 373; % 目标基频 (Hz)
designQ = 340; % 候选品质因数 (—)
tailLimit = 3.4000000000000004; % 余韵时间上限 (s)
tensionLimit = 113; % 允许张力上限 (N)
tView = 0; % tView（见网页参数表；SI 单位或无量纲选择）
% 以下为计算模型与绘图，可独立运行，无需网页。
model_x=cell(2,3); model_y=model_x;
set(groot,'defaultAxesFontName','Microsoft YaHei','defaultTextFontName','Microsoft YaHei');
set(groot,'defaultTextInterpreter','tex','defaultLegendInterpreter','tex','defaultAxesTickLabelInterpreter','tex');
figure('Color','w','Position',[80 80 640 1280]);
w=2*pi*f; k=w/c; Z=rho*c; tau=w*tView;fInitial=sqrt(T/mu)/(2*L);tunedT=mu*(2*L*target)^2;tail=@(ff,qq) qq*log(1000)/(pi*ff);level=@(tt,ff,qq) -20/log(10)*pi*ff*tt/qq;chosen=0;if tunedT<=tensionLimit && tail(target,designQ)<=tailLimit,chosen=designQ;end;;qaDomain=qaAxisLimits([0 5],0);
fundamental=fInitial;
currentTail=tail(fInitial,Q);
targetTension=tunedT;
maximumQ=pi*target*tailLimit/log(1000);
newTail=tail(target,designQ);
chosen=chosen;
worksheet_answers=[fundamental currentTail targetTension maximumQ newTail chosen];
subplot(2,1,1);
hold on;
x=linspace(qaDomain(1),qaDomain(2),401);
y=level(x,fInitial,Q);
model_x{1,1}=x; model_y{1,1}=y;
plot(x,y,'LineStyle','-','Marker','none','Color',[0 0.4470588235294118 0.7411764705882353],'LineWidth',1.5,'DisplayName','当前张力与损耗');
x=linspace(qaDomain(1),qaDomain(2),401);
y=level(x,target,designQ);
model_x{1,2}=x; model_y{1,2}=y;
plot(x,y,'LineStyle','-','Marker','none','Color',[0.8509803921568627 0.3254901960784314 0.09803921568627451],'LineWidth',1.5,'DisplayName','目标音高与候选损耗');
x=tail(target,designQ);
y=-60;
model_x{1,3}=x; model_y{1,3}=y;
plot(x,y,'LineStyle','none','Marker','o', 'MarkerIndices',[1],'Color',[0.9294117647058824 0.6941176470588235 0.12549019607843137],'LineWidth',1.5,'DisplayName','候选衰减六十分贝');
set(gca,'XScale','linear','YScale','linear');
xlim([0 5]); ylim([-200 0]);
xticks([0 1 2 3 4 5]); yticks([-200 -150 -100 -50 0]);
set(gca,'XMinorTick','off','YMinorTick','off');
xlabel('时间 t (s)','Interpreter','tex'); ylabel('相对初始振幅级 (dB)','Interpreter','tex');
yline(-60,'--',sprintf('振幅降至千分之一 = %.4g',-60),'Interpreter','tex','LabelVerticalAlignment','top','LabelHorizontalAlignment','right','HandleVisibility','off');
xline(tailLimit,'--',sprintf('余韵时间上限 = %.4g',tailLimit),'Interpreter','tex','LabelOrientation','horizontal','LabelVerticalAlignment','top','LabelHorizontalAlignment','left','HandleVisibility','off');
title({sprintf('候选处理后的衰减 60 dB 时间 = %s s',answerNumber(newTail)),'当前弦与调音后候选阻尼的衰减包络'},'Interpreter','tex','FontSize',12);
box on; grid on; set(gca,'FontName','Microsoft YaHei','FontSize',11,'TickDir','in');
lgd=legend('show','Location','best','Color','w','Box','on','Interpreter','tex');
qa_left=[]; qa_right=[]; qa_time=tView;
x=linspace(qaDomain(1),qaDomain(2),401); y=level(x,fInitial,Q);
qa_xl=qaDomain; qa_y=y(isfinite(y) & x>=qa_xl(1) & x<=qa_xl(2)); qa_left=[qa_left qa_y];
x=linspace(qaDomain(1),qaDomain(2),401); y=level(x,target,designQ);
qa_xl=qaDomain; qa_y=y(isfinite(y) & x>=qa_xl(1) & x<=qa_xl(2)); qa_left=[qa_left qa_y];
x=tail(target,designQ); y=-60;
qa_xl=qaDomain; qa_y=y(isfinite(y) & x>=qa_xl(1) & x<=qa_xl(2)); qa_left=[qa_left qa_y];
% 依当前参数重定标；原有 TeX、字体、图例与标线样式保留。
qa_domain=qaDomain; xlim(qaAxisLimits(qa_domain,0)); set(gca,'XTickMode','auto','YTickMode','auto');
ylim(qaAmplitudeLimits(qa_left,[-200 0],0,0));
lgd.Location='northoutside';
model_limits{1}=struct('x',xlim,'y',ylim);
w=2*pi*f; k=w/c; Z=rho*c; tau=w*tView;fInitial=sqrt(T/mu)/(2*L);tunedT=mu*(2*L*target)^2;tail=@(ff,qq) qq*log(1000)/(pi*ff);level=@(tt,ff,qq) -20/log(10)*pi*ff*tt/qq;chosen=0;if tunedT<=tensionLimit && tail(target,designQ)<=tailLimit,chosen=designQ;end;;qaDomain=[200 500];
subplot(2,1,2);
hold on;
x=linspace(qaDomain(1),qaDomain(2),401);
y=mu*(2*L*x).^2;
model_x{2,1}=x; model_y{2,1}=y;
plot(x,y,'LineStyle','-','Marker','none','Color',[0 0.4470588235294118 0.7411764705882353],'LineWidth',1.5,'DisplayName','调音张力');
x=target;
y=tunedT;
model_x{2,2}=x; model_y{2,2}=y;
plot(x,y,'LineStyle','none','Marker','o', 'MarkerIndices',[1],'Color',[0.8509803921568627 0.3254901960784314 0.09803921568627451],'LineWidth',1.5,'DisplayName','目标张力');
set(gca,'XScale','linear','YScale','linear');
xlim([200 500]); ylim([0 300]);
xticks([200 250 300 350 400 450 500]); yticks([0 50 100 150 200 250 300]);
set(gca,'XMinorTick','off','YMinorTick','off');
xlabel('基频 f (Hz)','Interpreter','tex'); ylabel('所需张力 (N)','Interpreter','tex');
yline(tensionLimit,'--',sprintf('允许张力上限 = %.4g',tensionLimit),'Interpreter','tex','LabelVerticalAlignment','bottom','LabelHorizontalAlignment','right','HandleVisibility','off');
title('目标基频与允许张力的联合校核','Interpreter','tex','FontSize',12);
box on; grid on; set(gca,'FontName','Microsoft YaHei','FontSize',11,'TickDir','in');
lgd=legend('show','Location','best','Color','w','Box','on','Interpreter','tex');
qa_left=[]; qa_right=[]; qa_time=tView;
x=linspace(qaDomain(1),qaDomain(2),401); y=mu*(2*L*x).^2;
qa_xl=qaDomain; qa_y=y(isfinite(y) & x>=qa_xl(1) & x<=qa_xl(2)); qa_left=[qa_left qa_y];
x=target; y=tunedT;
qa_xl=qaDomain; qa_y=y(isfinite(y) & x>=qa_xl(1) & x<=qa_xl(2)); qa_left=[qa_left qa_y];
% 依当前参数重定标；原有 TeX、字体、图例与标线样式保留。
qa_domain=qaDomain; xlim(qa_domain); set(gca,'XTickMode','auto','YTickMode','auto');
ylim(qaAmplitudeLimits(qa_left,[0 300],0,0));
lgd.Location='northoutside';
model_limits{2}=struct('x',xlim,'y',ylim);

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
