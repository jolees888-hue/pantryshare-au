import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import PostListing from "@/pages/PostListing";
import ListingDetail from "@/pages/ListingDetail";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router hook={useHashLocation}>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/post" component={PostListing} />
            <Route path="/listing/:id" component={ListingDetail} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}
