import React, { useState, useEffect, useMemo } from 'react';
import { getRoadmap, updateRoadmapItem } from '../../services/chatApiService';
import './roadmap.css';

// 과업 상세 내용
interface TaskDetails {
    objectives?: string[];
    key_concepts?: string[];
    steps?: { order: number; title: string; description: string; duration: string }[];
    resources?: string[];
    tips?: string;
}

// 개별 과업 (tasks 배열 내 항목)
interface RoadmapTask {
    rank: number;
    content: string;
    time: string;
    is_completed?: number;  // 0 또는 1
    completed_at?: string;
    details?: TaskDetails;  // 상세 내용
}

// 일차별 항목 (day 객체)
interface RoadmapItem {
    day: number;
    tasks: RoadmapTask[];
    created_at?: string;
}

interface RoadmapData {
    id: string;
    name: string;
    items: RoadmapItem[];
}

interface CalendarDay {
    day: number | null;
    status: 'empty' | 'normal' | 'active' | 'completed';
    roadmapDay?: number;
    taskCount?: number;
}

// 모달용 타입
interface SelectedTaskInfo {
    dayIndex: number;
    taskIndex: number;
    task: string;
    time: string;
    done: boolean;
    isToday: boolean;
    details?: TaskDetails;
}

const RoadmapView: React.FC = () => {
    const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [initialDateSet, setInitialDateSet] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTask, setSelectedTask] = useState<SelectedTaskInfo | null>(null); // 모달용


    // URL에서 roadmap_id 가져오기
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const roadmapId = urlParams.get('id');

        if (roadmapId) {
            loadRoadmap(roadmapId);  // parseInt 제거 - MongoDB ObjectId는 문자열
        } else {
            setLoading(false);
        }
    }, []);

    const loadRoadmap = async (roadmapId: string) => {
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
            let taskCount: number | undefined;

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
                    taskCount = item.tasks?.length || 0;

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
                taskCount
            });
        }

        return days;
    };

    const calendarDays = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    // 선택된 날짜(또는 오늘 날짜)에 해당하는 로드맵 항목 찾기 (useMemo로 최적화)
    const dayTasks = useMemo(() => {
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
            // tasks 배열을 rank 순으로 정렬하여 반환
            const sortedTasks = [...(item.tasks || [])].sort((a, b) => a.rank - b.rank);
            return sortedTasks.map((task, idx) => ({
                dayIndex: daysDiff,
                taskIndex: idx,
                rank: task.rank,
                task: task.content,
                time: task.time,
                done: task.is_completed === 1,
                isToday: isToday,
                details: task.details  // 상세 내용 포함
            }));
        }

        return [];
    }, [roadmapData, startDate, selectedDate]);

    const toggleTask = async (dayIndex: number, taskIndex: number, currentStatus: boolean, isToday: boolean) => {
        // 오늘 날짜가 아니면 체크 불가능
        if (!isToday) {
            return;
        }

        if (!roadmapData || !roadmapData.id) {
            console.error('로드맵 데이터가 없습니다.');
            return;
        }

        try {
            const newStatus = !currentStatus;
            // roadmap_id:day_index:task_index 형식으로 변환
            const roadmapItemId = `${roadmapData.id}:${dayIndex}:${taskIndex}`;
            const result = await updateRoadmapItem(roadmapItemId, newStatus);

            if (result && roadmapData) {
                // roadmapData의 해당 항목 업데이트
                const updatedItems = roadmapData.items.map((item, idx) => {
                    if (idx === dayIndex) {
                        const updatedTasks = item.tasks.map((task, tIdx) =>
                            tIdx === taskIndex
                                ? { ...task, is_completed: newStatus ? 1 : 0, completed_at: result.completed_at }
                                : task
                        );
                        return { ...item, tasks: updatedTasks };
                    }
                    return item;
                });

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
            <div className="roadmap-container">
                <div style={{ padding: '2rem', textAlign: 'center' }}>로드맵을 불러오는 중...</div>
            </div>
        );
    }

    if (!roadmapData) {
        return (
            <div className="roadmap-container">
                <div style={{ padding: '2rem', textAlign: 'center' }}>로드맵을 찾을 수 없습니다.</div>
            </div>
        );
    }

    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

    return (
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
                                        title={d.taskCount ? `${d.taskCount}개 과업` : undefined}
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
                            {dayTasks.length > 0 ? (
                                <ul className="todo-list">
                                    {dayTasks.map((item, idx) => {
                                        const isClickable = item.isToday === true;
                                        return (
                                            <li
                                                key={`${item.dayIndex}-${item.taskIndex}`}
                                                className={item.done ? 'done' : ''}
                                                style={{ opacity: isClickable ? 1 : 0.6 }}
                                            >
                                                {/* 체크박스: 클릭 시 완료 토글 */}
                                                <div
                                                    className="checkbox"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (isClickable) {
                                                            toggleTask(item.dayIndex, item.taskIndex, item.done, item.isToday);
                                                        }
                                                    }}
                                                    style={{ cursor: isClickable ? 'pointer' : 'not-allowed' }}
                                                >
                                                    {item.done && (
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                                                            <path d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                {/* 과업 내용: 클릭 시 모달 오픈 (오늘만) */}
                                                <div
                                                    style={{
                                                        flex: 1,
                                                        cursor: isClickable ? 'pointer' : 'default',
                                                        padding: '0.5rem 0'
                                                    }}
                                                    onClick={() => {
                                                        if (isClickable) {
                                                            setSelectedTask(item);
                                                        }
                                                    }}
                                                >
                                                    <span>{item.task}</span>
                                                    {item.time && (
                                                        <span style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>
                                                            예상 시간: {item.time}
                                                        </span>
                                                    )}
                                                    {item.details && (
                                                        <span style={{ display: 'block', fontSize: '0.75rem', color: '#6c5ce7', marginTop: '0.25rem' }}>
                                                            📝 상세 내용 보기
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

            {/* 과업 상세 모달 */ }
    {
        selectedTask && (
            <div
                className="modal-overlay"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}
                onClick={() => setSelectedTask(null)}
            >
                <div
                    className="modal-content"
                    style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '2rem',
                        maxWidth: '600px',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 모달 헤더 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#333' }}>{selectedTask.task}</h2>
                        <button
                            onClick={() => setSelectedTask(null)}
                            style={{
                                border: 'none',
                                background: 'none',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                color: '#888'
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                        예상 시간: {selectedTask.time}
                    </p>

                    {selectedTask.details ? (
                        <div>
                            {/* 학습 목표 */}
                            {selectedTask.details.objectives && selectedTask.details.objectives.length > 0 && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', color: '#6c5ce7', marginBottom: '0.5rem' }}>🎯 학습 목표</h3>
                                    <ul style={{ marginLeft: '1.5rem', color: '#555' }}>
                                        {selectedTask.details.objectives.map((obj, i) => (
                                            <li key={i}>{obj}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* 핵심 개념 */}
                            {selectedTask.details.key_concepts && selectedTask.details.key_concepts.length > 0 && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', color: '#00b894', marginBottom: '0.5rem' }}>💡 핵심 개념</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {selectedTask.details.key_concepts.map((concept, i) => (
                                            <span
                                                key={i}
                                                style={{
                                                    backgroundColor: '#e8f5e9',
                                                    padding: '0.3rem 0.8rem',
                                                    borderRadius: '20px',
                                                    fontSize: '0.9rem',
                                                    color: '#2e7d32'
                                                }}
                                            >
                                                {concept}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 학습 단계 */}
                            {selectedTask.details.steps && selectedTask.details.steps.length > 0 && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', color: '#0984e3', marginBottom: '0.5rem' }}>📚 학습 단계</h3>
                                    <ol style={{ marginLeft: '1.5rem' }}>
                                        {selectedTask.details.steps.map((step, i) => (
                                            <li key={i} style={{ marginBottom: '0.8rem' }}>
                                                <strong>{step.title}</strong>
                                                <span style={{ color: '#888', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                                                    ({step.duration})
                                                </span>
                                                <p style={{ color: '#666', marginTop: '0.3rem', marginBottom: 0 }}>
                                                    {step.description}
                                                </p>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}

                            {/* 추천 자료 */}
                            {selectedTask.details.resources && selectedTask.details.resources.length > 0 && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', color: '#e17055', marginBottom: '0.5rem' }}>📖 추천 자료</h3>
                                    <ul style={{ marginLeft: '1.5rem', color: '#555' }}>
                                        {selectedTask.details.resources.map((res, i) => (
                                            <li key={i}>{res}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* 팁 */}
                            {selectedTask.details.tips && (
                                <div style={{
                                    backgroundColor: '#fff9c4',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    marginTop: '1rem'
                                }}>
                                    <strong>💭 팁:</strong> {selectedTask.details.tips}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                            <p>아직 상세 내용이 생성되지 않았습니다.</p>
                            <p style={{ fontSize: '0.9rem' }}>매일 자정에 자동으로 생성됩니다.</p>
                        </div>
                    )}

                    {/* 완료 버튼 */}
                    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <button
                            onClick={() => {
                                toggleTask(selectedTask.dayIndex, selectedTask.taskIndex, selectedTask.done, selectedTask.isToday);
                                setSelectedTask(null);
                            }}
                            style={{
                                backgroundColor: selectedTask.done ? '#ddd' : '#6c5ce7',
                                color: selectedTask.done ? '#666' : 'white',
                                border: 'none',
                                padding: '0.8rem 2rem',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                cursor: 'pointer'
                            }}
                        >
                            {selectedTask.done ? '완료 취소' : '✓ 완료'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }
        </MainLayout >
    );
};

export default RoadmapView;
