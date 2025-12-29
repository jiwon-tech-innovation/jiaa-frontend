import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats, tryAutoLogin } from '../../services/api';
import { getRoadmaps } from '../../services/chatApiService';
import './statistics.css';

export const Statistics: React.FC = () => {
    const [weekIndex, setWeekIndex] = useState(0); // 0: 이번 주, 1: 1주 전, 2: 2주 전, 3: 3주 전
    const [isTokenReady, setIsTokenReady] = useState(false);

    // 앱 시작 시 자동 로그인 시도 (토큰이 없을 경우)
    useEffect(() => {
        const attemptAutoLogin = async () => {
            try {
                const success = await tryAutoLogin();
                if (success) {
                    console.log('[Statistics] Auto-login successful, tokens refreshed');
                } else {
                    console.log('[Statistics] Auto-login failed or no refresh token');
                }
            } catch (error) {
                console.error('[Statistics] Auto-login error:', error);
            } finally {
                // 토큰 준비 완료 (성공/실패 여부와 관계없이)
                setIsTokenReady(true);
            }
        };

        attemptAutoLogin();
    }, []);

    // Fetch Dashboard Stats (토큰 준비 완료 후 실행)
    const { data: radarData = [] } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: fetchDashboardStats,
        enabled: isTokenReady, // 토큰 준비 완료 후에만 실행
        staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    });

    // Fetch Roadmaps (토큰 준비 완료 후 실행)
    const { data: roadmapsData = [] } = useQuery({
        queryKey: ['roadmaps'],
        queryFn: () => getRoadmaps(),
        enabled: isTokenReady,
        staleTime: 5 * 60 * 1000,
    });

    // 시간 문자열을 시간(숫자)로 변환하는 함수
    const parseTimeToHours = (timeStr: string): number => {
        if (!timeStr) return 0;
        
        let totalHours = 0;
        
        // "시간" 단위 추출
        const hourMatch = timeStr.match(/(\d+)\s*시간/);
        if (hourMatch) {
            totalHours += parseInt(hourMatch[1], 10);
        }
        
        // "분" 단위 추출
        const minuteMatch = timeStr.match(/(\d+)\s*분/);
        if (minuteMatch) {
            totalHours += parseInt(minuteMatch[1], 10) / 60;
        }
        
        // "시간"이나 "분"이 없으면 숫자만 있는 경우 처리
        if (!hourMatch && !minuteMatch) {
            const numMatch = timeStr.match(/(\d+)/);
            if (numMatch) {
                // 기본적으로 분으로 간주
                totalHours = parseInt(numMatch[1], 10) / 60;
            }
        }
        
        return totalHours;
    };

    // 주간 활동량 데이터 계산
    const allWeeksData = useMemo(() => {
        const weeks: Array<{
            label: string;
            dateRange: string;
            data: Array<{ day: string; hours: number; date: string }>;
        }> = [];

        const today = new Date();
        const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

        // 최근 4주 데이터 생성
        for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
            // 주의 시작일 계산 (일요일 = 0, 월요일 = 1, ...)
            const dayOfWeek = today.getDay(); // 0 = 일요일, 1 = 월요일, ...
            const weekStart = new Date(today);
            // 이번 주 일요일로 이동 후, weekOffset만큼 주를 빼기
            weekStart.setDate(today.getDate() - dayOfWeek - (weekOffset * 7));
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            const weekData: Array<{ day: string; hours: number; date: string }> = [];

            // 각 요일별로 데이터 계산
            for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
                const currentDate = new Date(weekStart);
                currentDate.setDate(weekStart.getDate() + dayOffset);
                
                let dayHours = 0;

                // 모든 로드맵에서 완료된 태스크 찾기
                roadmapsData.forEach((roadmap: any) => {
                    if (!roadmap.items) return;

                    roadmap.items.forEach((item: any) => {
                        // 새 구조 (tasks 배열)
                        if (item.tasks && item.tasks.length > 0) {
                            item.tasks.forEach((task: any) => {
                                if (task.is_completed === 1 && task.completed_at) {
                                    const completedDate = new Date(task.completed_at);
                                    completedDate.setHours(0, 0, 0, 0);
                                    
                                    if (completedDate.getTime() === currentDate.getTime()) {
                                        dayHours += parseTimeToHours(task.time || '0분');
                                    }
                                }
                            });
                        } else {
                            // 레거시 구조
                            if (item.is_completed === 1 && item.completed_at) {
                                const completedDate = new Date(item.completed_at);
                                completedDate.setHours(0, 0, 0, 0);
                                
                                if (completedDate.getTime() === currentDate.getTime()) {
                                    dayHours += parseTimeToHours(item.time || '0분');
                                }
                            }
                        }
                    });
                });

                const dayName = weekDays[currentDate.getDay()];
                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                const day = String(currentDate.getDate()).padStart(2, '0');
                const dateStr = `${month}/${day}`;

                weekData.push({
                    day: dayName,
                    hours: Math.round(dayHours * 10) / 10, // 소수점 첫째자리까지
                    date: dateStr
                });
            }

            const monthStart = String(weekStart.getMonth() + 1).padStart(2, '0');
            const dayStart = String(weekStart.getDate()).padStart(2, '0');
            const monthEnd = String(weekEnd.getMonth() + 1).padStart(2, '0');
            const dayEnd = String(weekEnd.getDate()).padStart(2, '0');
            const dateRange = `${monthStart}/${dayStart} - ${monthEnd}/${dayEnd}`;

            const labels = ['이번 주', '지난 주', '2주 전', '3주 전'];
            weeks.push({
                label: labels[weekOffset],
                dateRange,
                data: weekData
            });
        }

        return weeks;
    }, [roadmapsData]);

    // 월간 학습 기록 데이터 계산
    const monthlyRecords = useMemo(() => {
        const records: Array<{ month: string; hours: number; goal: string; status: string }> = [];
        const today = new Date();
        
        // 가장 오래된 로드맵의 생성일 찾기 (가입일 기준)
        let earliestRoadmapDate: Date | null = null;
        roadmapsData.forEach((roadmap: any) => {
            if (roadmap.created_at) {
                const roadmapDate = new Date(roadmap.created_at);
                if (!earliestRoadmapDate || roadmapDate < earliestRoadmapDate) {
                    earliestRoadmapDate = roadmapDate;
                }
            }
        });

        // 가입일이 없으면 오늘 날짜를 기준으로 함
        const startDate = earliestRoadmapDate || today;
        const startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        
        // 최근 4개월 데이터 생성 (가입일 이후만)
        for (let monthOffset = 0; monthOffset < 4; monthOffset++) {
            const targetDate = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
            const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
            const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

            // 가입일 이전 월은 제외
            if (monthStart < startMonth) {
                continue;
            }

            let totalHours = 0;

            // 모든 로드맵에서 완료된 태스크 찾기
            roadmapsData.forEach((roadmap: any) => {
                if (!roadmap.items) return;

                roadmap.items.forEach((item: any) => {
                    // 새 구조 (tasks 배열)
                    if (item.tasks && item.tasks.length > 0) {
                        item.tasks.forEach((task: any) => {
                            if (task.is_completed === 1 && task.completed_at) {
                                const completedDate = new Date(task.completed_at);
                                
                                if (completedDate >= monthStart && completedDate <= monthEnd) {
                                    totalHours += parseTimeToHours(task.time || '0분');
                                }
                            }
                        });
                    } else {
                        // 레거시 구조
                        if (item.is_completed === 1 && item.completed_at) {
                            const completedDate = new Date(item.completed_at);
                            
                            if (completedDate >= monthStart && completedDate <= monthEnd) {
                                totalHours += parseTimeToHours(item.time || '0분');
                            }
                        }
                    }
                });
            });

            const monthName = `${targetDate.getMonth() + 1}월`;
            const hours = Math.round(totalHours);
            const goal = hours >= 100 ? '달성' : '미달';
            const status = hours >= 100 ? 'high' : hours >= 50 ? 'normal' : 'low';

            records.push({ month: monthName, hours, goal, status });
        }

        return records;
    }, [roadmapsData]);

    const currentWeek = allWeeksData[weekIndex] || allWeeksData[0] || { label: '이번 주', dateRange: '', data: [] };
    const weeklyData = currentWeek.data;

    const handlePrevWeek = () => {
        if (weekIndex < allWeeksData.length - 1) {
            setWeekIndex(weekIndex + 1);
        }
    };

    const handleNextWeek = () => {
        if (weekIndex > 0) {
            setWeekIndex(weekIndex - 1);
        }
    };

    // Calculate hexagon points for radar chart (대시보드와 동일한 방식)
    const generateGridHexagon = (centerX: number, centerY: number, radius: number) => {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
        }
        return points.join(' ');
    };

    // Calculate radar data points
    const calculateRadarPoints = (centerX: number, centerY: number, radius: number, values: number[]) => {
        const points = values.map((value, index) => {
            const angle = (Math.PI / 3) * index - Math.PI / 2;
            const r = (value / 100) * radius;
            const x = centerX + r * Math.cos(angle);
            const y = centerY + r * Math.sin(angle);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        });
        return points.join(' ');
    };

    // Calculate label positions
    const getLabelPosition = (centerX: number, centerY: number, radius: number, index: number) => {
        const angle = (Math.PI / 3) * index - Math.PI / 2;
        const labelRadius = radius + 15;
        const x = centerX + labelRadius * Math.cos(angle);
        const y = centerY + labelRadius * Math.sin(angle);
        return { x: x.toFixed(1), y: y.toFixed(1) };
    };

    const hoursList = weeklyData.map(d => d.hours);
    const maxDataValue = hoursList.length > 0 ? Math.max(...hoursList) : 0;
    const minDataValue = hoursList.length > 0 ? Math.min(...hoursList) : 0;
    
    // 실제 학습한 일수만으로 평균 계산 (0시간인 날 제외)
    const completedDays = hoursList.filter(hours => hours > 0);
    const avgValue = completedDays.length > 0
        ? completedDays.reduce((sum, current) => sum + current, 0) / completedDays.length
        : 0;

    // Y축 스케일을 위해 최대값 조정 (여유 공간 확보)
    const maxScale = Math.ceil(maxDataValue * 1.1) || 10;

    const chartHeight = 180;
    const barWidth = 36;
    const gap = 24;
    const padding = 40;
    const svgWidth = (barWidth + gap) * 7 + padding * 2;
    const svgHeight = chartHeight + padding * 2;

    // 평균선 Y 좌표 계산 (평균값이 0보다 클 때만 표시)
    const avgY = avgValue > 0 && maxScale > 0
        ? padding + (chartHeight - (avgValue / maxScale) * chartHeight)
        : null;

    return (
        <div className="statistics-container">
            <header className="statistics-header">
                <h1>학습 통계 리포트</h1>
            </header>

            <div className="statistics-content">
                <div className="stats-grid">
                    {/* Weekly Activity Bar Chart */}
                    <div className="chart-card">
                        <div className="chart-title-row">
                            <h3>주간 활동량 ({currentWeek.dateRange})</h3>
                            <div className="week-buttons">
                                <button onClick={handlePrevWeek} disabled={weekIndex >= allWeeksData.length - 1} className="nav-btn">&lt;</button>
                                <button onClick={handleNextWeek} disabled={weekIndex <= 0} className="nav-btn">&gt;</button>
                            </div>
                        </div>
                        <div className="chart-wrapper">
                            <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="bar-chart">
                                {/* Grid Lines */}
                                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                                    const y = padding + chartHeight * (1 - ratio);
                                    return (
                                        <g key={ratio}>
                                            <line className="grid-line" x1={padding} y1={y} x2={svgWidth - padding} y2={y} strokeDasharray="4" />
                                            <text className="grid-label" x={padding - 10} y={y + 4} fontSize="10" textAnchor="end">{Math.round(maxScale * ratio)}h</text>
                                        </g>
                                    );
                                })}

                                {/* Average Line - 실제 데이터 기반 평균선 */}
                                {avgY !== null && avgValue > 0 && (
                                    <g>
                                        <line 
                                            x1={padding} 
                                            y1={avgY} 
                                            x2={svgWidth - padding} 
                                            y2={avgY} 
                                            stroke="#7c5cdb" 
                                            strokeWidth="1.5" 
                                            strokeDasharray="5,5" 
                                            opacity="0.6" 
                                        />
                                        <text 
                                            x={svgWidth - padding + 5} 
                                            y={avgY + 4} 
                                            fill="#7c5cdb" 
                                            fontSize="10" 
                                            fontWeight="500"
                                        >
                                            평균 {avgValue.toFixed(1)}h
                                        </text>
                                    </g>
                                )}

                                {/* Bars */}
                                {weeklyData.map((data, index) => {
                                    const barHeight = (data.hours / maxScale) * chartHeight;
                                    const x = padding + index * (barWidth + gap) + gap / 2;
                                    const y = padding + (chartHeight - barHeight);
                                    let barColor = "rgba(124, 92, 219, 0.8)";
                                    if (data.hours === maxDataValue && data.hours > 0) barColor = "rgba(16, 185, 129, 0.9)";
                                    if (data.hours === minDataValue && data.hours > 0) barColor = "rgba(239, 68, 68, 0.9)";

                                    return (
                                        <g key={data.day} className="bar-group">
                                            <rect className="bar-bg" x={x} y={padding} width={barWidth} height={chartHeight} rx="6" />
                                            <rect className="bar-rect" x={x} y={y} width={barWidth} height={barHeight} fill={barColor} rx="6" />
                                            <text className="bar-label" x={x + barWidth / 2} y={svgHeight - padding + 20} fontSize="12" textAnchor="middle">{data.day}</text>
                                            {data.hours > 0 && <text className="bar-value" x={x + barWidth / 2} y={y - 8} fontSize="10" fontWeight="bold" textAnchor="middle">{data.hours}h</text>}
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    </div>

                    {/* Hexagon Stats ( Radar Chart ) */}
                    <div className="radar-card">
                        <h3>역량 다이어그램</h3>
                        <div className="radar-chart-container">
                            <svg viewBox="0 0 200 200" className="radar-chart" preserveAspectRatio="xMidYMid meet">
                                {/* Background hexagon */}
                                <polygon points={generateGridHexagon(100, 100, 80)} className="radar-bg" />
                                {/* Grid lines - inner hexagons (더 많은 그리드 선) */}
                                <polygon points={generateGridHexagon(100, 100, 68)} className="radar-grid" />
                                <polygon points={generateGridHexagon(100, 100, 56)} className="radar-grid" />
                                <polygon points={generateGridHexagon(100, 100, 44)} className="radar-grid" />
                                <polygon points={generateGridHexagon(100, 100, 32)} className="radar-grid" />
                                <polygon points={generateGridHexagon(100, 100, 20)} className="radar-grid" />
                                <polygon points={generateGridHexagon(100, 100, 8)} className="radar-grid" />
                                {/* Data polygon */}
                                {radarData.length > 0 && (
                                    <polygon
                                        points={calculateRadarPoints(100, 100, 80, radarData.map(d => d.value))}
                                        className="radar-data"
                                    />
                                )}
                                {/* Labels */}
                                {radarData.map((item, index) => {
                                    const pos = getLabelPosition(100, 100, 80, index);
                                    return (
                                        <text
                                            key={index}
                                            x={pos.x}
                                            y={pos.y}
                                            textAnchor="middle"
                                            className="radar-label"
                                        >
                                            {item.label}
                                        </text>
                                    );
                                })}
                            </svg>
                        </div>
                    </div>

                    {/* Monthly Records */}
                    <div className="monthly-card">
                        <h3>월간 학습 기록</h3>
                        <div className="monthly-record-list">
                            {monthlyRecords.map((record, index) => (
                                <div key={index} className="monthly-item">
                                    <div className="month-info">
                                        <div className="month-name">{record.month}</div>
                                        <div className="month-stat">총 {record.hours}시간 학습</div>
                                    </div>
                                    <div className={`month-badge ${record.status}`}>
                                        목표 {record.goal}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
