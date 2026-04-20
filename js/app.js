// 主应用逻辑
let currentWeekStart = null;
let currentYear = null;
let currentMonth = null;
let currentView = 'week';
let touchStartX = 0;
let touchEndX = 0;

// 卡片滑动相关
let currentDayIndex = 0; // 当前选中的日期索引 (0-6)
let weekSessions = []; // 当前周的课程数据
let isAnimating = false;

const daysOfWeek = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const subjectColors = [
    '#4b4ced', // 紫蓝色
    '#00b2ff', // 青色
    '#00cc80', // 绿色
    '#8c73d9', // 淡紫色
    '#ff6b35', // 橙色
    '#00d4ff', // 霓虹蓝
    '#bf00ff', // 霓虹紫
    '#ffd700', // 金色
];
const viewOrder = ['week', 'month', 'students', 'stats'];

// 初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    await initDB();
    loadWeekView();
    initSubjectColorStyles();
    initGestures();
    initCardSlider();
});

// 手势初始化
function initGestures() {
    document.body.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    document.body.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
}

function handleSwipe() {
    // 只在周视图处理视图切换
    if (currentView !== 'week') {
        const swipeThreshold = 80;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) < swipeThreshold) return;

        const currentIndex = viewOrder.indexOf(currentView);

        if (diff > 0) {
            const nextIndex = (currentIndex + 1) % viewOrder.length;
            switchView(viewOrder[nextIndex], 'slide-right');
        } else {
            const prevIndex = (currentIndex - 1 + viewOrder.length) % viewOrder.length;
            switchView(viewOrder[prevIndex], 'slide-left');
        }
    }
}

// 卡片滑动初始化
function initCardSlider() {
    const container = document.getElementById('day-cards-container');
    if (!container) return;

    container.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleCardSwipe();
    }, { passive: true });
}

function handleCardSwipe() {
    if (isAnimating) return;

    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) < swipeThreshold) return;

    if (diff > 0 && currentDayIndex < 6) {
        // 左滑 - 下一天
        slideToDay(currentDayIndex + 1, 'left');
    } else if (diff < 0 && currentDayIndex > 0) {
        // 右滑 - 前一天
        slideToDay(currentDayIndex - 1, 'right');
    }
}

function slideToDay(targetIndex, direction) {
    if (isAnimating || targetIndex < 0 || targetIndex > 6) return;
    isAnimating = true;

    const container = document.getElementById('day-cards-container');
    const cards = container.querySelectorAll('.day-card');

    // 更新指示器
    updateDayIndicator(targetIndex);

    // 动画方向
    const slideOutClass = direction === 'left' ? 'slide-out-left' : 'slide-out-right';
    const slideInClass = direction === 'left' ? 'slide-in-right' : 'slide-in-left';

    // 当前卡片滑出
    cards[currentDayIndex].classList.add(slideOutClass);

    // 目标卡片滑入
    cards[targetIndex].classList.remove('hidden');
    cards[targetIndex].classList.add('pre-' + (direction === 'left' ? 'right' : 'left'));
    cards[targetIndex].classList.add(slideInClass);

    setTimeout(() => {
        cards[currentDayIndex].classList.add('hidden');
        cards[currentDayIndex].classList.remove(slideOutClass, 'active');
        cards[targetIndex].classList.remove(slideInClass, 'pre-left', 'pre-right');
        cards[targetIndex].classList.add('active');
        currentDayIndex = targetIndex;
        isAnimating = false;
    }, 350);
}

