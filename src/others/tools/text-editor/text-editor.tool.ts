import fs from 'fs';
import path from 'path';

export class TextEditorTool {
  private readonly baseDir: string;
  private readonly backupDir: string;

  constructor(baseDir = '', backupDir = '') {
    this.baseDir = baseDir || process.cwd();
    this.backupDir = backupDir || path.join(this.baseDir, '.backups');
    fs.mkdirSync(this.backupDir, { recursive: true });
  }

  public view(filePath: string, viewRange?: [number, number]): string {
    const absPath = this.validatePath(filePath);
    if (fs.statSync(absPath).isDirectory()) {
      return fs.readdirSync(absPath).join('\n');
    }
    if (!fs.existsSync(absPath)) {
      throw new Error('File not found');
    }
    const content = fs.readFileSync(absPath, 'utf-8');
    const lines = content.split('\n');
    let start = 1;
    let end = lines.length;
    if (viewRange) {
      [start, end] = viewRange;
      if (end === -1) {
        end = lines.length;
      }
    }
    return lines
      .slice(start - 1, end)
      .map((line, i) => `${start + i}: ${line}`)
      .join('\n');
  }

  public strReplace(filePath: string, oldStr: string, newStr: string): string {
    const absPath = this.validatePath(filePath);
    if (!fs.existsSync(absPath)) {
      throw new Error('File not found');
    }
    const content = fs.readFileSync(absPath, 'utf-8');
    const matchCount = this.countMatches(content, oldStr);
    if (matchCount === 0) {
      throw new Error(
        'No match found for replacement. Please check your text and try again.',
      );
    }
    if (matchCount > 1) {
      throw new Error(
        `Found ${matchCount} matches for replacement text. Please provide more context to make a unique match.`,
      );
    }
    this.backupFile(absPath);
    fs.writeFileSync(absPath, content.replace(oldStr, newStr), 'utf-8');
    return 'Successfully replaced text at exactly one location.';
  }

  public create(filePath: string, fileText: string): string {
    const absPath = this.validatePath(filePath);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, fileText, 'utf-8');
    return `Successfully created ${filePath}`;
  }

  public insert(filePath: string, insertLine: number, newStr: string): string {
    const absPath = this.validatePath(filePath);
    if (!fs.existsSync(absPath)) {
      throw new Error('File not found');
    }
    this.backupFile(absPath);
    const lines = fs.readFileSync(absPath, 'utf-8').split('\n');
    const str = lines[lines.length - 1] !== '' ? '\n' + newStr : newStr;
    if (insertLine === 0) {
      lines.unshift(str);
    } else if (insertLine > 0 && insertLine <= lines.length) {
      lines.splice(insertLine, 0, str);
    } else {
      throw new RangeError(
        `Line number ${insertLine} is out of range. File has ${lines.length} lines.`,
      );
    }
    fs.writeFileSync(absPath, lines.join('\n'), 'utf-8');
    return `Successfully inserted text after line ${insertLine}`;
  }

  public undoEdit(filePath: string): string {
    const absPath = this.validatePath(filePath);
    if (!fs.existsSync(absPath)) {
      throw new Error('File not found');
    }
    return this.restoreBackup(absPath);
  }

  private backupFile(filePath: string): string {
    if (!fs.existsSync(filePath)) {
      return '';
    }
    const fileName = path.basename(filePath);
    const mtime = Math.floor(fs.statSync(filePath).mtimeMs / 1000);
    const backupPath = path.join(this.backupDir, `${fileName}.${mtime}`);
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
  }

  private restoreBackup(filePath: string): string {
    const fileName = path.basename(filePath);
    const backups = fs
      .readdirSync(this.backupDir)
      .filter((f) => f.startsWith(fileName + '.'));
    if (!backups.length) {
      throw new Error(`No backups found for ${filePath}`);
    }
    const latestBackup = backups.sort().reverse()[0];
    const backupPath = path.join(this.backupDir, latestBackup);
    fs.copyFileSync(backupPath, filePath);
    return `Successfully restored ${filePath} from backup`;
  }

  private validatePath(filePath: string): string {
    const absPath = path.normalize(path.join(this.baseDir, filePath));
    if (!absPath.startsWith(this.baseDir)) {
      throw new Error(
        `Access denied: Path '${filePath}' is outside the allowed directory`,
      );
    }
    return absPath;
  }

  private countMatches(content: string, oldStr: string): number {
    return content.split(oldStr).length - 1;
  }
}
