% 图 2.3-2　常见材料的纵波声速比较
% Exported current data; SI units unless an axis specifies otherwise.
set(groot,'defaultAxesFontName','Microsoft YaHei','defaultTextFontName','Microsoft YaHei');
set(groot,'defaultTextInterpreter','tex','defaultLegendInterpreter','tex','defaultAxesTickLabelInterpreter','tex');
figure('Color','w','Position',[80 80 640 340]);
subplot(1,1,1);
hold on;
x=[1 2 3 4 5];
y=[5047.544651250688 5091.750772173155 3429.971702850177 5099.019513592785 1594.4820103582015];
bar(x,y,0.7,'FaceColor',[0 0.4470588235294118 0.7411764705882353],'EdgeColor','k','DisplayName','纵波速度');
set(gca,'XScale','linear','YScale','linear');
xlim([0 6]); ylim([0 8000]);
xticks([0 1 2 3 4 5 6]); yticks([0 2000 4000 6000 8000]);
xticks([0 1 2 3 4 5 6]); xticklabels({'','钢','铝','黄铜','玻璃','有机玻璃',''});
set(gca,'XMinorTick','off','YMinorTick','off');
xlabel('材料（可用预设选取）','Interpreter','tex'); ylabel('细棒纵波速度 c (m/s)','Interpreter','tex');
title('材料演示参数的纵波速度','Interpreter','tex','FontSize',12);
box on; grid on; set(gca,'FontName','Microsoft YaHei','FontSize',11,'TickDir','in');