function updateDayIndicator(index) {
    const dots = document.querySelectorAll('.day-dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });

    // 更新日期标题
    const weekStart = new Date(currentWeekStart);
    const currentDate = new Date(weekStart);
    currentDate.setDate(weekStart.getDate() + index);

    const titleEl = document.getElementById('current-day-title');
    if (titleEl) {
        titleEl.textContent = `${daysOfWeek[index]} ${formatDateOnly(currentDate.toISOString().split('T')[0])}`;
    }
}

// 视图切换
function switchView(view, animation = null) {
    const prevView = currentView;
    currentView = view;

    document.querySelectorAll('.app-main').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    const newViewEl = document.getElementById(`${view}-view`);
    newViewEl.classList.remove('hidden');

    const viewContent = newViewEl.querySelector('.view-content');
    if (viewContent && animation) {
        viewContent.classList.add(animation);
        setTimeout(() => viewContent.classList.remove(animation), 300);
    }

    document.querySelector(`.nav-item[data-view="${view}"]`).classList.add('active');

    if (view === 'week') loadWeekView();
    else if (view === 'month') loadMonthView();
    else if (view === 'students') loadStudentsView();
    else if (view === 'stats') loadStatsView();
}

// ========== 周视图 ==========
async function loadWeekView(date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    currentWeekStart = getWeekStart(targetDate);
    console.log('loadWeekView called, currentWeekStart:', currentWeekStart);

    // 确定今天是周几，设置为当前选中
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date(currentWeekStart);
    for (let i = 0; i < 7; i++) {
        const checkDate = new Date(weekStart);
        checkDate.setDate(weekStart.getDate() + i);
        if (checkDate.toISOString().split('T')[0] === today) {
            currentDayIndex = i;
            break;
        }
    }
    console.log('currentDayIndex:', currentDayIndex);

    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekRangeEl = document.getElementById('week-range');
    if (weekRangeEl) {
        weekRangeEl.textContent = `${formatDateOnly(currentWeekStart)} - ${formatDateOnly(weekEnd.toISOString().split('T')[0])}`;
    }

    await renderWeekCards();
    await loadWeekIncome();
}

function getWeekStart(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    return monday.toISOString().split('T')[0];
}

async function renderWeekCards() {
    const weekStart = new Date(currentWeekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const sessions = await getSessionsByDateRange(
        currentWeekStart,
        weekEnd.toISOString().split('T')[0]
    );

    // 自动完成过期的课程
    const now = new Date();
    let updated = false;
    for (const session of sessions) {
        if (session.status === 'scheduled') {
            const sessionEnd = new Date(`${session.session_date}T${session.end_time}`);
            if (now > sessionEnd) {
                session.status = 'completed';
                await updateSession(session);
                updated = true;
            }
        }
    }

    weekSessions = updated ? await getSessionsByDateRange(
        currentWeekStart,
        weekEnd.toISOString().split('T')[0]
    ) : sessions;

    renderDayCards();
    renderDayIndicator();
}

function renderDayCards() {
    const container = document.getElementById('day-cards-container');
    console.log('renderDayCards called, container:', container);
    if (!container) {
        console.error('day-cards-container not found!');
        return;
    }

    const weekStart = new Date(currentWeekStart);
    const now = new Date();
    let html = '';

    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(weekStart);
        currentDate.setDate(weekStart.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        const isToday = isSameDay(currentDate, now);
        const isPast = currentDate < now && !isToday;

        const daySessions = weekSessions.filter(s => s.session_date === dateStr);
        const isCompleted = isPast && daySessions.length > 0;

        const isActive = i === currentDayIndex;
        const isHidden = !isActive;

        html += `
            <div class="day-card glass-card ${isActive ? 'active' : ''} ${isHidden ? 'hidden' : ''} ${isCompleted ? 'day-completed' : ''}"
                 data-date="${dateStr}" data-index="${i}">
                <div class="card-header-section">
                    <div class="day-info">
                        <span class="day-name">${daysOfWeek[i]}</span>
                        <span class="day-date">${formatDateOnly(dateStr)}</span>
                    </div>
                    ${isToday ? '<div class="today-badge">今天</div>' : ''}
                    ${isCompleted ? '<div class="completed-badge"><i class="bi bi-check-circle-fill"></i></div>' : ''}
                </div>
                <div class="day-income-badge">
                    <span class="income-label">今日收入</span>
                    <span class="income-value">¥${calculateDayIncome(daySessions)}</span>
                </div>
                <div class="sessions-list">
                    ${renderDaySessions(daySessions, isPast)}
                </div>
                <button class="add-session-card-btn" onclick="showAddDrawer('${dateStr}')">
                    <i class="bi bi-plus-lg"></i> 添加课程
                </button>
            </div>
        `;
    }

    console.log('Setting innerHTML, length:', html.length);
    container.innerHTML = html;

    // 更新标题
    const currentCard = container.querySelector('.day-card.active');
    if (currentCard) {
        const titleEl = document.getElementById('current-day-title');
        if (titleEl) {
            titleEl.textContent = `${daysOfWeek[currentDayIndex]} ${formatDateOnly(currentCard.dataset.date)}`;
        }
    }
}

function renderDaySessions(sessions, isPast) {
    if (sessions.length === 0) {
        return `
            <div class="empty-sessions">
                <i class="bi bi-calendar-x"></i>
                <p>暂无课程安排</p>
            </div>
        `;
    }

    sessions.sort((a, b) => a.start_time.localeCompare(b.start_time));

    return sessions.map(session => {
        const colorIndex = getSubjectColorIndex(session.subject);
        const color = subjectColors[colorIndex];
        const isCompleted = session.status === 'completed';

        return `
            <div class="session-card-item ${isCompleted ? 'session-completed' : ''}"
                 onclick="showSessionDrawer(${session.id})" style="--accent-color: ${color}">
                <div class="session-accent-bar"></div>
                <div class="session-content">
                    <div class="session-top">
                        <span class="session-title">${session.student_name} · ${session.subject}</span>
                        <span class="session-time">${formatTime(session.start_time)}-${formatTime(session.end_time)}</span>
                    </div>
                    <div class="session-bottom">
                        <span class="session-amount">¥${parseFloat(session.amount).toFixed(0)}</span>
                        ${session.notes ? `<span class="session-notes"><i class="bi bi-sticky"></i> ${session.notes}</span>` : ''}
                    </div>
                    ${isCompleted ? '<div class="session-status completed"><i class="bi bi-check-circle-fill"></i> 已完成</div>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

function calculateDayIncome(sessions) {
    return sessions
        .filter(s => s.status === 'completed')
        .reduce((sum, s) => sum + parseFloat(s.amount || 0), 0)
        .toFixed(0);
}

function renderDayIndicator() {
    const container = document.getElementById('day-indicator');
    console.log('renderDayIndicator called, container:', container);
    if (!container) {
        console.error('day-indicator not found!');
        return;
    }

    const weekStart = new Date(currentWeekStart);
    const now = new Date();

    let html = '';
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(weekStart);
        currentDate.setDate(weekStart.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        const isToday = isSameDay(currentDate, now);
        const isPast = currentDate < now && !isToday;
        const daySessions = weekSessions.filter(s => s.session_date === dateStr);
        const hasCompleted = daySessions.some(s => s.status === 'completed');

        html += `
            <div class="day-dot ${i === currentDayIndex ? 'active' : ''} ${isToday ? 'today' : ''} ${isPast && hasCompleted ? 'completed' : ''}"
                 onclick="slideToDay(${i}, ${i > currentDayIndex ? 'left' : 'right'})"
                 data-index="${i}">
            </div>
        `;
    }

    console.log('Day indicator HTML length:', html.length);
    container.innerHTML = html;
}

async function loadWeekIncome() {
    const weekStart = new Date(currentWeekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const sessions = await getSessionsByDateRange(
        currentWeekStart,
        weekEnd.toISOString().split('T')[0]
    );

    const completed = sessions.filter(s => s.status === 'completed');
    const totalIncome = completed.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
    const totalMinutes = completed.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalHours = totalMinutes / 60;
    const hourlyRate = totalHours > 0 ? (totalIncome / totalHours).toFixed(0) : 0;

    document.getElementById('weekly-income').textContent = `¥${totalIncome.toFixed(0)}`;
    document.getElementById('weekly-hourly').textContent = `¥${hourlyRate}/h`;
    document.getElementById('weekly-sessions').textContent = `${sessions.length}节`;
}

function prevWeek() {
    const prevDate = new Date(currentWeekStart);
    prevDate.setDate(prevDate.getDate() - 7);
    currentDayIndex = 0;
    loadWeekView(prevDate.toISOString().split('T')[0]);
}

function nextWeek() {
    const nextDate = new Date(currentWeekStart);
    nextDate.setDate(nextDate.getDate() + 7);
    currentDayIndex = 0;
    loadWeekView(nextDate.toISOString().split('T')[0]);
}

// ========== 月视图 ==========
async function loadMonthView(year = null, month = null) {
    const now = new Date();
    currentYear = year || now.getFullYear();
    currentMonth = month || (now.getMonth() + 1);

    document.getElementById('month-title').textContent = `${currentYear}年${currentMonth}月`;

    await renderMonthCalendar();
    await loadMonthIncome();
}

async function renderMonthCalendar() {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay() || 7;

    const monthStart = firstDay.toISOString().split('T')[0];
    const monthEnd = lastDay.toISOString().split('T')[0];
    const sessions = await getSessionsByDateRange(monthStart, monthEnd);

    let html = '<div class="calendar-row">';

    for (let i = 1; i < firstDayOfWeek; i++) {
        html += '<div class="calendar-cell empty"></div>';
    }

    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const isToday = today.getFullYear() === currentYear &&
                        today.getMonth() + 1 === currentMonth &&
                        today.getDate() === day;
        const daySessions = sessions.filter(s => s.session_date === dateStr);
        const dayIncome = daySessions.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);

        const intensity = Math.min(dayIncome / 500, 1);
        const bgColor = dayIncome > 0 ? `rgba(75, 76, 237, ${0.15 + intensity * 0.5})` : 'transparent';

        html += `
            <div class="calendar-cell ${isToday ? 'today' : ''}"
                 style="background: ${bgColor};"
                 onclick="showDayInWeek('${dateStr}')">
                <span class="day-num ${daySessions.length > 0 ? 'neon-text' : ''}">${day}</span>
                ${dayIncome > 0 ? `<span class="day-income">¥${dayIncome.toFixed(0)}</span>` : ''}
                ${daySessions.length > 0 && dayIncome === 0 ? `<span class="day-dots">${'●'.repeat(Math.min(daySessions.length, 3))}</span>` : ''}
            </div>
        `;

        if ((firstDayOfWeek - 1 + day) % 7 === 0 && day < daysInMonth) {
            html += '</div><div class="calendar-row">';
        }
    }

    html += '</div>';
    document.getElementById('calendar-grid').innerHTML = html;
}

async function loadMonthIncome() {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);

    const monthStart = firstDay.toISOString().split('T')[0];
    const monthEnd = lastDay.toISOString().split('T')[0];
    const sessions = await getSessionsByDateRange(monthStart, monthEnd);

    const completed = sessions.filter(s => s.status === 'completed');
    const totalIncome = completed.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);

    document.getElementById('month-income').textContent = `¥${totalIncome.toFixed(0)}`;
    document.getElementById('month-sessions').textContent = `${completed.length}节`;
}

function prevMonth() {
    if (currentMonth === 1) {
        currentYear--;
        currentMonth = 12;
    } else {
        currentMonth--;
    }
    loadMonthView(currentYear, currentMonth);
}

function nextMonth() {
    if (currentMonth === 12) {
        currentYear++;
        currentMonth = 1;
    } else {
        currentMonth++;
    }
    loadMonthView(currentYear, currentMonth);
}

function showDayInWeek(dateStr) {
    switchView('week');
    loadWeekView(dateStr);
}

// ========== 学生档案视图 ==========
async function loadStudentsView() {
    const students = await getAllStudents();
    renderStudentsList(students);
}

function renderStudentsList(students) {
    const container = document.getElementById('students-list');

    if (students.length === 0) {
        container.innerHTML = `
            <div class="students-empty">
                <i class="bi bi-people-fill"></i>
                <p class="empty-title">暂无学生档案</p>
                <p class="empty-hint">添加学生后可快速创建课程</p>
            </div>
        `;
        return;
    }

    container.innerHTML = students.map(student => `
        <div class="student-card" onclick="showStudentDrawer(${student.id})">
            <div class="student-info">
                <div class="student-name">${student.name}</div>
                <div class="student-detail">
                    <i class="bi bi-book"></i> ${student.subject || '未设置科目'}
                </div>
                ${student.default_address ? `<div class="student-detail"><i class="bi bi-geo-alt"></i> ${student.default_address}</div>` : ''}
                ${student.phone ? `<div class="student-detail"><i class="bi bi-telephone"></i> ${student.phone}</div>` : ''}
            </div>
            <div class="student-actions">
                <button class="btn-icon" onclick="event.stopPropagation(); quickAddSession(${student.id})" title="快速添加课程">
                    <i class="bi bi-plus-lg"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// ========== 统计视图 ==========
async function loadStatsView() {
    await loadStatsIncome();
    await loadIncomeTrendChart();
    await loadSubjectPieChart();
}

async function loadStatsIncome() {
    const today = new Date();

    const weekStart = new Date(today);
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    weekStart.setDate(today.getDate() + diff);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekSessions = await getSessionsByDateRange(
        weekStart.toISOString().split('T')[0],
        weekEnd.toISOString().split('T')[0]
    );
    const weekCompleted = weekSessions.filter(s => s.status === 'completed');
    const weekIncome = weekCompleted.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
    const weekHours = weekCompleted.reduce((sum, s) => sum + (s.duration || 0), 0) / 60;
    const weekHourly = weekHours > 0 ? (weekIncome / weekHours).toFixed(0) : 0;

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthSessions = await getSessionsByDateRange(
        monthStart.toISOString().split('T')[0],
        monthEnd.toISOString().split('T')[0]
    );
    const monthCompleted = monthSessions.filter(s => s.status === 'completed');
    const monthIncome = monthCompleted.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
    const monthHours = monthCompleted.reduce((sum, s) => sum + (s.duration || 0), 0) / 60;
    const monthHourly = monthHours > 0 ? (monthIncome / monthHours).toFixed(0) : 0;

    document.getElementById('stats-weekly-income').textContent = `¥${weekIncome.toFixed(0)}`;
    document.getElementById('stats-weekly-hourly').textContent = `时薪 ¥${weekHourly}/h`;
    document.getElementById('stats-monthly-income').textContent = `¥${monthIncome.toFixed(0)}`;
    document.getElementById('stats-monthly-hourly').textContent = `时薪 ¥${monthHourly}/h`;
}

async function loadIncomeTrendChart() {
    const canvas = document.getElementById('income-trend-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const sessions = await getAllSessions();
    const completed = sessions.filter(s => s.status === 'completed');

    const weeks = [];
    const now = new Date();

    for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now);
        const day = now.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        weekStart.setDate(now.getDate() + diff - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekIncome = completed
            .filter(s => {
                const d = new Date(s.session_date);
                return d >= weekStart && d <= weekEnd;
            })
            .reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);

        weeks.push({
            label: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
            income: weekIncome
        });
    }

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: weeks.map(w => w.label),
            datasets: [{
                label: '收入',
                data: weeks.map(w => w.income),
                borderColor: '#4b4ced',
                backgroundColor: 'rgba(75, 76, 237, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(255, 255, 255, 0.06)' }, ticks: { color: 'rgba(160, 160, 160, 0.8)' } },
                y: { grid: { color: 'rgba(255, 255, 255, 0.06)' }, ticks: { color: 'rgba(160, 160, 160, 0.8)' } }
            }
        }
    });
}

