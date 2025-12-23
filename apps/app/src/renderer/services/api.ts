
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

export const fetchContributionData = async (year: number): Promise<number[][]> => {
    // Simulate API call for dashboard data
    return new Promise((resolve) => {
        setTimeout(() => {
            const data: number[][] = [];

            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31);

            // 0 = Sunday, 1 = Monday, ...
            const startDay = startDate.getDay();

            // Days in the year
            const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
            const totalDays = isLeap ? 366 : 365;

            let currentWeek: number[] = [];

            // Pad initial week
            for (let i = 0; i < startDay; i++) {
                currentWeek.push(-1); // -1 indicates no day (empty cell)
            }

            for (let i = 1; i <= totalDays; i++) {
                const rand = Math.random();
                let level = 0;
                // Weighted random for realistic "activity"
                if (rand > 0.85) level = 1;         // Low
                else if (rand > 0.92) level = 2;    // Medium
                else if (rand > 0.96) level = 3;    // High
                else if (rand > 0.99) level = 4;    // Very High
                else if (rand > 0.6) level = 0;     // None (often 0)

                currentWeek.push(level);

                if (currentWeek.length === 7) {
                    data.push(currentWeek);
                    currentWeek = [];
                }
            }

            // Pad final week if not complete
            if (currentWeek.length > 0) {
                while (currentWeek.length < 7) {
                    currentWeek.push(-1);
                }
                data.push(currentWeek);
            }

            resolve(data);
        }, 300); // reduced latency
    });
};
