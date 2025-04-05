import { NextApiRequest, NextApiResponse } from 'next';

// Simulate a delay to make it feel like analysis is happening
const simulateDelay = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            const { githubUsername } = req.body;

            if (!githubUsername) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'GitHub username is required' 
                });
            }

            console.log(`Analyzing GitHub account for: ${githubUsername}`);
            
            // Simulate analysis time
            await simulateDelay(1500);
            
            // Return fixed score of 67 for all GitHub usernames
            const analysisResult = {
                username: githubUsername,
                score: 80,
                scoreBreakdown: {
                    codeQuality: 70,
                    projectActivity: 65,
                    communityEngagement: 68
                },
                analysisDate: new Date().toISOString()
            };

            return res.status(200).json({
                success: true,
                result: analysisResult
            });
            
        } catch (error) {
            console.error('Error analyzing GitHub account:', error);
            return res.status(500).json({
                success: false,
                message: 'Error analyzing GitHub account',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
} 