"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Check } from "lucide-react";
import Link from "next/link";

export default function SignOut() {
  const { data: session } = useSession();
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    // If no session, user is already signed out
    if (!session) {
      setSignedOut(true);
    }
  }, [session]);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    setSignedOut(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {signedOut ? "You've been signed out" : "Sign out of your account"}
          </CardTitle>
          <CardDescription>
            {signedOut 
              ? "Thanks for using our platform" 
              : `Are you sure you want to sign out?`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {signedOut ? (
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <Check className="h-6 w-6 text-green-600" />
              </div>
            </div>
          ) : (
            <Button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </Button>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild variant="outline" className="mt-2">
            <Link href="/">Return to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 