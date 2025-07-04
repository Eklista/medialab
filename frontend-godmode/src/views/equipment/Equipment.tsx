// views/equipment/Equipment.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Equipment() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Equipment Units</h2>
          <p className="text-muted-foreground">
            Manage individual equipment pieces and their status
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Equipment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipment Inventory</CardTitle>
          <CardDescription>
            Track equipment status, location, and availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Equipment inventory table will go here...</p>
        </CardContent>
      </Card>
    </div>
  );
}