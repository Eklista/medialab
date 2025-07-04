// views/equipment/Locations.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Locations() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Locations</h2>
          <p className="text-muted-foreground">
            Manage studios, rooms and spaces available for production
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Locations List</CardTitle>
          <CardDescription>
            Configure available spaces for filming and production
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Locations table will go here...</p>
        </CardContent>
      </Card>
    </div>
  );
}