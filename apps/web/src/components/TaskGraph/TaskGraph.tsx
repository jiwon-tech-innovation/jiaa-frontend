'use client';

import { useState, useEffect } from 'react';
import './TaskGraph.css';

// Generate demo data for the contribution graph
const generateDemoData = () => {
    const weeks: number[][] = [];
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const startDay = startOfYear.getDay();

    // Add empty cells for days before Jan 1st
    let currentWeek: number[] = [];
    for (let i = 0; i < startDay; i++) {
        currentWeek.push(-1);
    }

    // Generate data for each day of the year up to today
    const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));

    for (let d = 0; d <= dayOfYear; d++) {
        // Simulate activity levels (0-4)
        const level = Math.random() > 0.3 ? Math.floor(Math.random() * 5) : 0;
        currentWeek.push(level);

        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    }

    // Push remaining days
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
            currentWeek.push(-1);
        }
        weeks.push(currentWeek);
    }

    return weeks;
};

const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export function TaskGraph() {
    const [data, setData] = useState<number[][]>([]);

    useEffect(() => {
        setData(generateDemoData());
    }, []);

    const year = new Date().getFullYear();

    // Calculate total contributions
    const totalContributions = data.flat().filter(l => l > 0).length;

    // Calculate month positions
    const getMonthLabels = () => {
        const months = [];
        const startDate = new Date(year, 0, 1);
        const startDay = startDate.getDay();
        let daysSum = 0;

        for (let i = 0; i < 12; i++) {
            const weekIndex = Math.floor((daysSum + startDay) / 7);
            months.push({ name: monthNames[i], weekIndex });
            const daysInMonth = new Date(year, i + 1, 0).getDate();
            daysSum += daysInMonth;
        }
        return months;
    };

    const monthLabels = getMonthLabels();

    return (
        <div className="task-graph">
            <div className="task-graph-header">
                <h3>📊 과제 완료 현황</h3>
                <span className="task-count">{totalContributions}개 완료</span>
            </div>
            <div className="task-graph-content">
                <div className="months-row">
                    {monthLabels.slice(0, 12).map((m, i) => (
                        <span key={i} style={{ left: `${m.weekIndex * 14}px` }}>
                            {m.name}
                        </span>
                    ))}
                </div>
                <div className="graph-body">
                    <div className="days-col">
                        <span>월</span>
                        <span>수</span>
                        <span>금</span>
                    </div>
                    <div className="graph-grid">
                        {data.map((week, wIndex) => (
                            <div key={wIndex} className="graph-week">
                                {week.map((level, dIndex) => (
                                    <div
                                        key={`${wIndex}-${dIndex}`}
                                        className={`graph-cell ${level === -1 ? 'empty' : `level-${level}`}`}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="graph-legend">
                    <span>적음</span>
                    <div className="legend-cells">
                        <div className="graph-cell level-0" />
                        <div className="graph-cell level-1" />
                        <div className="graph-cell level-2" />
                        <div className="graph-cell level-3" />
                        <div className="graph-cell level-4" />
                    </div>
                    <span>많음</span>
                </div>
            </div>
        </div>
    );
}
