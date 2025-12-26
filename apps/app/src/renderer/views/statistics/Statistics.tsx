import React, { useState } from 'react';
import { MainLayout } from '../../components/MainLayout/MainLayout';
import './statistics.css';

export const Statistics: React.FC = () => {
    const [weekIndex, setWeekIndex] = useState(0); // 0: 이번 주, 1: 1주 전, 2: 2주 전, 3: 3주 전

    // Mock Data for 4 Weeks
    const allWeeksData = [
        {
            label: "이번 주",
            dateRange: "12/22 - 12/28",
            data: [
                { day: '월', hours: 3, date: '12/22' },
                { day: '화', hours: 5, date: '12/23' },
                { day: '수', hours: 2, date: '12/24' },
                { day: '목', hours: 7, date: '12/25' },
                { day: '금', hours: 4, date: '12/26' },
                { day: '토', hours: 0, date: '12/27' },
                { day: '일', hours: 0, date: '12/28' },
            ]
        },
        {
            label: "지난 주",
            dateRange: "12/15 - 12/21",
            data: [
                { day: '월', hours: 2, date: '12/15' },
                { day: '화', hours: 4.5, date: '12/16' },
                { day: '수', hours: 3, date: '12/17' },
                { day: '목', hours: 6, date: '12/18' },
                { day: '금', hours: 5, date: '12/19' },
                { day: '토', hours: 8, date: '12/20' },
                { day: '일', hours: 4, date: '12/21' },
            ]
        },
        {
            label: "2주 전",
            dateRange: "12/08 - 12/14",
            data: [
                { day: '월', hours: 4, date: '12/08' },
                { day: '화', hours: 4, date: '12/09' },
                { day: '수', hours: 5, date: '12/10' },
                { day: '목', hours: 3, date: '12/11' },
                { day: '금', hours: 6, date: '12/12' },
                { day: '토', hours: 5, date: '12/13' },
                { day: '일', hours: 2, date: '12/14' },
            ]
        },
        {
            label: "3주 전",
            dateRange: "12/01 - 12/07",
            data: [
                { day: '월', hours: 6, date: '12/01' },
                { day: '화', hours: 2, date: '12/02' },
                { day: '수', hours: 4, date: '12/03' },
                { day: '목', hours: 5, date: '12/04' },
                { day: '금', hours: 3, date: '12/05' },
                { day: '토', hours: 4, date: '12/06' },
                { day: '일', hours: 1, date: '12/07' },
            ]
        }
    ];

    // Radar Chart Data ( 육각형 스텟 )
    const radarData = [
        { subject: '코딩', value: 85, fullMark: 100 },
        { subject: '운동', value: 65, fullMark: 100 },
        { subject: '수학', value: 70, fullMark: 100 },
        { subject: '관리', value: 90, fullMark: 100 },
        { subject: '분석', value: 75, fullMark: 100 },
        { subject: '테스팅', value: 80, fullMark: 100 },
    ];

    // Monthly Record Data ( 월간 학습 기록 )
    const monthlyRecords = [
        { month: '12월', hours: 142, goal: '달성', status: 'high' },
        { month: '11월', hours: 128, goal: '달성', status: 'high' },
        { month: '10월', hours: 95, goal: '미달', status: 'normal' },
        { month: '9월', hours: 110, goal: '달성', status: 'normal' },
    ];

    const currentWeek = allWeeksData[weekIndex];
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

    // Helper to calculate radar chart points
    const getRadarPoints = (data: any[], radius: number, centerX: number, centerY: number) => {
        return data.map((d, i) => {
            const angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
            const r = (d.value / 100) * radius;
            const x = centerX + r * Math.cos(angle);
            const y = centerY + r * Math.sin(angle);
            return `${x},${y}`;
        }).join(' ');
    };

    const hoursList = weeklyData.map(d => d.hours);
    const maxDataValue = Math.max(...hoursList);
    const minDataValue = Math.min(...hoursList);
    const avgValue = hoursList.reduce((sum, current) => sum + current, 0) / hoursList.length;

    // Y축 스케일을 위해 최대값 조정 (여유 공간 확보)
    const maxScale = Math.ceil(maxDataValue * 1.1) || 10;

    const chartHeight = 180;
    const barWidth = 36;
    const gap = 24;
    const padding = 40;
    const svgWidth = (barWidth + gap) * 7 + padding * 2;
    const svgHeight = chartHeight + padding * 2;

    const avgY = padding + (chartHeight - (avgValue / maxScale) * chartHeight);

    return (
        <MainLayout activeTab="home" hideAvatar={true}>
            <div className="statistics-container">
                <header className="statistics-header">
                    <button className="back-btn" onClick={() => window.history.back()} title="뒤로가기">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
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
                                                <line x1={padding} y1={y} x2={svgWidth - padding} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
                                                <text x={padding - 10} y={y + 4} fill="rgba(255,255,255,0.3)" fontSize="10" textAnchor="end">{Math.round(maxScale * ratio)}h</text>
                                            </g>
                                        );
                                    })}

                                    {/* Average Line */}
                                    <line x1={padding} y1={avgY} x2={svgWidth - padding} y2={avgY} stroke="#7c5cdb" strokeWidth="1.5" strokeDasharray="5,5" opacity="0.6" />

                                    {/* Bars */}
                                    {weeklyData.map((data, index) => {
                                        const barHeight = (data.hours / maxScale) * chartHeight;
                                        const x = padding + index * (barWidth + gap) + gap / 2;
                                        const y = padding + (chartHeight - barHeight);
                                        let barColor = "rgba(124, 92, 219, 0.6)";
                                        if (data.hours === maxDataValue && data.hours > 0) barColor = "rgba(16, 185, 129, 0.7)";
                                        if (data.hours === minDataValue && data.hours > 0) barColor = "rgba(239, 68, 68, 0.7)";

                                        return (
                                            <g key={data.day} className="bar-group">
                                                <rect x={x} y={padding} width={barWidth} height={chartHeight} fill="rgba(255,255,255,0.02)" rx="6" />
                                                <rect className="bar-rect" x={x} y={y} width={barWidth} height={barHeight} fill={barColor} rx="6" />
                                                <text x={x + barWidth / 2} y={svgHeight - padding + 20} fill="rgba(255,255,255,0.6)" fontSize="12" textAnchor="middle">{data.day}</text>
                                                {data.hours > 0 && <text x={x + barWidth / 2} y={y - 8} fill="white" fontSize="10" fontWeight="bold" textAnchor="middle">{data.hours}h</text>}
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
                                <svg viewBox="0 0 200 200" className="radar-chart">
                                    {/* Background Hexagons */}
                                    {[1, 0.8, 0.6, 0.4, 0.2].map((scale) => (
                                        <polygon
                                            key={scale}
                                            points={getRadarPoints(radarData.map(d => ({ ...d, value: 100 * scale })), 80, 100, 100)}
                                            className="radar-grid"
                                        />
                                    ))}
                                    {/* Axis Lines */}
                                    {radarData.map((_, i) => {
                                        const angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
                                        return (
                                            <line
                                                key={i}
                                                x1="100" y1="100"
                                                x2={100 + 80 * Math.cos(angle)}
                                                y2={100 + 80 * Math.sin(angle)}
                                                stroke="rgba(255,255,255,0.1)"
                                            />
                                        );
                                    })}
                                    {/* Data Polygon */}
                                    <polygon
                                        points={getRadarPoints(radarData, 80, 100, 100)}
                                        className="radar-data"
                                    />
                                    {/* Labels */}
                                    {radarData.map((d, i) => {
                                        const angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
                                        const x = 100 + 95 * Math.cos(angle);
                                        const y = 100 + 95 * Math.sin(angle);
                                        return (
                                            <text
                                                key={d.subject}
                                                x={x} y={y}
                                                textAnchor="middle"
                                                className="radar-label"
                                                alignmentBaseline="middle"
                                            >
                                                {d.subject}
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
        </MainLayout>
    );
};


