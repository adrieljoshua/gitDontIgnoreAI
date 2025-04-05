/**
 * Fetches data from an API using a GitHub username
 * @param username GitHub username to fetch data for
 * @returns The API response as JSON
 */
export async function addCollaborator(username: string,projectName: string,moduleName: string) {
    // Replace this URL with your actual API endpoint
    const apiUrl = 'http://localhost:8000/execute';
    
    try {
        let prompt = "Add "+ username + " as a collaborator to the repository "+ projectName + " on GitHub."
        let response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input: prompt }),
        });
        prompt = "Create a new branch named "+moduleName+"-"+username+" in the repository "+ projectName + " on GitHub. "
        response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input: prompt }),
        });
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching GitHub user data:', error);
        throw error;
    }
}

/**
 * Creates a pull request from a specified branch to the main branch on GitHub.
 * 
 * This function sends a request to a local API endpoint that handles the GitHub pull request creation process.
 * The API is expected to create a pull request that merges the specified branch into the main branch
 * of the specified repository on GitHub.
 *
 * @param projectName - The name of the GitHub repository where the pull request should be created
 * @param branchName - The name of the source branch to create the pull request from
 * @returns A Promise that resolves to the JSON response from the API containing pull request details
 * @throws Will throw an error if the API request fails or returns a non-OK status code
 * @example
 * // Create a pull request from feature-branch to main
 * const prDetails = await createPullRequest('my-repo', 'feature-branch');
 */
export async function createPullRequest(projectName: string, branchName: string, description: string) {
    const apiUrl = 'http://localhost:8000/execute';
    
    try {
        const prompt = `Create a pull request from branch ${branchName} to the main branch in the repository ${projectName} on GitHub with the following description: "${description}"`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input: prompt }),
        });
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error creating pull request:', error);
        throw error;
    }
}

/**
 * Creates an issue in a GitHub repository
 * @param projectName The name of the repository
 * @param branchName The branch related to the issue
 * @param description The description of the issue
 * @returns The API response as JSON
 */
export async function createIssue(projectName: string, branchName: string, description: string) {
    const apiUrl = 'http://localhost:8000/execute';
    
    try {
        const prompt = `Create a new issue in the GitHub repository ${projectName} with title "Issue related to ${branchName}" and the following description: "${description}"`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input: prompt }),
        });
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error creating issue:', error);
        throw error;
    }
}

