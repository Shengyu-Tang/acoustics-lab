set(groot,'defaultFigureVisible','off');
% 3.1.3-1
% 参数块：修改后运行整个脚本即可重算；SI 单位（另注除外）。
rho = 1.21; % 静态密度 (kg/m³)
c = 343; % 介质声速 (m/s)
f = 1000; % 频率 (Hz)
pa = 1; % 声压峰值 (Pa)
ideal = 1; % ideal（见网页参数表；SI 单位或无量纲选择）
continuous = 1; % continuous（见网页参数表；SI 单位或无量纲选择）
compressible = 1; % compressible（见网页参数表；SI 单位或无量纲选择）
uniform = 1; % uniform（见网页参数表；SI 单位或无量纲选择）
small = 1; % small（见网页参数表；SI 单位或无量纲选择）
distortion = 0.35; % 非线性示意强度 (—)
tView = 0; % tView（见网页参数表；SI 单位或无量纲选择）
% 以下为计算模型与绘图，可独立运行，无需网页。
model_x={}; model_y={};
set(groot,'defaultAxesFontName','Microsoft YaHei','defaultTextFontName','Microsoft YaHei');
set(groot,'defaultTextInterpreter','tex','defaultLegendInterpreter','tex','defaultAxesTickLabelInterpreter','tex');
figure('Color','w','Position',[80 80 1280 1020]);
w=2*pi*f; k=w/c; Z=rho*c; tau=w*tView;mtitles={'非线性示意：波形变陡','小振幅：正弦波'};
lecture_readouts=[pa/(rho*c^2) pa/(rho*c^2)];
subplot(3,2,1);
hold on;
x=linspace(0,2,401);
y=sin(2*pi*x);
model_x{1,1}=x; model_y{1,1}=y;
plot(x,y,'LineStyle','--','Marker','none','Color',[0 0.4470588235294118 0.7411764705882353],'LineWidth',1.5,'DisplayName','线性基准');
x=linspace(0,2,401);
y=sin(2*pi*x)+(1-small)*distortion*sin(4*pi*x);
model_x{1,2}=x; model_y{1,2}=y;
plot(x,y,'LineStyle','-','Marker','none','Color',[0.8509803921568627 0.3254901960784314 0.09803921568627451],'LineWidth',1.5,'DisplayName','当前假设');
set(gca,'XScale','linear','YScale','linear');
xlim([0 2]); ylim([-1.5 1.5]);
xticks([0 0.5 1 1.5 2]); yticks([-1.5 -1 -0.5 0 0.5 1 1.5]);
set(gca,'XMinorTick','off','YMinorTick','off');
xlabel('相位坐标（—）','Interpreter','tex'); ylabel('归一化声压（—）','Interpreter','tex');
title(mtitles{1+small},'Interpreter','tex','FontSize',12);
box on; grid on; set(gca,'FontName','Microsoft YaHei','FontSize',11,'TickDir','in');
lgd=legend('show','Location','best','Color','w','Box','on','Interpreter','tex');
% 依当前参数重定标；原有 TeX、字体、图例与标线样式保留。
xlim([0 2]); set(gca,'XTickMode','auto','YTickMode','auto');
ylim([-1.5 1.5]);
w=2*pi*f; k=w/c; Z=rho*c; tau=w*tView;mtitles={'有耗散示意：振幅衰减','无耗散：振幅不变'};
lecture_readouts=[pa/(rho*c^2) pa/(rho*c^2)];
subplot(3,2,2);
hold on;
x=linspace(0,2,401);
y=exp(-(1-ideal)*x);
model_x{2,1}=x; model_y{2,1}=y;
plot(x,y,'LineStyle','-','Marker','none','Color',[0 0.4470588235294118 0.7411764705882353],'LineWidth',1.5,'DisplayName','振幅包络');
set(gca,'XScale','linear','YScale','linear');
xlim([0 2]); ylim([0 1.5]);
xticks([0 0.5 1 1.5 2]); yticks([0 0.25 0.5 0.75 1 1.25 1.5]);
set(gca,'XMinorTick','off','YMinorTick','off');
xlabel('传播距离（示意）','Interpreter','tex'); ylabel('归一化振幅（—）','Interpreter','tex');
title(mtitles{1+ideal},'Interpreter','tex','FontSize',12);
box on; grid on; set(gca,'FontName','Microsoft YaHei','FontSize',11,'TickDir','in');
lgd=legend('show','Location','best','Color','w','Box','on','Interpreter','tex');
% 依当前参数重定标；原有 TeX、字体、图例与标线样式保留。
xlim([0 2]); set(gca,'XTickMode','auto','YTickMode','auto');
ylim([0 1.5]);
w=2*pi*f; k=w/c; Z=rho*c; tau=w*tView;mtitles={'非均匀介质示意：声线弯曲','均匀静止：直声线'};
lecture_readouts=[pa/(rho*c^2) pa/(rho*c^2)];
subplot(3,2,3);
hold on;
x=linspace(0,2,401);
y=.2+(1-uniform)*x.^2/4;
model_x{3,1}=x; model_y{3,1}=y;
plot(x,y,'LineStyle','-','Marker','none','Color',[0 0.4470588235294118 0.7411764705882353],'LineWidth',1.5,'DisplayName','声线');
set(gca,'XScale','linear','YScale','linear');
xlim([0 2]); ylim([0 1.5]);
xticks([0 0.5 1 1.5 2]); yticks([0 0.25 0.5 0.75 1 1.25 1.5]);
set(gca,'XMinorTick','off','YMinorTick','off');
xlabel('水平位置（示意）','Interpreter','tex'); ylabel('垂直位置（示意）','Interpreter','tex');
title(mtitles{1+uniform},'Interpreter','tex','FontSize',12);
box on; grid on; set(gca,'FontName','Microsoft YaHei','FontSize',11,'TickDir','in');
lgd=legend('show','Location','best','Color','w','Box','on','Interpreter','tex');
% 依当前参数重定标；原有 TeX、字体、图例与标线样式保留。
xlim([0 2]); set(gca,'XTickMode','auto','YTickMode','auto');
ylim([0 1.5]);
w=2*pi*f; k=w/c; Z=rho*c; tau=w*tView;mtitles={'微观示意：连续场描述失效','连续场：可取空间导数'};
lecture_readouts=[pa/(rho*c^2) pa/(rho*c^2)];
subplot(3,2,4);
hold on;
x=linspace(0,2,401*continuous+17*(1-continuous));
y=sin(2*pi*x);
model_x{4,1}=x; model_y{4,1}=y;
plot(x,y,'LineStyle','-','Marker','none','Color',[0 0.4470588235294118 0.7411764705882353],'LineWidth',1.5,'DisplayName','介质描述');
set(gca,'XScale','linear','YScale','linear');
xlim([0 2]); ylim([-1.5 1.5]);
xticks([0 0.5 1 1.5 2]); yticks([-1.5 -1 -0.5 0 0.5 1 1.5]);
set(gca,'XMinorTick','off','YMinorTick','off');
xlabel('空间坐标（示意）','Interpreter','tex'); ylabel('扰动（示意）','Interpreter','tex');
title(mtitles{1+continuous},'Interpreter','tex','FontSize',12);
box on; grid on; set(gca,'FontName','Microsoft YaHei','FontSize',11,'TickDir','in');
lgd=legend('show','Location','best','Color','w','Box','on','Interpreter','tex');
% 依当前参数重定标；原有 TeX、字体、图例与标线样式保留。
xlim([0 2]); set(gca,'XTickMode','auto','YTickMode','auto');
ylim([-1.5 1.5]);
w=2*pi*f; k=w/c; Z=rho*c; tau=w*tView;mtitles={'不可压缩极限：无有限速压缩波','有限可压缩性：有限声速'};
lecture_readouts=[pa/(rho*c^2) pa/(rho*c^2)];
subplot(3,2,5);
hold on;
x=linspace(.9,1.1,401);
y=min(1.5,max(-1.5,(10*compressible+10000*(1-compressible))*(x-1)));
model_x{5,1}=x; model_y{5,1}=y;
plot(x,y,'LineStyle','-','Marker','none','Color',[0 0.4470588235294118 0.7411764705882353],'LineWidth',1.5,'DisplayName','状态斜率');
set(gca,'XScale','linear','YScale','linear');
xlim([0.9 1.1]); ylim([-1.5 1.5]);
xticks([0.9 0.95 1 1.05 1.1]); yticks([-1.5 -1 -0.5 0 0.5 1 1.5]);
set(gca,'XMinorTick','off','YMinorTick','off');
xlabel('静态密度比（—）','Interpreter','tex'); ylabel('声压扰动（归一化）','Interpreter','tex');
title(mtitles{1+compressible},'Interpreter','tex','FontSize',12);
box on; grid on; set(gca,'FontName','Microsoft YaHei','FontSize',11,'TickDir','in');
lgd=legend('show','Location','best','Color','w','Box','on','Interpreter','tex');
% 依当前参数重定标；原有 TeX、字体、图例与标线样式保留。
xlim([0.9 1.1]); set(gca,'XTickMode','auto','YTickMode','auto');
ylim([-1.5 1.5]);

