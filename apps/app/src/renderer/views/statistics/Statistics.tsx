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

    const hoursList = weeklyData.map(d => d.hours);
    const maxDataValue = Math.max(...hoursList);
    const minDataValue = Math.min(...hoursList);
    const avgValue = hoursList.reduce((sum, current) => sum + current, 0) / hoursList.length;

    // Y축 스케일을 위해 최대값 조정 (여유 공간 확보)
    const maxScale = Math.ceil(maxDataValue * 1.1);

    const chartHeight = 200;
    const barWidth = 40;
    const gap = 30;
    const padding = 40;
    const svgWidth = (barWidth + gap) * 7 + padding * 2;
    const svgHeight = chartHeight + padding * 2;

    const avgY = padding + (chartHeight - (avgValue / maxScale) * chartHeight);

    return (
        <MainLayout activeTab="home">
            <div className="statistics-container">
                <header className="statistics-header">
                    <h1>주간 학습 통계</h1>
                </header>
                <div className="statistics-content">
                    <div className="chart-card">
                        <div className="chart-title-row">
                            <h3>
                                {currentWeek.label} ({currentWeek.dateRange})
                            </h3>
                            <div className="week-buttons">
                                <button
                                    onClick={handlePrevWeek}
                                    disabled={weekIndex >= allWeeksData.length - 1}
                                    className="nav-btn"
                                >
                                    &lt;
                                </button>
                                <button
                                    onClick={handleNextWeek}
                                    disabled={weekIndex <= 0}
                                    className="nav-btn"
                                >
                                    &gt;
                                </button>
                            </div>
                        </div>
                        <div className="chart-wrapper">
                            <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="bar-chart">
                                {/* Grid Lines */}
                                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                                    const y = padding + chartHeight * (1 - ratio);
                                    return (
                                        <g key={ratio}>
                                            <line x1={padding} y1={y} x2={svgWidth - padding} y2={y} stroke="rgba(255,255,255,0.1)" strokeDasharray="4" />
                                            <text x={padding - 10} y={y + 4} fill="rgba(255,255,255,0.5)" fontSize="12" textAnchor="end">
                                                {Math.round(maxScale * ratio)}h
                                            </text>
                                        </g>
                                    );
                                })}

                                {/* Average Line */}
                                <g>
                                    <line
                                        x1={padding}
                                        y1={avgY}
                                        x2={svgWidth - padding}
                                        y2={avgY}
                                        stroke="#ff9d00"
                                        strokeWidth="2"
                                        strokeDasharray="5,5"
                                        opacity="0.8"
                                    />
                                    <text x={svgWidth - padding + 5} y={avgY + 4} fill="#ff9d00" fontSize="12" fontWeight="bold">
                                        Avg {avgValue.toFixed(1)}
                                    </text>
                                </g>

                                {/* Bars */}
                                {weeklyData.map((data, index) => {
                                    const barHeight = (data.hours / maxScale) * chartHeight;
                                    const x = padding + index * (barWidth + gap) + gap / 2;
                                    const y = padding + (chartHeight - barHeight);

                                    // Determine Bar Color
                                    let barColor = "#7c5cdb"; // Default Purple
                                    if (data.hours === maxDataValue) barColor = "#10b981"; // Max Green
                                    if (data.hours === minDataValue) barColor = "#ef4444"; // Min Red

                                    return (
                                        <g key={data.day} className="bar-group">
                                            {/* Bar Background */}
                                            <rect
                                                x={x}
                                                y={padding}
                                                width={barWidth}
                                                height={chartHeight}
                                                fill="rgba(255,255,255,0.03)"
                                                rx="4"
                                            />
                                            {/* Data Bar */}
                                            <rect
                                                x={x}
                                                y={y}
                                                width={barWidth}
                                                height={barHeight}
                                                fill={barColor}
                                                rx="4"
                                                style={{ transition: 'all 0.3s ease' }}
                                            />
                                            {/* Labels */}
                                            <text x={x + barWidth / 2} y={svgHeight - padding + 20} fill="white" fontSize="14" fontWeight="bold" textAnchor="middle">
                                                {data.day}
                                            </text>
                                            <text x={x + barWidth / 2} y={y - 8} fill={barColor} fontSize="12" fontWeight="bold" textAnchor="middle">
                                                {data.hours}h
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};


