% 2.2-2
% 参数块：修改后运行整个脚本即可重算；SI 单位（另注除外）。
T = 84; % 张力 (N)
mu = 0.00044000000000000007; % 线密度 (kg/m)
L = 0.5850000000000001; % 有效弦长 (m)
height = 0.0032; % 拨弦高度 (m)
pluck = 0.33; % 拨点位置 (—)
F0 = 0.05500000000000001; % 端点力幅值 (N)
target = 462; % 目标基频 (Hz)
tView = 0; % 动画快照时间 (s)
% 以下为计算模型与绘图，可独立运行，无需网页。
model_x={}; model_y={};
set(groot,'defaultAxesFontName','Microsoft YaHei','defaultTextFontName','Microsoft YaHei');
set(groot,'defaultTextInterpreter','tex','defaultLegendInterpreter','tex','defaultAxesTickLabelInterpreter','tex');
figure('Color','w','Position',[80 80 640 1020]);
c=sqrt(T/mu);
lecture_readouts=[sqrt(T/mu)/(2*L) 3*sqrt(T/mu)/(2*L) sqrt(T/mu)/(4*L) pluckB(2,height,pluck)];
subplot(3,1,1);
hold on;
x=linspace(0,1,401);
y=height*min(x/pluck,(1-x)/(1-pluck));
model_x{1,1}=x; model_y{1,1}=y;
plot(x,y,'LineStyle','-','Marker','none','Color',[0 0.4470588235294118 0.7411764705882353],'LineWidth',1.5,'DisplayName','初始形状');
x=pluck;
y=height;
model_x{1,2}=x; model_y{1,2}=y;
plot(x,y,'LineStyle','none','Marker','o', 'MarkerIndices',[1],'Color',[0.8509803921568627 0.3254901960784314 0.09803921568627451],'LineWidth',1.5,'DisplayName','拨点');
set(gca,'XScale','linear','YScale','linear');
xlim([0 1]); ylim([-0.002 0.008]);
xticks([0 0.2 0.4 0.6 0.8 1]); yticks([-0.002 0 0.002 0.004 0.006 0.008]);
set(gca,'XMinorTick','off','YMinorTick','off');
xlabel('位置 x/L (—)','Interpreter','tex'); ylabel('初始位移 y (m)','Interpreter','tex');
title('初始拨弦形状（三角形）','Interpreter','tex','FontSize',12);
box on; grid on; set(gca,'FontName','Microsoft YaHei','FontSize',11,'TickDir','in');
% 依当前参数重定标；原有 TeX、字体、图例与标线样式保留。
xlim([0 1]); set(gca,'XTickMode','auto','YTickMode','auto');
model_values=[model_y{1,1} model_y{1,2}]; model_values=model_values(isfinite(model_values)); if ~isempty(model_values), if strcmp(get(gca,'YScale'),'log'), positive=model_values(model_values>0); if ~isempty(positive),ylim([min(positive)*.5 max(positive)*2]);end; else, lo=min(0,min(model_values)); hi=max(0,max(model_values)); pad=max((hi-lo)*.08,1e-12); ylim([lo-pad hi+pad]);end;end;
c=sqrt(T/mu);
lecture_readouts=[sqrt(T/mu)/(2*L) 3*sqrt(T/mu)/(2*L) sqrt(T/mu)/(4*L) pluckB(2,height,pluck)];
subplot(3,1,2);
hold on;
x=1:12;
y=pluckB(x,height,pluck);
model_x{2,1}=x; model_y{2,1}=y;
bar(x,y,0.7,'FaceColor',[0 0.4470588235294118 0.7411764705882353],'EdgeColor','k','DisplayName','模态系数');
set(gca,'XScale','linear','YScale','linear');
xlim([0 15]); ylim([-0.001 0.004]);
xticks([0 5 10 15]); yticks([-0.001 0 0.001 0.002 0.003 0.004]);
set(gca,'XMinorTick','off','YMinorTick','off');
xlabel('阶数 n (—)','Interpreter','tex'); ylabel('系数 b_{n} (m)','Interpreter','tex');
title('前十二阶模态系数','Interpreter','tex','FontSize',12);
box on; grid on; set(gca,'FontName','Microsoft YaHei','FontSize',11,'TickDir','in');
% 依当前参数重定标；原有 TeX、字体、图例与标线样式保留。
xlim([0 14]); set(gca,'XTickMode','auto','YTickMode','auto');
model_values=[model_y{2,1}]; model_values=model_values(isfinite(model_values)); if ~isempty(model_values), if strcmp(get(gca,'YScale'),'log'), positive=model_values(model_values>0); if ~isempty(positive),ylim([min(positive)*.5 max(positive)*2]);end; else, lo=min(0,min(model_values)); hi=max(0,max(model_values)); pad=max((hi-lo)*.08,1e-12); ylim([lo-pad hi+pad]);end;end;
xl=xlim; xticks(ceil(xl(1)):floor(xl(2)));
c=sqrt(T/mu);
lecture_readouts=[sqrt(T/mu)/(2*L) 3*sqrt(T/mu)/(2*L) sqrt(T/mu)/(4*L) pluckB(2,height,pluck)];
subplot(3,1,3);
hold on;
x=linspace(0,1,401);
y=pluckSum(x,tView,c,L,height,pluck,-1);
model_x{3,1}=x; model_y{3,1}=y;
plot(x,y,'LineStyle','-','Marker','none','Color',[0 0.4470588235294118 0.7411764705882353],'LineWidth',1.5,'DisplayName','向右行波');
x=linspace(0,1,401);
y=pluckSum(x,tView,c,L,height,pluck,1);
model_x{3,2}=x; model_y{3,2}=y;
plot(x,y,'LineStyle','--','Marker','none','Color',[0.8509803921568627 0.3254901960784314 0.09803921568627451],'LineWidth',1.5,'DisplayName','向左行波');
x=linspace(0,1,401);
y=pluckSum(x,tView,c,L,height,pluck,0);
model_x{3,3}=x; model_y{3,3}=y;
plot(x,y,'LineStyle','-','Marker','none','Color',[0.9294117647058824 0.6941176470588235 0.12549019607843137],'LineWidth',1.5,'DisplayName','合成位移');
set(gca,'XScale','linear','YScale','linear');
xlim([0 1]); ylim([-0.01 0.01]);
xticks([0 0.2 0.4 0.6 0.8 1]); yticks([-0.01 -0.005 0 0.005 0.01]);
set(gca,'XMinorTick','off','YMinorTick','off');
xlabel('位置 x/L (—)','Interpreter','tex'); ylabel('横向位移 y (m)','Interpreter','tex');
title('反向行波叠加为驻波（慢放）','Interpreter','tex','FontSize',12);
box on; grid on; set(gca,'FontName','Microsoft YaHei','FontSize',11,'TickDir','in');
lgd=legend('show','Location','best','Color','w','Box','on','Interpreter','tex');
% 依当前参数重定标；原有 TeX、字体、图例与标线样式保留。
xlim([0 1]); set(gca,'XTickMode','auto','YTickMode','auto');
model_values=[model_y{3,1} model_y{3,2} model_y{3,3}]; model_values=model_values(isfinite(model_values)); if ~isempty(model_values), if strcmp(get(gca,'YScale'),'log'), positive=model_values(model_values>0); if ~isempty(positive),ylim([min(positive)*.5 max(positive)*2]);end; else, lo=min(0,min(model_values)); hi=max(0,max(model_values)); pad=max((hi-lo)*.4,1e-12); ylim([lo-pad hi+pad]);end;end;

qa=struct('x',{model_x(:)'},'y',{model_y(:)'}); if exist('worksheet_answers','var'),qa.answers=worksheet_answers;end; if exist('lecture_readouts','var'),qa.readouts=lecture_readouts;end; fid=fopen('E:/tangsy-D/08教学任务/07-教学评估/2026年教学评估/acoustics-redesign/specs/redesign/matlab-check/P1-fix/fig_2_2_2_set1.json','w','n','UTF-8'); fprintf(fid,'%s',jsonencode(qa)); fclose(fid); drawnow; exportgraphics(gcf,'E:/tangsy-D/08教学任务/07-教学评估/2026年教学评估/acoustics-redesign/specs/redesign/matlab-check/P1-fix/fig_2_2_2_set1.png','Resolution',120); close all;

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
