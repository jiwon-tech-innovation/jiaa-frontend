import React, { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '../../components/MainLayout/MainLayout';
import { getRoadmap, updateRoadmapItem } from '../../services/chatApiService';
import './roadmap.css';

interface RoadmapItem {
    id: number;
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
    const [selectedDate, setSelectedDate] = useState<Date | null>(null); // 선택된 날짜

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

    // 선택된 날짜(또는 오늘 날짜)에 해당하는 로드맵 항목 찾기 (useMemo로 최적화)
    const tasks = useMemo(() => {
        if (!roadmapData || !startDate) return [];

        // 선택된 날짜가 있으면 그 날짜를, 없으면 오늘 날짜를 사용
        const targetDate = selectedDate || new Date();
        targetDate.setHours(0, 0, 0, 0);
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        // 오늘 날짜인지 확인
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isToday = targetDate.toDateString() === today.toDateString();
        
        const daysDiff = Math.floor((targetDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log('[RoadmapView] 할 일 계산:', {
            targetDate: targetDate.toISOString(),
            start: start.toISOString(),
            daysDiff,
            itemsLength: roadmapData.items.length,
            isSelected: !!selectedDate,
            isToday
        });
        
        if (daysDiff >= 0 && daysDiff < roadmapData.items.length) {
            const item = roadmapData.items[daysDiff];
            return [{
                id: item.id,
                task: item.content,
                time: item.time,
                done: item.is_completed || false,
                isToday: isToday
            }];
        }
        
        return [];
    }, [roadmapData, startDate, selectedDate]);

    const toggleTask = async (itemId: number, currentStatus: boolean, isToday: boolean) => {
        // 오늘 날짜가 아니면 체크 불가능
        if (!isToday) {
            return;
        }
        
        try {
            const newStatus = !currentStatus;
            const result = await updateRoadmapItem(itemId, newStatus);
            
            if (result && roadmapData) {
                // roadmapData의 해당 항목 업데이트
                const updatedItems = roadmapData.items.map(item => 
                    item.id === itemId 
                        ? { ...item, is_completed: newStatus, completed_at: result.completed_at || item.completed_at }
                        : item
                );
                
                setRoadmapData({
                    ...roadmapData,
                    items: updatedItems
                });
            }
        } catch (error) {
            console.error('로드맵 항목 업데이트 오류:', error);
        }
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
                    <button className="back-btn" onClick={() => window.history.back()} title="뒤로가기">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
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
                                {calendarDays.map((d, i) => {
                                    // 오늘 날짜인지 확인
                                    const today = new Date();
                                    const isToday = d.day !== null && 
                                        new Date(currentDate.getFullYear(), currentDate.getMonth(), d.day).toDateString() === today.toDateString();
                                    
                                    // 날짜 클릭 핸들러
                                    const handleDateClick = () => {
                                        if (d.day !== null) {
                                            const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), d.day);
                                            clickedDate.setHours(0, 0, 0, 0);
                                            
                                            // 오늘 날짜를 클릭하면 선택 해제 (오늘로 돌아가기)
                                            if (isToday) {
                                                setSelectedDate(null);
                                                return;
                                            }
                                            
                                            // 로드맵 항목이 있는 날짜만 선택 가능
                                            if (roadmapData && startDate) {
                                                const daysDiff = Math.floor((clickedDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                                                if (daysDiff >= 0 && daysDiff < roadmapData.items.length) {
                                                    setSelectedDate(clickedDate);
                                                }
                                            }
                                        }
                                    };
                                    
                                    // 선택된 날짜인지 확인
                                    const isSelected = selectedDate && d.day !== null && 
                                        selectedDate.getDate() === d.day &&
                                        selectedDate.getMonth() === currentDate.getMonth() &&
                                        selectedDate.getFullYear() === currentDate.getFullYear();
                                    
                                    // 클릭 가능한 날짜: 오늘 날짜이거나 로드맵 항목이 있는 날짜
                                    const isClickable = isToday || !!d.roadmapDay;
                                    
                                    return (
                                        <div 
                                            key={i} 
                                            className={`calendar-cell ${d.status} ${isSelected ? 'selected' : ''} ${isClickable ? 'clickable' : ''}`}
                                            title={d.content}
                                            onClick={isClickable ? handleDateClick : undefined}
                                            style={isClickable ? { cursor: 'pointer' } : {}}
                                        >
                                            {d.day && <span className="day-number">{d.day}</span>}
                                            {/* {d.status === 'completed' && <div className="completed-mark"></div>} */}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* Right Section: Todo */}
                    <section className="section today-todo">
                        <h2 className="section-label">
                            {selectedDate 
                                ? `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 할 일`
                                : '오늘 할 일'
                            }
                        </h2>
                        <div className="content-card">
                            <div className="card-placeholder-content">
                                {tasks.length > 0 ? (
                                    <ul className="todo-list">
                                        {tasks.map((item) => {
                                            const isClickable = item.isToday === true; // 오늘 날짜만 클릭 가능
                                            return (
                                                <li
                                                    key={item.id}
                                                    className={item.done ? 'done' : ''}
                                                    onClick={() => isClickable && toggleTask(item.id, item.done, item.isToday)}
                                                    style={{ cursor: isClickable ? 'pointer' : 'not-allowed', opacity: isClickable ? 1 : 0.6 }}
                                                >
                                                    <div className="checkbox">
                                                        {item.done && (
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
                                        {selectedDate 
                                            ? `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일에는 로드맵에 등록된 일정이 없습니다.`
                                            : '오늘은 로드맵에 등록된 일정이 없습니다.'
                                        }
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
