import { useEffect, useState } from "react";
import { Plus, X, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/ImageUploader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const categories = ["Fiction", "Science Fiction", "Philosophy", "Education", "Self Help", "Children", "Technology"];

export type BookForEdit = {
  id: string;
  title: string;
  author: string | null;
  category: string | null;
  description: string | null;
  price: number | null;
  old_price: number | null;
  cover_url: string | null;
  pdf_url: string | null;
  audio_url: string | null;
  pages: number | null;
  duration: string | null;
  language: string | null;
  stock: number | null;
  what_you_will_learn: string[] | null;
  table_of_contents: { title: string; duration?: string }[] | null;
  preview_chapters: { title: string; audio_url?: string }[] | null;
};

type Props = { editing?: BookForEdit | null; onClose?: () => void; trigger?: "button" | "icon" | "external"; open?: boolean; onOpenChange?: (v: boolean) => void };

export function AddBookDialog({ editing = null, onClose, trigger = "button", open: controlledOpen, onOpenChange }: Props) {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => { onOpenChange ? onOpenChange(v) : setInternalOpen(v); if (!v) onClose?.(); };

  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [stock, setStock] = useState("");
  const [pages, setPages] = useState("");
  const [duration, setDuration] = useState("");
  const [language, setLanguage] = useState("English");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [learn, setLearn] = useState<string[]>([]);
  const [learnInput, setLearnInput] = useState("");
  const [toc, setToc] = useState<{ title: string; duration: string }[]>([]);
  const [tocTitle, setTocTitle] = useState("");
  const [tocDuration, setTocDuration] = useState("");
  const [previews, setPreviews] = useState<{ title: string; audio_url: string }[]>([]);
  const [pTitle, setPTitle] = useState("");
  const [pAudio, setPAudio] = useState("");

  const reset = () => {
    setTitle(""); setAuthor(""); setCategory(""); setPrice(""); setOldPrice(""); setStock("");
    setPages(""); setDuration(""); setLanguage("English");
    setDescription(""); setCoverUrl(""); setPdfUrl(""); setAudioUrl("");
    setLearn([]); setLearnInput(""); setToc([]); setTocTitle(""); setTocDuration("");
    setPreviews([]); setPTitle(""); setPAudio("");
  };

  useEffect(() => {
    if (editing && open) {
      setTitle(editing.title ?? "");
      setAuthor(editing.author ?? "");
      setCategory(editing.category ?? "");
      setPrice(editing.price != null ? String(editing.price) : "");
      setOldPrice(editing.old_price != null ? String(editing.old_price) : "");
      setStock(editing.stock != null ? String(editing.stock) : "");
      setPages(editing.pages != null ? String(editing.pages) : "");
      setDuration(editing.duration ?? "");
      setLanguage(editing.language ?? "English");
      setDescription(editing.description ?? "");
      setCoverUrl(editing.cover_url ?? "");
      setPdfUrl(editing.pdf_url ?? "");
      setAudioUrl(editing.audio_url ?? "");
      setLearn(editing.what_you_will_learn ?? []);
      setToc((editing.table_of_contents ?? []).map((t) => ({ title: t.title, duration: t.duration ?? "" })));
      setPreviews((editing.preview_chapters ?? []).map((p) => ({ title: p.title, audio_url: p.audio_url ?? "" })));
    }
  }, [editing, open]);

  const submit = async () => {
    if (!coverUrl) return toast.error("Please upload a cover image first.");
    if (!title.trim()) return toast.error("Title is required.");
    setSaving(true);
    const format = audioUrl ? "audio" : pdfUrl ? "pdf" : "hard";
    const payload = {
      title: title.trim(),
      author: author.trim() || null,
      category: category || null,
      description: description.trim() || null,
      price: Number(price) || 0,
      old_price: oldPrice ? Number(oldPrice) : null,
      stock: stock ? Number(stock) : 0,
      pages: pages ? Number(pages) : null,
      duration: duration.trim() || null,
      language: language.trim() || "English",
      cover_url: coverUrl,
      pdf_url: pdfUrl.trim() || null,
      audio_url: audioUrl.trim() || null,
      format,
      is_published: true,
      what_you_will_learn: learn,
      table_of_contents: toc,
      preview_chapters: previews,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from("books").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("books").insert({ ...payload, created_by: user?.id ?? null }));
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Book updated" : "Book published", { description: title });
    reset();
    setOpen(false);
  };

  const addLearn = () => { if (learnInput.trim()) { setLearn([...learn, learnInput.trim()]); setLearnInput(""); } };
  const addToc = () => { if (tocTitle.trim()) { setToc([...toc, { title: tocTitle.trim(), duration: tocDuration.trim() }]); setTocTitle(""); setTocDuration(""); } };
  const addPreview = () => { if (pTitle.trim()) { setPreviews([...previews, { title: pTitle.trim(), audio_url: pAudio.trim() }]); setPTitle(""); setPAudio(""); } };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v && !editing) reset(); }}>
      {trigger === "button" && (
        <DialogTrigger asChild>
          <Button className="w-full rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
            <Plus className="mr-2 h-4 w-4" /> Add New Book
          </Button>
        </DialogTrigger>
      )}
      {trigger === "icon" && (
        <DialogTrigger asChild>
          <Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">{editing ? "Edit book" : "Add new book"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-1">
            <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">Cover image</Label>
            <ImageUploader
              value={coverUrl}
              onChange={(url) => setCoverUrl(url)}
              onError={(m) => toast.error(m)}
              label="Drop cover or click to upload"
              hint="JPG/PNG/WEBP · uploaded to ImgBB · max 32MB"
            />
          </div>
          <div className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="b-title">Title</Label>
              <Input id="b-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The Architecture of Tomorrow" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="b-author">Author(s)</Label>
              <Input id="b-author" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Dr. Elena Vance & Julian Sterling" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="b-stock">Stock</Label>
                <Input id="b-stock" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="120" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="b-price">Price (৳)</Label>
                <Input id="b-price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="49.99" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="b-old">Old price (৳)</Label>
                <Input id="b-old" type="number" min="0" step="0.01" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} placeholder="89.00" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="b-pages">Pages</Label>
                <Input id="b-pages" type="number" min="0" value={pages} onChange={(e) => setPages(e.target.value)} placeholder="482" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="b-dur">Duration</Label>
                <Input id="b-dur" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="12h 45m" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="b-lang">Language</Label>
                <Input id="b-lang" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="English" />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 grid gap-2">
            <Label htmlFor="b-desc">Description</Label>
            <Textarea id="b-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief overview..." />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="b-pdf">PDF file URL (full content)</Label>
            <Input id="b-pdf" value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="b-audio">Full audiobook URL</Label>
            <Input id="b-audio" value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} placeholder="https://..." />
          </div>

          {/* What You Will Learn */}
          <div className="md:col-span-2 rounded-xl border border-border/50 p-4">
            <Label className="mb-2 block text-sm font-semibold">What you will learn</Label>
            <div className="flex gap-2">
              <Input value={learnInput} onChange={(e) => setLearnInput(e.target.value)} placeholder="Mastering procedural generation..." onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLearn(); } }} />
              <Button type="button" onClick={addLearn} variant="outline">Add</Button>
            </div>
            {learn.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm">
                {learn.map((l, i) => (
                  <li key={i} className="flex items-center justify-between rounded-md bg-surface-elevated px-3 py-2">
                    <span>{l}</span>
                    <button type="button" onClick={() => setLearn(learn.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Table of Contents */}
          <div className="md:col-span-2 rounded-xl border border-border/50 p-4">
            <Label className="mb-2 block text-sm font-semibold">Table of contents</Label>
            <div className="grid grid-cols-[1fr_120px_auto] gap-2">
              <Input value={tocTitle} onChange={(e) => setTocTitle(e.target.value)} placeholder="Ch 1: The Neural City" />
              <Input value={tocDuration} onChange={(e) => setTocDuration(e.target.value)} placeholder="42 min" />
              <Button type="button" onClick={addToc} variant="outline">Add</Button>
            </div>
            {toc.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm">
                {toc.map((c, i) => (
                  <li key={i} className="flex items-center justify-between rounded-md bg-surface-elevated px-3 py-2">
                    <span>{c.title}</span>
                    <span className="flex items-center gap-3 text-muted-foreground">
                      {c.duration && <span className="text-xs">{c.duration}</span>}
                      <button type="button" onClick={() => setToc(toc.filter((_, j) => j !== i))} className="hover:text-destructive"><X className="h-4 w-4" /></button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Audiobook preview chapters */}
          <div className="md:col-span-2 rounded-xl border border-border/50 p-4">
            <Label className="mb-2 block text-sm font-semibold">Audiobook preview chapters</Label>
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <Input value={pTitle} onChange={(e) => setPTitle(e.target.value)} placeholder="Chapter 1: The First Byte" />
              <Input value={pAudio} onChange={(e) => setPAudio(e.target.value)} placeholder="https://...mp3 (optional)" />
              <Button type="button" onClick={addPreview} variant="outline">Add</Button>
            </div>
            {previews.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm">
                {previews.map((c, i) => (
                  <li key={i} className="flex items-center justify-between rounded-md bg-surface-elevated px-3 py-2">
                    <span className="truncate">{c.title}</span>
                    <button type="button" onClick={() => setPreviews(previews.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full bg-transparent">Cancel</Button>
          <Button onClick={submit} disabled={saving} className="rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
            {saving ? "Saving…" : editing ? "Save changes" : "Publish book"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
