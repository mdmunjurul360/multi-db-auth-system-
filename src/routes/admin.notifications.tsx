import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send, Megaphone, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Admin" }] }),
  component: NotificationsPage,
});

const recent = [
  { icon: Megaphone, title: "Summer sale launched", body: "20% off on all sci-fi titles for the weekend.", time: "2h ago", tone: "text-primary" },
  { icon: AlertTriangle, title: "Maintenance window", body: "Platform will be in maintenance Sat 2am–4am.", time: "1d ago", tone: "text-warning" },
  { icon: Send, title: "Newsletter sent", body: "Monthly digest delivered to 14,302 subscribers.", time: "3d ago", tone: "text-success" },
];

function NotificationsPage() {
  const [audience, setAudience] = useState("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const send = () => {
    if (!title.trim() || !body.trim()) return toast.error("Title and message required");
    toast.success("Announcement sent", { description: `Audience: ${audience}` });
    setTitle(""); setBody("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-2xl bg-gradient-card p-6 shadow-card">
        <h3 className="font-display text-lg font-bold">Send announcement</h3>
        <p className="text-xs text-muted-foreground">Push notifications, emails and in-app alerts.</p>
        <div className="mt-5 space-y-4">
          <div className="grid gap-2">
            <Label>Audience</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger className="bg-input"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                <SelectItem value="students">Students</SelectItem>
                <SelectItem value="admins">Admins</SelectItem>
                <SelectItem value="moderators">Moderators</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="n-title">Title</Label>
            <Input id="n-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Big news!" className="bg-input" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="n-body">Message</Label>
            <Textarea id="n-body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share an update..." className="bg-input" />
          </div>
          <Button onClick={send} className="rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
            <Send className="mr-2 h-4 w-4" /> Send notification
          </Button>
        </div>
      </section>

      <aside className="rounded-2xl bg-gradient-card p-6 shadow-card">
        <h3 className="font-display text-lg font-bold">Recent activity</h3>
        <ul className="mt-5 space-y-4">
          {recent.map((r) => (
            <li key={r.title} className="flex gap-3">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface ${r.tone}`}>
                <r.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{r.title}</p>
                <p className="truncate text-xs text-muted-foreground">{r.body}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{r.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
