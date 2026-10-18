set(groot,'defaultFigureVisible','off');
% 3.5.2-2
% 参数块：修改后运行整个脚本即可重算；SI 单位（另注除外）。
rho = 1.21; % 静态密度 (kg/m³)
c = 343; % 介质声速 (m/s)
f = 1000; % 频率 (Hz)
pa = 1; % 声压峰值 (Pa)
azimuth = 60; % 方位角 (°)
elevation = 25; % 俯仰角 (°)
wavecount = 3; % 平面波列数 (—)
a1 = 0; % 第 1 列波方位角 (°)
a2 = 60; % 第 2 列波方位角 (°)
a3 = 120; % 第 3 列波方位角 (°)
a4 = -45; % 第 4 列波方位角 (°)
tView = 0; % tView（见网页参数表；SI 单位或无量纲选择）
% 以下为计算模型与绘图，可独立运行，无需网页。
model_x={}; model_y={};
set(groot,'defaultAxesFontName','Microsoft YaHei','defaultTextFontName','Microsoft YaHei');
set(groot,'defaultTextInterpreter','tex','defaultLegendInterpreter','tex','defaultAxesTickLabelInterpreter','tex');
figure('Color','w','Position',[80 80 640 340]);
w=2*pi*f; k=w/c; Z=rho*c; tau=w*tView;[XX,YY]=meshgrid(linspace(-1,1,161),linspace(-1,1,81));AA=[a1 a2 a3 a4];Pfield=zeros(size(XX));for jj=1:wavecount,Pfield=Pfield+cos(tau-2*pi*(XX*cosd(AA(jj))+YY*sind(AA(jj))));end;
lecture_readouts=[k k*cosd(elevation)*cosd(azimuth) k*cosd(elevation)*sind(azimuth) k*sind(elevation)];
subplot(1,1,1);
hold on;
field_x=linspace(-1,1,161); field_y=linspace(-1,1,81); field_z=Pfield;
im=imagesc(field_x,field_y,field_z);
model_fields{1}=struct('x',field_x,'y',field_y,'z',field_z);
if isprop(im,'Interpolation'), im.Interpolation='bilinear'; end
set(gca,'YDir','normal');
caxis([-4 4]);
% RdBu, identical 64 colors to browser
colormap(gca,[33 102 172;40 107 174;47 111 177;53 116 179;60 120 182;67 125 184;74 130 186;81 134 189;87 139 191;94 143 193;101 148 196;108 153 198;115 157 201;121 162 203;128 166 205;135 171 208;142 176 210;148 180 212;155 185 215;162 189 217;169 194 220;176 199 222;182 203 224;189 208 227;196 212 229;203 217 232;210 222 234;216 226 236;223 231 239;230 235 241;237 240 243;244 245 246;246 243 244;244 236 237;242 229 231;239 222 224;237 215 218;235 208 211;233 201 205;231 194 198;228 187 192;226 180 185;224 173 179;222 166 173;220 159 166;217 151 160;215 144 153;213 137 147;211 130 140;209 123 134;206 116 127;204 109 121;202 102 114;200 95 108;198 88 101;196 81 95;193 74 88;191 66 82;189 59 75;187 52 69;185 45 62;182 38 56;180 31 49;178 24 43]/255);
cb=colorbar; ylabel(cb,'合成归一化声压（—）','Interpreter','tex');
set(gca,'XScale','linear','YScale','linear');
xlim([-1 1]); ylim([-1 1]);
xticks([-1 -0.5 0 0.5 1]); yticks([-1 -0.5 0 0.5 1]);
set(gca,'XMinorTick','off','YMinorTick','off');
xlabel('位置 x/λ（—）','Interpreter','tex'); ylabel('位置 y/λ（—）','Interpreter','tex');
title('每列波具有独立方向；场为线性叠加','Interpreter','tex','FontSize',12);
box on; grid on; set(gca,'FontName','Microsoft YaHei','FontSize',11,'TickDir','in');
% 依当前参数重定标；原有 TeX、字体、图例与标线样式保留。
xlim([-1 1]); set(gca,'XTickMode','auto','YTickMode','auto');
ylim([-1 1]);

qa=struct('x',{model_x(:)'},'y',{model_y(:)'}); if exist('worksheet_answers','var'),qa.answers=worksheet_answers;end; if exist('lecture_readouts','var'),qa.readouts=lecture_readouts;end; if exist('model_fields','var'),qa.fields=model_fields;end; fid=fopen('E:/tangsy-D/08教学任务/07-教学评估/2026年教学评估/acoustics-redesign/specs/redesign/matlab-check/P2/fig_3_5_2_2_set0.json','w','n','UTF-8'); fprintf(fid,'%s',jsonencode(qa)); fclose(fid); drawnow; exportgraphics(gcf,'E:/tangsy-D/08教学任务/07-教学评估/2026年教学评估/acoustics-redesign/specs/redesign/matlab-check/P2/fig_3_5_2_2_set0.png','Resolution',120); close all;

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
