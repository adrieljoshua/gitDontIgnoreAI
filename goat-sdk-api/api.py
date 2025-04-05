import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, TypedDict, List
import aiohttp

from plugins.vercel.goat_plugins.vercel import VercelPlugin
from plugins.vercel.goat_plugins.vercel.options import VercelPluginOptions

# Load environment variables
load_dotenv()

from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate

from adapters.langchain.goat_adapters.langchain.adapter import get_on_chain_tools
from plugins.github.goat_plugins.github.options import GitHubPluginOptions
from plugins.github.goat_plugins.github.parameters import (
    CreateRepositoryParameters,
    CreateBranchParameters,
    ListRepositoriesParameters,
    AddCollaboratorParameters,
    RemoveCollaboratorParameters,
    CreateIssueParameters,
    CreatePullRequestParameters,
    MergePullRequestParameters
)
from goat.classes.wallet_client_base import WalletClientBase
from goat.types.chain import Chain, EvmChain
from goat.decorators.tool import Tool
from goat.classes.plugin_base import PluginBase

# Create a dummy wallet client for the GitHub plugin
class DummyWalletClient(WalletClientBase):
    def __init__(self):
        self.address = "0x0000000000000000000000000000000000000000"
        self.chain: Chain = EvmChain(
            type="evm",
            id=1
        )

    def get_address(self) -> str:
        return self.address

    def get_chain(self) -> Chain:
        return self.chain

    def sign_message(self, message: str) -> TypedDict:
        return {"signature": "0x" + "0" * 130}

    def balance_of(self, address: str) -> TypedDict:
        return {
            "decimals": 18,
            "symbol": "DUMMY",
            "name": "Dummy Token",
            "value": "0",
            "in_base_units": "0"
        }

