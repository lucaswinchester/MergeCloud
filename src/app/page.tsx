"use client"

import Link from 'next/link';
import { Button } from "@/components/ui/button"
import {
  UserButton,
  SignedIn,
  SignedOut,
  useAuth
} from "@clerk/nextjs"
import { useRouter } from "next/navigation";
import { useEffect } from "react";


const MyProtectedPage = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Redirect to your desired page (e.g., dashboard)
      router.push("/dashboard"); 
    }
    else {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);
};

export default MyProtectedPage;
