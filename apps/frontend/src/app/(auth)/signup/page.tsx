"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Error from "@/components/globals/form-error";
import Navbar from "@/components/globals/navbar";
import api from "@/lib/api";
import { FcGoogle } from "react-icons/fc";
import { SiGithub } from "react-icons/si";
import { BACKEND_URL } from "@/lib/config";

export default function SignUp() {
  const router = useRouter();

  //SignUp Credentials
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  //Error handler
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); //clear previous errors
    try {
      const response = await api.post("/user/signup", {
        name,
        email,
        password,
      });

      if (response) {
        router.push("/login");
      }
    } catch (error: any) {
      if (error.response && error.response.data) {
        setError(error.response.data.message || "Login Failed");
      } else {
        setError("Something went wrong. Please try again after some time");
      }
    }
  };

  const handleGoogleLogin = () => {
    // window.open(`${BACKEND_URL}/user/auth/google/callback`, "_self");
    window.location.href = `${BACKEND_URL}/auth/google/callback`;
  };

  const handleGithubLogin = () => {
    // window.open(`${BACKEND_URL}/user/auth/google/callback`, "_self");
    window.location.href = `${BACKEND_URL}/auth/github/callback`;
  };

  return (
    <>
      <Navbar OnlyLogo={true} />
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-[400px] bg-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-foreground">
              Create Account
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Get started with Flowentis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Display if Error Present */}
            {error && <Error errorMessage={error} />}

            {/* Signup Form  */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-input border-border text-foreground"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-input border-border text-foreground"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input border-border text-foreground"
                  required
                />
              </div>

              {/* Submit Button  */}
              <Button type="submit" onClick={handleSubmit} className="w-full">
                Sign Up
              </Button>
              <Button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full"
              >
                <FcGoogle className="text-lg" />
                <span>Sign Up with Google</span>
              </Button>
              <Button
                type="button"
                onClick={handleGithubLogin}
                className="w-full"
              >
                <SiGithub className="text-lg" />
                <span>Sign Up with Github</span>
              </Button>
            </form>

            <div className="mt-4 text-center">
              <a
                href="/login"
                className="text-sm text-neutral-400 hover:text-white"
              >
                Already have an account? Sign in
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