# Create a GitHub service class with tool methods
class GitHubService:
    BASE_URL = "https://api.github.com"
    
    def __init__(self, options: GitHubPluginOptions):
        self.options = options
        # Ensure token starts with 'github_pat_' for fine-grained tokens
        token = options.access_token
        if not token.startswith('github_pat_'):
            print(f"Warning: Token format may be incorrect. Expected 'github_pat_' prefix.")
        
        self.headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json"
        }
        print(f"Using GitHub token with prefix: {token[:10]}...")  # Only print first 10 chars for security

    @Tool({
        "description": "Create a new GitHub repository with a main branch. This is a complete repository creation that includes initializing the repository with a main branch.",
        "parameters_schema": CreateRepositoryParameters
    })
    async def create_repository(self, wallet: WalletClientBase, parameters: dict) -> dict:
        """Create a new GitHub repository with a main branch."""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.BASE_URL}/user/repos"
                data = {
                    "name": parameters["name"],
                    "private": parameters.get("private", False),
                    "auto_init": True  # This ensures a main branch is created
                }
                if "description" in parameters:
                    data["description"] = parameters["description"]

                print(f"Attempting to create repository with data: {data}")
                async with session.post(url, headers=self.headers, json=data) as response:
                    response_text = await response.text()
                    print(f"GitHub API response status: {response.status}")
                    print(f"GitHub API response: {response_text}")
                    
                    if not response.ok:
                        raise Exception(f"HTTP error! status: {response.status} {response_text}")
                    return await response.json()
        except Exception as error:
            print(f"Error creating repository: {error}")
            raise Exception(f"Failed to create repository: {error}")

    @Tool({
        "description": "List all repositories for the authenticated user",
        "parameters_schema": ListRepositoriesParameters
    })
    async def list_repositories(self, wallet: WalletClientBase, parameters: dict) -> List[dict]:
        """List all repositories for the authenticated user."""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.BASE_URL}/user/repos"
                async with session.get(url, headers=self.headers) as response:
                    if not response.ok:
                        raise Exception(f"HTTP error! status: {response.status} {await response.text()}")
                    return await response.json()
        except Exception as error:
            raise Exception(f"Failed to list repositories: {error}")

    @Tool({
        "description": "Create a new branch in a GitHub repository",
        "parameters_schema": CreateBranchParameters
    })
    async def create_branch(self, wallet: WalletClientBase, parameters: dict) -> dict:
        """Create a new branch in a repository."""
        try:
            async with aiohttp.ClientSession() as session:
                # Get the SHA of the base branch
                url = f"{self.BASE_URL}/repos/{self.options.username}/{parameters['repo_name']}/git/refs/heads/{parameters.get('base_branch', 'main')}"
                async with session.get(url, headers=self.headers) as response:
                    if not response.ok:
                        raise Exception(f"HTTP error! status: {response.status} {await response.text()}")
                    base_sha = (await response.json())["object"]["sha"]

                # Create the new branch
                url = f"{self.BASE_URL}/repos/{self.options.username}/{parameters['repo_name']}/git/refs"
                data = {
                    "ref": f"refs/heads/{parameters['branch_name']}",
                    "sha": base_sha
                }
                async with session.post(url, headers=self.headers, json=data) as response:
                    if not response.ok:
                        raise Exception(f"HTTP error! status: {response.status} {await response.text()}")
                    return await response.json()
        except Exception as error:
            raise Exception(f"Failed to create branch: {error}")

    @Tool({
        "description": "Add a collaborator to a repository with specific permissions",
        "parameters_schema": AddCollaboratorParameters
    })
    async def add_collaborator(self, wallet: WalletClientBase, parameters: dict) -> dict:
        """Add a collaborator to a repository."""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.BASE_URL}/repos/{self.options.username}/{parameters['repo_name']}/collaborators/{parameters['username']}"
                data = {
                    "permission": parameters.get('permission', 'push')
                }
                
                print(f"Attempting to add collaborator with data: {data}")
                async with session.put(url, headers=self.headers, json=data) as response:
                    response_text = await response.text()
                    print(f"GitHub API response status: {response.status}")
                    print(f"GitHub API response: {response_text}")
                    
                    if not response.ok:
                        raise Exception(f"HTTP error! status: {response.status} {response_text}")
                    return {"status": "success", "message": f"Added {parameters['username']} as collaborator"}
        except Exception as error:
            print(f"Error adding collaborator: {error}")
            raise Exception(f"Failed to add collaborator: {error}")

    @Tool({
        "description": "Remove a collaborator from a repository",
        "parameters_schema": RemoveCollaboratorParameters
    })
    async def remove_collaborator(self, wallet: WalletClientBase, parameters: dict) -> dict:
        """Remove a collaborator from a repository."""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.BASE_URL}/repos/{self.options.username}/{parameters['repo_name']}/collaborators/{parameters['username']}"
                
                print(f"Attempting to remove collaborator")
                async with session.delete(url, headers=self.headers) as response:
                    response_text = await response.text()
                    print(f"GitHub API response status: {response.status}")
                    print(f"GitHub API response: {response_text}")
                    
                    if not response.ok:
                        raise Exception(f"HTTP error! status: {response.status} {response_text}")
                    return {"status": "success", "message": f"Removed {parameters['username']} as collaborator"}
        except Exception as error:
            print(f"Error removing collaborator: {error}")
            raise Exception(f"Failed to remove collaborator: {error}")

    @Tool({
        "description": "Create a new issue in a GitHub repository",
        "parameters_schema": CreateIssueParameters
    })
    async def create_issue(self, wallet: WalletClientBase, parameters: dict) -> dict:
        """Create a new issue in a repository."""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.BASE_URL}/repos/{self.options.username}/{parameters['repo_name']}/issues"
                data = {
                    "title": parameters["title"],
                    "body": parameters["body"],
                    "labels": parameters.get("labels", [])  # Ensure labels is always an array
                }

                print(f"Attempting to create issue with data: {data}")
                async with session.post(url, headers=self.headers, json=data) as response:
                    response_text = await response.text()
                    print(f"GitHub API response status: {response.status}")
                    print(f"GitHub API response: {response_text}")
                    
                    if not response.ok:
                        raise Exception(f"HTTP error! status: {response.status} {response_text}")
                    return await response.json()
        except Exception as error:
            print(f"Error creating issue: {error}")
            raise Exception(f"Failed to create issue: {error}")

    @Tool({
        "description": "Create a new pull request in a GitHub repository",
        "parameters_schema": CreatePullRequestParameters
    })
    async def create_pull_request(self, wallet: WalletClientBase, parameters: dict) -> dict:
        """Create a new pull request in a repository."""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.BASE_URL}/repos/{self.options.username}/{parameters['repo_name']}/pulls"
                data = {
                    "title": parameters["title"],
                    "body": parameters["body"],
                    "head": parameters["head"],
                    "base": parameters.get("base", "main")
                }

                print(f"Attempting to create pull request with data: {data}")
                async with session.post(url, headers=self.headers, json=data) as response:
                    response_text = await response.text()
                    print(f"GitHub API response status: {response.status}")
                    print(f"GitHub API response: {response_text}")
                    
                    if not response.ok:
                        raise Exception(f"HTTP error! status: {response.status} {response_text}")
                    return await response.json()
        except Exception as error:
            print(f"Error creating pull request: {error}")
            raise Exception(f"Failed to create pull request: {error}")

    @Tool({
        "description": "Merge a pull request in a GitHub repository",
        "parameters_schema": MergePullRequestParameters
    })
    async def merge_pull_request(self, wallet: WalletClientBase, parameters: dict) -> dict:
        """Merge a pull request in a repository."""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.BASE_URL}/repos/{self.options.username}/{parameters['repo_name']}/pulls/{parameters['pull_number']}/merge"
                data = {
                    "merge_method": parameters.get("merge_method", "merge")
                }
                if "commit_title" in parameters:
                    data["commit_title"] = parameters["commit_title"]
                if "commit_message" in parameters:
                    data["commit_message"] = parameters["commit_message"]

                print(f"Attempting to merge pull request with data: {data}")
                async with session.put(url, headers=self.headers, json=data) as response:
                    response_text = await response.text()
                    print(f"GitHub API response status: {response.status}")
                    print(f"GitHub API response: {response_text}")
                    
                    if not response.ok:
                        raise Exception(f"HTTP error! status: {response.status} {response_text}")
                    return await response.json()
        except Exception as error:
            print(f"Error merging pull request: {error}")
            raise Exception(f"Failed to merge pull request: {error}")

