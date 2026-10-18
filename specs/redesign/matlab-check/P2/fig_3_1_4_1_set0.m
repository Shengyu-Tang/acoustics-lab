set(groot,'defaultFigureVisible','off');
% 3.1.4-1
% 参数块：修改后运行整个脚本即可重算；SI 单位（另注除外）。
rho = 1.21; % 静态密度 (kg/m³)
c = 343; % 介质声速 (m/s)
f = 1000; % 频率 (Hz)
pa = 1; % 声压峰值 (Pa)
left = 0.012; % 左面流速（向右为正） (m/s)
right = 0.008; % 右面流速（向右为正） (m/s)
L = 0.1; % 体元长度 (m)
S = 0.01; % 截面积 (m²)
tView = 0; % tView（见网页参数表；SI 单位或无量纲选择）
% 以下为计算模型与绘图，可独立运行，无需网页。
model_x={}; model_y={};
set(groot,'defaultAxesFontName','Microsoft YaHei','defaultTextFontName','Microsoft YaHei');
set(groot,'defaultTextInterpreter','tex','defaultLegendInterpreter','tex','defaultAxesTickLabelInterpreter','tex');
figure('Color','w','Position',[80 80 640 340]);
w=2*pi*f; k=w/c; Z=rho*c; tau=w*tView;aL=arrowPoints([.05 .65],[.05+left*15 .65],1);aR=arrowPoints([1.8 .65],[1.8+right*15 .65],1);rate=rho*(left-right)/L;
lecture_readouts=[rho*S*left rho*S*right S*L rho*(left-right)/L];
subplot(1,1,1);
hold on;
field_x=[.75 1.3]; field_y=[.3 .95]; field_z=tanh(rate*tView*100)*ones(2);
im=imagesc(field_x,field_y,field_z);
model_fields{1}=struct('x',field_x,'y',field_y,'z',field_z);
if isprop(im,'Interpolation'), im.Interpolation='bilinear'; end
set(gca,'YDir','normal');
caxis([-1 1]);
% RdBu, identical 64 colors to browser
colormap(gca,[33 102 172;40 107 174;47 111 177;53 116 179;60 120 182;67 125 184;74 130 186;81 134 189;87 139 191;94 143 193;101 148 196;108 153 198;115 157 201;121 162 203;128 166 205;135 171 208;142 176 210;148 180 212;155 185 215;162 189 217;169 194 220;176 199 222;182 203 224;189 208 227;196 212 229;203 217 232;210 222 234;216 226 236;223 231 239;230 235 241;237 240 243;244 245 246;246 243 244;244 236 237;242 229 231;239 222 224;237 215 218;235 208 211;233 201 205;231 194 198;228 187 192;226 180 185;224 173 179;222 166 173;220 159 166;217 151 160;215 144 153;213 137 147;211 130 140;209 123 134;206 116 127;204 109 121;202 102 114;200 95 108;198 88 101;196 81 95;193 74 88;191 66 82;189 59 75;187 52 69;185 45 62;182 38 56;180 31 49;178 24 43]/255);
cb=colorbar; ylabel(cb,'密度变化（归一化示意）','Interpreter','tex');
x=[0.4 0.4 0.7 0.7 0.4];
y=[0 1 1.25 0.25 0];
model_x{1,1}=x; model_y{1,1}=y;
plot(x,y,'LineStyle','-','Marker','none','Color',[0.4666666666666667 0.4666666666666667 0.4666666666666667],'LineWidth',1.5,'DisplayName','控制体');
x=[1.4 1.4 1.7 1.7 1.4];
y=[0 1 1.25 0.25 0];
model_x{1,2}=x; model_y{1,2}=y;
plot(x,y,'LineStyle','-','Marker','none','Color',[0.4666666666666667 0.4666666666666667 0.4666666666666667],'LineWidth',1.5,'DisplayName','棱边','HandleVisibility','off');
x=[0.4 1.4];
y=[0 0];
model_x{1,3}=x; model_y{1,3}=y;
plot(x,y,'LineStyle','-','Marker','none','Color',[0.4666666666666667 0.4666666666666667 0.4666666666666667],'LineWidth',1.5,'DisplayName','棱边','HandleVisibility','off');
x=[0.4 1.4];
y=[1 1];
model_x{1,4}=x; model_y{1,4}=y;
plot(x,y,'LineStyle','-','Marker','none','Color',[0.4666666666666667 0.4666666666666667 0.4666666666666667],'LineWidth',1.5,'DisplayName','棱边','HandleVisibility','off');
x=[0.7 1.7];
y=[1.25 1.25];
model_x{1,5}=x; model_y{1,5}=y;
plot(x,y,'LineStyle','-','Marker','none','Color',[0.4666666666666667 0.4666666666666667 0.4666666666666667],'LineWidth',1.5,'DisplayName','棱边','HandleVisibility','off');
x=[0.7 1.7];
y=[0.25 0.25];
model_x{1,6}=x; model_y{1,6}=y;
plot(x,y,'LineStyle','-','Marker','none','Color',[0.4666666666666667 0.4666666666666667 0.4666666666666667],'LineWidth',1.5,'DisplayName','棱边','HandleVisibility','off');
x=aL(:,1)';
y=aL(:,2)';
model_x{1,7}=x; model_y{1,7}=y;
plot(x,y,'LineStyle','-','Marker','none','Color',[0.6352941176470588 0.0784313725490196 0.1843137254901961],'LineWidth',1.5,'DisplayName','质量流 ρu入');
x=aR(:,1)';
y=aR(:,2)';
model_x{1,8}=x; model_y{1,8}=y;
plot(x,y,'LineStyle','-','Marker','none','Color',[0 0.4470588235294118 0.7411764705882353],'LineWidth',1.5,'DisplayName','质量流 ρu出');
set(gca,'XScale','linear','YScale','linear');
xlim([-1 3]); ylim([-0.5 1.5]);
xticks([-1 0 1 2 3]); yticks([-0.5 0 0.5 1 1.5]);
set(gca,'XMinorTick','off','YMinorTick','off');
xlabel('x 与深度投影（示意）','Interpreter','tex'); ylabel('z 与深度投影（示意）','Interpreter','tex');
text(0.4,0.06,'A','HorizontalAlignment','center','Interpreter','tex');
text(0.4,1.06,'B','HorizontalAlignment','center','Interpreter','tex');
text(0.7,1.31,'C','HorizontalAlignment','center','Interpreter','tex');
text(0.7,0.31,'D','HorizontalAlignment','center','Interpreter','tex');
text(1.4,0.06,'E','HorizontalAlignment','center','Interpreter','tex');
text(1.4,1.06,'F','HorizontalAlignment','center','Interpreter','tex');
text(1.7,1.31,'G','HorizontalAlignment','center','Interpreter','tex');
text(1.7,0.31,'H','HorizontalAlignment','center','Interpreter','tex');
text(0,0.85,'ρu入','HorizontalAlignment','center','Interpreter','tex');
text(2.1,0.85,'ρu出','HorizontalAlignment','center','Interpreter','tex');
title('六面体 ABCDEFGH：质量守恒','Interpreter','tex','FontSize',12);
box on; grid on; set(gca,'FontName','Microsoft YaHei','FontSize',11,'TickDir','in');
% 依当前参数重定标；原有 TeX、字体、图例与标线样式保留。
xlim([-0.4 2.6]); set(gca,'XTickMode','auto','YTickMode','auto');
ylim([-0.25 1.5]);

qa=struct('x',{model_x(:)'},'y',{model_y(:)'}); if exist('worksheet_answers','var'),qa.answers=worksheet_answers;end; if exist('lecture_readouts','var'),qa.readouts=lecture_readouts;end; if exist('model_fields','var'),qa.fields=model_fields;end; fid=fopen('E:/tangsy-D/08教学任务/07-教学评估/2026年教学评估/acoustics-redesign/specs/redesign/matlab-check/P2/fig_3_1_4_1_set0.json','w','n','UTF-8'); fprintf(fid,'%s',jsonencode(qa)); fclose(fid); drawnow; exportgraphics(gcf,'E:/tangsy-D/08教学任务/07-教学评估/2026年教学评估/acoustics-redesign/specs/redesign/matlab-check/P2/fig_3_1_4_1_set0.png','Resolution',120); close all;

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
