// views/users/Roles.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Roles() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Roles & Permissions</h2>
          <p className="text-muted-foreground">
            Configure user roles and their permissions
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roles List</CardTitle>
          <CardDescription>
            Define what each user role can access and modify
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Roles table will go here...</p>
        </CardContent>
      </Card>
    </div>
  );
}