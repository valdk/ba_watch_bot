import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_STATE = {
  version: 1,
  updatedAt: null,
  pages: {}
};

export async function readState(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      pages: parsed.pages ?? {}
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return DEFAULT_STATE;
    }

    throw error;
  }
}

export async function writeState(filePath, state) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}