async function loadSubjectPieChart() {
    const canvas = document.getElementById('subject-pie-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const sessions = await getAllSessions();
    const completed = sessions.filter(s => s.status === 'completed');

    if (completed.length === 0) {
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['暂无数据'],
                datasets: [{ data: [1], backgroundColor: ['rgba(100, 100, 100, 0.3)'], borderWidth: 0 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#a0a0a0' } } }
            }
        });
        return;
    }

    const subjectStats = {};
    completed.forEach(s => {
        if (!subjectStats[s.subject]) {
            subjectStats[s.subject] = { subject: s.subject, total: 0, count: 0 };
        }
        subjectStats[s.subject].total += parseFloat(s.amount || 0);
        subjectStats[s.subject].count++;
    });

    const data = Object.values(subjectStats).sort((a, b) => b.total - a.total);
    const labels = data.map(d => d.subject);
    const values = data.map(d => d.total);
    const colors = data.map((_, i) => subjectColors[i % subjectColors.length]);

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#e0e0e0', padding: 15, usePointStyle: true } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const item = data[context.dataIndex];
                            return `¥${item.total.toFixed(0)} (${item.count}节课)`;
                        }
                    }
                }
            }
        }
    });
}

// ========== 抽屉操作 ==========
async function showAddDrawer(date = null) {
    const form = document.getElementById('session-form');
    form.reset();
    document.getElementById('edit-session-id').value = '';

    const dateInput = form.querySelector('[name="session_date"]');
    dateInput.value = date || new Date().toISOString().split('T')[0];

    await loadStudentSelect();

    document.getElementById('add-overlay').classList.add('show');
    document.getElementById('add-drawer').classList.add('open');
}

