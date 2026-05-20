"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash, Package } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const DESTINATIONS = ["Teasa Spaceport", "Cassillo", "Sakura Sun", "Farnesway"] as const;
type Dest = (typeof DESTINATIONS)[number];

const DEST_SHORT: Record<Dest, string> = {
  "Teasa Spaceport": "Teasa",
  "Cassillo": "Cassillo",
  "Sakura Sun": "Sakura",
  "Farnesway": "Farnesway",
};

const PRESET_MATERIALS = [
  "Tungsten", "Aluminium", "Titanium", "Quartz", "Tin", "Silicon",
];

const STORAGE_KEY = "sc_hauling_v2";

// ─── Types ────────────────────────────────────────────────────────────────────

type DestQtys = Record<Dest, number>;

interface Mission {
  id: string;
  label: string;
  material: string;
  qtys: DestQtys;
  loaded: boolean;
}

function emptyQtys(): DestQtys {
  return Object.fromEntries(DESTINATIONS.map((d) => [d, 0])) as DestQtys;
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function missionTotal(m: Mission) {
  return DESTINATIONS.reduce((s, d) => s + (m.qtys[d] || 0), 0);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HaulingPlanner() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form
  const [formMaterial, setFormMaterial] = useState("");
  const [formCustomMat, setFormCustomMat] = useState("");
  const [formQtys, setFormQtys] = useState<DestQtys>(emptyQtys());

  // Persist
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMissions(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
  }, [missions, hydrated]);

  // Totals row
  const totals = useMemo(() => {
    const t = emptyQtys();
    for (const m of missions) {
      for (const d of DESTINATIONS) {
        t[d] += m.qtys[d] || 0;
      }
    }
    return t;
  }, [missions]);

  const grandTotal = DESTINATIONS.reduce((s, d) => s + totals[d], 0);

  // Add
  function addMission() {
    const mat =
      formMaterial === "__custom__"
        ? formCustomMat.trim()
        : formMaterial.trim();
    if (!mat) return;
    const total = DESTINATIONS.reduce((s, d) => s + (formQtys[d] || 0), 0);
    if (total === 0) return;

    const n = missions.length + 1;
    setMissions((prev) => [
      ...prev,
      {
        id: generateId(),
        label: `M${n}`,
        material: mat,
        qtys: { ...formQtys },
        loaded: false,
      },
    ]);
    setFormMaterial("");
    setFormCustomMat("");
    setFormQtys(emptyQtys());
    setDialogOpen(false);
  }

  function deleteMission(id: string) {
    setMissions((prev) => prev.filter((m) => m.id !== id));
  }

  function toggleLoaded(id: string) {
    setMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, loaded: !m.loaded } : m))
    );
  }

  function setQty(dest: Dest, val: string) {
    const n = parseInt(val, 10);
    setFormQtys((prev) => ({ ...prev, [dest]: isNaN(n) || n < 0 ? 0 : n }));
  }

  if (!hydrated) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Header */}
      <header className="border-b border-border bg-card/60 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-primary/20 border border-primary/40 flex items-center justify-center">
              <Package className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-widest uppercase text-primary leading-none">
                SC Hauling Planner
              </h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Origin: Everus Harbor &nbsp;·&nbsp; {missions.length} mission{missions.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4" /> Add Mission
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-md">
              <DialogHeader>
                <DialogTitle className="text-foreground">New Hauling Mission</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 pt-2">

                {/* Material picker */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Material</Label>
                  <Select
                    value={formMaterial}
                    onValueChange={(v) => { setFormMaterial(v); if (v !== "__custom__") setFormCustomMat(""); }}
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Select material…" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {PRESET_MATERIALS.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                      <SelectItem value="__custom__">Other (type below)</SelectItem>
                    </SelectContent>
                  </Select>
                  {formMaterial === "__custom__" && (
                    <Input
                      placeholder="Material name…"
                      value={formCustomMat}
                      onChange={(e) => setFormCustomMat(e.target.value)}
                      className="bg-input border-border mt-2"
                    />
                  )}
                </div>

                {/* Quantities per destination */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Quantity per Destination
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {DESTINATIONS.map((dest) => (
                      <div key={dest} className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">{dest}</Label>
                        <Input
                          type="number"
                          min={0}
                          placeholder="0"
                          value={formQtys[dest] === 0 ? "" : formQtys[dest]}
                          onChange={(e) => setQty(dest, e.target.value)}
                          className="bg-input border-border h-8 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1">
                    Leave blank / 0 for destinations not included in this mission.
                  </p>
                </div>

                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={addMission}
                  disabled={
                    (!formMaterial || (formMaterial === "__custom__" && !formCustomMat.trim())) ||
                    DESTINATIONS.every((d) => !formQtys[d])
                  }
                >
                  Add Mission
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 py-6">

        {missions.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-28 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold">No missions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first hauling mission to start planning your cargo run from Everus Harbor.
              </p>
            </div>
            <Button
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-4 h-4" /> Add First Mission
            </Button>
          </div>
        ) : (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold tracking-widest uppercase text-primary flex items-center gap-2">
                <Package className="w-4 h-4" />
                Mission Manifest
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      {/* Mission col */}
                      <TableHead className="text-muted-foreground text-[11px] uppercase tracking-wider pl-6 w-16">
                        #
                      </TableHead>
                      {/* Material col */}
                      <TableHead className="text-muted-foreground text-[11px] uppercase tracking-wider w-36">
                        Material
                      </TableHead>
                      {/* Destination cols */}
                      {DESTINATIONS.map((dest) => (
                        <TableHead
                          key={dest}
                          className="text-muted-foreground text-[11px] uppercase tracking-wider text-center"
                        >
                          {DEST_SHORT[dest]}
                        </TableHead>
                      ))}
                      {/* Total */}
                      <TableHead className="text-muted-foreground text-[11px] uppercase tracking-wider text-center w-16">
                        Total
                      </TableHead>
                      {/* Loaded */}
                      <TableHead className="text-muted-foreground text-[11px] uppercase tracking-wider text-center w-20">
                        Loaded
                      </TableHead>
                      {/* Delete */}
                      <TableHead className="w-10 pr-4" />
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {missions.map((m) => {
                      const total = missionTotal(m);
                      return (
                        <TableRow
                          key={m.id}
                          className={cn(
                            "border-border transition-opacity",
                            m.loaded ? "opacity-40 hover:opacity-70" : "hover:bg-accent/20"
                          )}
                        >
                          {/* ID */}
                          <TableCell className="pl-6 py-3 font-mono text-xs text-muted-foreground">
                            {m.label}
                          </TableCell>
                          {/* Material */}
                          <TableCell className="py-3 font-medium text-sm text-foreground">
                            {m.material}
                          </TableCell>
                          {/* Per-destination qtys */}
                          {DESTINATIONS.map((dest) => {
                            const val = m.qtys[dest];
                            return (
                              <TableCell
                                key={dest}
                                className={cn(
                                  "py-3 text-center font-mono text-sm",
                                  val > 0
                                    ? "text-amber-300 font-semibold"
                                    : "text-muted-foreground/30"
                                )}
                              >
                                {val > 0 ? val : "—"}
                              </TableCell>
                            );
                          })}
                          {/* Total */}
                          <TableCell className="py-3 text-center font-mono text-sm font-bold text-primary">
                            {total}
                          </TableCell>
                          {/* Loaded checkbox */}
                          <TableCell className="py-3 text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={m.loaded}
                                onCheckedChange={() => toggleLoaded(m.id)}
                                className={cn(
                                  "border-border data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600",
                                )}
                              />
                            </div>
                          </TableCell>
                          {/* Delete */}
                          <TableCell className="py-3 pr-4 text-right">
                            <button
                              onClick={() => deleteMission(m.id)}
                              className="text-muted-foreground/40 hover:text-destructive transition-colors"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>

                  {/* Totals footer */}
                  <tfoot>
                    <tr className="border-t border-border bg-muted/30">
                      <td className="pl-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold" colSpan={2}>
                        Total cargo
                      </td>
                      {DESTINATIONS.map((dest) => (
                        <td
                          key={dest}
                          className={cn(
                            "py-3 text-center font-mono text-sm font-bold",
                            totals[dest] > 0 ? "text-primary" : "text-muted-foreground/30"
                          )}
                        >
                          {totals[dest] > 0 ? totals[dest] : "—"}
                        </td>
                      ))}
                      <td className="py-3 text-center font-mono text-sm font-bold text-primary">
                        {grandTotal}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
