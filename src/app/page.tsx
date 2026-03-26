"use client"

import {
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
