export interface SourceLocation {
  file: string;
  line: number;
  column?: number;
  isUserCode: boolean;
}

interface SourceMapEntry extends SourceLocation {}

export class SourceMap {
  readonly entries: Map<number, SourceMapEntry> = new Map();
  private reverseIndex: Map<string, Map<number, number>> = new Map();

  load(_dwarfData: string): void {
    this.clear();
  }

  getLocation(pc: number): SourceLocation | null {
    return this.entries.get(pc) ?? null;
  }

  getPC(file: string, line: number): number | null {
    const fileMap = this.reverseIndex.get(file);
    if (!fileMap) return null;
    return fileMap.get(line) ?? null;
  }

  merge(
    newEntries: Array<{ pc: number; file: string; line: number }>,
  ): void {
    for (const entry of newEntries) {
      this.entries.set(entry.pc, {
        file: entry.file,
        line: entry.line,
        isUserCode: true,
      });

      let fileMap = this.reverseIndex.get(entry.file);
      if (!fileMap) {
        fileMap = new Map();
        this.reverseIndex.set(entry.file, fileMap);
      }
      fileMap.set(entry.line, entry.pc);
    }
  }

  clear(): void {
    this.entries.clear();
    this.reverseIndex.clear();
  }
}
