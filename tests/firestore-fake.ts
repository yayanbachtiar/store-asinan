/**
 * Fake Firestore IN-MEMORY untuk test — mengimplementasikan subset kecil
 * API Firestore yang dipakai lapisan repository (src/lib/repo/base.ts):
 * collection().add / doc(id).get|update|delete / collection().get /
 * where(field, "==", value).get.
 *
 * Ini BUKAN Firestore asli dan bukan emulator: tujuannya membuktikan logika
 * repository + lapisan baca + finance berjalan benar di atas kontrak API
 * yang sama. Bukti terhadap Firestore beneran terjadi saat deploy pertama
 * (atau dengan menjalankan emulator lokal lewat FIRESTORE_EMULATOR_HOST).
 */

type DocData = Record<string, unknown>;

class FakeDocSnapshot {
  constructor(
    public id: string,
    public exists: boolean,
    private docData: DocData | undefined,
  ) {}
  data(): DocData | undefined {
    return this.docData ? structuredClone(this.docData) : undefined;
  }
}

class FakeQuerySnapshot {
  constructor(public docs: FakeDocSnapshot[]) {}
  get empty() {
    return this.docs.length === 0;
  }
}

class FakeDocRef {
  constructor(
    private store: Map<string, DocData>,
    public id: string,
  ) {}
  async get(): Promise<FakeDocSnapshot> {
    const data = this.store.get(this.id);
    return new FakeDocSnapshot(this.id, data !== undefined, data);
  }
  async set(data: DocData): Promise<void> {
    this.store.set(this.id, structuredClone(data));
  }
  async update(data: DocData): Promise<void> {
    const existing = this.store.get(this.id);
    if (!existing) throw new Error(`Dokumen ${this.id} tidak ada`);
    this.store.set(this.id, { ...existing, ...structuredClone(data) });
  }
  async delete(): Promise<void> {
    this.store.delete(this.id);
  }
}

class FakeQuery {
  constructor(
    private store: Map<string, DocData>,
    private filters: [string, unknown][],
  ) {}
  where(field: string, _op: string, value: unknown): FakeQuery {
    return new FakeQuery(this.store, [...this.filters, [field, value]]);
  }
  async get(): Promise<FakeQuerySnapshot> {
    const docs: FakeDocSnapshot[] = [];
    for (const [id, data] of this.store) {
      if (this.filters.every(([field, value]) => data[field] === value)) {
        docs.push(new FakeDocSnapshot(id, true, data));
      }
    }
    return new FakeQuerySnapshot(docs);
  }
}

class FakeCollectionRef extends FakeQuery {
  private counter = 0;
  constructor(private collectionStore: Map<string, DocData>) {
    super(collectionStore, []);
  }
  doc(id: string): FakeDocRef {
    return new FakeDocRef(this.collectionStore, id);
  }
  async add(data: DocData): Promise<{ id: string }> {
    const id = `fake-${++this.counter}-${Math.random().toString(36).slice(2, 8)}`;
    this.collectionStore.set(id, structuredClone(data));
    return { id };
  }
}

export class FakeFirestore {
  private collections = new Map<string, Map<string, DocData>>();
  collection(name: string): FakeCollectionRef {
    let store = this.collections.get(name);
    if (!store) {
      store = new Map();
      this.collections.set(name, store);
    }
    return new FakeCollectionRef(store);
  }
}
