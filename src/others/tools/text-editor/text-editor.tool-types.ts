type TextEditorToolInput = {
  command: 'view' | 'str_replace' | 'create' | 'insert' | 'undo_edit';
  path: string;
  view_range?: [number, number];
  old_str?: string;
  new_str?: string;
  file_text?: string;
  insert_line?: number;
};