async function loadStudentSelect() {
    const students = await getAllStudents();
    const select = document.getElementById('student-select');
    select.innerHTML = '<option value="">-- 手动输入 --</option>' +
        students.map(s => `<option value="${s.id}">${s.name}${s.subject ? ` (${s.subject})` : ''}</option>`).join('');
}

async function fillFromStudent() {
    const select = document.getElementById('student-select');
    const studentId = select.value;
    if (!studentId) return;

    const student = await getStudent(parseInt(studentId));
    if (!student) return;

    const form = document.getElementById('session-form');
    form.querySelector('[name="student_name"]').value = student.name;
    if (student.subject) form.querySelector('[name="subject"]').value = student.subject;
    if (student.default_start_time) form.querySelector('[name="start_time"]').value = student.default_start_time;
    if (student.default_end_time) form.querySelector('[name="end_time"]').value = student.default_end_time;
    if (student.default_amount) form.querySelector('[name="amount"]').value = student.default_amount;
    if (student.default_address) form.querySelector('[name="address"]').value = student.default_address;
}

function closeAddDrawer() {
    document.getElementById('add-overlay').classList.remove('show');
    document.getElementById('add-drawer').classList.remove('open');
    document.getElementById('recurrence-options').classList.add('hidden');
}

async function showSessionDrawer(sessionId) {
    const session = await getSession(sessionId);
    if (!session) return;

    const isCompleted = session.status === 'completed';
    const statusBadge = isCompleted
        ? '<span class="status-badge completed">已完成</span>'
        : '<span class="status-badge scheduled">进行中</span>';

    const actionButton = isCompleted
        ? `<button class="btn-neon btn-outline" onclick="markScheduled(${session.id})">标记未完成</button>`
        : `<button class="btn-neon" onclick="markCompleted(${session.id})">标记完成</button>`;

    const deleteButtons = session.is_recurring && session.series_id
        ? `<button class="btn-neon btn-danger" onclick="deleteSession(${session.id})">删除本次</button>
           <button class="btn-neon btn-danger" onclick="deleteFutureSessions(${session.id}, '${session.series_id}', '${session.session_date}')">删除本次及之后</button>`
        : `<button class="btn-neon btn-danger" onclick="deleteSession(${session.id})">删除</button>`;

    document.getElementById('drawer-body').innerHTML = `
        <div class="session-detail">
            <div class="detail-row">
                <span class="detail-label">状态</span>
                <span class="detail-value">${statusBadge}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">学生</span>
                <span class="detail-value">${session.student_name}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">科目</span>
                <span class="detail-value">${session.subject}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">时间</span>
                <span class="detail-value">${session.session_date} ${formatTime(session.start_time)}-${formatTime(session.end_time)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">地址</span>
                <span class="detail-value">${session.address}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">金额</span>
                <span class="detail-value" style="color: var(--neon-gold); font-weight: 700;">¥${parseFloat(session.amount).toFixed(2)}</span>
            </div>
            ${session.notes ? `<div class="detail-row"><span class="detail-label">备注</span><span class="detail-value">${session.notes}</span></div>` : ''}
            ${session.is_recurring ? `<div class="detail-row"><span class="detail-label">类型</span><span class="detail-value"><i class="bi bi-arrow-repeat"></i> 每周重复</span></div>` : ''}
        </div>
        <div class="drawer-actions">
            <button class="btn-neon btn-outline" onclick="editSession(${session.id})">编辑</button>
            ${actionButton}
        </div>
        <div class="drawer-actions" style="margin-top: 8px;">
            ${deleteButtons}
        </div>
    `;

    document.getElementById('drawer-overlay').classList.add('show');
    document.getElementById('session-drawer').classList.add('open');
}

