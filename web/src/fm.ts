// Spectral Reflectance Marker Point - Web interface, file manager
// 2018
// Dr. Matthieu Herrmann, Monash University, Melbourne, Australia

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// File Manager
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

import { Option, some, none } from "ts-option";

/** File name and it's content as a string */
export type FNC = { fName: string; fContent: string };

/** The hash of a file, as a string */
export type Hash = string;

/** Manage several files: load them and remove duplicate */
export class FileManager {
  // --- --- --- Fields
  private fileMap: Promise<Map<Hash, FNC>>;

  // --- --- --- Constructor
  constructor() {
    this.fileMap = Promise.resolve(new Map());
  }

  // --- --- --- Private method

  /** Load the content of the file, compute a hash, and return a promise of a tuple Option [Hash, FNC]
   * The Opotion is none if the file was already in the map */
  private loadOneFile = (f: File): Promise<Option<[Hash, FNC]>> => {
    const reader = new FileReader();

    // Read the file, get the promise
    reader.readAsText(f);
    const readerPromise = new Promise<string>(resolve => {
      reader.onload = (e: Event) => resolve((e.target as FileReader).result);
    }); // End readerPromise

    // Now, compute the hash of the content
    const hashPromise: Promise<[Hash, FNC]> = readerPromise.then(async (content: string) => {
      // Do the hash
      const pHash: PromiseLike<ArrayBuffer> = crypto.subtle.digest(
        "SHA-1",
        new TextEncoder().encode(content)
      );
      const hash: ArrayBuffer = await pHash;
      const ha: number[] = Array.from(new Uint8Array(hash)); // convert ArrayBuffer to Array
      const hex: string = ha.map(b => ("00" + b.toString(16)).slice(-2)).join(""); // convert bytes to hex string
      return new Promise<[Hash, FNC]>(resolve => {
        resolve([hex, { fName: f.name, fContent: content }]);
      });
    }); // E, hashPromise

    // Now, check if we already now that file (though the HASH) or not.
    // If yes, update the map and return some(...); else return none
    const finalPromise = hashPromise.then(async (tuple: [Hash, FNC]) => {
      const h = tuple[0];
      const fnc = tuple[1];
      const m = await this.fileMap;
      if (m.has(h)) {
        // --- Do nothing
        return Promise.resolve(none);
      } else {
        // --- Update the map
        m.set(h, fnc);
        this.fileMap = Promise.resolve(m);
        return Promise.resolve(some(tuple));
      }
    });

    return finalPromise;
  };

  // --- --- --- Public methods

  /** Load files. Resolve promise when ready Return the new files. */
  public async loadFiles<T>(
    files: Array<File>,
    transform: (input: FNC) => T
  ): Promise<Map<Hash, T>> {
    const newFiles: Array<Option<[Hash, FNC]>> = await Promise.all(files.map(this.loadOneFile));
    const mappedFiles: Map<Hash, T> = new Map();
    newFiles.forEach(opt => {
      opt.forEach(tuple => {
        mappedFiles.set(tuple[0], transform(tuple[1]));
      });
    });
    return Promise.resolve(mappedFiles);
  }

  /** Clear files. Wait for the promise to be resolved before doing it. */
  public async clear(): Promise<Map<Hash, FNC>> {
    const map = await this.fileMap;
    map.clear();
    this.fileMap = Promise.resolve(map);
    return this.fileMap;
  }

  /** Removes a file by it's hash. */
  public async remove(hash: Hash): Promise<Map<Hash, FNC>> {
    const map = await this.fileMap;
    map.delete(hash);
    this.fileMap = Promise.resolve(map);
    return this.fileMap;
  }
}
