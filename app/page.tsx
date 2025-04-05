import Link from "next/link"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"
import { Code2, Hammer } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="relative h-screen flex items-center justify-center text-center">
          <div className="absolute inset-0 z-0">
            <img 
              src="/hero-bg.jpg" 
              alt="Hero background" 
              className="w-full h-full object-cover brightness-50"
            />
            <div className="absolute inset-0 bg-dark-900/80"></div>
          </div>
          <div className="relative z-10 flex flex-col items-center justify-center max-w-4xl mx-auto px-4">
            <h1 className="text-7xl font-extrabold mb-8 font-prompt text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">DevCollab Platform</h1>
            <p className="text-2xl text-gray-300 mb-12 max-w-2xl mx-auto font-prompt drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
              A platform for developers to collaborate on projects, share knowledge, and build amazing things together.
            </p>
            <div className="flex justify-center gap-6">
              <Button asChild className="bg-yellow-500 text-black hover:bg-yellow-400 text-lg px-8 py-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all">
                <Link href="/chat" className="flex items-center gap-2">Build Project <Hammer size={20} /></Link>
              </Button>
              <Button asChild variant="outline" className="bg-white text-black border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all text-lg px-8 py-6">
                <Link href="/find-project" className="flex items-center gap-2">For Developers <Code2 size={20}/></Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-prompt">How DevCollab Works</h2>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                  Connecting project owners with skilled developers in a few simple steps
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                <div className="flex flex-col items-center space-y-2 border-4 border-black p-6 rounded-none bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div className="p-3 rounded-none bg-yellow-500 border-2 border-black">
                    <span className="text-2xl font-bold text-black">1</span>
                  </div>
                  <h3 className="text-xl font-bold">Create Project</h3>
                  <p className="text-gray-500 text-center">
                    Project owners define their project requirements, modules, and budget
                  </p>
                </div>

                <div className="flex flex-col items-center space-y-2 border-4 border-black p-6 rounded-none bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div className="p-3 rounded-none bg-yellow-500 border-2 border-black">
                    <span className="text-2xl font-bold text-black">2</span>
                  </div>
                  <h3 className="text-xl font-bold">Developer Bidding</h3>
                  <p className="text-gray-500 text-center">
                    Developers review projects and bid on modules they can complete
                  </p>
                </div>

                <div className="flex flex-col items-center space-y-2 border-4 border-black p-6 rounded-none bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div className="p-3 rounded-none bg-yellow-500 border-2 border-black">
                    <span className="text-2xl font-bold text-black">3</span>
                  </div>
                  <h3 className="text-xl font-bold">Collaboration</h3>
                  <p className="text-gray-500 text-center">
                    Project owners accept bids, developers complete work, and verification ensures quality
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-6 bg-dark-900 text-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-yellow-500">DevCollab</span>
            </div>
            <p className="text-sm text-gray-400">© 2025 DevCollab. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="text-sm text-gray-400 hover:text-white">
                Terms
              </Link>
              <Link href="/privacy" className="text-sm text-gray-400 hover:text-white">
                Privacy
              </Link>
              <Link href="/contact" className="text-sm text-gray-400 hover:text-white">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

