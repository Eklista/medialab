// views/services/ServiceTypes.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ServiceTypes() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Service Types</h2>
          <p className="text-muted-foreground">
            Manage the types of services offered by the department
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Service Type
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Types List</CardTitle>
          <CardDescription>
            Configure the available service categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Service types table will go here...</p>
        </CardContent>
      </Card>
    </div>
  );
}