import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { uploadPhoto } from "@/lib/auction.functions";
import { bestMatch, baseName, fileToJpegBase64 } from "@/lib/photo-upload";
import type { Player, Team } from "@/lib/auction-data";

type Target = { key: string; kind: "player" | "team" | "team2"; id: string; label: string };

function buildTargets(players: Player[], teams: Team[]): Target[] {
  return [
    ...players.map((p) => ({
      key: `player:${p.id}`,
      kind: "player" as const,
      id: p.id,
      label: p.name,
    })),
    ...teams.map((t) => ({
      key: `team:${t.id}`,
      kind: "team" as const,
      id: t.id,
      label: `${t.captain_name || t.name} (captain · ${t.name})`,
    })),
    ...teams.map((t) => ({
      key: `team2:${t.id}`,
      kind: "team2" as const,
      id: t.id,
      label: `${t.captain2_name || t.name} (captain 2 · ${t.name})`,
    })),
  ];
}

type Row = {
  fileName: string;
  base64: string;
  preview: string;
  targetKey: string | null;
  score: number;
  done?: boolean;
};

export function BulkPhotoUpload({
  players,
  teams,
  passcode,
}: {
  players: Player[];
  teams: Team[];
  passcode: string;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const targets = buildTargets(players, teams);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const next: Row[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const base64 = await fileToJpegBase64(file);
        const candidates = targets.map((t) => ({
          id: t.key,
          name:
            t.kind === "team"
              ? (teams.find((x) => x.id === t.id)?.captain_name ?? "")
              : t.kind === "team2"
                ? (teams.find((x) => x.id === t.id)?.captain2_name ?? "")
                : t.label,
        }));
        const m = bestMatch(file.name, candidates);
        next.push({
          fileName: file.name,
          base64,
          preview: `data:image/jpeg;base64,${base64}`,
          targetKey: m.score >= 0.5 ? (m.candidate?.id ?? null) : null,
          score: m.score,
        });
      }
      setRows(next);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not read those files");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function commit() {
    setBusy(true);
    let ok = 0;
    for (const [i, row] of rows.entries()) {
      if (!row.targetKey || row.done) continue;
      const target = targets.find((t) => t.key === row.targetKey);
      if (!target) continue;
      try {
        await uploadPhoto({
          data: {
            passcode,
            kind: target.kind,
            id: target.id,
            base64: row.base64,
            contentType: "image/jpeg",
          },
        });
        ok++;
        setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, done: true } : r)));
      } catch (e) {
        toast.error(`${row.fileName}: ${e instanceof Error ? e.message : "upload failed"}`);
      }
    }
    setBusy(false);
    toast.success(`${ok} photo${ok === 1 ? "" : "s"} uploaded`);
  }

  const pending = rows.filter((r) => r.targetKey && !r.done).length;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="font-bold">Bulk photo upload</h3>
      <p className="text-xs text-muted-foreground">
        Drop in multiple images — filenames are matched to player (or captain) names. Review the
        matches before committing.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="mt-3 block w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-secondary-foreground"
        onChange={(e) => void onFiles(e.target.files)}
      />

      {rows.length > 0 && (
        <>
          <div className="mt-4 grid max-h-[45vh] gap-2 overflow-auto">
            {rows.map((row, i) => (
              <div
                key={row.fileName + i}
                className="flex items-center gap-3 rounded-lg border border-border px-2 py-2"
              >
                <img
                  src={row.preview}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-md object-cover"
                />
                <span className="w-40 shrink-0 truncate text-xs text-muted-foreground">
                  {baseName(row.fileName)}
                </span>
                <span className="text-muted-foreground">→</span>
                <Select
                  value={row.targetKey ?? ""}
                  onValueChange={(v) =>
                    setRows((prev) =>
                      prev.map((r, idx) => (idx === i ? { ...r, targetKey: v } : r)),
                    )
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="No match — pick one" />
                  </SelectTrigger>
                  <SelectContent>
                    {targets.map((t) => (
                      <SelectItem key={t.key} value={t.key}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span
                  className={`w-16 shrink-0 text-right text-[11px] ${
                    row.done
                      ? "text-success"
                      : row.score >= 0.85
                        ? "text-success"
                        : row.score >= 0.5
                          ? "text-primary"
                          : "text-muted-foreground"
                  }`}
                >
                  {row.done ? "uploaded" : `${Math.round(row.score * 100)}%`}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => void commit()} disabled={busy || pending === 0}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Upload ${pending} photo(s)`}
            </Button>
            <Button variant="secondary" onClick={() => setRows([])} disabled={busy}>
              Clear
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export function SinglePhotoButton({
  kind,
  id,
  name,
  photoUrl,
  passcode,
}: {
  kind: "player" | "team" | "team2";
  id: string;
  name: string;
  photoUrl: string | null;
  passcode: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const base64 = await fileToJpegBase64(file);
      await uploadPhoto({ data: { passcode, kind, id, base64, contentType: "image/jpeg" } });
      toast.success(`Photo saved for ${name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <button
      type="button"
      title={photoUrl ? "Replace photo" : "Upload photo"}
      onClick={() => ref.current?.click()}
      className="relative shrink-0"
    >
      <PlayerAvatar name={name} photoUrl={photoUrl} className="h-9 w-9 text-[11px]" />
      <span className="absolute -bottom-1 -right-1 rounded-full bg-secondary p-0.5 text-secondary-foreground">
        {busy ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Upload className="h-3 w-3" />
        )}
      </span>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
    </button>
  );
}
