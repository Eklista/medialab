// views/config/SMTPConfig.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function SMTPConfig() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">SMTP Configuration</h2>
        <p className="text-muted-foreground">
          Configure email server settings for notifications
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Email Server Settings
            <Badge variant="destructive">Not Connected</Badge>
          </CardTitle>
          <CardDescription>
            Configure SMTP server for sending emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">SMTP Host</Label>
              <Input id="smtp-host" placeholder="smtp.gmail.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-port">Port</Label>
              <Input id="smtp-port" placeholder="587" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-user">Username</Label>
              <Input id="smtp-user" placeholder="your-email@domain.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-pass">Password</Label>
              <Input id="smtp-pass" type="password" placeholder="••••••••" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button>Test Connection</Button>
            <Button variant="outline">Save Configuration</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}