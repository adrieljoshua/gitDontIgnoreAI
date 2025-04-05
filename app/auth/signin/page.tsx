"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Github } from "lucide-react";

export default function SignIn() {
  // Automatically redirect to GitHub auth
  useEffect(() => {
    // Optional: Auto redirect after a short delay
    // const timer = setTimeout(() => signIn("github"), 1500);
    // return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Sign in to continue</CardTitle>
          <CardDescription>
            Connect with GitHub to use the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button 
            onClick={() => signIn("github", { callbackUrl: "/chat" })}
            className="flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white"
          >
            <Github className="h-5 w-5" />
            Sign in with GitHub
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </CardFooter>
      </Card>
    </div>
  );
} 