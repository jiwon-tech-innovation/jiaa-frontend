import React, { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '../../components/MainLayout/MainLayout';
import { getRoadmap } from '../../services/chatApiService';
import './roadmap.css';

interface RoadmapItem {
    day: number;
    content: string;
    time: string;
    created_at?: string;
    is_completed?: boolean;
    completed_at?: string;
}

interface RoadmapData {
    id: number;
    name: string;
    items: RoadmapItem[];
}

interface CalendarDay {
    day: number | null;
    status: 'empty' | 'normal' | 'active' | 'completed';
    roadmapDay?: number; // 로드맵의 몇 일차인지
    content?: string;
}

const RoadmapView: React.FC = () => {
    const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [initialDateSet, setInitialDateSet] = useState(false);

    // URL에서 roadmap_id 가져오기
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const roadmapId = urlParams.get('id');
        
        if (roadmapId) {
            loadRoadmap(parseInt(roadmapId));
        } else {
            setLoading(false);
        }
    }, []);

    const loadRoadmap = async (roadmapId: number) => {
        try {
            setLoading(true);
            const data = await getRoadmap(roadmapId);
            console.log('[RoadmapView] 로드맵 데이터:', data);
            if (data) {
                setRoadmapData(data);
                
                // 첫 번째 항목(day: 1)의 created_at을 기준으로 시작 날짜 설정
                const firstItem = data.items?.find((item: RoadmapItem) => item.day === 1);
                if (firstItem && firstItem.created_at) {
                    const start = new Date(firstItem.created_at);
                    console.log('[RoadmapView] 시작 날짜 (created_at):', start);
                    setStartDate(start);
                    
                    // 시작 날짜가 있는 달을 기본으로 표시 (한 번만 설정)
                    if (!initialDateSet) {
                        setCurrentDate(new Date(start.getFullYear(), start.getMonth(), 1));
                        setInitialDateSet(true);
                    }
                } else {
                    console.warn('[RoadmapView] 첫 번째 항목의 created_at이 없습니다:', data.items);
                }
            } else {
                console.warn('[RoadmapView] 로드맵 데이터가 없습니다');
            }
        } catch (error) {
            console.error('로드맵 로드 오류:', error);
        } finally {
            setLoading(false);
        }
    };

    // 캘린더 데이터 생성 (실제 날짜 기반)
    const getDaysInMonth = (year: number, month: number) => {
        const date = new Date(year, month, 1);
        const days: CalendarDay[] = [];
        const firstDayIndex = date.getDay();
        const lastDay = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        // 이전 달 빈 칸
        for (let i = 0; i < firstDayIndex; i++) {
            days.push({ day: null, status: 'empty' });
        }

        // 이번 달 날짜
        for (let i = 1; i <= lastDay; i++) {
            const currentDay = new Date(year, month, i);
            let status: 'normal' | 'active' | 'completed' = 'normal';
            let roadmapDay: number | undefined;
            let content: string | undefined;

            // 오늘 날짜인지 확인
            const isToday = currentDay.toDateString() === today.toDateString();
            if (isToday) {
                status = 'active';
            }

            // 로드맵 데이터가 있고 시작 날짜가 있으면 해당 날짜의 로드맵 항목 찾기
            if (roadmapData && startDate) {
                const daysDiff = Math.floor((currentDay.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysDiff >= 0 && daysDiff < roadmapData.items.length) {
                    const item = roadmapData.items[daysDiff];
                    roadmapDay = item.day;
                    content = item.content;
                    
                    // 오늘이면 active, 과거면 completed
                    if (daysDiff === 0 && isToday) {
                        status = 'active';
                    } else if (daysDiff < 0 || (daysDiff === 0 && !isToday)) {
                        status = 'completed';
                    }
                }
            }

            days.push({ 
                day: i, 
                status,
                roadmapDay,
                content
            });
        }

        return days;
    };

    const calendarDays = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    // 오늘 날짜에 해당하는 로드맵 항목 찾기 (useMemo로 최적화)
    const tasks = useMemo(() => {
        if (!roadmapData || !startDate) return [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log('[RoadmapView] 오늘 할 일 계산:', {
            today: today.toISOString(),
            start: start.toISOString(),
            daysDiff,
            itemsLength: roadmapData.items.length
        });
        
        if (daysDiff >= 0 && daysDiff < roadmapData.items.length) {
            const item = roadmapData.items[daysDiff];
            return [{
                id: item.day,
                task: item.content,
                time: item.time,
                done: false
            }];
        }
        
        return [];
    }, [roadmapData, startDate]);

    const [taskStates, setTaskStates] = useState<{ [key: number]: boolean }>({});

    const toggleTask = (id: number) => {
        setTaskStates(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // 이전 달로 이동
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    // 다음 달로 이동
    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    if (loading) {
        return (
            <MainLayout activeTab="roadmap" hideAvatar={true}>
                <div className="roadmap-container">
                    <div style={{ padding: '2rem', textAlign: 'center' }}>로드맵을 불러오는 중...</div>
                </div>
            </MainLayout>
        );
    }

    if (!roadmapData) {
        return (
            <MainLayout activeTab="roadmap" hideAvatar={true}>
                <div className="roadmap-container">
                    <div style={{ padding: '2rem', textAlign: 'center' }}>로드맵을 찾을 수 없습니다.</div>
                </div>
            </MainLayout>
        );
    }

    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

    return (
        <MainLayout activeTab="roadmap" hideAvatar={true}>
            <div className="roadmap-container">
                <header className="roadmap-page-header">
                    <h1 className="main-title">
                        <span className="title-text">{roadmapData.name}</span>
                    </h1>
                </header>

                <main className="roadmap-layout">
                    {/* Left Section: Calendar Roadmap */}
                    <section className="section roadmap-main">
                        <div className="section-header-row">
                            <h2 className="section-label">로드맵</h2>
                            <div className="calendar-controls">
                                <button onClick={goToPreviousMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontSize: '1.2rem', padding: '0 0.5rem' }}>‹</button>
                                <span>{currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}</span>
                                <button onClick={goToNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontSize: '1.2rem', padding: '0 0.5rem' }}>›</button>
                            </div>
                        </div>
                        <div className="content-card calendar-card">
                            <div className="calendar-grid-header">
                                {weekDays.map(day => <div key={day} className="weekday">{day}</div>)}
                            </div>
                            <div className="calendar-grid">
                                {calendarDays.map((d, i) => (
                                    <div key={i} className={`calendar-cell ${d.status}`} title={d.content}>
                                        {d.day && <span className="day-number">{d.day}</span>}
                                        {d.roadmapDay && (
                                            <span className="roadmap-day-badge" style={{ 
                                                fontSize: '0.7rem', 
                                                color: '#888',
                                                position: 'absolute',
                                                bottom: '2px',
                                                right: '2px'
                                            }}>D{d.roadmapDay}</span>
                                        )}
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
                                {tasks.length > 0 ? (
                                    <ul className="todo-list">
                                        {tasks.map((item) => {
                                            const isDone = taskStates[item.id] || false;
                                            return (
                                                <li
                                                    key={item.id}
                                                    className={isDone ? 'done' : ''}
                                                    onClick={() => toggleTask(item.id)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div className="checkbox">
                                                        {isDone && (
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                                                                <path d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <span>{item.task}</span>
                                                        {item.time && (
                                                            <span style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>
                                                                예상 시간: {item.time}
                                                            </span>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                                        오늘은 로드맵에 등록된 일정이 없습니다.
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </MainLayout>
    );
};

export default RoadmapView;
