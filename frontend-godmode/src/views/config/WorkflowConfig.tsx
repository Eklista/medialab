// views/config/WorkflowConfig.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function WorkflowConfig() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Workflow Configuration</h2>
        <p className="text-muted-foreground">
          Configure project status workflows and transitions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Status Workflow</CardTitle>
          <CardDescription>
            Define the available statuses and their transitions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Pending</Badge>
            <span>→</span>
            <Badge variant="secondary">Approved</Badge>
            <span>→</span>
            <Badge variant="secondary">In Progress</Badge>
            <span>→</span>
            <Badge variant="secondary">Completed</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Current workflow configuration. Click to modify transitions and add new statuses.
          </p>
          <Button>Configure Workflow</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equipment Status Workflow</CardTitle>
          <CardDescription>
            Define equipment status transitions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Available</Badge>
            <span>↔</span>
            <Badge variant="secondary">In Use</Badge>
            <span>→</span>
            <Badge variant="secondary">Maintenance</Badge>
            <span>→</span>
            <Badge variant="destructive">Retired</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Equipment status flow configuration
          </p>
          <Button>Configure Equipment Flow</Button>
        </CardContent>
      </Card>
    </div>
  );
}