function closeDrawer() {
    document.getElementById('drawer-overlay').classList.remove('show');
    document.getElementById('session-drawer').classList.remove('open');
}

// ========== 学生抽屉操作 ==========
function showAddStudentDrawer() {
    const form = document.getElementById('student-form');
    form.reset();
    document.getElementById('edit-student-id').value = '';

    document.getElementById('student-overlay').classList.add('show');
    document.getElementById('student-drawer').classList.add('open');
}

async function showStudentDrawer(studentId) {
    const student = await getStudent(studentId);
    if (!student) return;

    const form = document.getElementById('student-form');
    form.reset();
    document.getElementById('edit-student-id').value = student.id;

    form.querySelector('[name="name"]').value = student.name;
    if (student.subject) form.querySelector('[name="subject"]').value = student.subject;
    if (student.default_start_time) form.querySelector('[name="default_start_time"]').value = student.default_start_time;
    if (student.default_end_time) form.querySelector('[name="default_end_time"]').value = student.default_end_time;
    if (student.default_amount) form.querySelector('[name="default_amount"]').value = student.default_amount;
    if (student.default_address) form.querySelector('[name="default_address"]').value = student.default_address;
    if (student.phone) form.querySelector('[name="phone"]').value = student.phone;
    if (student.notes) form.querySelector('[name="notes"]').value = student.notes;

    document.getElementById('student-overlay').classList.add('show');
    document.getElementById('student-drawer').classList.add('open');
}

