"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import Navbar from "@/components/navbar"

type Developer = {
  id: string
  name: string
  efficiency: number
  wallet: string
}

type CollaborationRequest = {
  id: string
  developer: Developer
  modules: string[]
  bid: number
}

type Module = {
  id: string
  name: string
  status: string
  developer: string | null
  submodules: Submodule[]
}

type Submodule = {
  id: string
  name: string
  status: string
}

type Project = {
  id: string
  title: string
  tagline: string
  description: string
  totalFund: number
  allocatedFund: number
  availableFund: number
  developers: Developer[]
  collaborationRequests: CollaborationRequest[]
  modules: Module[]
}

type ProjectsData = {
  [key: string]: Project
}

// Mock project data
const projectsData: ProjectsData = {
  "1": {
    id: "1",
    title: "E-commerce Platform",
    tagline: "A modern online shopping experience",
    description:
      "Building a scalable e-commerce platform with advanced search and recommendation features. The platform will include user authentication, product catalog, shopping cart, payment processing, and order management.",
    totalFund: 15000,
    allocatedFund: 8000,
    availableFund: 7000,
    developers: [
      { id: "d1", name: "Alice Johnson", efficiency: 95, wallet: "0x1234...5678" },
      { id: "d2", name: "Bob Smith", efficiency: 88, wallet: "0x8765...4321" },
    ],
    collaborationRequests: [
      {
        id: "r1",
        developer: { id: "d3", name: "Charlie Brown", efficiency: 92, wallet: "0x2345...6789" },
        modules: ["Payment Gateway"],
        bid: 2000,
      },
      {
        id: "r2",
        developer: { id: "d4", name: "Diana Prince", efficiency: 97, wallet: "0x3456...7890" },
        modules: ["User Authentication", "Product Search"],
        bid: 3500,
      },
    ],
    modules: [
      {
        id: "m1",
        name: "User Authentication",
        status: "Completed",
        developer: "d1",
        submodules: [
          { id: "sm1", name: "Registration", status: "Completed" },
          { id: "sm2", name: "Login", status: "Completed" },
          { id: "sm3", name: "Password Reset", status: "Completed" },
        ],
      },
      {
        id: "m2",
        name: "Product Catalog",
        status: "In Progress",
        developer: "d2",
        submodules: [
          { id: "sm4", name: "Product Listing", status: "Completed" },
          { id: "sm5", name: "Product Details", status: "In Progress" },
          { id: "sm6", name: "Product Search", status: "Not Started" },
        ],
      },
      {
        id: "m3",
        name: "Shopping Cart",
        status: "Not Started",
        developer: null,
        submodules: [
          { id: "sm7", name: "Add to Cart", status: "Not Started" },
          { id: "sm8", name: "Update Quantity", status: "Not Started" },
          { id: "sm9", name: "Remove Items", status: "Not Started" },
        ],
      },
      {
        id: "m4",
        name: "Payment Gateway",
        status: "Not Started",
        developer: null,
        submodules: [
          { id: "sm10", name: "Credit Card Processing", status: "Not Started" },
          { id: "sm11", name: "PayPal Integration", status: "Not Started" },
        ],
      },
      {
        id: "m5",
        name: "Order Management",
        status: "Not Started",
        developer: null,
        submodules: [
          { id: "sm12", name: "Order Creation", status: "Not Started" },
          { id: "sm13", name: "Order Tracking", status: "Not Started" },
          { id: "sm14", name: "Order History", status: "Not Started" },
        ],
      },
    ],
  },
  // Additional projects would be defined here
}

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  const project = projectsData[projectId]

  const [activeTab, setActiveTab] = useState("overview")
  const [showVerification, setShowVerification] = useState(false)
  const [verificationResults, setVerificationResults] = useState<string[]>([])

  const handleAcceptBid = (requestId: string) => {
    alert(`Bid ${requestId} accepted!`)
    // In a real app, this would update the project state
  }

  const handleRejectBid = (requestId: string) => {
    alert(`Bid ${requestId} rejected!`)
    // In a real app, this would update the project state
  }

  const handleMarkAsDone = () => {
    setShowVerification(true)
    // Simulate verification process
    setTimeout(() => {
      setVerificationResults([
        "✅ Code quality check passed",
        "✅ Unit tests passed",
        "✅ Integration tests passed",
        "✅ Performance benchmarks met",
        "✅ Documentation complete",
      ])
    }, 2000)
  }

  if (!project) {
    return <div>Project not found</div>
  }

  return (
    <div className="flex min-h-screen flex-col bg-dark-900">
      <Navbar />
      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{project.title}</h1>
          <p className="text-gray-400">{project.tagline}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-dark-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
              Overview
            </TabsTrigger>
            <TabsTrigger value="modules" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
              Modules
            </TabsTrigger>
            <TabsTrigger value="collaboration" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
              Collaboration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 bg-dark-800 border-dark-700">
                <CardHeader>
                  <CardTitle className="text-white">Project Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">{project.description}</p>
                </CardContent>
              </Card>

              <Card className="bg-dark-800 border-dark-700">
                <CardHeader>
                  <CardTitle className="text-white">Project Funds</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-300">Total: ${project.totalFund}</span>
                      <span className="text-sm font-medium text-gray-300">100%</span>
                    </div>
                    <Progress value={100} className="h-2 bg-dark-700" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-300">Allocated: ${project.allocatedFund}</span>
                      <span className="text-sm font-medium text-gray-300">
                        {Math.round((project.allocatedFund / project.totalFund) * 100)}%
                      </span>
                    </div>
                    <Progress value={(project.allocatedFund / project.totalFund) * 100} className="h-2 bg-dark-700" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-300">Available: ${project.availableFund}</span>
                      <span className="text-sm font-medium text-gray-300">
                        {Math.round((project.availableFund / project.totalFund) * 100)}%
                      </span>
                    </div>
                    <Progress value={(project.availableFund / project.totalFund) * 100} className="h-2 bg-dark-700" />
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-3 bg-dark-800 border-dark-700">
                <CardHeader>
                  <CardTitle className="text-white">Developers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {project.developers.map((dev: Developer) => (
                      <div key={dev.id} className="flex items-center justify-between p-3 border border-dark-600 rounded-lg bg-dark-700">
                        <div>
                          <p className="font-medium text-white">{dev.name}</p>
                          <p className="text-sm text-gray-400">Wallet: {dev.wallet}</p>
                        </div>
                        <Badge className="bg-green-500">{dev.efficiency}% Efficiency</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="modules" className="mt-6">
            <div className="space-y-6">
              {project.modules.map((module: Module) => (
                <Card key={module.id} className="bg-dark-800 border-dark-700">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-white">{module.name}</CardTitle>
                      <Badge
                        className={
                          module.status === "Completed"
                            ? "bg-green-500"
                            : module.status === "In Progress"
                              ? "bg-yellow-500 text-black"
                              : "bg-gray-500"
                        }
                      >
                        {module.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2 text-gray-300">Submodules</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {module.submodules.map((submodule: Submodule) => (
                            <div key={submodule.id} className="flex justify-between items-center p-2 border border-dark-600 rounded bg-dark-700">
                              <span className="text-gray-300">{submodule.name}</span>
                              <Badge
                                className={
                                  submodule.status === "Completed"
                                    ? "bg-green-500"
                                    : submodule.status === "In Progress"
                                      ? "bg-yellow-500 text-black"
                                      : "bg-gray-500"
                                }
                              >
                                {submodule.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {module.status === "In Progress" && (
                        <div className="flex justify-end">
                          <Button onClick={handleMarkAsDone} className="bg-yellow-500 text-black hover:bg-yellow-400">
                            Mark as Done
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {showVerification && (
              <Card className="mt-6 bg-dark-800 border-dark-700">
                <CardHeader>
                  <CardTitle className="text-white">Verification Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {verificationResults.map((result, index) => (
                      <div key={index} className="flex items-center gap-2 text-gray-300">
                        {result}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="collaboration" className="mt-6">
            <div className="space-y-6">
              <Card className="bg-dark-800 border-dark-700">
                <CardHeader>
                  <CardTitle className="text-white">Collaboration Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {project.collaborationRequests.map((request: CollaborationRequest) => (
                      <div key={request.id} className="border border-dark-600 rounded-lg p-4 bg-dark-700">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-medium text-white">{request.developer.name}</h3>
                            <p className="text-sm text-gray-400">Wallet: {request.developer.wallet}</p>
                            <Badge className="mt-2 bg-green-500">{request.developer.efficiency}% Efficiency</Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-white">${request.bid}</p>
                            <p className="text-sm text-gray-400">Bid Amount</p>
                          </div>
                        </div>
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Requested Modules:</h4>
                          <div className="flex flex-wrap gap-2">
                            {request.modules.map((moduleName: string) => (
                              <Badge key={moduleName} className="bg-dark-600 text-gray-300">
                                {moduleName}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                            onClick={() => handleRejectBid(request.id)}
                          >
                            Reject
                          </Button>
                          <Button
                            className="bg-green-500 text-white hover:bg-green-600"
                            onClick={() => handleAcceptBid(request.id)}
                          >
                            Accept
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

