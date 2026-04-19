// 生成PNG图标的脚本 - 在浏览器中运行
function generateIcons() {
    const sizes = [152, 167, 180, 192, 512];

    sizes.forEach(size => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // 背景
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#0a1628');
        gradient.addColorStop(0.5, '#102a43');
        gradient.addColorStop(1, '#0a1628');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(0, 0, size, size, size * 0.2);
        ctx.fill();

        // 边框
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = size * 0.008;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.roundRect(size * 0.015, size * 0.015, size * 0.97, size * 0.97, size * 0.19);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // 日历图标
        const calSize = size * 0.55;
        const calX = size * 0.1;
        const calY = size * 0.15;

        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = size * 0.012;
        ctx.beginPath();
        ctx.roundRect(calX, calY, calSize, calSize, size * 0.08);
        ctx.stroke();

        // 日历内部
        ctx.fillStyle = 'rgba(0, 212, 255, 0.1)';
        ctx.beginPath();
        ctx.roundRect(calX + size * 0.06, calY + size * 0.12, calSize - size * 0.12, calSize - size * 0.12, size * 0.04);
        ctx.fill();

        // 线条
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = size * 0.004;
        ctx.globalAlpha = 0.5;
        for (let i = 1; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(calX + size * 0.06, calY + size * 0.12 + size * 0.12 * i);
            ctx.lineTo(calX + calSize - size * 0.06, calY + size * 0.12 + size * 0.12 * i);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // 彩色方块
        const blockSize = size * 0.1;
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.roundRect(calX + size * 0.1, calY + size * 0.28, blockSize, blockSize * 0.7, size * 0.015);
        ctx.fill();

        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        ctx.roundRect(calX + size * 0.28, calY + size * 0.42, blockSize * 1.2, blockSize * 0.7, size * 0.015);
        ctx.fill();

        ctx.fillStyle = '#bf00ff';
        ctx.beginPath();
        ctx.roundRect(calX + size * 0.44, calY + size * 0.28, blockSize, blockSize * 0.7, size * 0.015);
        ctx.fill();

        // 加号圆圈
        const circleX = size * 0.65;
        const circleY = size * 0.65;
        const circleR = size * 0.18;

        const circleGradient = ctx.createLinearGradient(circleX - circleR, circleY - circleR, circleX + circleR, circleY + circleR);
        circleGradient.addColorStop(0, '#00d4ff');
        circleGradient.addColorStop(1, '#00ff88');
        ctx.fillStyle = circleGradient;
        ctx.beginPath();
        ctx.arc(circleX, circleY, circleR, 0, Math.PI * 2);
        ctx.fill();

        // 加号
        ctx.fillStyle = '#0a1628';
        ctx.font = `bold ${size * 0.2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', circleX, circleY + size * 0.01);

        // 下载
        const link = document.createElement('a');
        const filename = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`;
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

// 在控制台运行: generateIcons()
