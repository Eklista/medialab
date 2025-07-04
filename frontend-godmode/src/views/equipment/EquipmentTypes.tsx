// views/equipment/EquipmentTypes.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function EquipmentTypes() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Equipment Types</h2>
          <p className="text-muted-foreground">
            Manage categories of equipment available in the department
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Equipment Type
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipment Types List</CardTitle>
          <CardDescription>
            Configure equipment categories like cameras, audio, lighting, etc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Equipment types table will go here...</p>
        </CardContent>
      </Card>
    </div>
  );
}