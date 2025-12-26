import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../components/MainLayout/MainLayout';
import { getRoadmaps } from '../../services/chatApiService';
import './roadmap_list.css';

interface RoadmapItem {
    id: number;
    name: string;
    created_at: string;
    items: Array<{
        day: number;
        content: string;
        time: string;
        timestamp?: string;
    }>;
}

const RoadmapList: React.FC = () => {
    const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRoadmaps();
    }, []);

    const loadRoadmaps = async () => {
        try {
            setLoading(true);
            // TODO: user_id가 필요하면 추가
            const data = await getRoadmaps();
            setRoadmaps(data);
        } catch (error) {
            console.error('로드맵 목록 로드 오류:', error);
        } finally {
            setLoading(false);
        }
    };

    // 진행률 계산 (완료된 일차 / 전체 일차)
    const calculateProgress = (roadmap: RoadmapItem): number => {
        if (!roadmap.items || roadmap.items.length === 0) return 0;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // 첫 번째 항목의 timestamp를 기준으로 계산
        if (roadmap.items[0].timestamp) {
            const startDate = new Date(roadmap.items[0].timestamp);
            startDate.setHours(0, 0, 0, 0);
            
            const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const totalDays = roadmap.items.length;
            
            if (daysDiff < 0) return 0; // 아직 시작 전
            if (daysDiff >= totalDays) return 100; // 모두 완료
            
            return Math.round((daysDiff / totalDays) * 100);
        }
        
        return 0;
    };

    // 로드맵 상태 결정 (진행중/완료)
    const getRoadmapStatus = (roadmap: RoadmapItem): 'in-progress' | 'completed' => {
        const progress = calculateProgress(roadmap);
        return progress >= 100 ? 'completed' : 'in-progress';
    };

    const inProgressItems = roadmaps.filter(item => getRoadmapStatus(item) === 'in-progress');
    const completedItems = roadmaps.filter(item => getRoadmapStatus(item) === 'completed');

    const handleCardClick = (roadmapId: number) => {
        // Navigate to the detail view with roadmap ID
        window.location.href = `../roadmap/roadmap.html?id=${roadmapId}`;
    };

    if (loading) {
        return (
            <MainLayout activeTab="roadmap" hideAvatar={true}>
                <div className="roadmap-list-container">
                    <header className="roadmap-page-header">
                        <h1>로드맵</h1>
                    </header>
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                        로드맵을 불러오는 중...
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout activeTab="roadmap" hideAvatar={true}>
            <div className="roadmap-list-container">
                <header className="roadmap-page-header">
                    <h1>로드맵</h1>
                </header>

                {/* In Progress Section */}
                <section className="roadmap-section">
                    <h2 className="section-title">현재 진행</h2>
                    {inProgressItems.length > 0 ? (
                        <div className="roadmap-grid">
                            {inProgressItems.map(item => {
                                const progress = calculateProgress(item);
                                return (
                                    <div
                                        key={item.id}
                                        className="roadmap-card-item"
                                        onClick={() => handleCardClick(item.id)}
                                    >
                                        <div className="card-content">
                                            <div className="card-title">{item.name}</div>
                                            <div className="card-meta">진행중 • {progress}%</div>
                                            <div className="card-progress">
                                                <div className="card-progress-bar" style={{ width: `${progress}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                            진행 중인 로드맵이 없습니다.
                        </div>
                    )}
                </section>

                {/* Completed Section */}
                <section className="roadmap-section">
                    <h2 className="section-title">완료</h2>
                    {completedItems.length > 0 ? (
                        <div className="roadmap-grid">
                            {completedItems.map(item => (
                                <div
                                    key={item.id}
                                    className="roadmap-card-item completed"
                                    onClick={() => handleCardClick(item.id)}
                                >
                                    <div className="card-content">
                                        <div className="card-title">{item.name}</div>
                                        <div className="card-meta">완료됨 • 100%</div>
                                        <div className="card-progress">
                                            <div className="card-progress-bar" style={{ width: '100%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                            완료된 로드맵이 없습니다.
                        </div>
                    )}
                </section>
            </div>
        </MainLayout>
    );
};

export default RoadmapList;
