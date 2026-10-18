% 图 2.3-1　体元两截面应力差与轴向合力
% Exported current data; SI units unless an axis specifies otherwise.
set(groot,'defaultAxesFontName','Microsoft YaHei','defaultTextFontName','Microsoft YaHei');
set(groot,'defaultTextInterpreter','tex','defaultLegendInterpreter','tex','defaultAxesTickLabelInterpreter','tex');
figure('Color','w','Position',[80 80 640 340]);
subplot(1,1,1);
hold on;
x=[0.4 0.6 0.6 0.4 0.4];
y=[-0.1 -0.1 0.1 0.1 -0.1];
plot(x,y,'LineStyle','-','Marker','none','Color',[0 0.4470588235294118 0.7411764705882353],'LineWidth',1.5,'DisplayName','微元 S dz');
x=[0.4 0.19629629629629633 0.2268518518518519 0.19629629629629633 0.2268518518518519];
y=[0 0 0.015277777777777776 0 -0.015277777777777776];
plot(x,y,'LineStyle','-','Marker','none','Color',[0.8509803921568627 0.3254901960784314 0.09803921568627451],'LineWidth',1.5,'DisplayName','左截面力 −Sσ_{1}');
x=[0.6 0.82 0.7869999999999999 0.82 0.7869999999999999];
y=[0 0 -0.016499999999999997 0 0.016499999999999997];
plot(x,y,'LineStyle','-','Marker','none','Color',[0.9294117647058824 0.6941176470588235 0.12549019607843137],'LineWidth',1.5,'DisplayName','右截面力 Sσ_{2}');
x=[0.5 0.5444444444444445 0.5377777777777778 0.5444444444444445 0.5377777777777778];
y=[0.25 0.25 0.24666666666666667 0.25 0.25333333333333335];
plot(x,y,'LineStyle','-','Marker','none','Color',[0.49411764705882355 0.1843137254901961 0.5568627450980392],'LineWidth',1.5,'DisplayName','轴向合力（放大）');
set(gca,'XScale','linear','YScale','linear');
xlim([0 1]); ylim([-0.75 0.75]);
xticks([0 0.2 0.4 0.6 0.8 1]); yticks([-0.75 -0.5 -0.25 0 0.25 0.5 0.75]);
set(gca,'XMinorTick','off','YMinorTick','off');
xlabel('轴向示意位置 (—)','Interpreter','tex'); ylabel('横向示意坐标 (—)','Interpreter','tex');
title('纵向微元受力；右端边界：质量负载','Interpreter','tex','FontSize',12);
box on; grid on; set(gca,'FontName','Microsoft YaHei','FontSize',11,'TickDir','in');
lgd=legend('show','Location','best','Color','w','Box','on','Interpreter','tex');
