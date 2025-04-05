"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bot, Globe, UserCircle, Wallet } from "lucide-react"
import { useState, useEffect } from "react"
import { ethers } from "ethers"

export default function Navbar() {
  const pathname = usePathname()
  const [walletConnected, setWalletConnected] = useState(false)
  const [userAddress, setUserAddress] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)

  // Connect wallet function
  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum !== undefined) {
      try {
        const newProvider = new ethers.BrowserProvider(window.ethereum)
        const newSigner = await newProvider.getSigner()
        const address = await newSigner.getAddress()
        
        // Store connection data in localStorage
        localStorage.setItem('walletConnected', 'true')
        localStorage.setItem('userAddress', address)
        
        // Update state
        setProvider(newProvider)
        setSigner(newSigner)
        setUserAddress(address)
        setWalletConnected(true)
      } catch (error) {
        console.error("Error connecting wallet:", error)
      }
    } else {
      alert("Please install MetaMask")
    }
  }

  // Disconnect wallet function
  const disconnectWallet = () => {
    localStorage.removeItem('walletConnected')
    localStorage.removeItem('userAddress')
    setWalletConnected(false)
    setUserAddress(null)
    setProvider(null)
    setSigner(null)
  }

  // Check if wallet is already connected and set up event listeners
  useEffect(() => {
    if (typeof window === 'undefined' || window.ethereum === undefined) return

    // Check localStorage first
    const storedConnection = localStorage.getItem('walletConnected')
    const storedAddress = localStorage.getItem('userAddress')
    
    if (storedConnection === 'true' && storedAddress) {
      // Verify the connection is still valid
      window.ethereum.request({ method: 'eth_accounts' })
        .then(async (accounts: string[]) => {
          if (accounts.length > 0 && accounts[0].toLowerCase() === storedAddress.toLowerCase()) {
            // Connection is still valid
            const newProvider = new ethers.BrowserProvider(window.ethereum)
            const newSigner = await newProvider.getSigner()
            
            setProvider(newProvider)
            setSigner(newSigner)
            setUserAddress(storedAddress)
            setWalletConnected(true)
          } else {
            // Connection is no longer valid
            disconnectWallet()
          }
        })
        .catch((error: any) => {
          console.error("Error checking wallet connection:", error)
          disconnectWallet()
        })
    }

    // Set up event listeners for wallet events
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        disconnectWallet()
      } else if (accounts[0].toLowerCase() !== userAddress?.toLowerCase()) {
        // User switched accounts
        const newAddress = accounts[0]
        localStorage.setItem('userAddress', newAddress)
        setUserAddress(newAddress)
      }
    }

    const handleChainChanged = () => {
      // Reload the page when the chain changes
      window.location.reload()
    }

    const handleDisconnect = () => {
      disconnectWallet()
    }

    // Add event listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)
    window.ethereum.on('disconnect', handleDisconnect)

    // Clean up event listeners on unmount
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum.removeListener('chainChanged', handleChainChanged)
      window.ethereum.removeListener('disconnect', handleDisconnect)
    }
  }, [userAddress])

  return (
    <header className="w-full border-b-2 border-black dark:border-gray-800 px-6 bg-white">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-x-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl text-yellow-500 font-extrabold">DevCollab</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              href="/find-project"
              className={`text-sm flex font-bold items-center transition-colors gap-x-2 hover:text-yellow-500 ${
                pathname.startsWith("/find-project") ? "text-yellow-500" : ""
              }`}
            >
              <Globe size={16}/>
              Explore Community
              
            </Link>
            <Link
              href="/chat"
              className={`text-sm flex font-bold items-center transition-colors gap-x-2 hover:text-yellow-500 ${
                pathname.startsWith("/chat") ? "text-yellow-500" : ""
              }`}
            >
              <Bot size={16}/>
              Build Project
              
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          
          {walletConnected ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <div className="text-sm font-medium text-green-800">
                  {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={disconnectWallet}
                className="text-xs bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={connectWallet}
              className="flex items-center gap-2 bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100 hover:text-yellow-900"
            >
              <Wallet size={16} className="text-yellow-600" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

