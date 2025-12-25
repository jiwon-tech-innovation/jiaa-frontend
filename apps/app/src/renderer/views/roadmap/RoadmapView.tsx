import React, { useState } from 'react';
import { MainLayout } from '../../components/MainLayout/MainLayout';
import './roadmap.css';

const RoadmapView: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 1)); // 2025년 12월 기준

    // 캘린더 데이터 생성
    const getDaysInMonth = (year: number, month: number) => {
        const date = new Date(year, month, 1);
        const days = [];
        const firstDayIndex = date.getDay();
        const lastDay = new Date(year, month + 1, 0).getDate();

        // 이전 달 빈 칸
        for (let i = 0; i < firstDayIndex; i++) {
            days.push({ day: null, status: 'empty' });
        }

        // 이번 달 날짜
        for (let i = 1; i <= lastDay; i++) {
            let status = 'normal';
            if (i === 15) status = 'active'; // 예시: 오늘 날짜나 진행 중인 태스크
            if (i < 10) status = 'completed'; // 예시: 완료된 날짜
            days.push({ day: i, status });
        }

        return days;
    };

    const calendarDays = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    const [tasks, setTasks] = useState([
        { id: 1, task: '프로세스 모니터링 버그 수정', done: false },
        { id: 2, task: '로드맵 UI 피드백 반영', done: true },
        { id: 3, task: 'Live2D 표정 데이터 검토', done: false },
        { id: 4, task: '캘린더 로직 최적화', done: false },
    ]);

    const toggleTask = (id: number) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    };

    return (
        <MainLayout activeTab="roadmap" hideAvatar={true}>
            <div className="roadmap-container">
                <header className="roadmap-page-header">
                    <h1 className="main-title">
                        <span className="brace">{'{'}</span>
                        <span className="title-text">Load_Map Name</span>
                        <span className="brace">{'}'}</span>
                    </h1>
                </header>

                <main className="roadmap-layout">
                    {/* Left Section: Calendar Roadmap */}
                    <section className="section roadmap-main">
                        <div className="section-header-row">
                            <h2 className="section-label">로드맵</h2>
                            <div className="calendar-controls">
                                <span>2025년 12월</span>
                            </div>
                        </div>
                        <div className="content-card calendar-card">
                            <div className="calendar-grid-header">
                                {weekDays.map(day => <div key={day} className="weekday">{day}</div>)}
                            </div>
                            <div className="calendar-grid">
                                {calendarDays.map((d, i) => (
                                    <div key={i} className={`calendar-cell ${d.status}`}>
                                        {d.day && <span className="day-number">{d.day}</span>}
                                        {d.status === 'active' && <div className="event-dot"></div>}
                                        {d.status === 'completed' && <div className="completed-mark"></div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Right Section: Todo */}
                    <section className="section today-todo">
                        <h2 className="section-label">오늘 할 일</h2>
                        <div className="content-card">
                            <div className="card-placeholder-content">
                                <ul className="todo-list">
                                    {tasks.map((item) => (
                                        <li
                                            key={item.id}
                                            className={item.done ? 'done' : ''}
                                            onClick={() => toggleTask(item.id)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="checkbox">
                                                {item.done && (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                                                        <path d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span>{item.task}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </MainLayout>
    );
};

export default RoadmapView;
