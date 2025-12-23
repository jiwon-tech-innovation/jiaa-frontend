
import React from 'react';

interface ContributionGraphProps {
    data: number[][];
    years: number[];
    selectedYear: number;
    onSelectYear: (year: number) => void;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const ContributionGraph: React.FC<ContributionGraphProps> = ({ data, years, selectedYear, onSelectYear }) => {
    return (
        <div className="contribution-wrapper">
            <div className="contribution-container">
                <div className="months-label">
                    {months.map(m => <span key={m}>{m}</span>)}
                </div>
                <div className="graph-area">
                    <ul className="days-label">
                        <li>Mon</li>
                        <li>Wed</li>
                        <li>Fri</li>
                    </ul>
                    <div className="contribution-grid">
                        {data.map((week, wIndex) => (
                            <div key={wIndex} className="grid-week">
                                {week.map((level, dIndex) => (
                                    <div key={`${wIndex}-${dIndex}`} className={`grid-cell level-${level}`}></div>
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
