import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRoadmaps } from '../../services/chatApiService';
import './roadmap_list.css';

interface RoadmapItem {
    id: string;  // MongoDB ObjectId는 문자열
    name: string;
    created_at: string;
    items: Array<{
        id: number;  // item의 id는 인덱스 (number 유지)
        day: number;
        content?: string;
        time?: string;
        created_at?: string;
        is_completed?: boolean | number;
        completed_at?: string;
        tasks?: Array<{
            rank: number;
            content: string;
            time: string;
            is_completed?: number;
            completed_at?: string;
            details?: any;
        }>;
    }>;
}

const RoadmapList: React.FC = () => {
    // React Query로 로드맵 목록 가져오기
    const { data: roadmaps = [], isLoading: loading } = useQuery<RoadmapItem[]>({
        queryKey: ['roadmaps'],
        queryFn: () => getRoadmaps(),
        staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    });

    // 진행률 계산 (완료된 일차 / 전체 일차)
    const calculateProgress = (roadmap: RoadmapItem): number => {
        if (!roadmap.items || roadmap.items.length === 0) return 0;

        let completedCount = 0;

        roadmap.items.forEach(item => {
            // 새 구조: tasks 배열이 있는 경우
            if (item.tasks && item.tasks.length > 0) {
                // 모든 task가 완료되었는지 확인
                const allTasksCompleted = item.tasks.every(task => 
                    task.is_completed === 1 || task.is_completed === true
                );
                if (allTasksCompleted && item.tasks.length > 0) {
                    completedCount++;
                }
            } else {
                // 레거시 구조: item 자체에 is_completed가 있는 경우
                if (item.is_completed === true || item.is_completed === 1) {
                    completedCount++;
                }
            }
        });

        const totalCount = roadmap.items.length;
        if (totalCount === 0) return 0;

        return Math.round((completedCount / totalCount) * 100);
    };

    // 로드맵 상태 결정 (진행중/완료)
    const getRoadmapStatus = (roadmap: RoadmapItem): 'in-progress' | 'completed' => {
        const progress = calculateProgress(roadmap);
        return progress >= 100 ? 'completed' : 'in-progress';
    };

    const inProgressItems = roadmaps.filter(item => getRoadmapStatus(item) === 'in-progress');
    const completedItems = roadmaps.filter(item => getRoadmapStatus(item) === 'completed');

    const navigate = useNavigate();

    const handleCardClick = (roadmapId: string) => {
        // Navigate to the detail view with roadmap ID
        navigate(`/roadmap/${roadmapId}`);
    };

    if (loading) {
        return (
            <div className="roadmap-list-container">
                <header className="roadmap-page-header">
                    <h1>로드맵</h1>
                </header>
                <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                    로드맵을 불러오는 중...
                </div>
            </div>
        );
    }

    return (
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
    );
};

export default RoadmapList;
