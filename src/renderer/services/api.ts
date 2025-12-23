
// Mock API Service

interface SigninResponse {
    accessToken: string;
    refreshToken: string;
    email: string;
}

export const signin = async ({ email, password }: { email: string; password?: string }): Promise<SigninResponse> => {
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                accessToken: 'mock-access-token-' + Date.now(),
                refreshToken: 'mock-refresh-token-' + Date.now(),
                email: email,
            });
        }, 800);
    });
};

export const fetchContributionData = async (): Promise<number[][]> => {
    // Simulate API call for dashboard data
    return new Promise((resolve) => {
        setTimeout(() => {
            const data: number[][] = [];
            const totalWeeks = 53;
            for (let i = 0; i < totalWeeks; i++) {
                const week: number[] = [];
                for (let j = 0; j < 7; j++) {
                    const rand = Math.random();
                    let level = 0;
                    if (rand > 0.85) level = 1;
                    else if (rand > 0.92) level = 2;
                    else if (rand > 0.96) level = 3;
                    else if (rand > 0.99) level = 4;
                    week.push(level);
                }
                data.push(week);
            }
            resolve(data);
        }, 500);
    });
};