function closeStudentDrawer() {
    document.getElementById('student-overlay').classList.remove('show');
    document.getElementById('student-drawer').classList.remove('open');
}

async function saveStudent() {
    const form = document.getElementById('student-form');
    const formData = new FormData(form);

    const studentData = {
        name: formData.get('name'),
        subject: formData.get('subject') || '',
        default_start_time: formData.get('default_start_time') || '',
        default_end_time: formData.get('default_end_time') || '',
        default_amount: formData.get('default_amount') ? parseFloat(formData.get('default_amount')) : null,
        default_address: formData.get('default_address') || '',
        phone: formData.get('phone') || '',
        notes: formData.get('notes') || '',
        created_at: new Date().toISOString()
    };

    const editId = document.getElementById('edit-student-id').value;

    try {
        if (editId) {
            studentData.id = parseInt(editId);
            await updateStudent(studentData);
        } else {
            await addStudent(studentData);
        }

        closeStudentDrawer();
        loadStudentsView();
    } catch (error) {
        console.error('保存失败:', error);
        alert('保存失败，请重试');
    }
}

async function deleteStudent(studentId) {
    if (!confirm('确定要删除这个学生档案吗？')) return;

    try {
        await deleteStudentDB(studentId);
        closeStudentDrawer();
        loadStudentsView();
    } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败，请重试');
    }
}

