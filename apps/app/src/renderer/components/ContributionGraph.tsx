
import React from 'react';

interface ContributionGraphProps {
    data: number[][];
    years: number[];
    selectedYear: number;
    onSelectYear: (year: number) => void;
}

const getMonthLabels = (year: number) => {
    const months = [];
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

    const startDate = new Date(year, 0, 1);
    // 0 = Sunday
    const startDay = startDate.getDay();

    // We need to track the cumulative days to find week index
    // Week index = floor((DayOfYear + StartDay) / 7)

    let daysSum = 0;
    for (let i = 0; i < 12; i++) {
        // Calculate week index for the 1st of this month
        // DayOfYear for 1st of month i is daysSum
        const weekIndex = Math.floor((daysSum + startDay) / 7);

        months.push({ name: monthNames[i], weekIndex });

        // Add days in this month to sum for next iteration
        const daysInMonth = new Date(year, i + 1, 0).getDate();
        daysSum += daysInMonth;
    }
    return months;
};

export const ContributionGraph: React.FC<ContributionGraphProps> = ({ data, years, selectedYear, onSelectYear }) => {
    const monthLabels = getMonthLabels(selectedYear);

    return (
        <div className="contribution-wrapper">
            <div className="contribution-container">
                <div className="months-label" style={{ position: 'relative', height: '15px', display: 'block' }}>
                    {monthLabels.map((m) => (
                        <span
                            key={m.name}
                            style={{
                                position: 'absolute',
                                left: `${m.weekIndex * 14}px`, // 11px width + 3px gap
                                fontSize: '10px'
                            }}
                        >
                            {m.name}
                        </span>
                    ))}
                </div>
                <div className="graph-area">
                    <ul className="days-label">
                        <li>일</li>
                        <li>월</li>
                        <li>화</li>
                        <li>수</li>
                        <li>목</li>
                        <li>금</li>
                        <li>토</li>
                    </ul>
                    <div className="contribution-grid">
                        {data.map((week, wIndex) => (
                            <div key={wIndex} className="grid-week">
                                {week.map((level, dIndex) => (
                                    <div
                                        key={`${wIndex}-${dIndex}`}
                                        className={`grid-cell level-${level}`}
                                        style={level === -1 ? { backgroundColor: 'transparent', border: '1px solid transparent' } : {}}
                                    ></div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="year-list">
                {years.map(year => (
                    <button
                        key={year}
                        className={`year-item ${selectedYear === year ? 'active' : ''}`}
                        onClick={() => onSelectYear(year)}
                    >
                        {year}
                    </button>
                ))}
            </div>
        </div>
    );
};