# Create a proper GitHub plugin class
class GitHubPlugin(PluginBase[WalletClientBase]):
    def __init__(self, options: GitHubPluginOptions):
        super().__init__("github", [GitHubService(options)])

    def supports_chain(self, chain: Chain) -> bool:
        # GitHub plugin supports all chains since it's not chain-specific
        return True

app = FastAPI(title="GitHub Plugin API")

# Initialize LLM and tools
llm = ChatOpenAI(model="gpt-4o-mini")

# Get the prompt template
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant that can help with GitHub operations"),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

# Initialize tools with GitHub and Vercel plugins
wallet = DummyWalletClient()

# Initialize GitHub plugin
github_plugin = GitHubPlugin(GitHubPluginOptions(
    access_token=os.getenv('GITHUB_ACCESS_TOKEN'),
    username=os.getenv('GITHUB_USERNAME', 'philotheephilix')
))

# Initialize Vercel plugin
vercel_plugin = VercelPlugin(VercelPluginOptions(
    access_token=os.getenv('VERCEL_ACCESS_TOKEN'),
    team_id=os.getenv('VERCEL_TEAM_ID')
))

tools = get_on_chain_tools(
    wallet=wallet,
    plugins=[github_plugin, vercel_plugin]
)

agent = create_tool_calling_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, handle_parsing_errors=True, verbose=True)

class GitHubRequest(BaseModel):
    input: str
    chat_history: Optional[list] = None

@app.post("/execute")
async def execute_github_operation(request: GitHubRequest):
    """
    Execute a GitHub operation using the plugin.
    The input should be a natural language request for a GitHub operation.
    """
    response = agent_executor.invoke({
        "input": request.input,
        "chat_history": request.chat_history or [],
    })
    return {"output": response["output"]}

@app.get("/tools")
async def list_available_tools():
    """
    List all available GitHub tools from the plugin.
    """
    try:
        tool_descriptions = []
        for tool in tools:
            tool_descriptions.append({
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.parameters.model_json_schema() if hasattr(tool.parameters, 'model_json_schema') else tool.parameters
            })
        return {"tools": tool_descriptions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)