async function quickAddSession(studentId) {
    const student = await getStudent(studentId);
    if (!student) return;

    await showAddDrawer();

    const form = document.getElementById('session-form');
    form.querySelector('[name="student_name"]').value = student.name;
    if (student.subject) form.querySelector('[name="subject"]').value = student.subject;
    if (student.default_start_time) form.querySelector('[name="start_time"]').value = student.default_start_time;
    if (student.default_end_time) form.querySelector('[name="end_time"]').value = student.default_end_time;
    if (student.default_amount) form.querySelector('[name="amount"]').value = student.default_amount;
    if (student.default_address) form.querySelector('[name="address"]').value = student.default_address;
}

// ========== 课程操作 ==========
async function saveSession() {
    const form = document.getElementById('session-form');
    const formData = new FormData(form);

    const startTime = formData.get('start_time');
    const endTime = formData.get('end_time');
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const duration = endMinutes - startMinutes;

    if (duration <= 0) {
        alert('结束时间必须晚于开始时间');
        return;
    }

    const sessionData = {
        student_name: formData.get('student_name'),
        subject: formData.get('subject'),
        session_date: formData.get('session_date'),
        start_time: startTime,
        end_time: endTime,
        duration: duration,
        address: formData.get('address'),
        amount: parseFloat(formData.get('amount')),
        is_recurring: formData.get('is_recurring') === 'on',
        notes: formData.get('notes') || '',
        status: 'scheduled',
        created_at: new Date().toISOString()
    };

    const editId = document.getElementById('edit-session-id').value;

    try {
        if (editId) {
            sessionData.id = parseInt(editId);
            await updateSession(sessionData);
        } else {
            const isRecurring = formData.get('is_recurring') === 'on';
            const recurrenceEndDate = formData.get('recurrence_end_date');

            if (isRecurring && recurrenceEndDate) {
                const seriesId = 'series_' + Date.now();
                let currentDate = new Date(sessionData.session_date);
                const endDate = new Date(recurrenceEndDate);
                let weekCount = 0;

                while (currentDate <= endDate && weekCount < 52) {
                    const newSession = {
                        ...sessionData,
                        session_date: currentDate.toISOString().split('T')[0],
                        series_id: seriesId
                    };
                    await addSession(newSession);
                    currentDate.setDate(currentDate.getDate() + 7);
                    weekCount++;
                }
            } else {
                await addSession(sessionData);
            }
        }

        closeAddDrawer();
        loadWeekView();
    } catch (error) {
        console.error('保存失败:', error);
        alert('保存失败，请重试');
    }
}

