import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import PageWrapper from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { user } = useAuth();
  const homePath = user ? "/dashboard" : "/login";

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <PageWrapper>
        <div className="flex min-h-screen items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl">Page not found</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                The route <span className="font-mono">{location.pathname}</span> doesn’t exist.
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button asChild variant="default" className="w-full">
                  <Link to={homePath}>
                    <Home className="h-4 w-4 mr-2" />
                    {user ? "Go to Dashboard" : "Go to Login"}
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    </div>
  );
};

export default NotFound;
