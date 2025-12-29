import axios from 'axios';
import path from 'node:path';
import fs from 'fs/promises';
import { app } from 'electron';

// AI 판사 캐시 타입
interface JudgeCache {
    [windowTitle: string]: {
        verdict: 'STUDY' | 'DISTRACTION';
        timestamp: number;
    };
}

// 캐시 파일 경로
const getCachePath = (): string => {
    return path.join(app.getPath('userData'), 'judge-cache.json');
};

// 캐시 로드
const loadCache = async (): Promise<JudgeCache> => {
    try {
        const cachePath = getCachePath();
        const data = await fs.readFile(cachePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
};

// 캐시 저장
const saveCache = async (cache: JudgeCache): Promise<void> => {
    try {
        const cachePath = getCachePath();
        await fs.writeFile(cachePath, JSON.stringify(cache, null, 2), 'utf-8');
    } catch (error) {
        console.error('[AIJudge] Failed to save cache:', error);
    }
};

// AI 판사 백엔드 API 호출
const callJudgeAPI = async (windowTitle: string, processName?: string): Promise<'STUDY' | 'DISTRACTION'> => {
    try {
        // 환경 변수에서 API URL 가져오기 (기본값: Gateway를 통해 접근)
        const apiBaseUrl = process.env.AI_JUDGE_API_URL || 'http://localhost:8080';
        const apiUrl = `${apiBaseUrl}/api/v1/judge`;
        
        const requestBody: { window_title: string; process_name?: string } = {
            window_title: windowTitle
        };
        if (processName) {
            requestBody.process_name = processName;
        }
        
        const response = await axios.post(apiUrl, requestBody, {
            timeout: 15000, // 15초 타임아웃
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const verdict = response.data.verdict;
        if (verdict === 'STUDY' || verdict === 'DISTRACTION') {
            console.log(`[AIJudge] API response - verdict: ${verdict}, reason: ${response.data.reason}, confidence: ${response.data.confidence}`);
            return verdict;
        }
        
        // 기본값: 공부로 간주
        return 'STUDY';
    } catch (error: any) {
        console.error('[AIJudge] Judge API error:', error.message);
        if (error.response) {
            console.error('[AIJudge] Response status:', error.response.status);
            console.error('[AIJudge] Response data:', error.response.data);
        }
        // API 실패 시 기본값: 공부로 간주 (보수적 접근)
        return 'STUDY';
    }
};

// AI 판사: 창 제목과 프로세스 이름을 분석하여 공부/오락 판단
export const judgeWindowTitle = async (windowTitle: string, processName?: string): Promise<'STUDY' | 'DISTRACTION'> => {
    // 캐시 키는 창 제목과 프로세스 이름 조합
    const cacheKey = `${windowTitle}||${processName || ''}`;
    
    if (!windowTitle && !processName) {
        return 'STUDY'; // 둘 다 없으면 공부로 간주
    }
    
    // 1. 캐시 확인
    const cache = await loadCache();
    const cached = cache[cacheKey];
    
    // 캐시가 있고 24시간 이내면 캐시 사용
    if (cached && (Date.now() - cached.timestamp) < 24 * 60 * 60 * 1000) {
        console.log(`[AIJudge] Cache hit for: "${cacheKey}" -> ${cached.verdict}`);
        return cached.verdict;
    }
    
    // 2. AI 판단 요청
    console.log(`[AIJudge] Asking AI about: "${windowTitle}" (process: ${processName || 'N/A'})`);
    const verdict = await callJudgeAPI(windowTitle, processName);
    
    // 3. 캐시 저장
    cache[cacheKey] = {
        verdict,
        timestamp: Date.now()
    };
    await saveCache(cache);
    
    console.log(`[AIJudge] Verdict for "${cacheKey}": ${verdict}`);
    return verdict;
};

