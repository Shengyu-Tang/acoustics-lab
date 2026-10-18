set(groot,'defaultFigureVisible','off');
% 通风管道的单模频带与终端反射设计
% 参数块：修改后运行整个脚本即可重算；SI 单位（另注除外）。
rho = 1.21; % 静态密度 (kg/m³)
c = 350; % 空气声速 (m/s)
f = 570; % 工作频率 (Hz)
h = 0.28; % 现有波导高度 (m)
testF = 1690; % 高阶模态诊断频率 (Hz)
res = 1.7000000000000002; % 终端归一化声阻 (—)
react = 0.8; % 终端归一化声抗 (—)
safety = 0.8999999999999999; % 频率与截止频率比上限 (—)
tView = 0; % tView（见网页参数表；SI 单位或无量纲选择）
% 以下为计算模型与绘图，可独立运行，无需网页。
model_x=cell(2,3); model_y=model_x;
set(groot,'defaultAxesFontName','Microsoft YaHei','defaultTextFontName','Microsoft YaHei');
set(groot,'defaultTextInterpreter','tex','defaultLegendInterpreter','tex','defaultAxesTickLabelInterpreter','tex');
figure('Color','w','Position',[80 80 640 1280]);
w=2*pi*f; k=w/c; Z=rho*c; tau=w*tView;fc=c/(2*h);rp=abs((res+1i*react-1)/(res+1i*react+1));cg=@(ff,nn) c*sqrt(max(0,1-(nn*fc./ff).^2));chosenH=0;for hh=[.35 .3 .25 .2 .15 .1],if hh<=safety*c/(2*f),chosenH=hh;break;end;end;RP=(res+1i*react-1)/(res+1i*react+1);;qaDomain=qaAxisLimits([0 2],0);
cutoff=fc;
groupSpeed=cg(testF,1);
reflection=rp;
absorption=1-rp^2;
heightLimit=safety*c/(2*f);
selectedHeight=chosenH;
worksheet_answers=[cutoff groupSpeed reflection absorption heightLimit selectedHeight];
subplot(2,1,1);
hold on;
x=linspace(qaDomain(1),qaDomain(2),401);
y=abs(exp(1i*2*pi*f*x/c)+RP*exp(-1i*2*pi*f*x/c));
model_x{1,1}=x; model_y{1,1}=y;
plot(x,y,'LineStyle','-','Marker','none','Color',[0 0.4470588235294118 0.7411764705882353],'LineWidth',1.5,'DisplayName','工作频率的入射与反射合成场');
x=0;
y=abs(1+RP);
model_x{1,2}=x; model_y{1,2}=y;
plot(x,y,'LineStyle','none','Marker','o', 'MarkerIndices',[1],'Color',[0.8509803921568627 0.3254901960784314 0.09803921568627451],'LineWidth',1.5,'DisplayName','终端声压');
set(gca,'XScale','linear','YScale','linear');
xlim([0 2]); ylim([0.4 1.6]);
xticks([0 0.5 1 1.5 2]); yticks([0.4 0.6 0.8 1 1.2 1.4 1.6]);
set(gca,'XMinorTick','off','YMinorTick','off');
xlabel('距终端位置 z (m)','Interpreter','tex'); ylabel('合成声压幅值 (Pa)','Interpreter','tex');
yline(1+rp,'--',sprintf('波腹声压 %.4g Pa',1+rp),'Interpreter','tex','LabelVerticalAlignment','top','LabelHorizontalAlignment','right','HandleVisibility','off');
yline(1-rp,'--',sprintf('波节声压 %.4g Pa',1-rp),'Interpreter','tex','LabelVerticalAlignment','bottom','LabelHorizontalAlignment','right','HandleVisibility','off');
title({sprintf('终端声压反射系数模值 = %s',answerNumber(reflection)),'截止频率 625 Hz；所选高度 0.25 m；诊断群速度 325.2 m/s。'},'Interpreter','tex','FontSize',12);
box on; grid on; set(gca,'FontName','Microsoft YaHei','FontSize',11,'TickDir','in');
lgd=legend('show','Location','best','Color','w','Box','on','Interpreter','tex');
qa_left=[]; qa_right=[]; qa_time=tView;
x=linspace(qaDomain(1),qaDomain(2),401); y=abs(exp(1i*2*pi*f*x/c)+RP*exp(-1i*2*pi*f*x/c));
qa_xl=qaDomain; qa_y=y(isfinite(y) & x>=qa_xl(1) & x<=qa_xl(2)); qa_left=[qa_left qa_y];
x=0; y=abs(1+RP);
qa_xl=qaDomain; qa_y=y(isfinite(y) & x>=qa_xl(1) & x<=qa_xl(2)); qa_left=[qa_left qa_y];
% 依当前参数重定标；原有 TeX、字体、图例与标线样式保留。
qa_domain=qaDomain; xlim(qaAxisLimits(qa_domain,0)); set(gca,'XTickMode','auto','YTickMode','auto');
ylim(qaAmplitudeLimits(qa_left,[0.4 1.6],0,0));
lgd.Location='northoutside';
model_limits{1}=struct('x',xlim,'y',ylim);
w=2*pi*f; k=w/c; Z=rho*c; tau=w*tView;fc=c/(2*h);rp=abs((res+1i*react-1)/(res+1i*react+1));cg=@(ff,nn) c*sqrt(max(0,1-(nn*fc./ff).^2));chosenH=0;for hh=[.35 .3 .25 .2 .15 .1],if hh<=safety*c/(2*f),chosenH=hh;break;end;end;;qaDomain=[200 2000];
subplot(2,1,2);
hold on;
x=linspace(qaDomain(1),qaDomain(2),401);
y=cg(x,1);
model_x{2,1}=x; model_y{2,1}=y;
plot(x,y,'LineStyle','-','Marker','none','Color',[0 0.4470588235294118 0.7411764705882353],'LineWidth',1.5,'DisplayName','第一高阶模态');
x=linspace(qaDomain(1),qaDomain(2),401);
y=cg(x,2);
model_x{2,2}=x; model_y{2,2}=y;
plot(x,y,'LineStyle','-','Marker','none','Color',[0.8509803921568627 0.3254901960784314 0.09803921568627451],'LineWidth',1.5,'DisplayName','第二高阶模态');
x=testF;
y=cg(testF,1);
model_x{2,3}=x; model_y{2,3}=y;
plot(x,y,'LineStyle','none','Marker','o', 'MarkerIndices',[1],'Color',[0.9294117647058824 0.6941176470588235 0.12549019607843137],'LineWidth',1.5,'DisplayName','诊断频率的第一高阶群速度');
set(gca,'XScale','linear','YScale','linear');
xlim([200 2000]); ylim([0 400]);
xticks([0 500 1000 1500 2000]); yticks([0 100 200 300 400]);
set(gca,'XMinorTick','off','YMinorTick','off');
xlabel('频率 f (Hz)','Interpreter','tex'); ylabel('群速度 (m/s)','Interpreter','tex');
xline(fc,'--',sprintf('第一高阶截止频率 = %.4g',fc),'Interpreter','tex','LabelOrientation','horizontal','LabelVerticalAlignment','top','LabelHorizontalAlignment','right','HandleVisibility','off');
xline(f/safety,'--',{' ';sprintf('工作频率所需最低截止频率 = %.4g',f/safety)},'Interpreter','tex','LabelOrientation','horizontal','LabelVerticalAlignment','top','LabelHorizontalAlignment','right','HandleVisibility','off');
title('第一高阶群速度与截止裕量','Interpreter','tex','FontSize',12);
box on; grid on; set(gca,'FontName','Microsoft YaHei','FontSize',11,'TickDir','in');
lgd=legend('show','Location','best','Color','w','Box','on','Interpreter','tex');
qa_left=[]; qa_right=[]; qa_time=tView;
x=linspace(qaDomain(1),qaDomain(2),401); y=cg(x,1);
qa_xl=qaDomain; qa_y=y(isfinite(y) & x>=qa_xl(1) & x<=qa_xl(2)); qa_left=[qa_left qa_y];
x=linspace(qaDomain(1),qaDomain(2),401); y=cg(x,2);
qa_xl=qaDomain; qa_y=y(isfinite(y) & x>=qa_xl(1) & x<=qa_xl(2)); qa_left=[qa_left qa_y];
x=testF; y=cg(testF,1);
qa_xl=qaDomain; qa_y=y(isfinite(y) & x>=qa_xl(1) & x<=qa_xl(2)); qa_left=[qa_left qa_y];
% 依当前参数重定标；原有 TeX、字体、图例与标线样式保留。
qa_domain=qaDomain; xlim(qa_domain); set(gca,'XTickMode','auto','YTickMode','auto');
ylim(qaAmplitudeLimits(qa_left,[0 400],0,0));
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
