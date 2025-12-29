
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

    // 그리드 시작일: 해당 년도 1월 1일이 속한 주의 일요일
    const startOfYear = new Date(year, 0, 1);
    const startDay = startOfYear.getDay(); // 0 = Sunday
    const gridStartDate = new Date(year, 0, 1 - startDay);

    for (let i = 0; i < 12; i++) {
        // 각 월의 첫째 날
        const firstOfMonth = new Date(year, i, 1);
        // 그리드 시작일로부터 경과한 일수
        const daysSinceGridStart = Math.floor((firstOfMonth.getTime() - gridStartDate.getTime()) / (1000 * 60 * 60 * 24));
        // 주 인덱스 계산
        const weekIndex = Math.floor(daysSinceGridStart / 7);

        months.push({ name: monthNames[i], weekIndex });
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
                                left: `${m.weekIndex * 16}px`, // 13px cell + 3px gap
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
