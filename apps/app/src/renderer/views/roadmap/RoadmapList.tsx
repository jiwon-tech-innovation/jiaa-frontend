import React from 'react';
import { MainLayout } from '../../components/MainLayout/MainLayout';
import './roadmap_list.css';

interface RoadmapItem {
    id: number;
    title: string;
    status: 'in-progress' | 'completed';
}

const RoadmapList: React.FC = () => {
    // Mock data based on the requirement
    const roadmaps: RoadmapItem[] = [
        { id: 1, title: 'Roadmap 1', status: 'in-progress' },
        { id: 2, title: 'Roadmap 2', status: 'in-progress' },
        { id: 3, title: 'Roadmap 3', status: 'in-progress' },
        { id: 4, title: 'Roadmap 4', status: 'completed' },
    ];

    const inProgressItems = roadmaps.filter(item => item.status === 'in-progress');
    const completedItems = roadmaps.filter(item => item.status === 'completed');

    const handleCardClick = () => {
        // Navigate to the detail view
        window.location.href = './roadmap.html';
    };

    return (
        <MainLayout activeTab="roadmap" hideAvatar={true}>
            <div className="roadmap-list-container">
                <header className="roadmap-page-header">
                    <h1>로드맵</h1>
                </header>

                {/* In Progress Section */}
                <section className="roadmap-section">
                    <h2 className="section-title">현재 진행</h2>
                    <div className="roadmap-grid">
                        {inProgressItems.map(item => (
                            <div
                                key={item.id}
                                className="roadmap-card-item"
                                onClick={handleCardClick}
                            >
                                <div className="card-content">
                                    <div className="card-title">{item.title}</div>
                                    <div className="card-meta">진행중 • 45%</div>
                                    <div className="card-progress">
                                        <div className="card-progress-bar" style={{ width: '45%' }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Completed Section */}
                <section className="roadmap-section">
                    <h2 className="section-title">완료</h2>
                    <div className="roadmap-grid">
                        {completedItems.map(item => (
                            <div
                                key={item.id}
                                className="roadmap-card-item completed"
                                onClick={handleCardClick}
                            >
                                <div className="card-content">
                                    <div className="card-title">{item.title}</div>
                                    <div className="card-meta">완료됨 • 100%</div>
                                    <div className="card-progress">
                                        <div className="card-progress-bar" style={{ width: '100%' }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </MainLayout>
    );
};

export default RoadmapList;
