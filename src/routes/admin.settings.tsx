import { createFileRoute } from "@tanstack/react-router";
import { Globe, CreditCard, Server, KeyRound, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Admin" }] }),
  component: SettingsPage,
});

function Card({ icon: Icon, title, desc, children }: { icon: typeof Globe; title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-gradient-card p-6 shadow-card">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/20 text-primary"><Icon className="h-5 w-5" /></span>
        <div>
          <h3 className="font-display text-lg font-bold">{title}</h3>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-surface-elevated p-3">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

function SettingsPage() {
  const save = () => toast.success("Settings saved");
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card icon={Globe} title="Website" desc="General site configuration.">
        <div className="grid gap-2"><Label>Site name</Label><Input defaultValue="EduBari" className="bg-input" /></div>
        <div className="grid gap-2"><Label>Support email</Label><Input defaultValue="contact@edubari.bd" className="bg-input" /></div>
        <Row label="Maintenance mode"><Switch /></Row>
      </Card>

      <Card icon={CreditCard} title="Payments" desc="Connected payment methods.">
        <Row label="bKash"><Switch defaultChecked /></Row>
        <Row label="Nagad"><Switch defaultChecked /></Row>
        <Row label="Rocket"><Switch /></Row>
        <Row label="Card (Stripe)"><Switch defaultChecked /></Row>
      </Card>

      <Card icon={Server} title="Domain" desc="Custom domain & DNS.">
        <div className="grid gap-2"><Label>Primary domain</Label><Input defaultValue="edubari.bd" className="bg-input" /></div>
        <Row label="Force HTTPS"><Switch defaultChecked /></Row>
      </Card>

      <Card icon={KeyRound} title="API" desc="Public API keys & webhooks.">
        <div className="grid gap-2"><Label>Public API key</Label><Input readOnly value="pk_live_••••••••••••••" className="bg-input font-mono text-xs" /></div>
        <div className="grid gap-2"><Label>Webhook URL</Label><Input placeholder="https://..." className="bg-input" /></div>
      </Card>

      <Card icon={ShieldCheck} title="Security" desc="Authentication & access control.">
        <Row label="Two-factor auth for admins"><Switch defaultChecked /></Row>
        <Row label="Leaked password protection"><Switch defaultChecked /></Row>
        <Row label="Session timeout (30 min)"><Switch /></Row>
        <Row label="Activity logging"><Switch defaultChecked /></Row>
      </Card>

      <div className="md:col-span-2 flex justify-end">
        <Button onClick={save} className="rounded-full bg-gradient-primary text-primary-foreground shadow-glow">Save changes</Button>
      </div>
    </div>
  );
}