qa=struct('x',{model_x(:)'},'y',{model_y(:)'}); if exist('worksheet_answers','var'),qa.answers=worksheet_answers;end; if exist('lecture_readouts','var'),qa.readouts=lecture_readouts;end; if exist('model_fields','var'),qa.fields=model_fields;end; fid=fopen('E:/tangsy-D/08教学任务/07-教学评估/2026年教学评估/acoustics-redesign/specs/redesign/matlab-check/P2/fig_3_1_3_1_set0.json','w','n','UTF-8'); fprintf(fid,'%s',jsonencode(qa)); fclose(fid); drawnow; exportgraphics(gcf,'E:/tangsy-D/08教学任务/07-教学评估/2026年教学评估/acoustics-redesign/specs/redesign/matlab-check/P2/fig_3_1_3_1_set0.png','Resolution',120); close all;

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
function lim=p2NiceLimits(lo,hi)
raw=(hi-lo)/5;decade=10^floor(log10(raw));steps=[1 2 2.5 5 10]*decade;
counts=ceil(hi./steps-1e-10)-floor(lo./steps+1e-10)+1;
scores=abs(counts-6)+100*(counts<4 | counts>8);[~,ii]=min(scores);st=steps(ii);
lim=[floor(lo/st+1e-10)*st ceil(hi/st-1e-10)*st];
end
function L=p2SourceLevel(n,L1)
L=L1+10*log10(max(n,eps));L(n<=0)=NaN;
end