async function editSession(sessionId) {
    const session = await getSession(sessionId);
    if (!session) return;

    closeDrawer();

    const form = document.getElementById('session-form');
    form.reset();

    document.getElementById('edit-session-id').value = session.id;
    form.querySelector('[name="student_name"]').value = session.student_name;
    form.querySelector('[name="subject"]').value = session.subject;
    form.querySelector('[name="session_date"]').value = session.session_date;
    form.querySelector('[name="start_time"]').value = session.start_time;
    form.querySelector('[name="end_time"]').value = session.end_time;
    form.querySelector('[name="address"]').value = session.address;
    form.querySelector('[name="amount"]').value = session.amount;
    form.querySelector('[name="notes"]').value = session.notes || '';

    await loadStudentSelect();

    document.getElementById('add-overlay').classList.add('show');
    document.getElementById('add-drawer').classList.add('open');
}

async function deleteSession(sessionId) {
    if (!confirm('确定要删除这个课程吗？')) return;

    try {
        await deleteSessionDB(sessionId);
        closeDrawer();
        loadWeekView();
    } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败，请重试');
    }
}

async function deleteSeries(sessionId, seriesId) {
    if (!confirm('确定要删除这个循环课程的所有课程吗？此操作不可恢复。')) return;

    try {
        const count = await deleteSeriesSessions(seriesId);
        closeDrawer();
        loadWeekView();
        alert(`已删除 ${count} 节课程`);
    } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败，请重试');
    }
}

async function deleteFutureSessions(sessionId, seriesId, currentDate) {
    if (!confirm('确定要删除本次及之后的所有循环课程吗？\n\n之前的课程将保留。')) return;

    try {
        const allSessions = await getAllSessions();

        const futureSessions = allSessions.filter(s => {
            return s.series_id === seriesId && s.session_date >= currentDate;
        });

        const database = getDB();
        const transaction = database.transaction(['sessions'], 'readwrite');
        const store = transaction.objectStore('sessions');

        for (const session of futureSessions) {
            store.delete(session.id);
        }

        await new Promise((resolve, reject) => {
            transaction.oncomplete = resolve;
            transaction.onerror = reject;
        });

        closeDrawer();
        loadWeekView();
        alert(`已删除 ${futureSessions.length} 节课程`);
    } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败，请重试');
    }
}

async function markCompleted(sessionId) {
    const session = await getSession(sessionId);
    if (!session) return;

    session.status = 'completed';
    await updateSession(session);
    closeDrawer();
    loadWeekView();
}

async function markScheduled(sessionId) {
    const session = await getSession(sessionId);
    if (!session) return;

    session.status = 'scheduled';
    await updateSession(session);
    closeDrawer();
    loadWeekView();
}

// ========== 工具函数 ==========
function formatDateOnly(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

function formatTime(timeStr) {
    return timeStr ? timeStr.substring(0, 5) : '';
}

function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

function getSubjectColorIndex(subject) {
    if (!subject) return 0;
    const hash = subject.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return hash % subjectColors.length;
}

function initSubjectColorStyles() {
    const style = document.createElement('style');
    style.id = 'dynamic-subject-colors';
    let css = '';
    subjectColors.forEach((color, index) => {
        css += `.session-card.subject-color-${index} { border-left-color: ${color}; }\n`;
    });
    style.textContent = css;
    document.head.appendChild(style);
}
