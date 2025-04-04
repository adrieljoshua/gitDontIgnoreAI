import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Navbar from "@/components/navbar"

// Mock project data
const projects = [
  {
    id: "1",
    title: "E-commerce Platform",
    tagline: "A modern online shopping experience",
    description: "Building a scalable e-commerce platform with advanced search and recommendation features.",
    budget: 15000,
    modules: 5,
    owner: "TechVentures",
    status: "Active",
  },
  {
    id: "2",
    title: "Healthcare App",
    tagline: "Connecting patients with doctors",
    description: "A mobile application that allows patients to book appointments and consult with doctors remotely.",
    budget: 12000,
    modules: 4,
    owner: "MedTech Solutions",
    status: "Active",
  },
  {
    id: "3",
    title: "Learning Management System",
    tagline: "Education for everyone",
    description: "An online platform for creating, distributing, and managing educational content.",
    budget: 9000,
    modules: 6,
    owner: "EduTech Inc",
    status: "Active",
  },
  {
    id: "4",
    title: "Fitness Tracker",
    tagline: "Track your fitness journey",
    description: "A web and mobile application to track workouts, nutrition, and health metrics.",
    budget: 7500,
    modules: 3,
    owner: "FitLife",
    status: "Active",
  },
]

export default function ProjectsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Projects</h1>
          <Link href="/projects/create">
            <Badge className="bg-yellow-500 hover:bg-yellow-400 text-black">+ New Project</Badge>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link href={`/projects/${project.id}`} key={project.id}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>{project.title}</CardTitle>
                  <p className="text-sm text-gray-500">{project.tagline}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm line-clamp-3">{project.description}</p>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <div className="text-sm">
                    <span className="font-medium">Budget:</span> ${project.budget}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Modules:</span> {project.modules}
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}

